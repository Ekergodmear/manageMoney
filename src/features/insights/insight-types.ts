import type { CapitalPlannerSnapshot } from '@/features/capital/capital-planner-types';
import type { GamePolicyPreset } from '@/features/game-designer/game-policy-types';
import type { Session } from '@/features/session/session-domain';

export type InsightLayer =
  | 'quick'
  | 'recommendation'
  | 'trend'
  | 'record'
  | 'reflection'
  | 'outlier';

export type InsightActionTarget = 'scenario' | 'capital' | 'library' | 'session';

export type OutlierSeverity = 'critical' | 'notable';

export interface InsightConfidence {
  readonly level: 'low' | 'medium' | 'high' | 'very-high';
  readonly label: string;
  readonly sampleSize: number;
}

export interface InsightAction {
  readonly label: string;
  readonly target: InsightActionTarget;
  readonly sessionId?: string;
}

export interface InsightCard {
  readonly id: string;
  readonly layer: InsightLayer;
  readonly emoji: string;
  readonly title: string;
  readonly body: string;
  readonly conclusion?: string;
  readonly confidence?: InsightConfidence;
  readonly severity?: OutlierSeverity;
  readonly action?: InsightAction;
}

export interface InsightTrend {
  readonly id: string;
  readonly label: string;
  readonly sparkline: string;
  readonly latestLabel: string;
  readonly summary: string;
  readonly confidence?: InsightConfidence;
}

export interface InsightRecord {
  readonly id: string;
  readonly emoji: string;
  readonly label: string;
  readonly value: string;
  readonly detail?: string;
  readonly sessionId?: string;
}

export interface InsightReflection {
  readonly periodLabel: string;
  readonly lines: readonly string[];
  readonly closingLine: string;
  readonly confidence: InsightConfidence;
}

export interface SessionInsightMetrics {
  readonly session: Session;
  readonly presetName: string;
  readonly roundsPlayed: number;
  readonly continueCount: number;
  readonly improveCount: number;
  readonly planCount: number;
  readonly highestBet: number;
  readonly totalCapital: number;
  readonly capitalUsagePercent: number | null;
  readonly profitAmount: number | null;
  readonly won: boolean;
}

export interface AggregatedInsightMetrics {
  readonly sessions: readonly SessionInsightMetrics[];
  readonly totalCompleted: number;
  readonly winCount: number;
  readonly avgCapitalUsage: number | null;
  readonly avgContinue: number;
  readonly avgImprove: number;
  readonly avgRoundsBeforeContinue: number | null;
  readonly topPresetId: string | null;
  readonly topPresetShare: number;
  readonly topPresetName: string | null;
  readonly bestWinPresetId: string | null;
  readonly bestWinPresetName: string | null;
  readonly bestWinRate: number;
  readonly longestRounds: number;
  readonly longestSessionTitle: string | null;
  readonly recentSessionCount: number;
}

export interface InsightEngineInput {
  readonly sessions: readonly Session[];
  readonly presets: readonly GamePolicyPreset[];
  readonly capitalPlanner: CapitalPlannerSnapshot | null;
}

export interface InsightsSnapshot {
  readonly reflection: InsightReflection | null;
  readonly quick: readonly InsightCard[];
  readonly recommendations: readonly InsightCard[];
  readonly outliers: readonly InsightCard[];
  readonly trends: readonly InsightTrend[];
  readonly records: readonly InsightRecord[];
  readonly updated: InsightsUpdatedMeta;
  readonly hasData: boolean;
}

export interface InsightsUpdatedMeta {
  readonly relativeLabel: string;
  readonly sessionCount: number;
}
