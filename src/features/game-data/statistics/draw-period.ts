import type { DrawRecord } from '@/features/game-data/statistics/statistics-types';

export type ChartTimePeriod = 'day' | 'week' | 'month' | 'quarter' | 'year';

export const CHART_TIME_PERIODS: readonly ChartTimePeriod[] = [
  'day',
  'week',
  'month',
  'quarter',
  'year',
];

export const CHART_TIME_PERIOD_LABELS: Record<ChartTimePeriod, string> = {
  day: 'Ngày',
  week: 'Tuần',
  month: 'Tháng',
  quarter: 'Quý',
  year: 'Năm',
};

/** Bingo18 wall-clock — always Vietnam (+07). */
export const GAME_TIME_ZONE = 'Asia/Ho_Chi_Minh';

const MIN_YEAR = 2000;
const MAX_YEAR = 2100;

export interface ChartPeriodBounds {
  readonly start: Date;
  readonly end: Date;
}

export interface ChartPeriodSelection {
  readonly period: ChartTimePeriod;
  /** Any instant inside the selected calendar period (game TZ). */
  readonly referenceDate: Date;
}

export interface DrawKeyBounds {
  readonly fromKey: string;
  readonly toKey: string;
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

type GameParts = {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly hour: number;
  readonly minute: number;
  readonly second: number;
};

function readGameParts(instant: Date): GameParts {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: GAME_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(instant).map((part) => [part.type, part.value]),
  );
  return {
    year: Number(parts['year']),
    month: Number(parts['month']),
    day: Number(parts['day']),
    hour: Number(parts['hour']),
    minute: Number(parts['minute']),
    second: Number(parts['second']),
  };
}

function gameDateKey(parts: Pick<GameParts, 'year' | 'month' | 'day'>): string {
  return `${String(parts.year)}-${pad2(parts.month)}-${pad2(parts.day)}`;
}

/** YYYY-MM-DD in game timezone. */
export function toGameDateKey(instant: Date): string {
  return gameDateKey(readGameParts(instant));
}

export function dateKeyToReferenceInstant(dateKey: string): Date {
  return new Date(`${dateKey}T12:00:00+07:00`);
}

export function toDrawKeyFromInstant(instant: Date): string {
  const p = readGameParts(instant);
  return (
    `${String(p.year)}${pad2(p.month)}${pad2(p.day)}` +
    `${pad2(p.hour)}${pad2(p.minute)}${pad2(p.second)}`
  );
}

function gameMidnight(year: number, month: number, day: number): Date {
  return new Date(`${String(year)}-${pad2(month)}-${pad2(day)}T00:00:00+07:00`);
}

function gameEndOfDay(year: number, month: number, day: number): Date {
  return new Date(`${String(year)}-${pad2(month)}-${pad2(day)}T23:59:59+07:00`);
}

function gameEndOfMonth(year: number, month: number): Date {
  const lastDay = new Date(year, month, 0).getDate();
  return gameEndOfDay(year, month, lastDay);
}

function gameEndOfQuarter(year: number, quarterMonth: number): Date {
  return gameEndOfMonth(year, quarterMonth + 3);
}

/** Parse draw wall-clock to epoch ms; supports ISO drawAt or 14-digit drawKey. */
export function resolveDrawInstant(draw: DrawRecord): number | null {
  if (/^\d{14}$/.test(draw.drawKey)) {
    const k = draw.drawKey;
    const fromKey = Date.parse(
      `${k.slice(0, 4)}-${k.slice(4, 6)}-${k.slice(6, 8)}T${k.slice(8, 10)}:${k.slice(10, 12)}:${k.slice(12, 14)}+07:00`,
    );
    if (!Number.isNaN(fromKey)) {
      return fromKey;
    }
  }

  const parsedAt = Date.parse(draw.drawAt);
  if (!Number.isNaN(parsedAt)) {
    const year = new Date(parsedAt).getFullYear();
    if (year >= MIN_YEAR && year <= MAX_YEAR) {
      return parsedAt;
    }
  }

  return null;
}

function getDrawGameDateKey(draw: DrawRecord): string | null {
  if (/^\d{14}$/.test(draw.drawKey)) {
    const k = draw.drawKey;
    return `${k.slice(0, 4)}-${k.slice(4, 6)}-${k.slice(6, 8)}`;
  }
  const instant = resolveDrawInstant(draw);
  return instant === null ? null : toGameDateKey(new Date(instant));
}

function gameWeekday(year: number, month: number, day: number): number {
  return new Date(`${String(year)}-${pad2(month)}-${pad2(day)}T12:00:00+07:00`).getUTCDay();
}

/** Start of calendar period in game timezone (inclusive). */
export function getChartPeriodStart(
  period: ChartTimePeriod,
  referenceDate: Date = new Date(),
): Date {
  const p = readGameParts(referenceDate);

  switch (period) {
    case 'day':
      return gameMidnight(p.year, p.month, p.day);
    case 'week': {
      const wd = gameWeekday(p.year, p.month, p.day);
      const mondayOffset = wd === 0 ? 6 : wd - 1;
      const midnight = gameMidnight(p.year, p.month, p.day);
      return new Date(midnight.getTime() - mondayOffset * 86_400_000);
    }
    case 'month':
      return gameMidnight(p.year, p.month, 1);
    case 'quarter': {
      const quarterMonth = Math.floor((p.month - 1) / 3) * 3 + 1;
      return gameMidnight(p.year, quarterMonth, 1);
    }
    case 'year':
      return gameMidnight(p.year, 1, 1);
  }
}

/** Inclusive bounds — `clock` is real now; only cap end when period includes today. */
export function getChartPeriodBounds(
  period: ChartTimePeriod,
  referenceDate: Date = new Date(),
  clock: Date = new Date(),
): ChartPeriodBounds {
  const start = getChartPeriodStart(period, referenceDate);
  const p = readGameParts(referenceDate);
  const todayKey = toGameDateKey(clock);

  let periodEnd: Date;
  switch (period) {
    case 'day':
      periodEnd = gameEndOfDay(p.year, p.month, p.day);
      break;
    case 'week': {
      const weekEnd = new Date(start.getTime() + 6 * 86_400_000);
      const we = readGameParts(weekEnd);
      periodEnd = gameEndOfDay(we.year, we.month, we.day);
      break;
    }
    case 'month':
      periodEnd = gameEndOfMonth(p.year, p.month);
      break;
    case 'quarter': {
      const quarterMonth = Math.floor((p.month - 1) / 3) * 3 + 1;
      periodEnd = gameEndOfQuarter(p.year, quarterMonth);
      break;
    }
    case 'year':
      periodEnd = gameEndOfDay(p.year, 12, 31);
      break;
  }

  const periodIncludesToday = isDrawInChartPeriod(todayKey, period, referenceDate);

  if (!periodIncludesToday) {
    return { start, end: periodEnd };
  }

  const nowParts = readGameParts(clock);
  const actualNow = new Date(
    Date.parse(
      `${gameDateKey(nowParts)}T${pad2(nowParts.hour)}:${pad2(nowParts.minute)}:${pad2(nowParts.second)}+07:00`,
    ),
  );

  return {
    start,
    end: new Date(Math.min(periodEnd.getTime(), actualNow.getTime())),
  };
}

/** YYYYMMDD compact key for SQL day filter. */
export function toGameDayCompact(dateKey: string): string {
  return dateKey.replace(/-/g, '');
}

export function compactDayFromReference(referenceDate: Date): string {
  return toGameDayCompact(toGameDateKey(referenceDate));
}

/** draw_key range for Collector — reliable vs mixed draw_at ISO strings. */
export function getDrawKeyBounds(
  period: ChartTimePeriod,
  referenceDate: Date = new Date(),
): DrawKeyBounds {
  const { start, end } = getChartPeriodBounds(period, referenceDate);
  const startParts = readGameParts(start);
  return {
    fromKey: `${String(startParts.year)}${pad2(startParts.month)}${pad2(startParts.day)}000000`,
    toKey: toDrawKeyFromInstant(end),
  };
}

/** ISO with +07:00 for legacy between API. */
export function toGameOffsetIso(instant: Date): string {
  const p = readGameParts(instant);
  return (
    `${gameDateKey(p)}T${pad2(p.hour)}:${pad2(p.minute)}:${pad2(p.second)}+07:00`
  );
}

function isSameGameMonth(aKey: string, bKey: string): boolean {
  return aKey.slice(0, 7) === bKey.slice(0, 7);
}

function isSameGameQuarter(aKey: string, bKey: string): boolean {
  return (
    aKey.slice(0, 4) === bKey.slice(0, 4) &&
    Math.floor((Number(aKey.slice(5, 7)) - 1) / 3) ===
      Math.floor((Number(bKey.slice(5, 7)) - 1) / 3)
  );
}

function isSameGameWeek(aKey: string, bKey: string): boolean {
  return toGameDateKey(getChartPeriodStart('week', dateKeyToReferenceInstant(aKey))) ===
    toGameDateKey(getChartPeriodStart('week', dateKeyToReferenceInstant(bKey)));
}

function isDrawInChartPeriod(
  drawDateKey: string,
  period: ChartTimePeriod,
  referenceDate: Date,
): boolean {
  const refKey = toGameDateKey(referenceDate);
  switch (period) {
    case 'day':
      return drawDateKey === refKey;
    case 'week':
      return isSameGameWeek(drawDateKey, refKey);
    case 'month':
      return isSameGameMonth(drawDateKey, refKey);
    case 'quarter':
      return isSameGameQuarter(drawDateKey, refKey);
    case 'year':
      return drawDateKey.slice(0, 4) === refKey.slice(0, 4);
  }
}

export function filterDrawsByChartPeriod(
  draws: readonly DrawRecord[],
  period: ChartTimePeriod,
  referenceDate: Date = new Date(),
): readonly DrawRecord[] {
  const refKey = toGameDateKey(referenceDate);
  const refDayCompact = toGameDayCompact(refKey);

  return draws.filter((draw) => {
    if (period === 'day' && /^\d{14}$/.test(draw.drawKey)) {
      return draw.drawKey.startsWith(refDayCompact);
    }
    const drawDateKey = getDrawGameDateKey(draw);
    if (drawDateKey === null) {
      return false;
    }
    return isDrawInChartPeriod(drawDateKey, period, referenceDate);
  });
}

const VI_MONTHS = [
  'tháng 1',
  'tháng 2',
  'tháng 3',
  'tháng 4',
  'tháng 5',
  'tháng 6',
  'tháng 7',
  'tháng 8',
  'tháng 9',
  'tháng 10',
  'tháng 11',
  'tháng 12',
] as const;

function formatShortDate(dateKey: string): string {
  const [y = '', m = '', d = ''] = dateKey.split('-');
  return `${d}/${m}/${y}`;
}

/** Human-readable label for chart header. */
export function formatChartPeriodHeading(
  period: ChartTimePeriod,
  referenceDate: Date = new Date(),
): string {
  const refKey = toGameDateKey(referenceDate);
  const [year, month] = refKey.split('-').map(Number);
  const monthIndex = (month ?? 1) - 1;

  switch (period) {
    case 'day':
      return formatShortDate(refKey);
    case 'week': {
      const start = getChartPeriodStart('week', referenceDate);
      const end = new Date(start.getTime() + 6 * 86_400_000);
      return `${formatShortDate(toGameDateKey(start))} – ${formatShortDate(toGameDateKey(end))}`;
    }
    case 'month':
      return `${VI_MONTHS[monthIndex] ?? ''} ${String(year)}`;
    case 'quarter': {
      const q = Math.floor(monthIndex / 3) + 1;
      return `Quý ${String(q)}/${String(year)}`;
    }
    case 'year':
      return `Năm ${String(year)}`;
  }
}

export function defaultChartPeriodSelection(): ChartPeriodSelection {
  return { period: 'day', referenceDate: new Date() };
}

/** Format instant in bingo18 timezone (vi-VN). */
export function formatGameDateTime(
  instant: Date,
  mode: 'date' | 'time' | 'datetime' = 'datetime',
): string {
  const options: Intl.DateTimeFormatOptions =
    mode === 'date'
      ? { year: 'numeric', month: '2-digit', day: '2-digit' }
      : mode === 'time'
        ? { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }
        : {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
          };
  return new Intl.DateTimeFormat('vi-VN', { timeZone: GAME_TIME_ZONE, ...options }).format(
    instant,
  );
}

/** Wall-clock range from actual draws — e.g. "08:05 – 21:30". */
export function formatChartPeriodTimeRange(
  draws: readonly { drawKey: string }[],
): string | null {
  const keys = draws
    .map((d) => d.drawKey)
    .filter((k) => /^\d{14}$/.test(k))
    .sort();
  if (keys.length === 0) {
    return null;
  }
  const first = keys[0] ?? '';
  const last = keys[keys.length - 1] ?? '';
  const toTime = (key: string): string => `${key.slice(8, 10)}:${key.slice(10, 12)}`;
  if (toTime(first) === toTime(last)) {
    return `${toTime(first)} (+07)`;
  }
  return `${toTime(first)} – ${toTime(last)} (+07)`;
}
