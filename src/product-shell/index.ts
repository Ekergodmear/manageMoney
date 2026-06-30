export { createWorkspaceRegistry, DuplicateWorkspaceError, WorkspaceNotFoundError } from '@/product-shell/registry/workspace-registry';
export type { WorkspaceRegistry } from '@/product-shell/registry/workspace-registry';

export {
  createCommandRegistry,
  CommandDisabledError,
  CommandNotFoundError,
  CommandNotVisibleError,
  DuplicateCommandError,
} from '@/product-shell/registry/command-registry';
export type { CommandRegistry } from '@/product-shell/registry/command-registry';

export {
  createShortcutRegistry,
  DuplicateShortcutError,
  formatShortcutDisplay,
  ShortcutNotFoundError,
} from '@/product-shell/registry/shortcut-registry';
export type { ShortcutRegistry } from '@/product-shell/registry/shortcut-registry';

export { createActionHistory } from '@/product-shell/runtime/action-history';
export type { ActionHistory, ActionHistoryEntry } from '@/product-shell/runtime/action-history';

export { createAppContext } from '@/product-shell/runtime/app-context';
export type { CreateAppContextOptions } from '@/product-shell/runtime/app-context';

export { createShellRuntime } from '@/product-shell/runtime/shell-runtime';
export type { ShellRuntime } from '@/product-shell/runtime/shell-runtime';

export type { WorkspaceDefinition, WorkspaceId, WorkspaceNavigationItem } from '@/product-shell/types/workspace';
export type {
  AppCommand,
  AppContext,
  CommandCategory,
  CommandSearchResult,
  ShellLogger,
  ShellNotificationApi,
  ShellServices,
  ShortcutBinding,
} from '@/product-shell/types/command';
export type { ResolvedShortcut, ShortcutSpec } from '@/product-shell/types/shortcut';
export type {
  DiagnosticCapability,
  DiagnosticRow,
  DiagnosticSnapshot,
  DiagnosticStatus,
  Severity,
} from '@/product-shell/types/diagnostics';
