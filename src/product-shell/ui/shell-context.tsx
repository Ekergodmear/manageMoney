import { createContext, useContext, type ReactNode } from 'react';

import type { AppContext } from '@/product-shell/types/command';
import type { ShellRuntime } from '@/product-shell/runtime/shell-runtime';

export interface ShellContextValue {
  readonly runtime: ShellRuntime;
  readonly appContext: AppContext;
  readonly paletteOpen: boolean;
  readonly openPalette: () => void;
  readonly closePalette: () => void;
}

const ShellContext = createContext<ShellContextValue | null>(null);

export interface ShellContextProviderProps {
  readonly value: ShellContextValue;
  readonly children: ReactNode;
}

export function ShellContextProvider({ value, children }: ShellContextProviderProps): ReactNode {
  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
}

export function useShell(): ShellContextValue {
  const context = useContext(ShellContext);
  if (context === null) {
    throw new Error('useShell must be used within ShellProvider');
  }
  return context;
}
