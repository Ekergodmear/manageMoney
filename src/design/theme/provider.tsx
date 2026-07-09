import { createContext, useContext, useEffect, type ReactNode } from 'react';

import { applyThemeToDocument } from './apply-theme';
import type { ThemeMode } from './types';

interface ThemeContextValue {
  readonly mode: ThemeMode;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  readonly mode: ThemeMode;
  readonly children: ReactNode;
}

export function ThemeProvider({ mode, children }: ThemeProviderProps): ReactNode {
  useEffect(() => {
    applyThemeToDocument(mode);
  }, [mode]);

  return <ThemeContext.Provider value={{ mode }}>{children}</ThemeContext.Provider>;
}

export function useThemeMode(): ThemeMode {
  const ctx = useContext(ThemeContext);
  if (ctx === null) {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  }
  return ctx.mode;
}
