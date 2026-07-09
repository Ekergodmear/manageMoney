/**
 * Spacing scale — pixel values, mapped to Tailwind (1 unit = 4px).
 * Rút ra từ spacing đang dùng trong app (gap-2/3/4, p-4/5/6/8).
 */
export const spacing = {
  2: 2,
  4: 4,
  8: 8,
  12: 12,
  16: 16,
  20: 20,
  24: 24,
  32: 32,
  40: 40,
  48: 48,
  64: 64,
} as const;

export type SpacingKey = keyof typeof spacing;

/** Tailwind gap / space-y prefix */
export const spacingGap: Record<SpacingKey, string> = {
  2: 'gap-0.5',
  4: 'gap-1',
  8: 'gap-2',
  12: 'gap-3',
  16: 'gap-4',
  20: 'gap-5',
  24: 'gap-6',
  32: 'gap-8',
  40: 'gap-10',
  48: 'gap-12',
  64: 'gap-16',
};

export const spacingSpaceY: Record<SpacingKey, string> = {
  2: 'space-y-0.5',
  4: 'space-y-1',
  8: 'space-y-2',
  12: 'space-y-3',
  16: 'space-y-4',
  20: 'space-y-5',
  24: 'space-y-6',
  32: 'space-y-8',
  40: 'space-y-10',
  48: 'space-y-12',
  64: 'space-y-16',
};

export const spacingPadding: Record<SpacingKey, string> = {
  2: 'p-0.5',
  4: 'p-1',
  8: 'p-2',
  12: 'p-3',
  16: 'p-4',
  20: 'p-5',
  24: 'p-6',
  32: 'p-8',
  40: 'p-10',
  48: 'p-12',
  64: 'p-16',
};
