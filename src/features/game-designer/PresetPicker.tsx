import type { ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import type { GamePolicyPreset } from '@/features/game-designer/game-policy-types';
import { rewardPolicyLabel } from '@/features/game-designer/preset-utils';
import { cn } from '@/lib/utils';

interface PresetPickerProps {
  readonly presets: readonly GamePolicyPreset[];
  readonly activePresetId: string;
  readonly onSelect: (preset: GamePolicyPreset) => void;
}

export function PresetPicker({ presets, activePresetId, onSelect }: PresetPickerProps): ReactNode {
  const byCategory = presets.reduce<Record<string, GamePolicyPreset[]>>((acc, preset) => {
    const cat = preset.category;
    const list = acc[cat] ?? [];
    list.push(preset);
    acc[cat] = list;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold">Game</p>
        <p className="text-xs text-muted-foreground">Chọn preset — Planning tự điền luật game.</p>
      </div>
      {Object.entries(byCategory).map(([category, items]) => (
        <div key={category}>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {category}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {items.map((preset) => {
              const active = preset.id === activePresetId;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    onSelect(preset);
                  }}
                  className={cn(
                    'rounded-xl border p-3 text-left transition-colors',
                    active
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-border hover:bg-muted/40',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'h-2 w-2 rounded-full',
                        active ? 'bg-primary' : 'bg-muted-foreground/40',
                      )}
                    />
                    <span className="font-medium">{preset.name}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>×{preset.rewardMultiplier}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {rewardPolicyLabel(preset.rewardPolicy)}
                    </Badge>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
