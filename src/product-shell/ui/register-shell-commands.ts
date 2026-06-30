import type { ShellRuntime } from '@/product-shell/runtime/shell-runtime';

export interface ShellCommandHandlers {
  readonly openPalette: () => void;
}

export function registerShellCommands(
  shell: ShellRuntime,
  handlers: ShellCommandHandlers,
): void {
  shell.registerCommand({
    id: 'shell.open-palette',
    title: 'Command Palette',
    category: 'Navigation',
    keywords: ['palette', 'commands', 'search'],
    visible: () => true,
    enabled: () => true,
    execute: async () => {
      handlers.openPalette();
    },
  });

  shell.registerCommand({
    id: 'navigation.open-planning',
    title: 'Open Planning',
    category: 'Navigation',
    keywords: ['plan', 'planning', 'generate'],
    visible: () => true,
    enabled: () => true,
    execute: async (ctx) => {
      ctx.navigate('planning');
    },
  });

  shell.registerCommand({
    id: 'navigation.open-session',
    title: 'Open Session',
    category: 'Session',
    keywords: ['session', 'playing', 'continue'],
    visible: () => true,
    enabled: () => true,
    execute: async (ctx) => {
      ctx.navigate('session');
    },
  });

  shell.bindShortcut('Ctrl+K', 'shell.open-palette');
}
