import { describe, expect, it, vi } from 'vitest';

import {
  CommandDisabledError,
  CommandNotVisibleError,
  createAppContext,
  createActionHistory,
  createCommandRegistry,
  createShellRuntime,
  createShortcutRegistry,
  createWorkspaceRegistry,
  DuplicateCommandError,
  DuplicateShortcutError,
  DuplicateWorkspaceError,
  WorkspaceNotFoundError,
} from '@/product-shell';
import type { AppCommand, AppContext } from '@/product-shell';

function planningWorkspace() {
  return {
    id: 'planning' as const,
    title: 'Planning',
    icon: 'planning',
    route: '/planning',
  };
}

function generatePlanCommand(executeFn?: (ctx: AppContext) => Promise<void>): AppCommand {
  return {
    id: 'planning.generate',
    title: 'Generate Plan',
    category: 'Planning',
    keywords: ['plan', 'generate'],
    visible: (ctx) => ctx.activeWorkspaceId === 'planning',
    enabled: (ctx) => ctx.flags.planReady === true,
    execute: executeFn ?? (async () => undefined),
  };
}

describe('workspace registry', () => {
  it('registers and returns a workspace', () => {
    const registry = createWorkspaceRegistry();
    const workspace = planningWorkspace();
    registry.register(workspace);
    expect(registry.get('planning')).toEqual(workspace);
  });

  it('rejects duplicate workspace id', () => {
    const registry = createWorkspaceRegistry();
    registry.register(planningWorkspace());
    expect(() => registry.register(planningWorkspace())).toThrow(DuplicateWorkspaceError);
  });

  it('unregisters a workspace', () => {
    const registry = createWorkspaceRegistry();
    registry.register(planningWorkspace());
    registry.unregister('planning');
    expect(registry.get('planning')).toBeUndefined();
  });

  it('builds navigation list from registered workspaces', () => {
    const registry = createWorkspaceRegistry();
    registry.register(planningWorkspace());
    registry.register({
      id: 'dashboard',
      title: 'Dashboard',
      icon: 'dashboard',
      route: '/dashboard',
    });
    expect(registry.getNavigation()).toEqual([
      {
        id: 'dashboard',
        title: 'Dashboard',
        icon: 'dashboard',
        route: '/dashboard',
      },
      {
        id: 'planning',
        title: 'Planning',
        icon: 'planning',
        route: '/planning',
      },
    ]);
  });

  it('throws when unregistering unknown workspace', () => {
    const registry = createWorkspaceRegistry();
    expect(() => registry.unregister('planning')).toThrow(WorkspaceNotFoundError);
  });
});

describe('command registry', () => {
  it('registers and executes a command', async () => {
    const registry = createCommandRegistry();
    const execute = vi.fn(async () => undefined);
    const command = generatePlanCommand(execute);
    registry.register(command);

    const ctx = createAppContext({
      activeWorkspaceId: 'planning',
      flags: { planReady: true },
    });
    await registry.execute('planning.generate', ctx);
    expect(execute).toHaveBeenCalledOnce();
  });

  it('searches commands by title and keywords', () => {
    const registry = createCommandRegistry();
    registry.register(generatePlanCommand());
    registry.register({
      id: 'planning.open',
      title: 'Open Planning',
      category: 'Navigation',
      keywords: ['workspace'],
      visible: () => true,
      enabled: () => true,
      execute: async () => undefined,
    });

    const results = registry.search('plan');
    expect(results.map((entry) => entry.command.id)).toContain('planning.generate');
    expect(results.map((entry) => entry.command.id)).toContain('planning.open');
  });

  it('respects visible and enabled guards', async () => {
    const registry = createCommandRegistry();
    registry.register(generatePlanCommand());

    const hiddenCtx = createAppContext({ activeWorkspaceId: 'dashboard', flags: { planReady: true } });
    await expect(registry.execute('planning.generate', hiddenCtx)).rejects.toThrow(CommandNotVisibleError);

    const disabledCtx = createAppContext({ activeWorkspaceId: 'planning', flags: { planReady: false } });
    await expect(registry.execute('planning.generate', disabledCtx)).rejects.toThrow(CommandDisabledError);
  });

  it('rejects duplicate command id', () => {
    const registry = createCommandRegistry();
    registry.register(generatePlanCommand());
    expect(() => registry.register(generatePlanCommand())).toThrow(DuplicateCommandError);
  });
});

describe('shortcut registry', () => {
  it('binds and resolves a shortcut', () => {
    const registry = createShortcutRegistry();
    registry.bind('Ctrl+K', 'planning.generate');
    expect(registry.resolve('Ctrl+K')).toBe('planning.generate');
  });

  it('rejects duplicate shortcut binding', () => {
    const registry = createShortcutRegistry();
    registry.bind('Ctrl+K', 'planning.generate');
    expect(() => registry.bind('Ctrl+K', 'planning.open')).toThrow(DuplicateShortcutError);
  });

  it('unbinds a shortcut', () => {
    const registry = createShortcutRegistry();
    registry.bind('Ctrl+K', 'planning.generate');
    registry.unbind('Ctrl+K');
    expect(registry.resolve('Ctrl+K')).toBeUndefined();
  });

  it('lists bound shortcuts', () => {
    const registry = createShortcutRegistry();
    registry.bind('Ctrl+K', 'planning.generate');
    expect(registry.list()).toEqual([
      {
        commandId: 'planning.generate',
        spec: { key: 'k', modifiers: ['ctrl'] },
        display: 'Ctrl+K',
      },
    ]);
  });
});

describe('action history', () => {
  it('records commands in order', () => {
    const history = createActionHistory();
    history.record('planning.generate');
    history.record('planning.open');
    expect(history.recent(10).map((entry) => entry.commandId)).toEqual([
      'planning.open',
      'planning.generate',
    ]);
  });

  it('applies recent limit', () => {
    const history = createActionHistory();
    history.record('a');
    history.record('b');
    history.record('c');
    expect(history.recent(2).map((entry) => entry.commandId)).toEqual(['c', 'b']);
  });

  it('clears history', () => {
    const history = createActionHistory();
    history.record('planning.generate');
    history.clear();
    expect(history.recent(10)).toEqual([]);
  });
});

describe('shell runtime integration', () => {
  it('wires workspace, command, shortcut, execute, and history', async () => {
    const shell = createShellRuntime();
    const execute = vi.fn(async () => undefined);

    shell.registerWorkspace(planningWorkspace());
    shell.commands.register(generatePlanCommand(execute));
    shell.shortcuts.bind('Ctrl+K', 'planning.generate');

    expect(shell.shortcuts.resolve('Ctrl+K')).toBe('planning.generate');

    const ctx = createAppContext({
      activeWorkspaceId: 'planning',
      flags: { planReady: true },
    });
    await shell.executeCommand('planning.generate', ctx);

    expect(execute).toHaveBeenCalledOnce();
    expect(shell.actionHistory.recent(10).map((entry) => entry.commandId)).toEqual([
      'planning.generate',
    ]);
  });
});
