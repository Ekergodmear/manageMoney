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
import { useEffect, useMemo, useState, type FormEvent, type JSX, type ReactNode } from 'react';

import {
  AppShell,
  ComingSoonToast,
  PanelCard,
  type NavItemId,
} from '@/shell/AppShell';
import { palette, type ThemeMode } from '@/shell/theme';

type Screen = 'form' | 'decision' | 'plan';

type FormField =
  | 'targetProfit'
  | 'roundCount'
  | 'rewardMultiplier'
  | 'minimumBet'
  | 'betStep'
  | 'userBankroll'
  | 'winTaxThreshold'
  | 'winTaxRatePercent'
  | 'request';

interface FormValues {
  targetProfit: string;
  roundCount: string;
  rewardMultiplier: string;
  minimumBet: string;
  betStep: string;
  userBankroll: string;
  winTaxEnabled: boolean;
  winTaxThreshold: string;
  winTaxRatePercent: string;
}

interface GenerateResult {
  strategy: Strategy;
  statistics: StrategyStatistics;
  request: CalculationRequest;
  userBankroll: number | null;
}

const DEFAULT_FORM: FormValues = {
  targetProfit: '100.000',
  roundCount: '500',
  rewardMultiplier: '120',
  minimumBet: '10.000',
  betStep: '10.000',
  userBankroll: '30.000.000',
  winTaxEnabled: true,
  winTaxThreshold: '10.000.000',
  winTaxRatePercent: '10',
};

const MULTIPLIER_DECIMAL_PLACES = 2;
const SCROLL_TOP_THRESHOLD_PX = 200;

type MoneyFormField = 'targetProfit' | 'minimumBet' | 'betStep' | 'winTaxThreshold' | 'userBankroll';

function normalizeNumericInput(raw: string): string {
  return raw.trim().replace(/,/g, '').replace(/\s/g, '');
}

function normalizeMoneyInput(raw: string): string {
  return raw.trim().replace(/\./g, '').replace(/,/g, '').replace(/\s/g, '');
}

function formatAmount(amount: number): string {
  return amount.toLocaleString('vi-VN');
}

function sanitizeMoneyInput(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits === '') {
    return '';
  }
  const value = Number(digits);
  if (!Number.isFinite(value)) {
    return '';
  }
  return formatAmount(value);
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

function parseMoneyPositiveInt(raw: string): number | null {
  const normalized = normalizeMoneyInput(raw);
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
  'winTax.threshold must be at least 1': 'Ngưỡng thuế phải từ 1 trở lên.',
  'winTax.ratePercent must be between 1 and 99': 'Thuế phải từ 1% đến 99%.',
  'winTax.threshold must be a finite integer': 'Ngưỡng thuế phải là số nguyên.',
  'winTax.ratePercent must be a finite integer': 'Thuế phải là số nguyên.',
};

function userFacingValidationMessage(message: string): string {
  return VALIDATION_MESSAGE_VI[message] ?? 'Giá trị không hợp lệ.';
}

function clientIntegerFieldError(raw: string): string {
  return normalizeNumericInput(raw) === ''
    ? 'Vui lòng nhập số.'
    : 'Vui lòng nhập số nguyên.';
}

function clientMoneyFieldError(raw: string): string {
  return normalizeMoneyInput(raw) === ''
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
    path === 'betStep' ||
    path === 'winTax.threshold'
  ) {
    return path === 'winTax.threshold' ? 'winTaxThreshold' : path;
  }
  if (path === 'winTax.ratePercent') {
    return 'winTaxRatePercent';
  }
  return 'request';
}

function buildRequest(
  values: FormValues,
): { request: CalculationRequest } | { fieldErrors: Partial<Record<FormField, string>> } {
  const fieldErrors: Partial<Record<FormField, string>> = {};

  const targetProfit = parseMoneyPositiveInt(values.targetProfit);
  if (targetProfit === null) {
    fieldErrors.targetProfit = clientMoneyFieldError(values.targetProfit);
  }

  const roundCount = parsePositiveInt(values.roundCount);
  if (roundCount === null) {
    fieldErrors.roundCount = clientIntegerFieldError(values.roundCount);
  }

  const rewardMultiplier = parseDecimal(values.rewardMultiplier, MULTIPLIER_DECIMAL_PLACES);
  if (rewardMultiplier === null) {
    fieldErrors.rewardMultiplier = clientMultiplierFieldError(values.rewardMultiplier);
  }

  const minimumBet = parseMoneyPositiveInt(values.minimumBet);
  if (minimumBet === null) {
    fieldErrors.minimumBet = clientMoneyFieldError(values.minimumBet);
  }

  const betStep = parseMoneyPositiveInt(values.betStep);
  if (betStep === null) {
    fieldErrors.betStep = clientMoneyFieldError(values.betStep);
  }

  let winTaxThreshold: number | null = null;
  let winTaxRatePercent: number | null = null;
  if (values.winTaxEnabled) {
    winTaxThreshold = parseMoneyPositiveInt(values.winTaxThreshold);
    if (winTaxThreshold === null) {
      fieldErrors.winTaxThreshold = clientMoneyFieldError(values.winTaxThreshold);
    }
    winTaxRatePercent = parsePositiveInt(values.winTaxRatePercent);
    if (winTaxRatePercent === null) {
      fieldErrors.winTaxRatePercent = clientIntegerFieldError(values.winTaxRatePercent);
    } else if (winTaxRatePercent < 1 || winTaxRatePercent > 99) {
      fieldErrors.winTaxRatePercent = 'Thuế phải từ 1% đến 99%.';
    }
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
      ...(values.winTaxEnabled &&
      winTaxThreshold !== null &&
      winTaxRatePercent !== null
        ? { winTax: { threshold: winTaxThreshold, ratePercent: winTaxRatePercent } }
        : {}),
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
  const userBankroll = bankrollRaw === '' ? null : parseMoneyPositiveInt(bankrollRaw);

  return {
    result: {
      strategy,
      statistics,
      request: built.request,
      userBankroll,
    },
  };
}

function useShowScrollTop(): boolean {
  const [show, setShow] = useState(false);

  useEffect(() => {
    function onScroll(): void {
      setShow(window.scrollY > SCROLL_TOP_THRESHOLD_PX);
    }

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return show;
}

function createUi(theme: ThemeMode) {
  const c = palette[theme];
  return {
    c,
    pageTitle: { fontSize: '1.65rem', fontWeight: 700, margin: '0 0 0.35rem' } as const,
    pageSubtitle: { color: c.textMuted, margin: '0 0 1.5rem', fontSize: '0.95rem' } as const,
    formGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '1rem 1.25rem',
    } as const,
    field: { marginBottom: 0 } as const,
    labelRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.35rem',
      fontWeight: 600,
      marginBottom: '0.4rem',
      fontSize: '0.85rem',
      color: c.text,
    } as const,
    infoBtn: {
      width: '1.1rem',
      height: '1.1rem',
      borderRadius: '50%',
      border: `1px solid ${c.border}`,
      background: c.surfaceMuted,
      color: c.textMuted,
      fontSize: '0.65rem',
      fontWeight: 700,
      cursor: 'help',
      lineHeight: 1,
      padding: 0,
    } as const,
    input: {
      width: '100%',
      padding: '0.65rem 0.75rem',
      fontSize: '0.95rem',
      border: `1px solid ${c.border}`,
      borderRadius: '10px',
      boxSizing: 'border-box' as const,
      background: c.surface,
      color: c.text,
    },
    inputWithIcon: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      border: `1px solid ${c.border}`,
      borderRadius: '10px',
      padding: '0 0.65rem',
      background: c.surface,
    },
    fieldHint: { color: c.textMuted, fontSize: '0.78rem', marginTop: '0.35rem', lineHeight: 1.4 } as const,
    error: { color: '#dc2626', fontSize: '0.82rem', marginTop: '0.3rem' } as const,
    primaryBtn: {
      width: '100%',
      padding: '0.85rem 1rem',
      fontSize: '1rem',
      fontWeight: 600,
      background: '#111',
      color: '#fff',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      marginTop: '1.25rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
    } as const,
    secondaryBtn: {
      background: c.surface,
      border: `1px solid ${c.border}`,
      borderRadius: '10px',
      padding: '0.5rem 0.85rem',
      color: c.text,
      cursor: 'pointer',
      fontSize: '0.88rem',
      fontWeight: 600,
    } as const,
    privacyBanner: {
      marginTop: '1.25rem',
      background: c.okBg,
      border: `1px solid ${c.okBorder}`,
      color: c.okText,
      borderRadius: '12px',
      padding: '0.85rem 1rem',
      fontSize: '0.85rem',
      lineHeight: 1.45,
    } as const,
    card: {
      background: c.surface,
      border: `1px solid ${c.border}`,
      borderRadius: '14px',
      padding: '1.1rem',
      marginBottom: '0.85rem',
      boxShadow: c.shadow,
    } as const,
    cardHero: {
      background: `linear-gradient(135deg, ${c.primarySoft}, ${c.surface})`,
      border: `1px solid ${c.border}`,
      borderRadius: '14px',
      padding: '1.2rem',
      marginBottom: '0.85rem',
    } as const,
    summaryRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.45rem 0',
      fontSize: '0.88rem',
      borderBottom: `1px solid ${c.border}`,
    } as const,
    warnBox: {
      background: c.warnBg,
      border: `1px solid ${c.warnBorder}`,
      color: c.warnText,
      borderRadius: '12px',
      padding: '0.85rem',
      fontSize: '0.85rem',
      lineHeight: 1.5,
    } as const,
    upcomingList: {
      margin: 0,
      paddingLeft: '1.1rem',
      color: c.textMuted,
      fontSize: '0.85rem',
      lineHeight: 1.6,
    } as const,
    table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: '0.88rem' } as const,
    th: {
      textAlign: 'left' as const,
      borderBottom: `2px solid ${c.border}`,
      padding: '0.5rem 0.35rem',
      color: c.textMuted,
      fontWeight: 600,
      fontSize: '0.8rem',
    },
    td: { borderBottom: `1px solid ${c.border}`, padding: '0.5rem 0.35rem' } as const,
    thCheck: {
      textAlign: 'center' as const,
      borderBottom: `2px solid ${c.border}`,
      padding: '0.5rem 0.35rem',
      width: '2.5rem',
    },
    tdCheck: {
      borderBottom: `1px solid ${c.border}`,
      padding: '0.5rem 0.35rem',
      textAlign: 'center' as const,
    },
    rowCompleted: { background: theme === 'light' ? '#f0fdf4' : '#052e16' } as const,
    stickyNav: {
      position: 'sticky' as const,
      top: 0,
      zIndex: 10,
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      flexWrap: 'wrap' as const,
      padding: '0 0 1rem',
      marginBottom: '0.5rem',
      background: c.bg,
    },
    scrollTopButton: {
      position: 'fixed' as const,
      right: 'max(1rem, env(safe-area-inset-right))',
      bottom: 'max(1.25rem, env(safe-area-inset-bottom))',
      zIndex: 20,
      width: '2.75rem',
      height: '2.75rem',
      borderRadius: '50%',
      border: 'none',
      background: c.primary,
      color: '#fff',
      fontSize: '1.2rem',
      cursor: 'pointer',
      boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
    },
  };
}

function FieldLabel({
  htmlFor,
  icon,
  label,
  info,
  ui,
}: {
  htmlFor: string;
  icon: string;
  label: string;
  info?: string | undefined;
  ui: ReturnType<typeof createUi>;
}): JSX.Element {
  return (
    <label htmlFor={htmlFor} style={ui.labelRow}>
      <span aria-hidden>{icon}</span>
      {label}
      {info != null && info !== '' ? (
        <button type="button" style={ui.infoBtn} title={info} aria-label={info}>
          i
        </button>
      ) : null}
    </label>
  );
}

function FormInputField({
  id,
  icon,
  label,
  info,
  value,
  onChange,
  error,
  inputMode,
  ui,
  fullWidth = false,
}: {
  id: string;
  icon: string;
  label: string;
  info?: string | undefined;
  value: string;
  onChange: (v: string) => void;
  error?: string | undefined;
  inputMode?: 'numeric' | 'decimal' | 'text';
  ui: ReturnType<typeof createUi>;
  fullWidth?: boolean;
}): JSX.Element {
  return (
    <div style={{ ...ui.field, ...(fullWidth ? { gridColumn: '1 / -1' } : {}) }}>
      <FieldLabel htmlFor={id} icon={icon} label={label} info={info} ui={ui} />
      <div style={ui.inputWithIcon}>
        <span aria-hidden style={{ opacity: 0.7 }}>
          {icon}
        </span>
        <input
          id={id}
          style={{ ...ui.input, border: 'none', padding: '0.65rem 0', background: 'transparent' }}
          inputMode={inputMode}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      {error != null && error !== '' ? <div style={ui.error}>{error}</div> : null}
    </div>
  );
}

function ScrollToTopButton({
  visible,
  ui,
}: {
  visible: boolean;
  ui: ReturnType<typeof createUi>;
}): JSX.Element | null {
  if (!visible) {
    return null;
  }
  return (
    <button
      type="button"
      style={ui.scrollTopButton}
      aria-label="Cuộn lên đầu trang"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      ↑
    </button>
  );
}

function DecisionCard({
  emoji,
  label,
  value,
  hint,
  hero,
  ui,
}: {
  emoji: string;
  label: string;
  value: string;
  hint?: string;
  hero?: boolean;
  ui: ReturnType<typeof createUi>;
}): JSX.Element {
  return (
    <section style={hero ? ui.cardHero : ui.card}>
      <div style={{ fontSize: '1.25rem', marginBottom: '0.35rem' }} aria-hidden>
        {emoji}
      </div>
      <div style={{ color: ui.c.textMuted, fontSize: '0.85rem', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: hero ? 'clamp(1.5rem, 4vw, 2rem)' : '1.2rem', fontWeight: 700 }}>
        {value}
      </div>
      {hint !== undefined ? (
        <p style={{ color: ui.c.textMuted, fontSize: '0.82rem', marginTop: '0.4rem', marginBottom: 0 }}>
          {hint}
        </p>
      ) : null}
    </section>
  );
}

function SummaryLine({
  icon,
  label,
  value,
  highlight,
  ui,
}: {
  icon: string;
  label: string;
  value: string;
  highlight?: boolean;
  ui: ReturnType<typeof createUi>;
}): JSX.Element {
  return (
    <div style={ui.summaryRow}>
      <span style={{ color: ui.c.textMuted }}>
        {icon} {label}
      </span>
      <strong style={{ color: highlight ? ui.c.primary : ui.c.text }}>{value}</strong>
    </div>
  );
}

export function App(): JSX.Element {
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [screen, setScreen] = useState<Screen>('form');
  const [form, setForm] = useState<FormValues>(DEFAULT_FORM);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FormField, string>>>({});
  const [generated, setGenerated] = useState<GenerateResult | null>(null);
  const [completedThroughRound, setCompletedThroughRound] = useState(0);
  const [comingSoon, setComingSoon] = useState<string | null>(null);
  const showScrollTop = useShowScrollTop();
  const ui = useMemo(() => createUi(theme), [theme]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [screen]);

  function goToScreen(next: Screen): void {
    setScreen(next);
  }

  function handleNavSelect(id: NavItemId): void {
    if (id !== 'create') {
      setComingSoon('Tính năng đang phát triển — sẽ có trong bản cập nhật tới.');
      return;
    }
    goToScreen('form');
  }

  function updateField(key: keyof FormValues, value: string): void {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key as FormField];
      delete next.request;
      return next;
    });
  }

  function updateMoneyField(key: MoneyFormField, value: string): void {
    updateField(key, sanitizeMoneyInput(value));
  }

  function handleGenerate(event: FormEvent): void {
    event.preventDefault();

    if (form.userBankroll.trim() !== '' && parseMoneyPositiveInt(form.userBankroll) === null) {
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
    setCompletedThroughRound(0);
    setGenerated(outcome.result);
    goToScreen('decision');
  }

  function handleRoundProgressToggle(roundIndex: number, checked: boolean): void {
    setCompletedThroughRound(checked ? roundIndex : roundIndex - 1);
  }

  function resetRoundProgress(): void {
    setCompletedThroughRound(0);
  }

  function renderRightPanel(): ReactNode {
    const bankrollDisplay =
      form.userBankroll.trim() === '' ? '—' : `${form.userBankroll} đ`;

    if (screen === 'decision' && generated !== null) {
      const { statistics, userBankroll } = generated;
      return (
        <>
          <PanelCard title="Kết quả kế hoạch" theme={theme}>
            <SummaryLine
              icon="💰"
              label="Vốn cần"
              value={`${formatAmount(statistics.requiredBankrollAmount)} đ`}
              ui={ui}
              highlight
            />
            <SummaryLine
              icon="📈"
              label="Lợi nhuận ước tính"
              value={`${formatAmount(statistics.expectedProfitAmount)} đ`}
              ui={ui}
            />
            <SummaryLine
              icon="📊"
              label="Cược lớn nhất"
              value={`${formatAmount(statistics.maximumBetAmount)} đ`}
              ui={ui}
            />
            {userBankroll !== null ? (
              <SummaryLine
                icon="🏦"
                label="Vốn của bạn"
                value={`${formatAmount(userBankroll)} đ`}
                ui={ui}
                highlight={userBankroll < statistics.requiredBankrollAmount}
              />
            ) : null}
          </PanelCard>
          {renderStaticPanels()}
        </>
      );
    }

    if (screen === 'plan' && generated !== null) {
      const { strategy, statistics } = generated;
      return (
        <>
          <PanelCard title="Tiến độ" theme={theme}>
            <SummaryLine
              icon="✓"
              label="Đã cược"
              value={`${String(completedThroughRound)} / ${String(strategy.rounds.length)}`}
              ui={ui}
              highlight
            />
            <SummaryLine
              icon="💰"
              label="Vốn cần"
              value={`${formatAmount(statistics.requiredBankrollAmount)} đ`}
              ui={ui}
            />
          </PanelCard>
          {renderStaticPanels()}
        </>
      );
    }

    return (
      <>
        <PanelCard title="Tóm tắt nhanh" theme={theme}>
          <SummaryLine icon="🎯" label="Mục tiêu" value={`${form.targetProfit} đ`} ui={ui} />
          <SummaryLine icon="🔢" label="Số vòng" value={form.roundCount} ui={ui} />
          <SummaryLine icon="✖️" label="Hệ số" value={`×${form.rewardMultiplier}`} ui={ui} />
          <SummaryLine icon="💵" label="Cược tối thiểu" value={`${form.minimumBet} đ`} ui={ui} />
          <SummaryLine
            icon="🏦"
            label="Vốn của bạn"
            value={bankrollDisplay}
            ui={ui}
            highlight={form.userBankroll.trim() !== ''}
          />
        </PanelCard>
        {renderStaticPanels()}
      </>
    );
  }

  function renderStaticPanels(): ReactNode {
    return (
      <>
        <PanelCard title="Lưu ý quan trọng" theme={theme}>
          <div style={ui.warnBox}>
            Kế hoạch dựa trên công thức tối ưu — không đảm bảo thắng. Hãy chơi có trách nhiệm và chỉ
            dùng số vốn bạn chấp nhận mất.
          </div>
        </PanelCard>
        <PanelCard title="Tính năng sắp tới" theme={theme}>
          <ul style={ui.upcomingList}>
            <li>Mô phỏng kịch bản</li>
            <li>Tối ưu khi thiếu vốn</li>
            <li>Tiếp tục kế hoạch</li>
            <li>Phân bổ đa tài khoản</li>
          </ul>
        </PanelCard>
      </>
    );
  }

  function renderMain(): ReactNode {
    if (screen === 'decision' && generated !== null) {
      const { statistics, userBankroll, request } = generated;
      const bankrollShort =
        userBankroll !== null && userBankroll < statistics.requiredBankrollAmount;
      const targetAmount =
        request.targetProfit.mode === 'fixedAmount' ? request.targetProfit.amount : null;

      return (
        <>
          <nav style={ui.stickyNav} aria-label="Điều hướng">
            <button type="button" style={ui.secondaryBtn} onClick={() => goToScreen('form')}>
              ← Sửa ý định
            </button>
          </nav>
          <h1 style={ui.pageTitle}>Kết quả kế hoạch</h1>
          <p style={ui.pageSubtitle}>Xem tổng quan trước khi vào bảng chi tiết từng vòng.</p>

          <DecisionCard
            emoji="💰"
            label="Vốn cần chuẩn bị"
            value={`${formatAmount(statistics.requiredBankrollAmount)} đ`}
            hint="Mức vốn tối đa nếu chưa thắng vòng nào."
            hero
            ui={ui}
          />
          {targetAmount !== null ? (
            <DecisionCard
              emoji="🎯"
              label="Mục tiêu của bạn"
              value={`${formatAmount(targetAmount)} đ`}
              ui={ui}
            />
          ) : null}
          <DecisionCard
            emoji="📈"
            label="Lợi nhuận ước tính (nếu thắng)"
            value={`${formatAmount(statistics.expectedProfitAmount)} đ`}
            ui={ui}
          />
          <DecisionCard
            emoji="📊"
            label="Cược lớn nhất"
            value={`${formatAmount(statistics.maximumBetAmount)} đ`}
            ui={ui}
          />

          <section style={ui.card}>
            {bankrollShort ? (
              <p style={{ color: ui.c.warnText, margin: '0 0 1rem', lineHeight: 1.45 }}>
                ⚠ Vốn của bạn thấp hơn mức cần — hãy xem lại trước khi dùng.
              </p>
            ) : (
              <p style={{ color: ui.c.okText, margin: '0 0 1rem', fontWeight: 600 }}>
                ✓ Kế hoạch cược đã sẵn sàng.
              </p>
            )}
            <button type="button" style={ui.primaryBtn} onClick={() => goToScreen('plan')}>
              ✨ Xem kế hoạch cược
            </button>
          </section>
          <ScrollToTopButton visible={showScrollTop} ui={ui} />
        </>
      );
    }

    if (screen === 'plan' && generated !== null) {
      const { strategy, statistics } = generated;

      return (
        <>
          <nav style={ui.stickyNav} aria-label="Điều hướng">
            <button type="button" style={ui.secondaryBtn} onClick={() => goToScreen('decision')}>
              ← Kết quả
            </button>
            <button type="button" style={ui.secondaryBtn} onClick={() => goToScreen('form')}>
              ← Sửa ý định
            </button>
          </nav>
          <h1 style={ui.pageTitle}>Kế hoạch — {strategy.rounds.length} vòng</h1>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              flexWrap: 'wrap',
              marginBottom: '1rem',
            }}
          >
            <span style={{ fontSize: '0.9rem', color: ui.c.textMuted }}>
              Đã cược: <strong style={{ color: ui.c.text }}>{completedThroughRound}</strong> /{' '}
              {strategy.rounds.length}
              {completedThroughRound > 0
                ? ` · Tích lũy: ${formatAmount(strategy.rounds[completedThroughRound - 1]?.accumulatedSpent ?? 0)} đ`
                : ''}
            </span>
            {completedThroughRound > 0 ? (
              <button type="button" style={ui.secondaryBtn} onClick={resetRoundProgress}>
                Đặt lại
              </button>
            ) : null}
          </div>

          <div style={{ overflowX: 'auto', background: ui.c.surface, borderRadius: '14px', border: `1px solid ${ui.c.border}` }}>
            <table style={ui.table}>
              <thead>
                <tr>
                  <th style={ui.thCheck} scope="col" aria-label="Đã cược">
                    ✓
                  </th>
                  <th style={ui.th}>Vòng</th>
                  <th style={ui.th}>Cược</th>
                  <th style={ui.th}>Tích lũy chi</th>
                </tr>
              </thead>
              <tbody>
                {strategy.rounds.map((round) => {
                  const isCompleted = round.index <= completedThroughRound;
                  return (
                    <tr key={round.index} style={isCompleted ? ui.rowCompleted : undefined}>
                      <td style={ui.tdCheck}>
                        <input
                          type="checkbox"
                          checked={isCompleted}
                          aria-label={`Đánh dấu đã cược đến vòng ${String(round.index)}`}
                          onChange={(e) =>
                            handleRoundProgressToggle(round.index, e.target.checked)
                          }
                        />
                      </td>
                      <td style={ui.td}>{round.index}</td>
                      <td style={ui.td}>{formatAmount(round.betAmount)}</td>
                      <td style={ui.td}>{formatAmount(round.accumulatedSpent)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p style={{ marginTop: '1rem', fontWeight: 600 }}>
            Vốn cần: {formatAmount(statistics.requiredBankrollAmount)} đ
          </p>
          <ScrollToTopButton visible={showScrollTop} ui={ui} />
        </>
      );
    }

    return (
      <>
        <h1 style={ui.pageTitle}>Tạo kế hoạch</h1>
        <p style={ui.pageSubtitle}>
          Nhập thông tin bên dưới để tạo kế hoạch cược tối ưu
        </p>

        <form onSubmit={handleGenerate}>
          <div style={ui.formGrid}>
            <FormInputField
              id="targetProfit"
              icon="🎯"
              label="Lợi nhuận mục tiêu (đ)"
              info="Số tiền lời bạn muốn đạt khi thắng"
              value={form.targetProfit}
              onChange={(v) => updateMoneyField('targetProfit', v)}
              error={fieldErrors.targetProfit}
              inputMode="numeric"
              ui={ui}
            />
            <FormInputField
              id="roundCount"
              icon="🔢"
              label="Số vòng"
              info="Số vòng tối đa trước khi thắng"
              value={form.roundCount}
              onChange={(v) => updateField('roundCount', v)}
              error={fieldErrors.roundCount}
              inputMode="numeric"
              ui={ui}
            />
            <FormInputField
              id="rewardMultiplier"
              icon="✖️"
              label="Hệ số thưởng (×)"
              info="Hệ số nhân tiền thắng (tối đa 2 chữ số thập phân)"
              value={form.rewardMultiplier}
              onChange={(v) => updateField('rewardMultiplier', v)}
              error={fieldErrors.rewardMultiplier}
              inputMode="decimal"
              ui={ui}
            />
            <FormInputField
              id="minimumBet"
              icon="💵"
              label="Cược tối thiểu (đ)"
              value={form.minimumBet}
              onChange={(v) => updateMoneyField('minimumBet', v)}
              error={fieldErrors.minimumBet}
              inputMode="numeric"
              ui={ui}
            />
            <FormInputField
              id="betStep"
              icon="📏"
              label="Bước cược (đ)"
              value={form.betStep}
              onChange={(v) => updateMoneyField('betStep', v)}
              error={fieldErrors.betStep}
              inputMode="numeric"
              ui={ui}
            />

            <div style={{ gridColumn: '1 / -1' }}>
              <label
                style={{
                  ...ui.labelRow,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={form.winTaxEnabled}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, winTaxEnabled: e.target.checked }));
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next.winTaxThreshold;
                      delete next.winTaxRatePercent;
                      delete next.request;
                      return next;
                    });
                  }}
                />
                Áp dụng thuế khi thắng lớn
              </label>
              <p style={ui.fieldHint}>
                Thuế tính trên tổng tiền thắng khi đạt ngưỡng (mặc định: 10% từ 10 triệu).
              </p>
            </div>

            {form.winTaxEnabled ? (
              <>
                <FormInputField
                  id="winTaxThreshold"
                  icon="🏛️"
                  label="Ngưỡng thuế (tiền thắng) (đ)"
                  value={form.winTaxThreshold}
                  onChange={(v) => updateMoneyField('winTaxThreshold', v)}
                  error={fieldErrors.winTaxThreshold}
                  inputMode="numeric"
                  ui={ui}
                />
                <FormInputField
                  id="winTaxRatePercent"
                  icon="％"
                  label="Thuế (%)"
                  value={form.winTaxRatePercent}
                  onChange={(v) => updateField('winTaxRatePercent', v)}
                  error={fieldErrors.winTaxRatePercent}
                  inputMode="numeric"
                  ui={ui}
                />
              </>
            ) : null}

            <FormInputField
              id="userBankroll"
              icon="🏦"
              label="Vốn của bạn (tùy chọn) (đ)"
              info="Để so sánh với vốn cần chuẩn bị"
              value={form.userBankroll}
              onChange={(v) => updateMoneyField('userBankroll', v)}
              error={fieldErrors.userBankroll}
              inputMode="numeric"
              ui={ui}
              fullWidth
            />
          </div>

          {fieldErrors.request !== undefined ? (
            <div style={{ ...ui.error, marginTop: '1rem' }}>{fieldErrors.request}</div>
          ) : null}

          <button type="submit" style={ui.primaryBtn}>
            ✨ Tạo kế hoạch
          </button>

          <div style={ui.privacyBanner}>
            🔒 Dữ liệu được xử lý hoàn toàn trên trình duyệt của bạn — không lưu trên server.
          </div>
        </form>
      </>
    );
  }

  return (
    <>
      <AppShell
        activeNav="create"
        onNavSelect={handleNavSelect}
        theme={theme}
        onThemeChange={setTheme}
        main={renderMain()}
        rightPanel={renderRightPanel()}
        showRightPanel
      />
      {comingSoon !== null ? (
        <ComingSoonToast message={comingSoon} onClose={() => setComingSoon(null)} theme={theme} />
      ) : null}
    </>
  );
}
