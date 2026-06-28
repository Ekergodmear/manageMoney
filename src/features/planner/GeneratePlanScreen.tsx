import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import {
  CircleDollarSign,
  Gamepad2,
  Lock,
  Percent,
  Sparkles,
  Target,
} from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InfoTip, TooltipProvider } from '@/components/ui/tooltip';
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

function FieldBlock({
  id,
  label,
  info,
  error,
  children,
}: {
  id: string;
  label: string;
  info?: string;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Label htmlFor={id}>{label}</Label>
        {info != null && info !== '' ? <InfoTip content={info} /> : null}
      </div>
      {children}
      {error != null && error !== '' ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : null}
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

  return (
    <TooltipProvider>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tạo kế hoạch</h2>
          <p className="mt-1 text-muted-foreground">
            Nhập thông tin bên dưới để tạo kế hoạch cược tối ưu
          </p>
        </div>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-primary" />
              Thông tin kế hoạch
            </CardTitle>
            <CardDescription>Chia theo mục tiêu, thông số game, luật và ngân sách</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit((data) => onSubmit(data as PlannerFormValues))}
              className="space-y-6"
            >
              <FormSection icon={<Target className="h-4 w-4" />} title="Thông tin mục tiêu">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FieldBlock
                    id="targetProfit"
                    label="Lợi nhuận mục tiêu (đ)"
                    info="Số tiền lời bạn muốn đạt khi thắng"
                    error={errors.targetProfit?.message}
                  >
                    <Input id="targetProfit" inputMode="numeric" {...bindMoney('targetProfit')} />
                  </FieldBlock>
                  <FieldBlock
                    id="roundCount"
                    label="Số vòng"
                    info="Số vòng tối đa trước khi thắng"
                    error={errors.roundCount?.message}
                  >
                    <Input id="roundCount" inputMode="numeric" {...register('roundCount')} />
                  </FieldBlock>
                </div>
              </FormSection>

              <FormSection icon={<Gamepad2 className="h-4 w-4" />} title="Thông số trò chơi">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FieldBlock
                    id="rewardMultiplier"
                    label="Hệ số thưởng (×)"
                    info="Hỗ trợ tối đa 2 chữ số thập phân"
                    error={errors.rewardMultiplier?.message}
                  >
                    <Input id="rewardMultiplier" inputMode="decimal" {...register('rewardMultiplier')} />
                  </FieldBlock>
                  <FieldBlock
                    id="minimumBet"
                    label="Cược tối thiểu (đ)"
                    error={errors.minimumBet?.message}
                  >
                    <Input id="minimumBet" inputMode="numeric" {...bindMoney('minimumBet')} />
                  </FieldBlock>
                  <FieldBlock id="betStep" label="Bước cược (đ)" error={errors.betStep?.message}>
                    <Input id="betStep" inputMode="numeric" {...bindMoney('betStep')} />
                  </FieldBlock>
                </div>
              </FormSection>

              <FormSection icon={<Percent className="h-4 w-4" />} title="Luật trò chơi">
                <div className="space-y-4">
                  <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-3">
                    <Checkbox
                      id="winTaxEnabled"
                      checked={winTaxEnabled}
                      onCheckedChange={(checked) =>
                        setValue('winTaxEnabled', checked === true, { shouldValidate: true })
                      }
                    />
                    <div className="space-y-1">
                      <Label htmlFor="winTaxEnabled" className="cursor-pointer">
                        Áp dụng thuế khi thắng lớn
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Thuế trên tổng tiền thắng khi đạt ngưỡng (mặc định 10% từ 10 triệu)
                      </p>
                    </div>
                  </div>
                  {winTaxEnabled ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FieldBlock
                        id="winTaxThreshold"
                        label="Ngưỡng thuế (đ)"
                        error={errors.winTaxThreshold?.message}
                      >
                        <Input
                          id="winTaxThreshold"
                          inputMode="numeric"
                          {...bindMoney('winTaxThreshold')}
                        />
                      </FieldBlock>
                      <FieldBlock
                        id="winTaxRatePercent"
                        label="Thuế (%)"
                        error={errors.winTaxRatePercent?.message}
                      >
                        <Input
                          id="winTaxRatePercent"
                          inputMode="numeric"
                          {...register('winTaxRatePercent')}
                        />
                      </FieldBlock>
                    </div>
                  ) : null}
                </div>
              </FormSection>

              <FormSection icon={<CircleDollarSign className="h-4 w-4" />} title="Ngân sách">
                <FieldBlock
                  id="userBankroll"
                  label="Vốn của bạn (tùy chọn) (đ)"
                  info="Để so sánh với vốn cần chuẩn bị"
                  error={errors.userBankroll?.message}
                >
                  <Input id="userBankroll" inputMode="numeric" {...bindMoney('userBankroll')} />
                </FieldBlock>
              </FormSection>

              {serverError != null && serverError !== '' ? (
                <p className="text-sm text-destructive">{serverError}</p>
              ) : null}

              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <Button type="submit" size="lg" className="w-full">
                  <Sparkles className="h-4 w-4" />
                  Tạo kế hoạch
                </Button>
              </motion.div>

              <div className="flex items-start gap-2 rounded-xl border border-success bg-success p-4 text-sm text-success-foreground">
                <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                Dữ liệu được xử lý hoàn toàn trên trình duyệt — không lưu trên server.
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
