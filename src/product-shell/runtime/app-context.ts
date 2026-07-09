import type { AppContext, ShellLogger, ShellNotificationApi, ShellServices } from '@/product-shell/types/command';
import type { WorkspaceId } from '@/product-shell/types/workspace';

export interface CreateAppContextOptions {
  readonly navigate?: (workspaceId: WorkspaceId) => void;
  readonly services?: ShellServices;
  readonly notifications?: ShellNotificationApi;
  readonly logger?: ShellLogger;
  readonly flags?: Readonly<Record<string, boolean>>;
}

const noopLogger: ShellLogger = {
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
};

const noopNotifications: ShellNotificationApi = {
  notify: () => undefined,
};

export function createAppContext(options: CreateAppContextOptions = {}): AppContext {
  return {
    navigate: options.navigate ?? (() => undefined),
    services: options.services ?? {},
    notifications: options.notifications ?? noopNotifications,
    logger: options.logger ?? noopLogger,
    flags: options.flags ?? {},
  };
}
