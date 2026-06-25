import {
  buildStatistics,
  buildStrategy,
  solve,
  validateCalculationRequest,
} from '@stake/constraint-engine';

import type {
  CalculationRequest,
  Strategy,
  StrategyStatistics,
} from '@stake/constraint-engine';
import { useState, type FormEvent, type JSX } from 'react';

type Screen = 'form' | 'decision' | 'plan';

type FormField =
  | 'targetProfit'
  | 'roundCount'
  | 'rewardMultiplier'
  | 'minimumBet'
  | 'betStep'
  | 'userBankroll'
  | 'request';

interface FormValues {
  targetProfit: string;
  roundCount: string;
  rewardMultiplier: string;
  minimumBet: string;
  betStep: string;
  userBankroll: string;
}

interface GenerateResult {
  strategy: Strategy;
  statistics: StrategyStatistics;
  request: CalculationRequest;
  userBankroll: number | null;
}

const DEFAULT_FORM: FormValues = {
  targetProfit: '100000',
  roundCount: '50',
  rewardMultiplier: '20',
  minimumBet: '10000',
  betStep: '1000',
  userBankroll: '',
};

function formatAmount(amount: number): string {
  return amount.toLocaleString('en-US');
}

function parsePositiveInt(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === '') {
    return null;
  }
  const value = Number(trimmed);
  if (!Number.isFinite(value) || !Number.isInteger(value)) {
    return null;
  }
  return value;
}

function mapValidationPath(path: string): FormField {
  if (path === 'targetProfit' || path === 'targetProfit.amount') {
    return 'targetProfit';
  }
  if (
    path === 'rewardMultiplier' ||
    path === 'roundCount' ||
    path === 'minimumBet' ||
    path === 'betStep'
  ) {
    return path;
  }
  return 'request';
}

function buildRequest(values: FormValues): CalculationRequest | null {
  const targetProfit = parsePositiveInt(values.targetProfit);
  const roundCount = parsePositiveInt(values.roundCount);
  const rewardMultiplier = parsePositiveInt(values.rewardMultiplier);
  const minimumBet = parsePositiveInt(values.minimumBet);
  const betStep = parsePositiveInt(values.betStep);

  if (
    targetProfit === null ||
    roundCount === null ||
    rewardMultiplier === null ||
    minimumBet === null ||
    betStep === null
  ) {
    return null;
  }

  return {
    rewardMultiplier,
    roundCount,
    minimumBet,
    betStep,
    targetProfit: { mode: 'fixedAmount', amount: targetProfit },
  };
}

function generatePlan(values: FormValues): {
  result?: GenerateResult;
  fieldErrors?: Partial<Record<FormField, string>>;
} {
  const request = buildRequest(values);
  if (request === null) {
    return {
      fieldErrors: {
        request: 'Please enter whole numbers in all required fields.',
      },
    };
  }

  const validated = validateCalculationRequest(request);
  if (validated.kind === 'failure') {
    const fieldErrors: Partial<Record<FormField, string>> = {};
    for (const err of validated.error.errors) {
      const field = mapValidationPath(err.path);
      if (fieldErrors[field] === undefined) {
        fieldErrors[field] = err.message;
      }
    }
    return { fieldErrors };
  }

  const solved = solve(validated.value);
  if (solved.kind === 'failure') {
    return { fieldErrors: { request: 'Could not generate plan. Please check your inputs.' } };
  }

  const strategy = buildStrategy(solved.value.rounds);
  const statistics = buildStatistics(strategy);
  const bankrollRaw = values.userBankroll.trim();
  const userBankroll =
    bankrollRaw === '' ? null : parsePositiveInt(bankrollRaw);

  return {
    result: {
      strategy,
      statistics,
      request,
      userBankroll,
    },
  };
}

const styles = {
  page: {
    fontFamily: 'system-ui, sans-serif',
    maxWidth: '28rem',
    margin: '0 auto',
    padding: '1.5rem 1rem',
    color: '#111',
    lineHeight: 1.5,
  } as const,
  title: { fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.25rem' } as const,
  subtitle: { color: '#555', margin: '0 0 1.5rem', fontSize: '0.95rem' } as const,
  label: { display: 'block', fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.9rem' } as const,
  input: {
    width: '100%',
    padding: '0.5rem 0.6rem',
    fontSize: '1rem',
    border: '1px solid #ccc',
    borderRadius: '4px',
    boxSizing: 'border-box' as const,
  },
  field: { marginBottom: '1rem' } as const,
  error: { color: '#b00020', fontSize: '0.85rem', marginTop: '0.25rem' } as const,
  button: {
    width: '100%',
    padding: '0.65rem 1rem',
    fontSize: '1rem',
    fontWeight: 600,
    background: '#111',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  } as const,
  backLink: {
    background: 'none',
    border: 'none',
    padding: 0,
    color: '#555',
    cursor: 'pointer',
    fontSize: '0.9rem',
    marginBottom: '1rem',
  } as const,
  statBlock: { marginBottom: '1.25rem' } as const,
  statLabel: { color: '#555', fontSize: '0.85rem', marginBottom: '0.15rem' } as const,
  statValue: { fontSize: '1.35rem', fontWeight: 700 } as const,
  statusOk: { color: '#0d6b0d', margin: '1rem 0' } as const,
  statusWarn: { color: '#9a6700', margin: '1rem 0', lineHeight: 1.45 } as const,
  sectionTitle: { fontSize: '1.15rem', fontWeight: 700, margin: '0 0 1rem' } as const,
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: '0.9rem' } as const,
  th: {
    textAlign: 'left' as const,
    borderBottom: '2px solid #ddd',
    padding: '0.4rem 0.25rem',
  },
  td: { borderBottom: '1px solid #eee', padding: '0.4rem 0.25rem' } as const,
};

export function App(): JSX.Element {
  const [screen, setScreen] = useState<Screen>('form');
  const [form, setForm] = useState<FormValues>(DEFAULT_FORM);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FormField, string>>>({});
  const [generated, setGenerated] = useState<GenerateResult | null>(null);

  function updateField(key: keyof FormValues, value: string): void {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      delete next.request;
      return next;
    });
  }

  function handleGenerate(event: FormEvent): void {
    event.preventDefault();

    if (form.userBankroll.trim() !== '' && parsePositiveInt(form.userBankroll) === null) {
      setFieldErrors({ userBankroll: 'Please enter a whole number.' });
      return;
    }

    const outcome = generatePlan(form);
    if (outcome.fieldErrors !== undefined) {
      setFieldErrors(outcome.fieldErrors);
      return;
    }
    if (outcome.result === undefined) {
      return;
    }
    setFieldErrors({});
    setGenerated(outcome.result);
    setScreen('decision');
  }

  if (screen === 'decision' && generated !== null) {
    const { statistics, userBankroll } = generated;
    const bankrollShort =
      userBankroll !== null && userBankroll < statistics.requiredBankrollAmount;

    return (
      <main style={styles.page}>
        <button type="button" style={styles.backLink} onClick={() => setScreen('form')}>
          ← Sửa ý định
        </button>

        <h2 style={styles.sectionTitle}>Plan Generated</h2>

        <div style={styles.statBlock}>
          <div style={styles.statLabel}>Required bankroll</div>
          <div style={styles.statValue}>{formatAmount(statistics.requiredBankrollAmount)}</div>
        </div>

        <div style={styles.statBlock}>
          <div style={styles.statLabel}>Expected profit</div>
          <div style={styles.statValue}>{formatAmount(statistics.expectedProfitAmount)}</div>
        </div>

        <div style={styles.statBlock}>
          <div style={styles.statLabel}>Maximum bet</div>
          <div style={styles.statValue}>{formatAmount(statistics.maximumBetAmount)}</div>
        </div>

        {bankrollShort ? (
          <p style={styles.statusWarn}>
            ⚠ Your bankroll is only {formatAmount(userBankroll)}.
            <br />
            Required: {formatAmount(statistics.requiredBankrollAmount)}.
            <br />
            Plan generated — review before use.
          </p>
        ) : (
          <p style={styles.statusOk}>✓ Your plan is ready.</p>
        )}

        <button type="button" style={styles.button} onClick={() => setScreen('plan')}>
          View Plan
        </button>
      </main>
    );
  }

  if (screen === 'plan' && generated !== null) {
    const { strategy, statistics } = generated;

    return (
      <main style={styles.page}>
        <button type="button" style={styles.backLink} onClick={() => setScreen('decision')}>
          ← Kết quả
        </button>

        <h2 style={styles.sectionTitle}>Kế hoạch — {strategy.rounds.length} vòng</h2>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Vòng</th>
              <th style={styles.th}>Cược</th>
              <th style={styles.th}>Tích lũy chi</th>
            </tr>
          </thead>
          <tbody>
            {strategy.rounds.map((round) => (
              <tr key={round.index}>
                <td style={styles.td}>{round.index}</td>
                <td style={styles.td}>{formatAmount(round.betAmount)}</td>
                <td style={styles.td}>{formatAmount(round.accumulatedSpent)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p style={{ marginTop: '1rem', fontWeight: 600 }}>
          Vốn cần: {formatAmount(statistics.requiredBankrollAmount)}
        </p>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <h1 style={styles.title}>Stake Planner</h1>
      <p style={styles.subtitle}>Lập kế hoạch — biết cần bao nhiêu vốn</p>

      <form onSubmit={handleGenerate}>
        <div style={styles.field}>
          <label style={styles.label} htmlFor="targetProfit">
            Lợi nhuận mục tiêu
          </label>
          <input
            id="targetProfit"
            style={styles.input}
            inputMode="numeric"
            value={form.targetProfit}
            onChange={(e) => updateField('targetProfit', e.target.value)}
          />
          {fieldErrors.targetProfit !== undefined ? (
            <div style={styles.error}>{fieldErrors.targetProfit}</div>
          ) : null}
        </div>

        <div style={styles.field}>
          <label style={styles.label} htmlFor="roundCount">
            Số vòng
          </label>
          <input
            id="roundCount"
            style={styles.input}
            inputMode="numeric"
            value={form.roundCount}
            onChange={(e) => updateField('roundCount', e.target.value)}
          />
          {fieldErrors.roundCount !== undefined ? (
            <div style={styles.error}>{fieldErrors.roundCount}</div>
          ) : null}
        </div>

        <div style={styles.field}>
          <label style={styles.label} htmlFor="rewardMultiplier">
            Hệ số thưởng
          </label>
          <input
            id="rewardMultiplier"
            style={styles.input}
            inputMode="numeric"
            value={form.rewardMultiplier}
            onChange={(e) => updateField('rewardMultiplier', e.target.value)}
          />
          {fieldErrors.rewardMultiplier !== undefined ? (
            <div style={styles.error}>{fieldErrors.rewardMultiplier}</div>
          ) : null}
        </div>

        <div style={styles.field}>
          <label style={styles.label} htmlFor="minimumBet">
            Cược tối thiểu
          </label>
          <input
            id="minimumBet"
            style={styles.input}
            inputMode="numeric"
            value={form.minimumBet}
            onChange={(e) => updateField('minimumBet', e.target.value)}
          />
          {fieldErrors.minimumBet !== undefined ? (
            <div style={styles.error}>{fieldErrors.minimumBet}</div>
          ) : null}
        </div>

        <div style={styles.field}>
          <label style={styles.label} htmlFor="betStep">
            Bước cược
          </label>
          <input
            id="betStep"
            style={styles.input}
            inputMode="numeric"
            value={form.betStep}
            onChange={(e) => updateField('betStep', e.target.value)}
          />
          {fieldErrors.betStep !== undefined ? (
            <div style={styles.error}>{fieldErrors.betStep}</div>
          ) : null}
        </div>

        <div style={styles.field}>
          <label style={styles.label} htmlFor="userBankroll">
            Vốn của bạn (tùy chọn)
          </label>
          <input
            id="userBankroll"
            style={styles.input}
            inputMode="numeric"
            value={form.userBankroll}
            onChange={(e) => updateField('userBankroll', e.target.value)}
          />
          {fieldErrors.userBankroll !== undefined ? (
            <div style={styles.error}>{fieldErrors.userBankroll}</div>
          ) : null}
        </div>

        {fieldErrors.request !== undefined ? (
          <div style={{ ...styles.error, marginBottom: '1rem' }}>{fieldErrors.request}</div>
        ) : null}

        <button type="submit" style={styles.button}>
          Generate Plan
        </button>
      </form>
    </main>
  );
}
