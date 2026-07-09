/**
 * Elevation shadows — semantic, không hardcode shadow-sm ở component.
 */
export const shadows = {
  surface: 'shadow-none',
  card: 'shadow-sm',
  popup: 'shadow-md',
  overlay: 'shadow-lg',
} as const;

export type ShadowKey = keyof typeof shadows;

/** Card elevation → shadow mapping */
export const elevationShadow: Record<'0' | '1' | '2' | 'popup' | 'overlay', string> = {
  '0': shadows.surface,
  '1': shadows.surface,
  '2': shadows.card,
  popup: shadows.popup,
  overlay: shadows.overlay,
};
