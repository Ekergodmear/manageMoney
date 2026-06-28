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
    favorite: session.favorite ?? false,
    archived: session.archived ?? false,
    tags: session.tags ?? [],
    pendingRename: session.pendingRename ?? false,
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
    return numbered[1]!.trim();
  }
  return t;
}

export function nextDuplicateTitle(
  sourceTitle: string,
  allSessions: readonly Session[],
): string {
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
      ...plan,
      id: newId,
      parentPlanId:
        plan.parentPlanId !== null ? (oldToNew.get(plan.parentPlanId) ?? null) : null,
      status: 'ready' as const,
      completedThroughRound: 0,
      createdAt: at,
      finishedAt: undefined,
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
      { at, type: 'plan-added', planId: currentPlanId ?? undefined, label: 'Duplicate' },
    ],
    startedAt: null,
    finishedAt: undefined,
    profitAmount: null,
    favorite: false,
    archived: false,
    tags: [...session.tags],
    notes: session.notes,
    pendingRename: true,
    createdAt: at,
    updatedAt: at,
  };
}
