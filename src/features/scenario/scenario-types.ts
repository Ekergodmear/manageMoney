import type { GenerateResult, PlannerFormValues } from '@/features/planner/plan-service';

export interface ScenarioExperiment {
  readonly id: string;
  readonly name: string;
  readonly label: string;
  readonly isBaseline: boolean;
  readonly overrides: Partial<PlannerFormValues>;
  readonly formValues: PlannerFormValues;
  readonly result: GenerateResult | null;
  readonly error: string | null;
  readonly notes: string;
}

export interface ScenarioLab {
  readonly id: string;
  readonly name: string;
  readonly presetId: string;
  readonly baseline: ScenarioExperiment | null;
  readonly experiments: readonly ScenarioExperiment[];
  readonly selectedExperimentId: string | null;
  readonly createdAt: string;
}

export interface ScenarioQuickFork {
  readonly id: string;
  readonly label: string;
  readonly overrides: Partial<PlannerFormValues>;
}

export const SCENARIO_QUICK_FORKS: readonly ScenarioQuickFork[] = [
  {
    id: 'tax-none',
    label: 'No Tax',
    overrides: { winTaxEnabled: false, winTaxThreshold: '', winTaxRatePercent: '10' },
  },
  {
    id: 'tax-20',
    label: 'Tax 20%',
    overrides: { winTaxEnabled: true, winTaxRatePercent: '20' },
  },
  {
    id: 'mult-80',
    label: 'Multiplier ×80',
    overrides: { rewardMultiplier: '80' },
  },
  {
    id: 'maxbet-500k',
    label: 'Max bet 500k',
    overrides: { maximumBet: '500.000' },
  },
  {
    id: 'bankroll-20m',
    label: 'Vốn 20M',
    overrides: { userBankroll: '20.000.000' },
  },
  {
    id: 'bankroll-50m',
    label: 'Vốn 50M',
    overrides: { userBankroll: '50.000.000' },
  },
  {
    id: 'rounds-1000',
    label: '1000 vòng',
    overrides: { roundCount: '1000' },
  },
  {
    id: 'profit-150k',
    label: 'Profit 150k',
    overrides: { targetProfit: '150.000' },
  },
];

export interface ScenarioLabSnapshot {
  readonly id: string;
  readonly name: string;
  readonly savedAt: string;
  readonly presetId: string;
  readonly baselineForm: PlannerFormValues;
  readonly experiments: readonly {
    readonly name: string;
    readonly label: string;
    readonly isBaseline: boolean;
    readonly overrides: Partial<PlannerFormValues>;
    readonly notes?: string;
  }[];
}

/** @deprecated Legacy snapshot field — use experiments */
export type ScenarioLabSnapshotLegacy = ScenarioLabSnapshot & {
  readonly branches?: ScenarioLabSnapshot['experiments'];
};

export type ScenarioEditableField = keyof Pick<
  PlannerFormValues,
  | 'targetProfit'
  | 'roundCount'
  | 'rewardMultiplier'
  | 'minimumBet'
  | 'maximumBet'
  | 'betStep'
  | 'userBankroll'
  | 'winTaxEnabled'
  | 'winTaxThreshold'
  | 'winTaxRatePercent'
>;

/** @deprecated Use ScenarioExperiment */
export type ScenarioBranch = ScenarioExperiment;
