import { createCommandRegistry, type CommandRegistry } from '@/product-shell/registry/command-registry';
import { createShortcutRegistry, type ShortcutRegistry } from '@/product-shell/registry/shortcut-registry';
import { createWorkspaceRegistry, type WorkspaceRegistry } from '@/product-shell/registry/workspace-registry';
import { createActionHistory, type ActionHistory } from '@/product-shell/runtime/action-history';
import type { AppContext } from '@/product-shell/types/command';
import type { WorkspaceDefinition } from '@/product-shell/types/workspace';

export interface ShellRuntime {
  readonly workspaces: WorkspaceRegistry;
  readonly commands: CommandRegistry;
  readonly shortcuts: ShortcutRegistry;
  readonly actionHistory: ActionHistory;
  registerWorkspace(definition: WorkspaceDefinition): void;
  unregisterWorkspace(id: WorkspaceDefinition['id']): void;
  executeCommand(id: string, ctx: AppContext): Promise<void>;
}

export function createShellRuntime(): ShellRuntime {
  const workspaces = createWorkspaceRegistry();
  const commands = createCommandRegistry();
  const shortcuts = createShortcutRegistry();
  const actionHistory = createActionHistory();

  return {
    workspaces,
    commands,
    shortcuts,
    actionHistory,

    registerWorkspace(definition: WorkspaceDefinition): void {
      workspaces.register(definition);
    },

    unregisterWorkspace(id: WorkspaceDefinition['id']): void {
      workspaces.unregister(id);
    },

    async executeCommand(id: string, ctx: AppContext): Promise<void> {
      await commands.execute(id, ctx);
      actionHistory.record(id);
    },
  };
}
