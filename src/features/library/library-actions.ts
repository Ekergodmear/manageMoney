import type { LibraryCollection } from '@/features/library/library-types';

import type { Plan, Session } from '@/features/session/session-domain';

function nowIso(): string {
  return new Date().toISOString();
}

export function createLibraryCollection(name: string, tag: string): LibraryCollection {
  return {
    id: crypto.randomUUID(),
    name,
    tag,
  };
}

export function normalizeSessionLibraryFields(session: Session): Session {
  return {
    ...session,
    pendingRename: session.pendingRename ?? false,
    plans: session.plans.map((plan) => ({
      ...plan,
      formValues: {
        ...plan.formValues,
        marketId: plan.marketId,
      },
    })),
  };
}

export function toggleSessionFavorite(session: Session): Session {
  return {
    ...session,
    favorite: !session.favorite,
    updatedAt: nowIso(),
  };
}

export function toggleSessionArchived(session: Session): Session {
  return {
    ...session,
    archived: !session.archived,
    updatedAt: nowIso(),
  };
}

export function updateSessionTags(session: Session, tags: readonly string[]): Session {
  return {
    ...session,
    tags: [...tags],
    updatedAt: nowIso(),
  };
}

function duplicateRootTitle(title: string): string {
  let t = title.trim();
  t = t.replace(/\s*\(bản sao\)$/i, '').trim();
  t = t.replace(/\s*-\s*Copy$/i, '').trim();
  const numbered = /^(.+?)\s*\((\d+)\)$/.exec(t);
  if (numbered !== null) {
    const baseTitle = numbered[1];
    if (baseTitle !== undefined) {
      return baseTitle.trim();
    }
  }
  return t;
}

export function nextDuplicateTitle(sourceTitle: string, allSessions: readonly Session[]): string {
  const root = duplicateRootTitle(sourceTitle);
  let maxNum = 1;
  for (const s of allSessions) {
    if (s.title === root) {
      maxNum = Math.max(maxNum, 1);
      continue;
    }
    const escaped = root.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const m = new RegExp(`^${escaped}\\s*\\((\\d+)\\)$`).exec(s.title);
    if (m !== null) {
      maxNum = Math.max(maxNum, Number(m[1]));
    }
  }
  return `${root} (${String(maxNum + 1)})`;
}

export function duplicateSession(
  session: Session,
  nextSessionNumber: number,
  allSessions: readonly Session[],
): Session {
  const at = nowIso();
  const oldToNew = new Map<string, string>();
  for (const plan of session.plans) {
    oldToNew.set(plan.id, crypto.randomUUID());
  }

  const newPlans: Plan[] = session.plans.map((plan) => {
    const newId = oldToNew.get(plan.id) ?? crypto.randomUUID();
    return {
      id: newId,
      label: plan.label,
      origin: plan.origin,
      parentPlanId: plan.parentPlanId !== null ? (oldToNew.get(plan.parentPlanId) ?? null) : null,
      marketId: plan.marketId,
      formValues: plan.formValues,
      generated: plan.generated,
      status: 'ready' as const,
      completedThroughRound: 0,
      createdAt: at,
    };
  });

  const currentPlanId =
    session.currentPlanId !== null
      ? (oldToNew.get(session.currentPlanId) ?? newPlans[0]?.id ?? null)
      : (newPlans[0]?.id ?? null);

  return {
    ...session,
    id: crypto.randomUUID(),
    sessionNumber: nextSessionNumber,
    title: nextDuplicateTitle(session.title, allSessions),
    status: 'draft',
    plans: newPlans,
    currentPlanId,
    timeline: [
      { at, type: 'session-created' },
      ...(currentPlanId !== null
        ? [{ at, type: 'plan-added' as const, planId: currentPlanId, label: 'Duplicate' }]
        : [{ at, type: 'plan-added' as const, label: 'Duplicate' }]),
    ],
    startedAt: null,
    profitAmount: null,
    favorite: false,
    archived: false,
    tags: [...session.tags],
    lastSettledDrawKey: null,
    playedRounds: [],
    notes: session.notes,
    pendingRename: true,
    createdAt: at,
    updatedAt: at,
  };
}
