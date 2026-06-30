import { Check, Save, Trash2 } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DEFAULT_PRESET_ID } from '@/features/game-designer/builtin-presets';
import type { GamePolicyDraft, GamePolicyPreset } from '@/features/game-designer/game-policy-types';
import {
  draftFromPreset,
  findPreset,
  mergePresets,
  presetFromDraft,
  rewardPolicyLabel,
} from '@/features/game-designer/preset-utils';
import { MarketsPanel } from '@/features/game-designer/MarketsPanel';
import { useGameStatistics } from '@/features/game-data/hooks/use-game-statistics';
import { buildBingo18Markets } from '@/features/game-data/markets/bingo18-markets';
import { resolvePresetMarkets } from '@/features/game-data/markets/market-catalog';
import { formatMoneyFieldValue } from '@/features/planner/schema';
import { cn } from '@/lib/utils';

interface GameDesignerScreenProps {
  readonly customPresets: readonly GamePolicyPreset[];
  readonly activePresetId: string;
  readonly onSavePreset: (preset: GamePolicyPreset) => void;
  readonly onDeletePreset: (id: string) => void;
  readonly onSelectPreset: (id: string) => void;
}

export function GameDesignerScreen({
  customPresets,
  activePresetId,
  onSavePreset,
  onDeletePreset,
  onSelectPreset,
}: GameDesignerScreenProps): ReactNode {
  const allPresets = useMemo(() => mergePresets(customPresets), [customPresets]);
  const selected = useMemo((): GamePolicyPreset => {
    const found =
      findPreset(allPresets, activePresetId) ??
      findPreset(allPresets, DEFAULT_PRESET_ID) ??
      allPresets[0];
    if (found === undefined) {
      throw new Error('No game presets available');
    }
    return found;
  }, [allPresets, activePresetId]);
  const [draft, setDraft] = useState<GamePolicyDraft>(() => draftFromPreset(selected));

  function loadPreset(preset: GamePolicyPreset): void {
    onSelectPreset(preset.id);
    setDraft(draftFromPreset(preset));
  }

  function updateDraft<K extends keyof GamePolicyDraft>(key: K, value: GamePolicyDraft[K]): void {
    setDraft((prev) => {
      const next = { ...prev, [key]: value };
      if (
        key === 'rewardPolicy' &&
        (prev.gameId === 'bingo18' || selected.id.startsWith('bingo'))
      ) {
        return { ...next, markets: [...buildBingo18Markets(next.rewardPolicy)] };
      }
      return next;
    });
  }

  const draftMarkets = draft.markets ?? resolvePresetMarkets(selected);
  const { snapshot: gameStatistics } = useGameStatistics(selected);

  function bindMoney(field: 'minimumBet' | 'maximumBet' | 'betStep'): {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  } {
    return {
      value: draft[field],
      onChange: (e) => {
        updateDraft(field, formatMoneyFieldValue(field, e.target.value));
      },
    };
  }

  function handleSaveAsNew(): void {
    const id = `custom-${crypto.randomUUID()}`;
    const preset = presetFromDraft(draft, id);
    onSavePreset(preset);
    onSelectPreset(id);
  }

  function handleOverwrite(): void {
    if (selected.builtin === true) {
      handleSaveAsNew();
      return;
    }
    const preset = presetFromDraft({ ...draft, id: selected.id }, selected.id);
    onSavePreset(preset);
  }

  const inputClass = 'h-10 rounded-lg text-sm';

  return (
    <div className="w-full max-w-4xl space-y-5">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Game Designer</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Định nghĩa luật game — preset tự điền vào Planning.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
        <Card className="h-fit shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm">Presets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 p-2">
            {allPresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  loadPreset(preset);
                }}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                  activePresetId === preset.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted/60',
                )}
              >
                {activePresetId === preset.id ? (
                  <Check className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <span className="w-3.5" />
                )}
                <span className="truncate font-medium">{preset.name}</span>
                {!preset.builtin ? (
                  <Badge variant="outline" className="ml-auto text-[10px]">
                    custom
                  </Badge>
                ) : null}
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-semibold">Game Rules</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 p-4 pt-0 sm:grid-cols-2">
              <Field label="Tên game">
                <Input
                  className={inputClass}
                  value={draft.name}
                  onChange={(e) => {
                    updateDraft('name', e.target.value);
                  }}
                />
              </Field>
              <Field label="Nhóm">
                <Input
                  className={inputClass}
                  value={draft.category}
                  onChange={(e) => {
                    updateDraft('category', e.target.value);
                  }}
                />
              </Field>
              <Field label="Reward multiplier">
                <Input
                  className={inputClass}
                  inputMode="decimal"
                  value={draft.rewardMultiplier}
                  onChange={(e) => {
                    updateDraft('rewardMultiplier', e.target.value);
                  }}
                />
              </Field>
              <Field label="Minimum bet (đ)">
                <Input className={inputClass} inputMode="numeric" {...bindMoney('minimumBet')} />
              </Field>
              <Field label="Maximum bet (đ)">
                <Input className={inputClass} inputMode="numeric" {...bindMoney('maximumBet')} />
              </Field>
              <Field label="Bet step (đ)">
                <Input className={inputClass} inputMode="numeric" {...bindMoney('betStep')} />
              </Field>
            </CardContent>
          </Card>

          <MarketsPanel
            markets={draftMarkets}
            {...(gameStatistics?.markets !== undefined
              ? { observedStats: gameStatistics.markets }
              : {})}
            readOnly={selected.builtin === true}
          />

          <Card className="shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-semibold">Reward Policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 pt-0">
              <div className="flex flex-wrap gap-4">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="reward-policy"
                    checked={draft.rewardPolicy.type === 'no-tax'}
                    onChange={() => {
                      updateDraft('rewardPolicy', { type: 'no-tax' });
                    }}
                  />
                  No tax
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="reward-policy"
                    checked={draft.rewardPolicy.type === 'tier-tax'}
                    onChange={() => {
                      updateDraft('rewardPolicy', {
                        type: 'tier-tax',
                        threshold: '10.000.000',
                        ratePercent: '10',
                      });
                    }}
                  />
                  Fixed tax (tier)
                </label>
              </div>
              {draft.rewardPolicy.type === 'tier-tax' ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Threshold (đ)">
                    <Input
                      className={inputClass}
                      value={draft.rewardPolicy.threshold ?? ''}
                      onChange={(e) => {
                        updateDraft('rewardPolicy', {
                          ...draft.rewardPolicy,
                          threshold: formatMoneyFieldValue('winTaxThreshold', e.target.value),
                        });
                      }}
                    />
                  </Field>
                  <Field label="Tax (%)">
                    <Input
                      className={inputClass}
                      value={draft.rewardPolicy.ratePercent ?? ''}
                      onChange={(e) => {
                        updateDraft('rewardPolicy', {
                          ...draft.rewardPolicy,
                          ratePercent: e.target.value,
                        });
                      }}
                    />
                  </Field>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-semibold">Continue Policy</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <Field label="Maximum rounds (Session Planner)">
                <Input
                  className={inputClass}
                  type="number"
                  min={100}
                  value={draft.continuePolicy.maximumRounds}
                  onChange={(e) => {
                    updateDraft('continuePolicy', {
                      ...draft.continuePolicy,
                      maximumRounds: Number(e.target.value) || 5000,
                    });
                  }}
                />
              </Field>
              <Field label="Continue presets (tổng số vòng mục tiêu)">
                <Input
                  className={inputClass}
                  placeholder="1000, 1500, 2000, 5000"
                  value={draft.continuePolicy.presets.join(', ')}
                  onChange={(e) => {
                    const presets = e.target.value
                      .split(/[,;\s]+/)
                      .map((part) => Number(part.trim()))
                      .filter((n) => Number.isFinite(n) && n > 0);
                    updateDraft('continuePolicy', {
                      ...draft.continuePolicy,
                      presets,
                    });
                  }}
                />
              </Field>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleOverwrite}>
              <Save className="h-4 w-4" />
              {selected.builtin === true ? 'Save as Preset' : 'Save Preset'}
            </Button>
            {selected.builtin !== true ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  onDeletePreset(selected.id);
                }}
              >
                <Trash2 className="h-4 w-4" />
                Xóa
              </Button>
            ) : null}
          </div>

          <p className="text-xs text-muted-foreground">
            Preview: ×{draft.rewardMultiplier} · {rewardPolicyLabel(draft.rewardPolicy)} · continue
            đến {draft.continuePolicy.maximumRounds} vòng
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }): ReactNode {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}
