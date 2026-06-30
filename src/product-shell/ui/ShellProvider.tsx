import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import type { AppContext } from '@/product-shell/types/command';
import type { ShellRuntime } from '@/product-shell/runtime/shell-runtime';

import { CommandPalette } from '@/product-shell/ui/CommandPalette';
import { registerShellCommands } from '@/product-shell/ui/register-shell-commands';
import { ShellContextProvider } from '@/product-shell/ui/shell-context';
import { useGlobalKeyboard } from '@/product-shell/ui/use-global-keyboard';

export interface ShellProviderProps {
  readonly runtime: ShellRuntime;
  readonly appContext: AppContext;
  readonly children: ReactNode;
}

export function ShellProvider({ runtime, appContext, children }: ShellProviderProps): ReactNode {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const registeredRef = useRef(false);

  const openPalette = useCallback(() => {
    setPaletteOpen(true);
  }, []);

  const closePalette = useCallback(() => {
    setPaletteOpen(false);
  }, []);

  useEffect(() => {
    if (registeredRef.current) {
      return;
    }
    registerShellCommands(runtime, { openPalette });
    registeredRef.current = true;
  }, [openPalette, runtime]);

  useGlobalKeyboard(runtime, appContext, { enabled: !paletteOpen });

  const contextValue = useMemo(
    () => ({
      runtime,
      appContext,
      paletteOpen,
      openPalette,
      closePalette,
    }),
    [appContext, closePalette, openPalette, paletteOpen, runtime],
  );

  return (
    <ShellContextProvider value={contextValue}>
      {children}
      <CommandPalette open={paletteOpen} onClose={closePalette} />
    </ShellContextProvider>
  );
}
