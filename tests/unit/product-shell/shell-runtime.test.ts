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
    visible: (ctx) => ctx.flags.onPlanningWorkspace === true,
    enabled: (ctx) => ctx.flags.planReady === true,
    execute: executeFn ?? (() => Promise.resolve()),
  };
}

function planningCtx(overrides: { onPlanningWorkspace?: boolean; planReady?: boolean } = {}) {
  return createAppContext({
    flags: {
      onPlanningWorkspace: overrides.onPlanningWorkspace ?? true,
      planReady: overrides.planReady ?? true,
    },
  });
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
    expect(() => {
      registry.register(planningWorkspace());
    }).toThrow(DuplicateWorkspaceError);
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
    expect(() => {
      registry.unregister('planning');
    }).toThrow(WorkspaceNotFoundError);
  });
});

describe('command registry', () => {
  it('registers and executes a command', async () => {
    const registry = createCommandRegistry();
    const execute = vi.fn(() => Promise.resolve());
    const command = generatePlanCommand(execute);
    registry.register(command);

    await registry.execute('planning.generate', planningCtx());
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
      execute: () => Promise.resolve(),
    });

    const results = registry.search('plan');
    expect(results.map((entry) => entry.command.id)).toContain('planning.generate');
    expect(results.map((entry) => entry.command.id)).toContain('planning.open');
  });

  it('respects visible and enabled guards', async () => {
    const registry = createCommandRegistry();
    registry.register(generatePlanCommand());

    const hiddenCtx = planningCtx({ onPlanningWorkspace: false, planReady: true });
    await expect(registry.execute('planning.generate', hiddenCtx)).rejects.toThrow(CommandNotVisibleError);

    const disabledCtx = planningCtx({ onPlanningWorkspace: true, planReady: false });
    await expect(registry.execute('planning.generate', disabledCtx)).rejects.toThrow(CommandDisabledError);
  });

  it('rejects duplicate command id', () => {
    const registry = createCommandRegistry();
    registry.register(generatePlanCommand());
    expect(() => {
      registry.register(generatePlanCommand());
    }).toThrow(DuplicateCommandError);
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
    expect(() => {
      registry.bind('Ctrl+K', 'planning.open');
    }).toThrow(DuplicateShortcutError);
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

  it('defaults record outcome to success', () => {
    const history = createActionHistory();
    history.record('planning.generate');
    expect(history.recent(1)[0]?.outcome).toBe('success');
  });

  it('records success and failure outcomes', () => {
    const history = createActionHistory();
    history.recordSuccess('planning.generate');
    history.recordFailure('planning.export');
    expect(history.recent(2)).toEqual([
      expect.objectContaining({ commandId: 'planning.export', outcome: 'failure' }),
      expect.objectContaining({ commandId: 'planning.generate', outcome: 'success' }),
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

describe('shell runtime facade', () => {
  it('forwards workspace registration to the registry', () => {
    const shell = createShellRuntime();
    shell.registerWorkspace(planningWorkspace());
    expect(shell.workspaces.get('planning')).toEqual(planningWorkspace());
  });

  it('forwards command registration and search to the registry', () => {
    const shell = createShellRuntime();
    shell.registerCommand(generatePlanCommand());
    const results = shell.searchCommands('generate', planningCtx());
    expect(results.map((entry) => entry.command.id)).toContain('planning.generate');
  });

  it('forwards shortcut bind and resolve to the registry', () => {
    const shell = createShellRuntime();
    shell.bindShortcut('Ctrl+K', 'planning.generate');
    expect(shell.shortcuts.resolve('Ctrl+K')).toBe('planning.generate');
    shell.unbindShortcut('Ctrl+K');
    expect(shell.shortcuts.resolve('Ctrl+K')).toBeUndefined();
  });

  it('records success when executeCommand succeeds', async () => {
    const shell = createShellRuntime();
    shell.registerCommand(generatePlanCommand());
    await shell.executeCommand('planning.generate', planningCtx());
    expect(shell.actionHistory.recent(1)).toEqual([
      expect.objectContaining({ commandId: 'planning.generate', outcome: 'success' }),
    ]);
  });

  it('records failure when executeCommand throws', async () => {
    const shell = createShellRuntime();
    shell.registerCommand({
      ...generatePlanCommand(),
      enabled: () => true,
      visible: () => true,
      execute: () => Promise.reject(new Error('export failed')),
    });
    await expect(shell.executeCommand('planning.generate', planningCtx())).rejects.toThrow('export failed');
    expect(shell.actionHistory.recent(1)).toEqual([
      expect.objectContaining({ commandId: 'planning.generate', outcome: 'failure' }),
    ]);
  });
});

describe('shell runtime integration', () => {
  it('wires workspace, command, shortcut, execute, and history via facade', async () => {
    const shell = createShellRuntime();
    const execute = vi.fn(() => Promise.resolve());

    shell.registerWorkspace(planningWorkspace());
    shell.registerCommand(generatePlanCommand(execute));
    shell.bindShortcut('Ctrl+K', 'planning.generate');

    expect(shell.shortcuts.resolve('Ctrl+K')).toBe('planning.generate');

    await shell.executeCommand('planning.generate', planningCtx());

    expect(execute).toHaveBeenCalledOnce();
    expect(shell.actionHistory.recent(10)).toEqual([
      expect.objectContaining({ commandId: 'planning.generate', outcome: 'success' }),
    ]);
  });
});
