import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { GamePolicyPreset } from '@/features/game-designer/game-policy-types';
import { groupMarketsByType } from '@/features/game-designer/preset-utils';
import { BINGO18_FLOWER_MULTIPLIER } from '@/features/game-data/markets/bingo18-markets';
import {
  formatMultiplierDisplay,
  marketPlanLabelFromPreset,
  resolvePresetMarkets,
} from '@/features/game-data/markets/market-catalog';
import type { MarketDefinition } from '@/features/game-data/markets/market-definition';
import { findMarketById } from '@/features/game-data/markets/market-resolver';
import { cn } from '@/lib/utils';

export type PlanBetKind = 'total' | 'flower';

/** Bảng hệ số Bingo18 — đối xứng tổng, hoa ×120. */
export const BINGO18_PLAN_MULTIPLIER_TIERS: readonly {
  readonly multiplier: number;
  readonly hint: string;
}[] = [
  { multiplier: 120, hint: 'Hoa 111–666 · Tổng 3 & 18' },
  { multiplier: 40, hint: 'Tổng 4 & 17' },
  { multiplier: 20, hint: 'Tổng 5 & 16' },
  { multiplier: 12, hint: 'Tổng 6 & 15' },
  { multiplier: 8, hint: 'Tổng 7 & 14' },
  { multiplier: 5.5, hint: 'Tổng 8 & 13' },
  { multiplier: 4.7, hint: 'Tổng 9 & 12' },
  { multiplier: 4.4, hint: 'Tổng 10 & 11' },
];

export function planBetKindFromMarketId(marketId: string): PlanBetKind {
  return marketId.startsWith('flower-') ? 'flower' : 'total';
}

interface PlanMarketPickerProps {
  readonly preset: GamePolicyPreset;
  readonly value: string;
  readonly onChange: (marketId: string) => void;
  readonly disabled?: boolean;
  readonly className?: string;
}

function MarketChip({
  market,
  selected,
  displayValue,
  onSelect,
  disabled,
}: {
  market: MarketDefinition;
  selected: boolean;
  displayValue: string;
  onSelect: () => void;
  disabled: boolean;
}): React.ReactNode {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border px-2 py-2 text-center transition-colors',
        'min-h-[3.25rem] hover:bg-accent/60 disabled:opacity-50',
        selected
          ? 'border-primary bg-primary/10 ring-1 ring-primary/40'
          : 'border-border bg-background',
      )}
      aria-pressed={selected}
    >
      <span className="text-sm font-semibold tabular-nums">{displayValue}</span>
      <span className="text-[10px] font-medium text-muted-foreground">
        ×{formatMultiplierDisplay(market.multiplier)}
      </span>
    </button>
  );
}

export function PlanMarketPicker({
  preset,
  value,
  onChange,
  disabled = false,
  className,
}: PlanMarketPickerProps): React.ReactNode {
  const markets = resolvePresetMarkets(preset);
  const { totals, flowers } = groupMarketsByType(markets);
  const selected = findMarketById(markets, value) ?? totals[0] ?? flowers[0];

  const initialKind = planBetKindFromMarketId(value);
  const [kind, setKind] = useState<PlanBetKind>(initialKind);

  useEffect(() => {
    setKind(planBetKindFromMarketId(value));
  }, [value]);

  const activeKind =
    kind === 'flower' && flowers.length === 0
      ? 'total'
      : kind === 'total' && totals.length === 0
        ? 'flower'
        : kind;

  const options = activeKind === 'flower' ? flowers : totals;

  const summary = useMemo(() => {
    if (selected === undefined) {
      return null;
    }
    return marketPlanLabelFromPreset(preset, selected.id);
  }, [preset, selected]);

  function selectKind(next: PlanBetKind): void {
    setKind(next);
    const pool = next === 'flower' ? flowers : totals;
    const currentInPool = pool.find((m) => m.id === value);
    if (currentInPool !== undefined) {
      return;
    }
    const fallback = pool[0];
    if (fallback !== undefined) {
      onChange(fallback.id);
    }
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="space-y-1.5">
        <Label className="text-sm">Cược theo</Label>
        <p className="text-xs text-muted-foreground">
          Chọn <strong>Tổng</strong> hoặc <strong>Hoa</strong> — hệ số hiển thị ngay để theo dõi khi
          trúng.
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant={activeKind === 'total' ? 'default' : 'outline'}
          size="sm"
          disabled={disabled || totals.length === 0}
          className="flex-1"
          onClick={() => {
            selectKind('total');
          }}
        >
          Tổng (3–18)
        </Button>
        <Button
          type="button"
          variant={activeKind === 'flower' ? 'default' : 'outline'}
          size="sm"
          disabled={disabled || flowers.length === 0}
          className="flex-1"
          onClick={() => {
            selectKind('flower');
          }}
        >
          Hoa (111–666)
        </Button>
      </div>

      {activeKind === 'flower' ? (
        <p className="text-[11px] text-muted-foreground">
          Mọi hoa trúng đều <strong>×{BINGO18_FLOWER_MULTIPLIER}</strong>.
        </p>
      ) : null}

      <div
        className={cn(
          'grid gap-2',
          activeKind === 'flower' ? 'grid-cols-3 sm:grid-cols-6' : 'grid-cols-4 sm:grid-cols-8',
        )}
      >
        {options.map((market) => (
            <MarketChip
              key={market.id}
              market={market}
              selected={market.id === value}
              displayValue={String(market.matchValue)}
              disabled={disabled}
              onSelect={() => {
                onChange(market.id);
              }}
            />
          ))}
      </div>

      {summary !== null ? (
        <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
          <p className="text-xs text-muted-foreground">Theo dõi trên plan</p>
          <p className="text-sm font-semibold text-primary">{summary}</p>
        </div>
      ) : null}

      <details className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs">
        <summary className="cursor-pointer font-medium text-muted-foreground">
          Bảng hệ số Bingo18
        </summary>
        <ul className="mt-2 space-y-1 text-muted-foreground">
          {BINGO18_PLAN_MULTIPLIER_TIERS.map((tier) => (
            <li key={tier.multiplier}>
              <span className="font-mono font-semibold text-foreground">
                ×{formatMultiplierDisplay(tier.multiplier)}
              </span>
              {' — '}
              {tier.hint}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
