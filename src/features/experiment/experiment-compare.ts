import type { Experiment } from '@/features/experiment/experiment-types';

export interface CompareExperimentColumn {
  readonly id: string;
  readonly name: string;
  readonly label: string;
}

export interface CompareExperimentCell {
  readonly value: string;
  readonly delta: string | null;
  readonly deltaTone: 'positive' | 'negative' | 'neutral' | null;
}

export interface CompareMetricRow {
  readonly id: string;
  readonly label: string;
  readonly baseline: string;
  readonly cells: Readonly<Record<string, CompareExperimentCell>>;
}

export interface ExperimentCompareTable {
  readonly baseline: CompareExperimentColumn | null;
  readonly experiments: readonly CompareExperimentColumn[];
  readonly rows: readonly CompareMetricRow[];
}

function formatMoney(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return Number.isInteger(m) ? `${String(m)}M` : `${m.toFixed(1)}M`;
  }
  if (n >= 1_000) {
    const k = n / 1_000;
    return Number.isInteger(k) ? `${String(k)}k` : `${k.toFixed(0)}k`;
  }
  return n.toLocaleString('vi-VN');
}

function roiPercent(experiment: Experiment): number | null {
  if (experiment.result === null) {
    return null;
  }
  const bankroll = experiment.result.statistics.requiredBankrollAmount;
  if (bankroll <= 0) {
    return null;
  }
  return (experiment.result.statistics.expectedProfitAmount / bankroll) * 100;
}

function formatDelta(
  baseline: number,
  current: number,
  kind: 'money' | 'percent' | 'number',
): { text: string; tone: 'positive' | 'negative' | 'neutral' } {
  const d = current - baseline;
  if (d === 0) {
    return { text: '0', tone: 'neutral' };
  }
  const sign = d > 0 ? '+' : '';
  if (kind === 'money') {
    return { text: `${sign}${formatMoney(d)}`, tone: d > 0 ? 'positive' : 'negative' };
  }
  if (kind === 'percent') {
    return { text: `${sign}${d.toFixed(1)}%`, tone: d > 0 ? 'positive' : 'negative' };
  }
  return { text: `${sign}${String(d)}`, tone: d > 0 ? 'positive' : 'negative' };
}

interface MetricDef {
  readonly id: string;
  readonly label: string;
  readonly kind: 'money' | 'percent' | 'number' | 'text';
  readonly pick: (e: Experiment) => string;
  readonly numeric?: (e: Experiment) => number | null;
}

const METRICS: MetricDef[] = [
  {
    id: 'required-bankroll',
    label: 'Vốn cần',
    kind: 'money',
    pick: (e) =>
      e.result !== null ? formatMoney(e.result.statistics.requiredBankrollAmount) : '—',
    numeric: (e) => e.result?.statistics.requiredBankrollAmount ?? null,
  },
  {
    id: 'max-bet',
    label: 'Max bet',
    kind: 'money',
    pick: (e) => (e.result !== null ? formatMoney(e.result.statistics.maximumBetAmount) : '—'),
    numeric: (e) => e.result?.statistics.maximumBetAmount ?? null,
  },
  {
    id: 'profit',
    label: 'Lợi nhuận',
    kind: 'money',
    pick: (e) =>
      e.result !== null ? formatMoney(e.result.statistics.expectedProfitAmount) : '—',
    numeric: (e) => e.result?.statistics.expectedProfitAmount ?? null,
  },
  {
    id: 'rounds',
    label: 'Số vòng',
    kind: 'number',
    pick: (e) => (e.result !== null ? String(e.result.statistics.roundCount) : '—'),
    numeric: (e) => e.result?.statistics.roundCount ?? null,
  },
  {
    id: 'roi',
    label: 'ROI',
    kind: 'percent',
    pick: (e) => {
      const roi = roiPercent(e);
      return roi !== null ? `${roi.toFixed(1)}%` : '—';
    },
    numeric: (e) => roiPercent(e),
  },
  {
    id: 'tax',
    label: 'Thuế',
    kind: 'text',
    pick: (e) => (e.formValues.winTaxEnabled ? `${e.formValues.winTaxRatePercent}%` : 'Không'),
  },
  {
    id: 'multiplier',
    label: 'Hệ số',
    kind: 'text',
    pick: (e) => `×${e.formValues.rewardMultiplier}`,
  },
];

export function buildExperimentCompareTable(
  experiments: readonly Experiment[],
): ExperimentCompareTable | null {
  const valid = experiments.filter((e) => e.result !== null || e.error !== null);
  if (valid.length < 2) {
    return null;
  }

  const baselineExp = valid.find((e) => e.isBaseline) ?? valid[0];
  if (baselineExp === undefined) {
    return null;
  }

  const others = valid.filter((e) => e.id !== baselineExp.id);

  const baseline: CompareExperimentColumn = {
    id: baselineExp.id,
    name: baselineExp.name,
    label: baselineExp.label,
  };

  const experimentColumns: CompareExperimentColumn[] = others.map((e) => ({
    id: e.id,
    name: e.name,
    label: e.label,
  }));

  const rows: CompareMetricRow[] = METRICS.map((metric) => {
    const baselineValue = metric.pick(baselineExp);
    const baselineNumeric = metric.numeric?.(baselineExp) ?? null;

    const cells: Record<string, CompareExperimentCell> = {};
    for (const exp of others) {
      const value = metric.pick(exp);
      let delta: string | null = null;
      let deltaTone: CompareExperimentCell['deltaTone'] = null;

      if (metric.kind !== 'text' && baselineNumeric !== null) {
        const currentNumeric = metric.numeric?.(exp) ?? null;
        if (currentNumeric !== null) {
          const formatted = formatDelta(
            baselineNumeric,
            currentNumeric,
            metric.kind === 'percent' ? 'percent' : metric.kind === 'number' ? 'number' : 'money',
          );
          delta = formatted.text;
          deltaTone = formatted.tone;
        }
      }

      cells[exp.id] = { value, delta, deltaTone };
    }

    return {
      id: metric.id,
      label: metric.label,
      baseline: baselineValue,
      cells,
    };
  });

  return {
    baseline,
    experiments: experimentColumns,
    rows,
  };
}

/** @deprecated Use buildExperimentCompareTable */
export const buildScenarioCompareTable = buildExperimentCompareTable;
