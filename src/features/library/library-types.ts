import type { Session } from '@/features/session/session-domain';
import type { computeSessionStatistics } from '@/features/session/session-domain';

export interface LibraryCollection {
  readonly id: string;
  readonly name: string;
  readonly tag: string;
}

export interface LibraryStats {
  readonly active: number;
  readonly completed: number;
  readonly won: number;
  readonly lost: number;
  readonly stopped: number;
  readonly archived: number;
}

export interface LibraryFilters {
  readonly query: string;
  readonly status: 'all' | Session['status'];
  readonly presetId: string;
  readonly minContinue: number | null;
  readonly minHighestBet: number | null;
  readonly tag: string | null;
  readonly collectionId: string | null;
  readonly includeArchived: boolean;
}

export const DEFAULT_LIBRARY_FILTERS: LibraryFilters = {
  query: '',
  status: 'all',
  presetId: 'all',
  minContinue: null,
  minHighestBet: null,
  tag: null,
  collectionId: null,
  includeArchived: false,
};

export const BUILTIN_COLLECTIONS: readonly { readonly id: string; readonly name: string }[] = [
  { id: 'favorite', name: '⭐ Favorite' },
  { id: 'archive', name: 'Archive' },
];

export interface SessionCardSummary {
  readonly session: Session;
  readonly presetName: string;
  readonly marketLabel: string;
  readonly marketMultiplier: number | null;
  readonly sessionHitExpected: number | null;
  readonly sessionHitActual: number | null;
  readonly stats: ReturnType<typeof computeSessionStatistics>;
  readonly totalRounds: number;
  readonly completedRounds: number;
}

export interface CompareMetricRow {
  readonly id: string;
  readonly label: string;
  readonly values: readonly [string, string];
  readonly delta: string;
}

export type RecencyGroup = 'today' | 'yesterday' | 'this-week' | 'this-month' | 'older';

export const RECENCY_GROUP_LABELS: Record<RecencyGroup, string> = {
  today: 'Hôm nay',
  yesterday: 'Hôm qua',
  'this-week': 'Tuần này',
  'this-month': 'Tháng này',
  older: 'Tháng trước',
};

export interface SessionCompareResult {
  readonly leftTitle: string;
  readonly rightTitle: string;
  readonly rows: readonly CompareMetricRow[];
}
