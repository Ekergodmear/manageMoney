import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InfoTip } from '@/components/ui/tooltip';
import { PresetPicker } from '@/features/game-designer/PresetPicker';
import type { GamePolicyPreset } from '@/features/game-designer/game-policy-types';
import type { PlannerFormValues } from '@/features/planner/plan-service';
import { DEFAULT_PLANNER_FORM } from '@/features/planner/plan-service';
import { formatMoneyFieldValue, plannerFormSchema, type PlannerFormSchema } from '@/features/planner/schema';

interface GeneratePlanScreenProps {
  readonly defaultValues?: PlannerFormValues;
  readonly presets: readonly GamePolicyPreset[];
  readonly activePresetId: string;
  readonly onPresetSelect: (preset: GamePolicyPreset) => void;
  readonly onSubmit: (values: PlannerFormValues) => void;
  readonly onValuesChange?: (values: PlannerFormValues) => void;
  readonly serverError?: string | undefined;
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Label htmlFor={id} className="text-sm">
          {label}
        </Label>
        {hint != null && hint !== '' ? <InfoTip content={hint} /> : null}
      </div>
      {children}
      {error != null && error !== '' ? <p className="text-[11px] text-destructive">{error}</p> : null}
    </div>
  );
}

export function GeneratePlanScreen({
  defaultValues = DEFAULT_PLANNER_FORM,
  presets,
  activePresetId,
  onPresetSelect,
  onSubmit,
  onValuesChange,
  serverError,
}: GeneratePlanScreenProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PlannerFormSchema>({
    resolver: zodResolver(plannerFormSchema),
    defaultValues,
    mode: 'onChange',
  });

  const winTaxEnabled = watch('winTaxEnabled');

  useEffect(() => {
    if (onValuesChange === undefined) {
      return;
    }
    const sub = watch((values) => {
      onValuesChange(values as PlannerFormValues);
    });
    return () => sub.unsubscribe();
  }, [watch, onValuesChange]);

  function bindMoney(name: keyof PlannerFormSchema) {
    return {
      ...register(name),
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        setValue(name, formatMoneyFieldValue(name, e.target.value), { shouldValidate: true });
      },
    };
  }

  const inputClass = 'h-10 rounded-lg text-sm';

  return (
    <div className="w-full space-y-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Planning</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Chọn game preset, đặt mục tiêu, tạo kế hoạch.
        </p>
      </div>

      <PresetPicker
        presets={presets}
        activePresetId={activePresetId}
        onSelect={onPresetSelect}
      />

      <form onSubmit={handleSubmit((data) => onSubmit(data as PlannerFormValues))} className="space-y-4">
        <Card className="shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-semibold">Thông tin trò chơi</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 p-4 pt-0 sm:grid-cols-2">
            <Field id="rewardMultiplier" label="Game (×)" hint="Hệ số thưởng" error={errors.rewardMultiplier?.message}>
              <Input id="rewardMultiplier" className={inputClass} inputMode="decimal" {...register('rewardMultiplier')} />
            </Field>
            <Field id="minimumBet" label="Minimum bet (đ)" hint="Cược tối thiểu" error={errors.minimumBet?.message}>
              <Input id="minimumBet" className={inputClass} inputMode="numeric" {...bindMoney('minimumBet')} />
            </Field>
            <Field id="betStep" label="Step (đ)" hint="Bước cược" error={errors.betStep?.message}>
              <Input id="betStep" className={inputClass} inputMode="numeric" {...bindMoney('betStep')} />
            </Field>
            <Field id="maximumBet" label="Maximum (đ)" hint="Giới hạn cược — từ Game Designer" error={errors.maximumBet?.message}>
              <Input id="maximumBet" className={inputClass} inputMode="numeric" {...bindMoney('maximumBet')} readOnly />
            </Field>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-semibold">Mục tiêu</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 p-4 pt-0 sm:grid-cols-2">
            <Field id="targetProfit" label="Lợi nhuận (đ)" hint="Số tiền lời khi thắng" error={errors.targetProfit?.message}>
              <Input id="targetProfit" className={inputClass} inputMode="numeric" {...bindMoney('targetProfit')} />
            </Field>
            <Field id="roundCount" label="Số vòng" hint="Tối đa trước khi thắng" error={errors.roundCount?.message}>
              <Input id="roundCount" className={inputClass} inputMode="numeric" {...register('roundCount')} />
            </Field>
            <Field id="userBankroll" label="Vốn hiện có (đ)" hint="Tùy chọn — để so sánh" error={errors.userBankroll?.message}>
              <Input id="userBankroll" className={inputClass} inputMode="numeric" {...bindMoney('userBankroll')} />
            </Field>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-semibold">Reward Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0">
            <div className="flex items-center gap-2">
              <Checkbox
                id="winTaxEnabled"
                checked={winTaxEnabled}
                onCheckedChange={(checked) =>
                  setValue('winTaxEnabled', checked === true, { shouldValidate: true })
                }
              />
              <Label htmlFor="winTaxEnabled" className="cursor-pointer text-sm">
                Thuế khi thắng lớn
              </Label>
              <InfoTip content="Thuế trên tổng tiền thắng khi đạt ngưỡng" />
            </div>
            {winTaxEnabled ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field id="winTaxThreshold" label="Ngưỡng (đ)" error={errors.winTaxThreshold?.message}>
                  <Input id="winTaxThreshold" className={inputClass} inputMode="numeric" {...bindMoney('winTaxThreshold')} />
                </Field>
                <Field id="winTaxRatePercent" label="Thuế (%)" error={errors.winTaxRatePercent?.message}>
                  <Input id="winTaxRatePercent" className={inputClass} inputMode="numeric" {...register('winTaxRatePercent')} />
                </Field>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {serverError != null && serverError !== '' ? (
          <p className="text-xs text-destructive">{serverError}</p>
        ) : null}

        <Button type="submit" className="h-11 w-full sm:w-auto sm:min-w-48">
          Tạo kế hoạch
        </Button>
      </form>
    </div>
  );
}
