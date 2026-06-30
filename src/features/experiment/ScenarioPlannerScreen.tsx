import { Copy, FlaskConical, Play, Plus, RotateCcw, Save, StickyNote } from 'lucide-react';
import { useCallback, useMemo, useState, type ReactNode, Fragment } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PresetPicker } from '@/features/game-designer/PresetPicker';
import type { GamePolicyPreset } from '@/features/game-designer/game-policy-types';
import { applyPresetToForm } from '@/features/game-designer/preset-utils';
import { DEFAULT_PLANNER_FORM, type PlannerFormValues } from '@/features/planner/plan-service';
import { formatMoneyFieldValue } from '@/features/planner/schema';
import {
  labToSnapshot,
  loadRecentScenarios,
  promoteExperimentToPreset,
  removeRecentScenario,
  saveRecentScenario,
} from '@/features/experiment/experiment-actions';
import { buildExperimentCompareTable } from '@/features/experiment/experiment-compare';
import {
  createBaselineExperiment,
  duplicateExperiment,
  forkExperiment,
  regenerateExperiment,
  restoreLabFromSnapshot,
  updateExperimentForm,
  updateExperimentNotes,
} from '@/features/experiment/experiment-engine';
import {
  EXPERIMENT_QUICK_FORKS,
  type Experiment,
  type ExperimentLab,
  type ExperimentLabSnapshot,
} from '@/features/experiment/experiment-types';
import { formatAmount } from '@/lib/money-format';
import { cn } from '@/lib/utils';

interface ScenarioPlannerScreenProps {
  readonly presets: readonly GamePolicyPreset[];
  readonly activePresetId: string;
  readonly onPresetSelect: (preset: GamePolicyPreset) => void;
  readonly onUseExperiment: (experiment: Experiment, allExperiments: readonly Experiment[]) => void;
  readonly onPromotePreset: (preset: GamePolicyPreset) => void;
}

function emptyLab(presetId: string): ExperimentLab {
  return {
    id: crypto.randomUUID(),
    name: 'Lab',
    presetId,
    baseline: null,
    experiments: [],
    selectedExperimentId: null,
    createdAt: new Date().toISOString(),
  };
}

function bindMoney(
  value: string,
  onChange: (v: string) => void,
  field: keyof PlannerFormValues,
): {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
} {
  return {
    value,
    onChange: (e) => {
      onChange(formatMoneyFieldValue(field, e.target.value));
    },
  };
}

function deltaClass(tone: 'positive' | 'negative' | 'neutral' | null): string {
  if (tone === 'positive') {
    return 'text-emerald-600 dark:text-emerald-400 font-semibold';
  }
  if (tone === 'negative') {
    return 'text-rose-600 dark:text-rose-400 font-semibold';
  }
  return 'text-muted-foreground';
}

export function ScenarioPlannerScreen({
  presets,
  activePresetId,
  onPresetSelect,
  onUseExperiment,
  onPromotePreset,
}: ScenarioPlannerScreenProps): ReactNode {
  const activePreset = presets.find((p) => p.id === activePresetId);
  const [baseForm, setBaseForm] = useState<PlannerFormValues>(() => {
    const base = DEFAULT_PLANNER_FORM;
    return activePreset !== undefined ? applyPresetToForm(base, activePreset) : base;
  });
  const [lab, setLab] = useState<ExperimentLab>(() => emptyLab(activePresetId));
  const [recent, setRecent] = useState<ExperimentLabSnapshot[]>(() => loadRecentScenarios());
  const [baselineError, setBaselineError] = useState<string | null>(null);

  const selectedExperiment = useMemo(
    () => lab.experiments.find((e) => e.id === lab.selectedExperimentId) ?? lab.baseline,
    [lab],
  );

  const compareTable = useMemo(
    () => buildExperimentCompareTable(lab.experiments),
    [lab.experiments],
  );

  const handlePresetSelect = useCallback(
    (preset: GamePolicyPreset) => {
      setBaseForm((prev) => applyPresetToForm(prev, preset));
      onPresetSelect(preset);
    },
    [onPresetSelect],
  );

  function patchExperiment(updated: Experiment): void {
    setLab((prev) => ({
      ...prev,
      baseline: prev.baseline?.id === updated.id ? updated : prev.baseline,
      experiments: prev.experiments.map((e) => (e.id === updated.id ? updated : e)),
    }));
  }

  function createBaseline(): void {
    const form = { ...baseForm, presetId: activePresetId };
    const baseline = createBaselineExperiment(form, activePresetId);
    if (baseline.error !== null) {
      setBaselineError(baseline.error);
      return;
    }
    setBaselineError(null);
    const nextLab: ExperimentLab = {
      ...lab,
      id: crypto.randomUUID(),
      name: activePreset?.name ?? 'Lab',
      presetId: activePresetId,
      baseline,
      experiments: [baseline],
      selectedExperimentId: baseline.id,
      createdAt: new Date().toISOString(),
    };
    setLab(nextLab);
    const snapshot = labToSnapshot(nextLab);
    if (snapshot !== null) {
      setRecent(saveRecentScenario(snapshot));
    }
  }

  function addQuickFork(forkId: string): void {
    if (lab.baseline === null) {
      return;
    }
    const fork = EXPERIMENT_QUICK_FORKS.find((f) => f.id === forkId);
    if (fork === undefined) {
      return;
    }
    const experiment = forkExperiment(
      lab.baseline.formValues,
      lab.experiments,
      fork.overrides,
      fork.label,
    );
    setLab((prev) => ({
      ...prev,
      experiments: [...prev.experiments, experiment],
      selectedExperimentId: experiment.id,
    }));
  }

  function duplicateSelected(): void {
    if (selectedExperiment === null || selectedExperiment.isBaseline) {
      return;
    }
    const copy = duplicateExperiment(selectedExperiment, lab.experiments);
    setLab((prev) => ({
      ...prev,
      experiments: [...prev.experiments, copy],
      selectedExperimentId: copy.id,
    }));
  }

  function regenerateSelected(): void {
    if (selectedExperiment === null) {
      return;
    }
    patchExperiment(regenerateExperiment(selectedExperiment));
  }

  function updateSelectedField(field: keyof PlannerFormValues, value: string | boolean): void {
    if (selectedExperiment === null || lab.baseline === null) {
      return;
    }
    const nextForm = { ...selectedExperiment.formValues, [field]: value };
    patchExperiment(updateExperimentForm(selectedExperiment, lab.baseline.formValues, nextForm));
  }

  function updateSelectedNotes(notes: string): void {
    if (selectedExperiment === null) {
      return;
    }
    patchExperiment(updateExperimentNotes(selectedExperiment, notes));
  }

  function loadRecent(snapshot: ExperimentLabSnapshot): void {
    const { baseline, experiments } = restoreLabFromSnapshot(snapshot);
    const preset = presets.find((p) => p.id === snapshot.presetId);
    if (preset !== undefined) {
      handlePresetSelect(preset);
    }
    setBaseForm(snapshot.baselineForm);
    setLab({
      id: snapshot.id,
      name: snapshot.name,
      presetId: snapshot.presetId,
      baseline,
      experiments,
      selectedExperimentId: baseline.id,
      createdAt: snapshot.savedAt,
    });
    setBaselineError(null);
  }

  function resetLab(): void {
    setLab(emptyLab(activePresetId));
    setBaselineError(null);
  }

  return (
    <div className="w-full max-w-5xl space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold tracking-tight">Scenario Planner</h2>
          <Badge variant="outline" className="text-[10px]">
            Lab · không lưu DB
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Thử nghiệm luật game và kế hoạch — so sánh trước khi tạo Session.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Base Scenario</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <PresetPicker
                presets={presets}
                activePresetId={activePresetId}
                onSelect={handlePresetSelect}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Vốn">
                  <Input
                    inputMode="numeric"
                    {...bindMoney(
                      baseForm.userBankroll,
                      (v) => {
                        setBaseForm((f) => ({ ...f, userBankroll: v }));
                      },
                      'userBankroll',
                    )}
                  />
                </Field>
                <Field label="Lợi nhuận mục tiêu">
                  <Input
                    inputMode="numeric"
                    {...bindMoney(
                      baseForm.targetProfit,
                      (v) => {
                        setBaseForm((f) => ({ ...f, targetProfit: v }));
                      },
                      'targetProfit',
                    )}
                  />
                </Field>
                <Field label="Số vòng">
                  <Input
                    inputMode="numeric"
                    value={baseForm.roundCount}
                    onChange={(e) => {
                      setBaseForm((f) => ({ ...f, roundCount: e.target.value.replace(/\D/g, '') }));
                    }}
                  />
                </Field>
                <Field label="Hệ số">
                  <Input
                    value={baseForm.rewardMultiplier}
                    onChange={(e) => {
                      setBaseForm((f) => ({ ...f, rewardMultiplier: e.target.value }));
                    }}
                  />
                </Field>
              </div>
              <Button onClick={createBaseline} className="w-full sm:w-auto">
                <Play className="h-4 w-4" />
                Create Baseline
              </Button>
              {baselineError !== null ? (
                <p className="text-sm text-destructive">{baselineError}</p>
              ) : null}
            </CardContent>
          </Card>

          {compareTable !== null ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Compare</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="pb-2 pr-3 font-medium text-muted-foreground">Metric</th>
                      {compareTable.baseline !== null ? (
                        <th className="pb-2 pr-3 font-medium text-primary">
                          {compareTable.baseline.name}
                          <p className="text-[10px] font-normal text-muted-foreground">
                            {compareTable.baseline.label}
                          </p>
                        </th>
                      ) : null}
                      {compareTable.experiments.map((col) => (
                        <th key={col.id} colSpan={2} className="pb-2 pr-3 font-medium">
                          {col.name}
                          <p className="text-[10px] font-normal text-muted-foreground">
                            {col.label}
                          </p>
                        </th>
                      ))}
                    </tr>
                    {compareTable.experiments.length > 0 ? (
                      <tr className="border-b border-border/60 text-[10px] text-muted-foreground">
                        <th className="pb-1 pr-3" />
                        {compareTable.baseline !== null ? <th className="pb-1 pr-3" /> : null}
                        {compareTable.experiments.map((col) => (
                          <Fragment key={col.id}>
                            <th className="pb-1 pr-2 font-normal">Giá trị</th>
                            <th className="pb-1 pr-3 font-normal">Δ</th>
                          </Fragment>
                        ))}
                      </tr>
                    ) : null}
                  </thead>
                  <tbody>
                    {compareTable.rows.map((row) => (
                      <tr key={row.id} className="border-b border-border/60">
                        <td className="py-2 pr-3 text-muted-foreground">{row.label}</td>
                        <td className="py-2 pr-3 font-mono text-xs">{row.baseline}</td>
                        {compareTable.experiments.map((col) => {
                          const cell = row.cells[col.id];
                          return (
                            <Fragment key={col.id}>
                              <td className="py-2 pr-2 font-mono text-xs">{cell?.value ?? '—'}</td>
                              <td
                                className={cn(
                                  'py-2 pr-3 font-mono text-xs',
                                  deltaClass(cell?.deltaTone ?? null),
                                )}
                              >
                                {cell?.delta ?? '—'}
                              </td>
                            </Fragment>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          ) : null}

          {selectedExperiment !== null ? (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base">{selectedExperiment.name}</CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={regenerateSelected}>
                      <RotateCcw className="h-3.5 w-3.5" />
                      Generate
                    </Button>
                    {!selectedExperiment.isBaseline ? (
                      <Button variant="outline" size="sm" onClick={duplicateSelected}>
                        <Copy className="h-3.5 w-3.5" />
                        Duplicate
                      </Button>
                    ) : null}
                    {selectedExperiment.result !== null ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => {
                            onUseExperiment(selectedExperiment, lab.experiments);
                          }}
                        >
                          <Save className="h-3.5 w-3.5" />
                          Dùng experiment này
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            onPromotePreset(
                              promoteExperimentToPreset(
                                selectedExperiment,
                                `${selectedExperiment.label} preset`,
                              ),
                            );
                          }}
                        >
                          Save as Preset
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{selectedExperiment.label}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedExperiment.error !== null ? (
                  <p className="text-sm text-destructive">{selectedExperiment.error}</p>
                ) : null}
                {selectedExperiment.result !== null ? (
                  <div className="grid gap-2 text-sm sm:grid-cols-4">
                    <Stat
                      label="Vốn cần"
                      value={`${formatAmount(selectedExperiment.result.statistics.requiredBankrollAmount)} đ`}
                    />
                    <Stat
                      label="Max bet"
                      value={`${formatAmount(selectedExperiment.result.statistics.maximumBetAmount)} đ`}
                    />
                    <Stat
                      label="Lợi nhuận"
                      value={`${formatAmount(selectedExperiment.result.statistics.expectedProfitAmount)} đ`}
                    />
                    <Stat
                      label="Vòng"
                      value={String(selectedExperiment.result.statistics.roundCount)}
                    />
                  </div>
                ) : null}
                <div className="space-y-1.5 border-t border-border pt-3">
                  <div className="flex items-center gap-1.5">
                    <StickyNote className="h-3.5 w-3.5 text-muted-foreground" />
                    <Label className="text-xs text-muted-foreground">Notes</Label>
                  </div>
                  <textarea
                    className="min-h-[72px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    value={selectedExperiment.notes}
                    onChange={(e) => {
                      updateSelectedNotes(e.target.value);
                    }}
                    placeholder="Game mới. Casino A. VIP..."
                    rows={3}
                  />
                </div>
                <div className="grid gap-3 border-t border-border pt-3 sm:grid-cols-2">
                  <Field label="Hệ số">
                    <Input
                      value={selectedExperiment.formValues.rewardMultiplier}
                      onChange={(e) => {
                        updateSelectedField('rewardMultiplier', e.target.value);
                      }}
                    />
                  </Field>
                  <Field label="Max bet">
                    <Input
                      inputMode="numeric"
                      {...bindMoney(
                        selectedExperiment.formValues.maximumBet,
                        (v) => {
                          updateSelectedField('maximumBet', v);
                        },
                        'maximumBet',
                      )}
                    />
                  </Field>
                  <Field label="Lợi nhuận">
                    <Input
                      inputMode="numeric"
                      {...bindMoney(
                        selectedExperiment.formValues.targetProfit,
                        (v) => {
                          updateSelectedField('targetProfit', v);
                        },
                        'targetProfit',
                      )}
                    />
                  </Field>
                  <Field label="Vòng">
                    <Input
                      inputMode="numeric"
                      value={selectedExperiment.formValues.roundCount}
                      onChange={(e) => {
                        updateSelectedField('roundCount', e.target.value.replace(/\D/g, ''));
                      }}
                    />
                  </Field>
                  <Field label="Vốn">
                    <Input
                      inputMode="numeric"
                      {...bindMoney(
                        selectedExperiment.formValues.userBankroll,
                        (v) => {
                          updateSelectedField('userBankroll', v);
                        },
                        'userBankroll',
                      )}
                    />
                  </Field>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="scenario-tax"
                        checked={selectedExperiment.formValues.winTaxEnabled}
                        onCheckedChange={(c) => {
                          updateSelectedField('winTaxEnabled', c === true);
                        }}
                      />
                      <Label htmlFor="scenario-tax" className="text-sm">
                        Thuế thắng
                      </Label>
                    </div>
                    {selectedExperiment.formValues.winTaxEnabled ? (
                      <Input
                        inputMode="numeric"
                        value={selectedExperiment.formValues.winTaxRatePercent}
                        onChange={(e) => {
                          updateSelectedField(
                            'winTaxRatePercent',
                            e.target.value.replace(/\D/g, ''),
                          );
                        }}
                        placeholder="10"
                      />
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <FlaskConical className="h-4 w-4" />
                Experiments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {lab.experiments.length === 0 ? (
                <p className="text-xs text-muted-foreground">Tạo Baseline để bắt đầu thử nghiệm.</p>
              ) : (
                lab.experiments.map((experiment) => (
                  <button
                    key={experiment.id}
                    type="button"
                    onClick={() => {
                      setLab((prev) => ({ ...prev, selectedExperimentId: experiment.id }));
                    }}
                    className={cn(
                      'w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                      lab.selectedExperimentId === experiment.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/40',
                    )}
                  >
                    <p className="font-medium">{experiment.name}</p>
                    <p className="text-[11px] text-muted-foreground">{experiment.label}</p>
                    {experiment.notes.trim() !== '' ? (
                      <p className="mt-1 truncate text-[10px] italic text-muted-foreground">
                        {experiment.notes}
                      </p>
                    ) : null}
                    {experiment.error !== null ? (
                      <p className="mt-1 text-[10px] text-destructive">Lỗi</p>
                    ) : null}
                  </button>
                ))
              )}
              {lab.baseline !== null ? (
                <div className="border-t border-border pt-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Thêm nhanh</p>
                  <div className="flex flex-wrap gap-1.5">
                    {EXPERIMENT_QUICK_FORKS.map((fork) => (
                      <Button
                        key={fork.id}
                        variant="outline"
                        size="sm"
                        className="h-7 text-[11px]"
                        onClick={() => {
                          addQuickFork(fork.id);
                        }}
                      >
                        <Plus className="h-3 w-3" />
                        {fork.label}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : null}
              {lab.baseline !== null ? (
                <Button variant="ghost" size="sm" className="w-full text-xs" onClick={resetLab}>
                  Đóng lab (xóa tất cả)
                </Button>
              ) : null}
            </CardContent>
          </Card>

          {recent.length > 0 ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Recent Scenarios</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {recent.map((item) => (
                  <div key={item.id} className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        loadRecent(item);
                      }}
                      className="flex-1 rounded-lg border border-border px-2 py-1.5 text-left text-xs hover:bg-muted/40"
                    >
                      <p className="font-medium">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(item.savedAt).toLocaleString('vi-VN')}
                      </p>
                    </button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-[10px]"
                      onClick={() => {
                        setRecent(removeRecentScenario(item.id));
                      }}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }): ReactNode {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }): ReactNode {
  return (
    <div className="rounded-lg border border-border p-2">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}
