/**
 * Typography variants — thay text-xl font-bold rải rác.
 * Font: Segoe UI (đã dùng trong index.css).
 */
export const typography = {
  display: 'text-3xl font-bold tracking-tight',
  h1: 'text-xl font-bold tracking-tight',
  h2: 'text-lg font-semibold leading-none',
  h3: 'text-sm font-semibold',
  body: 'text-sm leading-relaxed',
  small: 'text-xs',
  caption: 'text-[10px] font-semibold uppercase tracking-wide',
  mono: 'font-mono text-2xl tracking-widest',
  metric: 'text-xl font-bold tabular-nums',
} as const;

export type TypographyVariant = keyof typeof typography;

export const fontFamily = {
  sans: "'Segoe UI', ui-sans-serif, system-ui, sans-serif",
  mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
} as const;
