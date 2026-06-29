import { darkTheme } from './dark';
import { lightTheme } from './light';
import type { ThemeColors, ThemeMode } from './types';

const THEME_CSS_MAP: Record<keyof ThemeColors, string> = {
  background: '--background',
  foreground: '--foreground',
  surface: '--card',
  surfaceForeground: '--card-foreground',
  primary: '--primary',
  primaryForeground: '--primary-foreground',
  secondary: '--secondary',
  secondaryForeground: '--secondary-foreground',
  muted: '--muted',
  mutedForeground: '--muted-foreground',
  accent: '--accent',
  accentForeground: '--accent-foreground',
  border: '--border',
  input: '--input',
  ring: '--ring',
  danger: '--destructive',
  warning: '--warning',
  warningForeground: '--warning-foreground',
  success: '--success',
  successForeground: '--success-foreground',
};

export function getThemeColors(mode: ThemeMode): ThemeColors {
  return mode === 'dark' ? darkTheme : lightTheme;
}

export function applyThemeToDocument(mode: ThemeMode): void {
  const colors = getThemeColors(mode);
  const root = document.documentElement;

  root.classList.toggle('dark', mode === 'dark');

  for (const [key, cssVar] of Object.entries(THEME_CSS_MAP)) {
    const value = colors[key as keyof ThemeColors];
    root.style.setProperty(cssVar, value);
  }
}
