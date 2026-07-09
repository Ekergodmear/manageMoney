import type { GenerateResult, PlannerFormValues } from '@/features/planner/plan-service';

export interface Experiment {
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

export interface ExperimentLab {
  readonly id: string;
  readonly name: string;
  readonly presetId: string;
  readonly baseline: Experiment | null;
  readonly experiments: readonly Experiment[];
  readonly selectedExperimentId: string | null;
  readonly createdAt: string;
}

export interface ExperimentQuickFork {
  readonly id: string;
  readonly label: string;
  readonly overrides: Partial<PlannerFormValues>;
}

export const EXPERIMENT_QUICK_FORKS: readonly ExperimentQuickFork[] = [
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

export interface ExperimentLabSnapshot {
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

export type ExperimentEditableField = keyof Pick<
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

/** @deprecated Use Experiment */
export type ScenarioExperiment = Experiment;
/** @deprecated Use ExperimentLab */
export type ScenarioLab = ExperimentLab;
/** @deprecated Use EXPERIMENT_QUICK_FORKS */
export const SCENARIO_QUICK_FORKS = EXPERIMENT_QUICK_FORKS;
/** @deprecated Use ExperimentLabSnapshot */
export type ScenarioLabSnapshot = ExperimentLabSnapshot;
/** @deprecated Use ExperimentEditableField */
export type ScenarioEditableField = ExperimentEditableField;
