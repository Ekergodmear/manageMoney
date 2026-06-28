import type { GamePolicyPreset } from '@/features/game-designer/game-policy-types';
import type { LibraryStats, RecencyGroup, SessionCardSummary } from '@/features/library/library-types';
import { RECENCY_GROUP_LABELS } from '@/features/library/library-types';
import type { Session, SessionStatus } from '@/features/session/session-domain';
import { computeSessionStatistics, getCurrentPlan } from '@/features/session/session-domain';

export function computeLibraryStats(sessions: readonly Session[]): LibraryStats {
  let active = 0;
  let won = 0;
  let lost = 0;
  let stopped = 0;
  let archived = 0;

  for (const session of sessions) {
    if (session.archived) {
      archived++;
    }
    if (session.status === 'playing' || session.status === 'draft') {
      active++;
    }
    if (session.status === 'won') {
      won++;
    }
    if (session.status === 'lost') {
      lost++;
    }
    if (session.status === 'stopped') {
      stopped++;
    }
  }

  const completed = won + lost + stopped;

  return { active, completed, won, lost, stopped, archived };
}

export function isActiveSession(session: Session): boolean {
  return session.status === 'playing' || session.status === 'draft';
}

export function relativeDateLabel(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startOfToday.getTime() - startOfDate.getTime()) / 86_400_000);

  if (diffDays === 0) {
    return 'Hôm nay';
  }
  if (diffDays === 1) {
    return 'Hôm qua';
  }
  return date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' });
}

export function buildSessionCardSummary(
  session: Session,
  presets: readonly GamePolicyPreset[],
): SessionCardSummary {
  const stats = computeSessionStatistics(session);
  const plan = getCurrentPlan(session);
  const preset = presets.find((p) => p.id === session.presetId);
  const totalRounds = plan?.generated.strategy.rounds.length ?? 0;
  const completedRounds = plan?.completedThroughRound ?? 0;
  const rewardMultiplier = plan?.formValues.rewardMultiplier ?? '—';

  return {
    session,
    presetName: preset?.name ?? session.presetId,
    stats,
    totalRounds,
    completedRounds,
    rewardMultiplier,
  };
}

export function sessionStatusVisual(status: SessionStatus): {
  readonly emoji: string;
  readonly label: string;
  readonly accentClass: string;
} {
  switch (status) {
    case 'won':
      return { emoji: '🟢', label: 'WON', accentClass: 'text-emerald-600 dark:text-emerald-400' };
    case 'playing':
      return { emoji: '🟡', label: 'PLAYING', accentClass: 'text-amber-600 dark:text-amber-400' };
    case 'lost':
      return { emoji: '🔴', label: 'LOST', accentClass: 'text-red-600 dark:text-red-400' };
    case 'draft':
      return { emoji: '⚪', label: 'DRAFT', accentClass: 'text-muted-foreground' };
    case 'stopped':
      return { emoji: '⏹', label: 'STOPPED', accentClass: 'text-muted-foreground' };
    default:
      return { emoji: '⚪', label: status, accentClass: 'text-muted-foreground' };
  }
}

export function getRecencyGroup(iso: string): RecencyGroup {
  const date = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startOfToday.getTime() - startOfDate.getTime()) / 86_400_000);

  if (diffDays === 0) {
    return 'today';
  }
  if (diffDays === 1) {
    return 'yesterday';
  }
  if (diffDays <= 7) {
    return 'this-week';
  }
  if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
    return 'this-month';
  }
  return 'older';
}

const RECENCY_ORDER: readonly RecencyGroup[] = [
  'today',
  'yesterday',
  'this-week',
  'this-month',
  'older',
];

export function groupSessionsByRecency(
  sessions: readonly Session[],
): { readonly group: RecencyGroup; readonly label: string; readonly sessions: Session[] }[] {
  const buckets = new Map<RecencyGroup, Session[]>();
  for (const session of sessions) {
    const group = getRecencyGroup(session.updatedAt);
    const list = buckets.get(group) ?? [];
    list.push(session);
    buckets.set(group, list);
  }
  return RECENCY_ORDER.filter((g) => (buckets.get(g)?.length ?? 0) > 0).map((group) => ({
    group,
    label: RECENCY_GROUP_LABELS[group],
    sessions: buckets.get(group) ?? [],
  }));
}
