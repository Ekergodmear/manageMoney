import { useMemo, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import {
  CHART_TIME_PERIOD_LABELS,
  CHART_TIME_PERIODS,
  dateKeyToReferenceInstant,
  getChartPeriodStart,
  toGameDateKey,
  type ChartPeriodSelection,
  type ChartTimePeriod,
} from '@/features/game-data/statistics/draw-period';
import { cn } from '@/lib/utils';

export interface ChartPeriodSelectorProps {
  readonly value: ChartPeriodSelection;
  readonly onChange: (next: ChartPeriodSelection) => void;
  /** YYYY-MM-DD → số kỳ trong DB (hiển thị trên lịch). */
  readonly dailyCounts?: Readonly<Record<string, number>>;
}

const WEEKDAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'] as const;
const MONTH_SHORT = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'] as const;

function shiftReference(
  period: ChartTimePeriod,
  referenceDate: Date,
  delta: number,
): Date {
  const p = toGameDateKey(referenceDate).split('-').map(Number) as [number, number, number];
  const [year, month] = p;

  switch (period) {
    case 'day':
      return dateKeyToReferenceInstant(
        toGameDateKey(new Date(referenceDate.getTime() + delta * 86_400_000)),
      );
    case 'week':
      return dateKeyToReferenceInstant(
        toGameDateKey(new Date(referenceDate.getTime() + delta * 7 * 86_400_000)),
      );
    case 'month': {
      const d = new Date(`${String(year)}-${String(month).padStart(2, '0')}-15T12:00:00+07:00`);
      d.setMonth(d.getMonth() + delta);
      return d;
    }
    case 'quarter': {
      const d = new Date(`${String(year)}-${String(month).padStart(2, '0')}-15T12:00:00+07:00`);
      d.setMonth(d.getMonth() + delta * 3);
      return d;
    }
    case 'year':
      return dateKeyToReferenceInstant(`${String(year + delta)}-06-15`);
  }
}

function buildMonthGrid(viewYear: number, viewMonth: number): readonly (string | null)[] {
  const first = new Date(`${String(viewYear)}-${String(viewMonth).padStart(2, '0')}-01T12:00:00+07:00`);
  const firstKey = toGameDateKey(first);
  const firstWeekday = new Date(`${firstKey}T12:00:00+07:00`).getUTCDay();
  const mondayOffset = firstWeekday === 0 ? 6 : firstWeekday - 1;
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();

  const cells: (string | null)[] = [];
  for (let i = 0; i < mondayOffset; i += 1) {
    cells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d += 1) {
    cells.push(
      `${String(viewYear)}-${String(viewMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    );
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  return cells;
}

function isDateInWeek(dateKey: string, referenceDate: Date): boolean {
  const weekStart = toGameDateKey(getChartPeriodStart('week', referenceDate));
  const weekEnd = toGameDateKey(
    new Date(getChartPeriodStart('week', referenceDate).getTime() + 6 * 86_400_000),
  );
  return dateKey >= weekStart && dateKey <= weekEnd;
}

export function ChartPeriodSelector({
  value,
  onChange,
  dailyCounts = {},
}: ChartPeriodSelectorProps): ReactNode {
  const { period, referenceDate } = value;
  const refKey = toGameDateKey(referenceDate);
  const [viewYear, viewMonth] = refKey.split('-').map(Number) as [number, number];
  const todayKey = toGameDateKey(new Date());

  const monthCells = useMemo(
    () => buildMonthGrid(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  const setPeriod = (nextPeriod: ChartTimePeriod): void => {
    onChange({ period: nextPeriod, referenceDate });
  };

  const setReference = (nextDate: Date): void => {
    onChange({ period, referenceDate: nextDate });
  };

  const selectDateKey = (dateKey: string): void => {
    setReference(dateKeyToReferenceInstant(dateKey));
  };

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
      <div className="flex flex-wrap gap-1">
        {CHART_TIME_PERIODS.map((p) => (
          <Button
            key={p}
            type="button"
            size="sm"
            variant={period === p ? 'default' : 'outline'}
            className="h-8 px-3 text-xs"
            onClick={() => {
              setPeriod(p);
            }}
          >
            {CHART_TIME_PERIOD_LABELS[p]}
          </Button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 px-2 text-xs"
          onClick={() => {
            setReference(shiftReference(period, referenceDate, -1));
          }}
        >
          ←
        </Button>
        <span className="text-center text-xs font-medium text-foreground">
          {period === 'day' || period === 'week'
            ? `${MONTH_SHORT[viewMonth - 1] ?? ''} ${String(viewYear)}`
            : period === 'month'
              ? String(viewYear)
              : `Năm ${String(viewYear)}`}
        </span>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 px-2 text-xs"
          onClick={() => {
            setReference(shiftReference(period, referenceDate, 1));
          }}
        >
          →
        </Button>
      </div>

      {period === 'day' || period === 'week' ? (
        <div>
          <div className="mb-1 grid grid-cols-7 gap-0.5">
            {WEEKDAY_LABELS.map((label) => (
              <div
                key={label}
                className="py-1 text-center text-[10px] font-medium uppercase text-muted-foreground"
              >
                {label}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {monthCells.map((dateKey, index) => {
              if (dateKey === null) {
                return <div key={`empty-${String(index)}`} className="h-8" />;
              }
              const dayNum = Number(dateKey.slice(8, 10));
              const dayCount = dailyCounts[dateKey];
              const isSelected =
                period === 'day'
                  ? dateKey === refKey
                  : isDateInWeek(dateKey, referenceDate);
              const isToday = dateKey === todayKey;
              return (
                <button
                  key={dateKey}
                  type="button"
                  className={cn(
                    'flex min-h-10 flex-col items-center justify-center rounded px-0.5 text-xs font-medium transition-colors',
                    isSelected
                      ? 'bg-foreground text-background'
                      : 'hover:bg-muted',
                    isToday && !isSelected ? 'ring-1 ring-foreground/40' : '',
                    dateKey > todayKey ? 'opacity-40' : '',
                    dayCount === undefined ? 'opacity-60' : '',
                  )}
                  disabled={dateKey > todayKey}
                  onClick={() => {
                    selectDateKey(dateKey);
                  }}
                >
                  <span>{dayNum}</span>
                  {dayCount !== undefined ? (
                    <span
                      className={cn(
                        'text-[9px] font-normal leading-none',
                        isSelected ? 'text-background/80' : 'text-muted-foreground',
                      )}
                    >
                      {dayCount}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {period === 'month' ? (
        <div className="grid grid-cols-4 gap-2">
          {MONTH_SHORT.map((label, index) => {
            const month = index + 1;
            const isSelected = viewMonth === month;
            const monthKey = `${String(viewYear)}-${String(month).padStart(2, '0')}`;
            const isFuture = monthKey > todayKey.slice(0, 7);
            const monthTotal = Object.entries(dailyCounts).reduce((sum, [day, count]) => {
              return day.startsWith(monthKey) ? sum + count : sum;
            }, 0);
            return (
              <Button
                key={label}
                type="button"
                size="sm"
                variant={isSelected ? 'default' : 'outline'}
                className="h-auto min-h-9 flex-col py-1 text-xs"
                disabled={isFuture}
                onClick={() => {
                  selectDateKey(`${monthKey}-15`);
                }}
              >
                <span>{label}</span>
                {monthTotal > 0 ? (
                  <span className="text-[9px] font-normal opacity-80">{monthTotal} kỳ</span>
                ) : null}
              </Button>
            );
          })}
        </div>
      ) : null}

      {period === 'quarter' ? (
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((q) => {
            const quarterMonth = (q - 1) * 3 + 1;
            const isSelected = Math.floor((viewMonth - 1) / 3) + 1 === q;
            const quarterKey = `${String(viewYear)}-${String(quarterMonth).padStart(2, '0')}`;
            const isFuture = quarterKey > todayKey.slice(0, 7);
            return (
              <Button
                key={q}
                type="button"
                size="sm"
                variant={isSelected ? 'default' : 'outline'}
                className="h-9 text-xs"
                disabled={isFuture}
                onClick={() => {
                  selectDateKey(`${String(viewYear)}-${String(quarterMonth).padStart(2, '0')}-15`);
                }}
              >
                Q{q}
              </Button>
            );
          })}
        </div>
      ) : null}

      {period === 'year' ? (
        <div className="flex flex-wrap justify-center gap-2">
          {[viewYear - 1, viewYear, viewYear + 1].map((y) => {
            const isSelected = y === viewYear;
            const isFuture = y > Number(todayKey.slice(0, 4));
            return (
              <Button
                key={y}
                type="button"
                size="sm"
                variant={isSelected ? 'default' : 'outline'}
                className="h-9 min-w-[4rem] text-xs"
                disabled={isFuture}
                onClick={() => {
                  selectDateKey(`${String(y)}-06-15`);
                }}
              >
                {y}
              </Button>
            );
          })}
        </div>
      ) : null}

      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-8 w-full text-xs text-muted-foreground"
        onClick={() => {
          onChange({ period, referenceDate: new Date() });
        }}
      >
        Về hôm nay
      </Button>
    </div>
  );
}
