import type { WorkspaceId } from '@/product-shell/types/workspace';

export type CommandCategory =
  | 'Planning'
  | 'Session'
  | 'Library'
  | 'Dashboard'
  | 'Navigation'
  | 'Developer';

export interface ShortcutBinding {
  readonly key: string;
  readonly modifiers?: readonly ('ctrl' | 'shift' | 'alt' | 'meta')[];
  readonly display?: string;
}

export interface ShellLogger {
  readonly info: (message: string) => void;
  readonly warn: (message: string) => void;
  readonly error: (message: string) => void;
}

export interface ShellNotificationApi {
  readonly notify: (message: string) => void;
}

export interface ShellServices {
  readonly [service: string]: unknown;
}

/** Injected dependencies — no UI state. */
export interface AppContext {
  readonly navigate: (workspaceId: WorkspaceId) => void;
  readonly services: ShellServices;
  readonly notifications: ShellNotificationApi;
  readonly logger: ShellLogger;
  readonly flags: Readonly<Record<string, boolean>>;
}

export interface AppCommand {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly category: CommandCategory;
  readonly icon?: string;
  readonly keywords: readonly string[];
  readonly shortcut?: ShortcutBinding;
  readonly visible: (ctx: AppContext) => boolean;
  readonly enabled: (ctx: AppContext) => boolean;
  readonly execute: (ctx: AppContext) => Promise<void>;
}

export interface CommandSearchResult {
  readonly command: AppCommand;
  readonly score: number;
}
