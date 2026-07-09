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
    execute: () => {
      handlers.openPalette();
      return Promise.resolve();
    },
  });

  shell.registerCommand({
    id: 'navigation.open-planning',
    title: 'Open Planning',
    category: 'Navigation',
    keywords: ['plan', 'planning', 'generate'],
    visible: () => true,
    enabled: () => true,
    execute: (ctx) => {
      ctx.navigate('planning');
      return Promise.resolve();
    },
  });

  shell.registerCommand({
    id: 'navigation.open-session',
    title: 'Open Session',
    category: 'Session',
    keywords: ['session', 'playing', 'continue'],
    visible: () => true,
    enabled: () => true,
    execute: (ctx) => {
      ctx.navigate('session');
      return Promise.resolve();
    },
  });

  shell.registerCommand({
    id: 'navigation.open-diagnostics',
    title: 'Open Diagnostics',
    category: 'Developer',
    keywords: ['diagnostics', 'health', 'status'],
    visible: () => true,
    enabled: () => true,
    execute: (ctx) => {
      ctx.navigate('diagnostics');
      return Promise.resolve();
    },
  });

  shell.bindShortcut('Ctrl+K', 'shell.open-palette');
}
