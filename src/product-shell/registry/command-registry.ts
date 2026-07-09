import type {
  AppCommand,
  AppContext,
  CommandSearchResult,
} from '@/product-shell/types/command';

export class DuplicateCommandError extends Error {
  constructor(id: string) {
    super(`Command already registered: ${id}`);
    this.name = 'DuplicateCommandError';
  }
}

export class CommandNotFoundError extends Error {
  constructor(id: string) {
    super(`Command not found: ${id}`);
    this.name = 'CommandNotFoundError';
  }
}

export class CommandDisabledError extends Error {
  constructor(id: string) {
    super(`Command disabled: ${id}`);
    this.name = 'CommandDisabledError';
  }
}

export class CommandNotVisibleError extends Error {
  constructor(id: string) {
    super(`Command not visible: ${id}`);
    this.name = 'CommandNotVisibleError';
  }
}

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

function scoreCommand(command: AppCommand, query: string): number {
  if (query.length === 0) {
    return 1;
  }
  const id = command.id.toLowerCase();
  const title = command.title.toLowerCase();
  if (id === query || title === query) {
    return 100;
  }
  if (id.startsWith(query) || title.startsWith(query)) {
    return 80;
  }
  if (id.includes(query) || title.includes(query)) {
    return 60;
  }
  if (command.description?.toLowerCase().includes(query)) {
    return 40;
  }
  for (const keyword of command.keywords) {
    if (keyword.toLowerCase().includes(query)) {
      return 30;
    }
  }
  return 0;
}

export interface CommandRegistry {
  register(command: AppCommand): void;
  unregister(id: string): void;
  get(id: string): AppCommand | undefined;
  getAll(ctx?: AppContext): readonly AppCommand[];
  search(query: string, ctx?: AppContext): readonly CommandSearchResult[];
  execute(id: string, ctx: AppContext): Promise<void>;
}

export function createCommandRegistry(): CommandRegistry {
  const byId = new Map<string, AppCommand>();

  function visibleCommands(ctx?: AppContext): readonly AppCommand[] {
    const all = [...byId.values()];
    if (ctx === undefined) {
      return all;
    }
    return all.filter((command) => command.visible(ctx));
  }

  return {
    register(command: AppCommand): void {
      if (byId.has(command.id)) {
        throw new DuplicateCommandError(command.id);
      }
      byId.set(command.id, command);
    },

    unregister(id: string): void {
      if (!byId.delete(id)) {
        throw new CommandNotFoundError(id);
      }
    },

    get(id: string): AppCommand | undefined {
      return byId.get(id);
    },

    getAll(ctx?: AppContext): readonly AppCommand[] {
      return [...visibleCommands(ctx)].sort((a, b) => a.title.localeCompare(b.title));
    },

    search(query: string, ctx?: AppContext): readonly CommandSearchResult[] {
      const normalized = normalizeQuery(query);
      return visibleCommands(ctx)
        .map((command) => ({ command, score: scoreCommand(command, normalized) }))
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score || a.command.title.localeCompare(b.command.title));
    },

    async execute(id: string, ctx: AppContext): Promise<void> {
      const command = byId.get(id);
      if (command === undefined) {
        throw new CommandNotFoundError(id);
      }
      if (!command.visible(ctx)) {
        throw new CommandNotVisibleError(id);
      }
      if (!command.enabled(ctx)) {
        throw new CommandDisabledError(id);
      }
      await command.execute(ctx);
    },
  };
}
