import type { GamePolicyPreset } from '@/features/game-designer/game-policy-types';
import { groupMarketsByType } from '@/features/game-designer/preset-utils';
import { resolvePresetMarkets } from '@/features/game-data/markets/market-catalog';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface MarketPickerProps {
  readonly preset: GamePolicyPreset;
  readonly value: string;
  readonly onChange: (marketId: string) => void;
  readonly disabled?: boolean;
  readonly className?: string;
}

export function MarketPicker({
  preset,
  value,
  onChange,
  disabled = false,
  className,
}: MarketPickerProps): React.ReactNode {
  const markets = resolvePresetMarkets(preset);
  const { totals, flowers, sizes } = groupMarketsByType(markets);

  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor="marketId" className="text-sm">
        Market
      </Label>
      <select
        id="marketId"
        value={value}
        disabled={disabled}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
      >
        {totals.length > 0 ? (
          <optgroup label="Tổng">
            {totals.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label} · ×{m.multiplier}
              </option>
            ))}
          </optgroup>
        ) : null}
        {flowers.length > 0 ? (
          <optgroup label="Hoa">
            {flowers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label} · ×{m.multiplier}
              </option>
            ))}
          </optgroup>
        ) : null}
        {sizes.length > 0 ? (
          <optgroup label="Tài / Xỉu">
            {sizes.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label} · ×{m.multiplier}
              </option>
            ))}
          </optgroup>
        ) : null}
      </select>
    </div>
  );
}
