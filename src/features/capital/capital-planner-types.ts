export type CapitalGoal = 'max-profit' | 'longest-play' | 'lowest-bet' | 'balanced';

export type RiskProfile = 'conservative' | 'normal' | 'aggressive';

export type SafetyLevel = 'safe' | 'tight' | 'risky';

export interface CapitalSessionRecommendation {
  readonly id: string;
  readonly label: string;
  readonly allocatedCapital: number;
  readonly targetProfit: number;
  readonly roundCount: number;
  readonly requiredBankroll: number;
  readonly maxBet: number;
  readonly safety: SafetyLevel;
  readonly formValues: import('@/features/planner/plan-service').PlannerFormValues;
  readonly result: import('@/features/planner/plan-service').GenerateResult;
}

export interface CapitalPlannerResult {
  readonly totalBankroll: number;
  readonly usableBankroll: number;
  readonly reserve: number;
  readonly strategy: CapitalGoal;
  readonly risk: RiskProfile;
  readonly presetId: string;
  readonly recommendations: readonly CapitalSessionRecommendation[];
  readonly totalTargetProfit: number;
  readonly singleBest: CapitalSessionRecommendation | null;
}

export interface CapitalPlannerInput {
  readonly bankroll: number;
  readonly presetId: string;
  readonly baseForm: import('@/features/planner/plan-service').PlannerFormValues;
  readonly strategy: CapitalGoal;
  readonly risk: RiskProfile;
}

export interface CapitalOverview {
  readonly total: number;
  readonly allocated: number;
  readonly available: number;
}

export interface CapitalPlannerSnapshot {
  readonly totalBankroll: number;
  readonly strategy: CapitalGoal;
  readonly risk: RiskProfile;
  readonly presetId: string;
  readonly result: CapitalPlannerResult;
  readonly generatedAt: string;
}

export const CAPITAL_GOAL_LABELS: Record<CapitalGoal, string> = {
  'max-profit': 'Lợi nhuận tối đa',
  'longest-play': 'Chơi lâu nhất',
  'lowest-bet': 'Cược thấp nhất',
  balanced: 'Cân bằng',
};

export const RISK_LABELS: Record<RiskProfile, string> = {
  conservative: 'Thấp',
  normal: 'Trung bình',
  aggressive: 'Cao',
};
