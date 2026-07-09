import type { CapitalGoal, RiskProfile } from '@/features/capital/capital-planner-types';
import type { StrategyCandidate } from '@/features/planning-strategy/planning-strategy-engine';

export interface CapitalAllocationPolicy {
  readonly sessionRatios: readonly number[];
  readonly sessionLabels: readonly string[];
  readonly minimumBankroll: number;
  readonly excludeRisks: readonly RiskProfile[];
}

export interface StrategyProfile {
  readonly id: CapitalGoal;
  readonly label: string;
  readonly riskUtilization: Record<RiskProfile, number>;
  readonly allocationPolicy: CapitalAllocationPolicy | null;
  readonly profitCapRatio: Record<RiskProfile, number>;
  readonly roundFilter: 'all' | 'long' | 'short';
  readonly score: (candidate: StrategyCandidate) => number;
}

const DEFAULT_RISK_UTILIZATION: Record<RiskProfile, number> = {
  conservative: 0.7,
  normal: 0.85,
  aggressive: 0.95,
};

const DEFAULT_PROFIT_CAP: Record<RiskProfile, number> = {
  conservative: 0.08,
  normal: 0.15,
  aggressive: 0.2,
};

const BALANCED_ALLOCATION: CapitalAllocationPolicy = {
  sessionRatios: [0.3, 0.38, 0.22],
  sessionLabels: ['Session 1', 'Session 2', 'Session 3'],
  minimumBankroll: 15_000_000,
  excludeRisks: ['aggressive'],
};

const BASE_PROFIT_GRID = [
  50_000, 80_000, 100_000, 120_000, 150_000, 200_000, 250_000, 300_000, 400_000, 500_000,
];

const ALL_ROUNDS = [100, 150, 200, 300, 400, 500, 600, 700, 800, 1000, 1500] as const;

function profitGrid(bankroll: number, capRatio: number, maxItems?: number): number[] {
  const capped = BASE_PROFIT_GRID.filter((p) => p <= bankroll * capRatio);
  if (maxItems !== undefined && capped.length > maxItems) {
    return capped.slice(0, maxItems);
  }
  if (capped.length > 0) {
    return capped;
  }
  return [Math.max(50_000, Math.floor(bankroll * 0.05))];
}

function roundGrid(filter: StrategyProfile['roundFilter']): number[] {
  if (filter === 'long') {
    return ALL_ROUNDS.filter((r) => r >= 300);
  }
  if (filter === 'short') {
    return ALL_ROUNDS.filter((r) => r <= 600);
  }
  return [...ALL_ROUNDS];
}

export const STRATEGY_PROFILES: Record<CapitalGoal, StrategyProfile> = {
  'max-profit': {
    id: 'max-profit',
    label: 'Lợi nhuận tối đa',
    riskUtilization: DEFAULT_RISK_UTILIZATION,
    allocationPolicy: null,
    profitCapRatio: DEFAULT_PROFIT_CAP,
    roundFilter: 'short',
    score: (c) => c.profit * 1000 - c.requiredBankroll,
  },
  'longest-play': {
    id: 'longest-play',
    label: 'Chơi lâu nhất',
    riskUtilization: DEFAULT_RISK_UTILIZATION,
    allocationPolicy: null,
    profitCapRatio: DEFAULT_PROFIT_CAP,
    roundFilter: 'long',
    score: (c) => c.rounds * 10_000 + c.profit,
  },
  'lowest-bet': {
    id: 'lowest-bet',
    label: 'Cược thấp nhất',
    riskUtilization: DEFAULT_RISK_UTILIZATION,
    allocationPolicy: null,
    profitCapRatio: DEFAULT_PROFIT_CAP,
    roundFilter: 'all',
    score: (c) => -c.maxBet * 100 + c.rounds,
  },
  balanced: {
    id: 'balanced',
    label: 'Cân bằng',
    riskUtilization: DEFAULT_RISK_UTILIZATION,
    allocationPolicy: BALANCED_ALLOCATION,
    profitCapRatio: DEFAULT_PROFIT_CAP,
    roundFilter: 'all',
    score: (c) => c.profit * 500 + c.rounds * 5000 - c.maxBet,
  },
};

export function getStrategyProfile(goal: CapitalGoal): StrategyProfile {
  return STRATEGY_PROFILES[goal];
}

export function usableBankroll(
  profile: StrategyProfile,
  risk: RiskProfile,
  bankroll: number,
): number {
  return Math.floor(bankroll * profile.riskUtilization[risk]);
}

export function shouldUseMultiSession(
  profile: StrategyProfile,
  bankroll: number,
  risk: RiskProfile,
): boolean {
  const policy = profile.allocationPolicy;
  if (policy === null) {
    return false;
  }
  if (bankroll < policy.minimumBankroll) {
    return false;
  }
  return !policy.excludeRisks.includes(risk);
}

export interface SessionSlice {
  readonly label: string;
  readonly amount: number;
}

export function sessionSlices(profile: StrategyProfile, totalBankroll: number): SessionSlice[] {
  const policy = profile.allocationPolicy;
  if (policy === null) {
    return [];
  }
  return policy.sessionRatios.map((ratio, index) => ({
    label: policy.sessionLabels[index] ?? `Session ${String(index + 1)}`,
    amount: Math.floor(totalBankroll * ratio),
  }));
}

export function profitCandidates(
  profile: StrategyProfile,
  risk: RiskProfile,
  bankroll: number,
): number[] {
  const capRatio = profile.profitCapRatio[risk];
  if (profile.id === 'longest-play' || profile.id === 'lowest-bet') {
    const grid = profitGrid(bankroll, capRatio, 5);
    return grid.length > 0 ? grid : [80_000, 100_000];
  }
  return profitGrid(bankroll, capRatio);
}

export function roundCandidates(profile: StrategyProfile): number[] {
  return roundGrid(profile.roundFilter);
}

export function pickBestCandidate(
  candidates: readonly StrategyCandidate[],
  profile: StrategyProfile,
): StrategyCandidate | null {
  if (candidates.length === 0) {
    return null;
  }
  return [...candidates].sort((a, b) => profile.score(b) - profile.score(a))[0] ?? null;
}
