import { useEffect } from 'react';

import type { AppContext } from '@/product-shell/types/command';
import type { ShellRuntime } from '@/product-shell/runtime/shell-runtime';

import { isEditableTarget, keyboardEventToShortcut } from '@/product-shell/ui/keyboard';

export function useGlobalKeyboard(
  runtime: ShellRuntime,
  appContext: AppContext,
  options: { readonly enabled?: boolean } = {},
): void {
  const enabled = options.enabled ?? true;

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    function onKeyDown(event: KeyboardEvent): void {
      if (isEditableTarget(event.target)) {
        return;
      }

      const shortcut = keyboardEventToShortcut(event);
      if (shortcut === null) {
        return;
      }

      const commandId = runtime.shortcuts.resolve(shortcut);
      if (commandId === undefined) {
        return;
      }

      event.preventDefault();
      void runtime.executeCommand(commandId, appContext);
    }

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [appContext, enabled, runtime]);
}
