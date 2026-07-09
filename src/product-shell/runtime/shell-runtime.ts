import { createCommandRegistry, type CommandRegistry } from '@/product-shell/registry/command-registry';
import { createShortcutRegistry, type ShortcutRegistry } from '@/product-shell/registry/shortcut-registry';
import { createWorkspaceRegistry, type WorkspaceRegistry } from '@/product-shell/registry/workspace-registry';
import { createActionHistory, type ActionHistory } from '@/product-shell/runtime/action-history';
import type { AppCommand, AppContext, CommandSearchResult } from '@/product-shell/types/command';
import type { ShortcutSpec } from '@/product-shell/types/shortcut';
import type { WorkspaceDefinition, WorkspaceId } from '@/product-shell/types/workspace';

export interface ShellRuntime {
  /** Advanced API. Prefer ShellRuntime facade methods. */
  readonly workspaces: WorkspaceRegistry;
  /** Advanced API. Prefer ShellRuntime facade methods. */
  readonly commands: CommandRegistry;
  /** Advanced API. Prefer ShellRuntime facade methods. */
  readonly shortcuts: ShortcutRegistry;
  readonly actionHistory: ActionHistory;

  registerWorkspace(definition: WorkspaceDefinition): void;
  unregisterWorkspace(id: WorkspaceId): void;
  registerCommand(command: AppCommand): void;
  unregisterCommand(id: string): void;
  bindShortcut(shortcut: string | ShortcutSpec, commandId: string): void;
  unbindShortcut(shortcut: string | ShortcutSpec): void;
  searchCommands(query: string, ctx: AppContext): readonly CommandSearchResult[];
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

    unregisterWorkspace(id: WorkspaceId): void {
      workspaces.unregister(id);
    },

    registerCommand(command: AppCommand): void {
      commands.register(command);
    },

    unregisterCommand(id: string): void {
      commands.unregister(id);
    },

    bindShortcut(shortcut: string | ShortcutSpec, commandId: string): void {
      shortcuts.bind(shortcut, commandId);
    },

    unbindShortcut(shortcut: string | ShortcutSpec): void {
      shortcuts.unbind(shortcut);
    },

    searchCommands(query: string, ctx: AppContext): readonly CommandSearchResult[] {
      return commands.search(query, ctx);
    },

    async executeCommand(id: string, ctx: AppContext): Promise<void> {
      try {
        await commands.execute(id, ctx);
        actionHistory.recordSuccess(id);
      } catch (error) {
        actionHistory.recordFailure(id);
        throw error;
      }
    },
  };
}
