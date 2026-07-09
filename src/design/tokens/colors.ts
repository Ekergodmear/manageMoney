/**
 * Semantic colors — map tới CSS variables trong index.css.
 * Không dùng green500; đổi theme chỉ cần sửa theme/light.ts + dark.ts.
 */
export const colorVar = {
  background: 'var(--background)',
  foreground: 'var(--foreground)',
  surface: 'var(--card)',
  surfaceForeground: 'var(--card-foreground)',
  surfaceElevated: 'var(--card)',
  primary: 'var(--primary)',
  primaryForeground: 'var(--primary-foreground)',
  secondary: 'var(--secondary)',
  secondaryForeground: 'var(--secondary-foreground)',
  muted: 'var(--muted)',
  mutedForeground: 'var(--muted-foreground)',
  accent: 'var(--accent)',
  accentForeground: 'var(--accent-foreground)',
  border: 'var(--border)',
  input: 'var(--input)',
  ring: 'var(--ring)',
  success: 'var(--success)',
  successForeground: 'var(--success-foreground)',
  warning: 'var(--warning)',
  warningForeground: 'var(--warning-foreground)',
  danger: 'var(--destructive)',
} as const;

export type SemanticColor = keyof typeof colorVar;

/** Tailwind utility class prefixes */
export const semanticBg: Record<
  | 'background'
  | 'surface'
  | 'surfaceElevated'
  | 'primary'
  | 'secondary'
  | 'muted'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger',
  string
> = {
  background: 'bg-background',
  surface: 'bg-card',
  surfaceElevated: 'bg-card',
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  muted: 'bg-muted',
  accent: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-destructive',
};

export const semanticText: Record<
  'foreground' | 'muted' | 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger',
  string
> = {
  foreground: 'text-foreground',
  muted: 'text-muted-foreground',
  primary: 'text-primary',
  secondary: 'text-secondary-foreground',
  accent: 'text-accent-foreground',
  success: 'text-success-foreground',
  warning: 'text-warning-foreground',
  danger: 'text-destructive',
};

export const semanticBorder: Record<
  'default' | 'primary' | 'success' | 'warning' | 'danger',
  string
> = {
  default: 'border-border',
  primary: 'border-primary/20',
  success: 'border-emerald-500/25',
  warning: 'border-amber-500/25',
  danger: 'border-red-500/25',
};

/** StatusChip tones — chỉ dùng semantic colors, không amber/emerald hardcode */
export const statusChipTone = {
  muted: 'border-transparent bg-muted text-muted-foreground',
  warning: 'border-transparent bg-warning text-warning-foreground',
  success: 'border-transparent bg-success text-success-foreground',
  'success-strong': 'border-transparent bg-success text-success-foreground font-bold',
  danger: 'border-transparent bg-destructive/10 text-destructive font-semibold',
} as const;

export type StatusChipToneKey = keyof typeof statusChipTone;
