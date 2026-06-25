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

const MULTIPLIER_DECIMAL_PLACES = 2;

function normalizeNumericInput(raw: string): string {
  return raw.trim().replace(/,/g, '').replace(/\s/g, '');
}

function formatAmount(amount: number): string {
  return amount.toLocaleString('vi-VN');
}

function parsePositiveInt(raw: string): number | null {
  const normalized = normalizeNumericInput(raw);
  if (normalized === '') {
    return null;
  }
  const value = Number(normalized);
  if (!Number.isFinite(value) || !Number.isInteger(value)) {
    return null;
  }
  return value;
}

function parseDecimal(raw: string, maxDecimalPlaces: number): number | null {
  const normalized = normalizeNumericInput(raw);
  if (normalized === '') {
    return null;
  }
  const value = Number(normalized);
  if (!Number.isFinite(value)) {
    return null;
  }
  const scale = 10 ** maxDecimalPlaces;
  const scaled = Math.round(value * scale);
  if (Math.abs(value * scale - scaled) > 1e-6) {
    return null;
  }
  return value;
}

const VALIDATION_MESSAGE_VI: Record<string, string> = {
  'roundCount must be at least 1': 'Số vòng phải từ 1 trở lên.',
  'roundCount must be an integer': 'Số vòng phải là số nguyên.',
  'roundCount must be a finite number': 'Số vòng phải là số hợp lệ.',
  'rewardMultiplier must be greater than 1': 'Hệ số thưởng phải lớn hơn 1.',
  'rewardMultiplier must be a finite number': 'Hệ số thưởng phải là số hợp lệ.',
  'rewardMultiplier must have at most 2 decimal places':
    'Hệ số thưởng hỗ trợ tối đa 2 chữ số thập phân.',
  'minimumBet must be a multiple of betStep': 'Cược tối thiểu phải chia hết cho bước cược.',
  'minimumBet must be at least 1': 'Cược tối thiểu phải từ 1 trở lên.',
  'betStep must be at least 1': 'Bước cược phải từ 1 trở lên.',
  'targetProfit.amount must be non-negative': 'Lợi nhuận mục tiêu không được âm.',
  'targetProfit.amount must be an integer': 'Lợi nhuận mục tiêu phải là số nguyên.',
};

function userFacingValidationMessage(message: string): string {
  return VALIDATION_MESSAGE_VI[message] ?? 'Giá trị không hợp lệ.';
}

function clientIntegerFieldError(raw: string): string {
  return normalizeNumericInput(raw) === ''
    ? 'Vui lòng nhập số.'
    : 'Vui lòng nhập số nguyên.';
}

function clientMultiplierFieldError(raw: string): string {
  return normalizeNumericInput(raw) === ''
    ? 'Vui lòng nhập số.'
    : 'Vui lòng nhập số hợp lệ (tối đa 2 chữ số thập phân).';
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

function buildRequest(
  values: FormValues,
): { request: CalculationRequest } | { fieldErrors: Partial<Record<FormField, string>> } {
  const fieldErrors: Partial<Record<FormField, string>> = {};

  const targetProfit = parsePositiveInt(values.targetProfit);
  if (targetProfit === null) {
    fieldErrors.targetProfit = clientIntegerFieldError(values.targetProfit);
  }

  const roundCount = parsePositiveInt(values.roundCount);
  if (roundCount === null) {
    fieldErrors.roundCount = clientIntegerFieldError(values.roundCount);
  }

  const rewardMultiplier = parseDecimal(values.rewardMultiplier, MULTIPLIER_DECIMAL_PLACES);
  if (rewardMultiplier === null) {
    fieldErrors.rewardMultiplier = clientMultiplierFieldError(values.rewardMultiplier);
  }

  const minimumBet = parsePositiveInt(values.minimumBet);
  if (minimumBet === null) {
    fieldErrors.minimumBet = clientIntegerFieldError(values.minimumBet);
  }

  const betStep = parsePositiveInt(values.betStep);
  if (betStep === null) {
    fieldErrors.betStep = clientIntegerFieldError(values.betStep);
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  if (
    targetProfit === null ||
    roundCount === null ||
    rewardMultiplier === null ||
    minimumBet === null ||
    betStep === null
  ) {
    return { fieldErrors: { request: 'Vui lòng kiểm tra lại các ô bắt buộc.' } };
  }

  return {
    request: {
      rewardMultiplier,
      roundCount,
      minimumBet,
      betStep,
      targetProfit: { mode: 'fixedAmount', amount: targetProfit },
    },
  };
}

function generatePlan(values: FormValues): {
  result?: GenerateResult;
  fieldErrors?: Partial<Record<FormField, string>>;
} {
  const built = buildRequest(values);
  if ('fieldErrors' in built) {
    return { fieldErrors: built.fieldErrors };
  }

  const validated = validateCalculationRequest(built.request);
  if (validated.kind === 'failure') {
    const fieldErrors: Partial<Record<FormField, string>> = {};
    for (const err of validated.error.errors) {
      const field = mapValidationPath(err.path);
      if (fieldErrors[field] === undefined) {
        fieldErrors[field] = userFacingValidationMessage(err.message);
      }
    }
    return { fieldErrors };
  }

  const solved = solve(validated.value);
  if (solved.kind === 'failure') {
    return { fieldErrors: { request: 'Không tạo được kế hoạch. Vui lòng kiểm tra lại thông tin.' } };
  }

  const strategy = buildStrategy(solved.value.rounds);
  const statistics = buildStatistics(strategy);
  const bankrollRaw = values.userBankroll.trim();
  const userBankroll = bankrollRaw === '' ? null : parsePositiveInt(bankrollRaw);

  return {
    result: {
      strategy,
      statistics,
      request: built.request,
      userBankroll,
    },
  };
}

const styles = {
  page: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    maxWidth: 'min(28rem, 100%)',
    margin: '0 auto',
    padding: 'clamp(1rem, 4vw, 1.75rem) clamp(1rem, 3vw, 1.25rem)',
    color: '#111',
    lineHeight: 1.5,
  } as const,
  title: { fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.25rem' } as const,
  subtitle: { color: '#555', margin: '0 0 1.5rem', fontSize: '0.95rem' } as const,
  label: { display: 'block', fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.9rem' } as const,
  input: {
    width: '100%',
    padding: '0.55rem 0.65rem',
    fontSize: '1rem',
    border: '1px solid #ccc',
    borderRadius: '6px',
    boxSizing: 'border-box' as const,
  },
  field: { marginBottom: '1rem' } as const,
  fieldHint: { color: '#666', fontSize: '0.8rem', marginTop: '0.3rem', lineHeight: 1.4 } as const,
  error: { color: '#b00020', fontSize: '0.85rem', marginTop: '0.25rem' } as const,
  button: {
    width: '100%',
    padding: '0.7rem 1rem',
    fontSize: '1rem',
    fontWeight: 600,
    background: '#111',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
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
  card: {
    background: '#fafafa',
    border: '1px solid #e8e8e8',
    borderRadius: '10px',
    padding: '1rem 1.1rem',
    marginBottom: '0.85rem',
  } as const,
  cardHero: {
    background: '#f4f6f8',
    border: '1px solid #dde3ea',
    borderRadius: '10px',
    padding: '1.15rem 1.1rem',
    marginBottom: '0.85rem',
  } as const,
  cardEmoji: { fontSize: '1.1rem', marginBottom: '0.35rem' } as const,
  cardLabel: { color: '#555', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.2rem' } as const,
  cardValueHero: { fontSize: 'clamp(1.75rem, 6vw, 2.25rem)', fontWeight: 700, lineHeight: 1.15 } as const,
  cardValue: { fontSize: '1.2rem', fontWeight: 600 } as const,
  cardHint: { color: '#666', fontSize: '0.8rem', marginTop: '0.4rem', lineHeight: 1.45 } as const,
  cardFooter: {
    background: '#fff',
    border: '1px solid #e8e8e8',
    borderRadius: '10px',
    padding: '1rem 1.1rem',
    marginTop: '0.25rem',
    marginBottom: '1rem',
  } as const,
  statusOk: { color: '#0d6b0d', margin: '0 0 1rem', fontWeight: 500 } as const,
  statusWarn: { color: '#9a6700', margin: '0 0 1rem', lineHeight: 1.45 } as const,
  sectionTitle: { fontSize: '1.15rem', fontWeight: 700, margin: '0 0 1rem' } as const,
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: '0.9rem' } as const,
  th: {
    textAlign: 'left' as const,
    borderBottom: '2px solid #ddd',
    padding: '0.4rem 0.25rem',
  },
  td: { borderBottom: '1px solid #eee', padding: '0.4rem 0.25rem' } as const,
};

function DecisionCard({
  emoji,
  label,
  value,
  hint,
  hero = false,
}: {
  emoji: string;
  label: string;
  value: string;
  hint?: string;
  hero?: boolean;
}): JSX.Element {
  return (
    <section style={hero ? styles.cardHero : styles.card}>
      <div style={styles.cardEmoji} aria-hidden="true">
        {emoji}
      </div>
      <div style={styles.cardLabel}>{label}</div>
      <div style={hero ? styles.cardValueHero : styles.cardValue}>{value}</div>
      {hint !== undefined ? <p style={styles.cardHint}>{hint}</p> : null}
    </section>
  );
}

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
      setFieldErrors({ userBankroll: 'Vui lòng nhập số nguyên.' });
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
    const { statistics, userBankroll, request } = generated;
    const bankrollShort =
      userBankroll !== null && userBankroll < statistics.requiredBankrollAmount;
    const targetAmount =
      request.targetProfit.mode === 'fixedAmount' ? request.targetProfit.amount : null;

    return (
      <main style={styles.page}>
        <button type="button" style={styles.backLink} onClick={() => setScreen('form')}>
          ← Sửa ý định
        </button>

        <DecisionCard
          emoji="💰"
          label="Vốn cần chuẩn bị"
          value={formatAmount(statistics.requiredBankrollAmount)}
          hint="Đây là mức vốn tối đa bạn cần có nếu chưa thắng vòng nào."
          hero
        />

        {targetAmount !== null ? (
          <DecisionCard emoji="🎯" label="Mục tiêu của bạn" value={formatAmount(targetAmount)} />
        ) : null}

        <DecisionCard
          emoji="📈"
          label="Lợi nhuận ước tính (nếu thắng)"
          value={formatAmount(statistics.expectedProfitAmount)}
        />

        <DecisionCard
          emoji="📊"
          label="Cược lớn nhất"
          value={formatAmount(statistics.maximumBetAmount)}
        />

        <section style={styles.cardFooter}>
          {bankrollShort ? (
            <p style={styles.statusWarn}>
              ⚠ Vốn của bạn: {formatAmount(userBankroll)} — thấp hơn mức cần{' '}
              {formatAmount(statistics.requiredBankrollAmount)}.
              <br />
              Kế hoạch đã tạo — hãy xem lại trước khi dùng.
            </p>
          ) : (
            <p style={styles.statusOk}>✓ Kế hoạch cược của bạn đã sẵn sàng.</p>
          )}

          <button type="button" style={styles.button} onClick={() => setScreen('plan')}>
            Xem kế hoạch cược
          </button>
        </section>
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

        <div style={{ overflowX: 'auto' }}>
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
        </div>

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
            inputMode="decimal"
            placeholder="Ví dụ: 20, 19.6, 1.95"
            value={form.rewardMultiplier}
            onChange={(e) => updateField('rewardMultiplier', e.target.value)}
          />
          <p style={styles.fieldHint}>Hỗ trợ tối đa 2 chữ số thập phân.</p>
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
          Tạo kế hoạch
        </button>
      </form>
    </main>
  );
}
