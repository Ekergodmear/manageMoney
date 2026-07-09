export interface ThemeColors {
  readonly background: string;
  readonly foreground: string;
  readonly surface: string;
  readonly surfaceForeground: string;
  readonly primary: string;
  readonly primaryForeground: string;
  readonly secondary: string;
  readonly secondaryForeground: string;
  readonly muted: string;
  readonly mutedForeground: string;
  readonly accent: string;
  readonly accentForeground: string;
  readonly border: string;
  readonly input: string;
  readonly ring: string;
  readonly danger: string;
  readonly warning: string;
  readonly warningForeground: string;
  readonly success: string;
  readonly successForeground: string;
}

export type ThemeMode = 'light' | 'dark';

export interface ThemeDensity {
  readonly compact: boolean;
}

export interface ThemeSettings {
  readonly mode: ThemeMode;
  readonly density: ThemeDensity;
}
