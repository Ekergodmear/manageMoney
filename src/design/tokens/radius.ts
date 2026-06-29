/**
 * Border radius — khớp với --radius-* trong index.css.
 */
export const radius = {
  xs: 'rounded-md',
  sm: 'rounded-lg',
  md: 'rounded-xl',
  lg: 'rounded-2xl',
  xl: 'rounded-3xl',
  full: 'rounded-full',
} as const;

export type RadiusKey = keyof typeof radius;

/** CSS variable references (for programmatic use) */
export const radiusVar = {
  xs: 'var(--radius-sm)',
  sm: 'var(--radius-sm)',
  md: 'var(--radius-md)',
  lg: 'var(--radius-lg)',
  xl: 'var(--radius-xl)',
} as const;
