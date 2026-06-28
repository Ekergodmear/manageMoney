export type ThemeMode = 'light' | 'dark';

export const palette = {
  light: {
    bg: '#f4f6fb',
    surface: '#ffffff',
    surfaceMuted: '#f8fafc',
    border: '#e8ecf4',
    text: '#0f172a',
    textMuted: '#64748b',
    primary: '#7c3aed',
    primarySoft: '#ede9fe',
    primaryText: '#5b21b6',
    warnBg: '#fffbeb',
    warnBorder: '#fde68a',
    warnText: '#92400e',
    okBg: '#ecfdf5',
    okBorder: '#a7f3d0',
    okText: '#065f46',
    shadow: '0 1px 3px rgba(15, 23, 42, 0.06)',
  },
  dark: {
    bg: '#0f1117',
    surface: '#1a1d27',
    surfaceMuted: '#141820',
    border: '#2a3040',
    text: '#f1f5f9',
    textMuted: '#94a3b8',
    primary: '#a78bfa',
    primarySoft: '#2e1065',
    primaryText: '#ddd6fe',
    warnBg: '#422006',
    warnBorder: '#78350f',
    warnText: '#fde68a',
    okBg: '#052e16',
    okBorder: '#166534',
    okText: '#86efac',
    shadow: '0 1px 3px rgba(0, 0, 0, 0.35)',
  },
} as const;

export function themeColors(mode: ThemeMode) {
  return palette[mode];
}
