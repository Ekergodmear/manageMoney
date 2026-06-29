import type { ReactNode } from 'react';

import { Input } from '@/components/ui/input';
import { Stack } from '@/components/ui/Stack';
import { Text } from '@/components/ui/Text';
import { semanticBg, semanticBorder } from '@/design/tokens/colors';
import { radius } from '@/design/tokens/radius';
import { typography } from '@/design/tokens/typography';
import { cn } from '@/lib/utils';

export interface FilterOption {
  readonly value: string;
  readonly label: string;
}

export interface FilterFieldProps {
  readonly label: string;
  readonly value: string;
  readonly options: readonly FilterOption[];
  readonly onChange: (value: string) => void;
}

export function FilterField({ label, value, options, onChange }: FilterFieldProps): ReactNode {
  return (
    <Stack spacing={4}>
      <Text variant="small" muted>
        {label}
      </Text>
      <select
        className={cn(
          'w-full border px-2 py-2',
          radius.xs,
          semanticBg.background,
          semanticBorder.default,
          typography.body,
        )}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Stack>
  );
}

export interface NumberFilterFieldProps {
  readonly label: string;
  readonly value: number | null;
  readonly min?: number;
  readonly placeholder?: string;
  readonly onChange: (value: number | null) => void;
}

export function NumberFilterField({
  label,
  value,
  min = 0,
  placeholder = '—',
  onChange,
}: NumberFilterFieldProps): ReactNode {
  return (
    <Stack spacing={4}>
      <Text variant="small" muted>
        {label}
      </Text>
      <Input
        type="number"
        min={min}
        placeholder={placeholder}
        value={value ?? ''}
        onChange={(event) => {
          const raw = event.target.value;
          onChange(raw === '' ? null : Number(raw));
        }}
      />
    </Stack>
  );
}
