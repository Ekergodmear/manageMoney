import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormSection } from '@/layout/AppLayout';
import type { PlannerFormValues } from '@/features/planner/plan-service';
import { DEFAULT_PLANNER_FORM } from '@/features/planner/plan-service';
import { formatMoneyFieldValue, plannerFormSchema, type PlannerFormSchema } from '@/features/planner/schema';

interface GeneratePlanScreenProps {
  readonly defaultValues?: PlannerFormValues;
  readonly onSubmit: (values: PlannerFormValues) => void;
  readonly onValuesChange?: (values: PlannerFormValues) => void;
  readonly serverError?: string | undefined;
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm">
        {label}
      </Label>
      {children}
      {error != null && error !== '' ? <p className="text-[11px] text-destructive">{error}</p> : null}
    </div>
  );
}

export function GeneratePlanScreen({
  defaultValues = DEFAULT_PLANNER_FORM,
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
        <h2 className="text-xl font-bold tracking-tight">Tạo kế hoạch</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Nhập thông tin để tạo kế hoạch cược tối ưu
        </p>
      </div>

      <Card className="w-full shadow-md">
        <CardHeader className="space-y-0 p-5 pb-3">
          <CardTitle className="text-lg">Thông tin kế hoạch</CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <form onSubmit={handleSubmit((data) => onSubmit(data as PlannerFormValues))} className="space-y-5">
            <FormSection title="Mục tiêu">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="targetProfit" label="Lợi nhuận (đ)" error={errors.targetProfit?.message}>
                  <Input id="targetProfit" className={inputClass} inputMode="numeric" {...bindMoney('targetProfit')} />
                </Field>
                <Field id="roundCount" label="Số vòng" error={errors.roundCount?.message}>
                  <Input id="roundCount" className={inputClass} inputMode="numeric" {...register('roundCount')} />
                </Field>
              </div>
            </FormSection>

            <FormSection title="Thông số">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="rewardMultiplier" label="Hệ số (×)" error={errors.rewardMultiplier?.message}>
                  <Input id="rewardMultiplier" className={inputClass} inputMode="decimal" {...register('rewardMultiplier')} />
                </Field>
                <Field id="minimumBet" label="Cược tối thiểu (đ)" error={errors.minimumBet?.message}>
                  <Input id="minimumBet" className={inputClass} inputMode="numeric" {...bindMoney('minimumBet')} />
                </Field>
                <Field id="betStep" label="Bước cược (đ)" error={errors.betStep?.message}>
                  <Input id="betStep" className={inputClass} inputMode="numeric" {...bindMoney('betStep')} />
                </Field>
              </div>
            </FormSection>

            <FormSection title="Thuế">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="winTaxEnabled"
                  checked={winTaxEnabled}
                  onCheckedChange={(checked) =>
                    setValue('winTaxEnabled', checked === true, { shouldValidate: true })
                  }
                />
                <Label htmlFor="winTaxEnabled" className="cursor-pointer text-xs font-normal">
                  Thuế khi thắng lớn
                </Label>
              </div>
              {winTaxEnabled ? (
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <Field id="winTaxThreshold" label="Ngưỡng (đ)" error={errors.winTaxThreshold?.message}>
                    <Input id="winTaxThreshold" className={inputClass} inputMode="numeric" {...bindMoney('winTaxThreshold')} />
                  </Field>
                  <Field id="winTaxRatePercent" label="Thuế (%)" error={errors.winTaxRatePercent?.message}>
                    <Input id="winTaxRatePercent" className={inputClass} inputMode="numeric" {...register('winTaxRatePercent')} />
                  </Field>
                </div>
              ) : null}
            </FormSection>

            <Field id="userBankroll" label="Vốn của bạn (đ)" error={errors.userBankroll?.message}>
              <Input id="userBankroll" className={inputClass} inputMode="numeric" {...bindMoney('userBankroll')} />
            </Field>

            {serverError != null && serverError !== '' ? (
              <p className="text-xs text-destructive">{serverError}</p>
            ) : null}

            <Button type="submit" className="h-11 w-full">
              Tạo kế hoạch
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Dữ liệu xử lý trên trình duyệt — không lưu server.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
