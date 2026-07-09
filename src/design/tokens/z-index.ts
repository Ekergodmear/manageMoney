/**
 * Z-index layers — drawer, overlay, toast, command palette.
 */
export const zIndex = {
  base: 0,
  raised: 10,
  dropdown: 20,
  sticky: 30,
  drawer: 40,
  overlay: 50,
  toast: 60,
  commandPalette: 70,
} as const;

export type ZIndexKey = keyof typeof zIndex;

export const zIndexClass: Record<ZIndexKey, string> = {
  base: 'z-0',
  raised: 'z-10',
  dropdown: 'z-20',
  sticky: 'z-30',
  drawer: 'z-40',
  overlay: 'z-50',
  toast: 'z-60',
  commandPalette: 'z-[70]',
};
