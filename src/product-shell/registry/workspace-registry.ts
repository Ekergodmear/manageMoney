import type {
  WorkspaceDefinition,
  WorkspaceId,
  WorkspaceNavigationItem,
} from '@/product-shell/types/workspace';

export class DuplicateWorkspaceError extends Error {
  constructor(id: WorkspaceId) {
    super(`Workspace already registered: ${id}`);
    this.name = 'DuplicateWorkspaceError';
  }
}

export class WorkspaceNotFoundError extends Error {
  constructor(id: WorkspaceId) {
    super(`Workspace not found: ${id}`);
    this.name = 'WorkspaceNotFoundError';
  }
}

export interface WorkspaceRegistry {
  register(definition: WorkspaceDefinition): void;
  unregister(id: WorkspaceId): void;
  get(id: WorkspaceId): WorkspaceDefinition | undefined;
  getAll(): readonly WorkspaceDefinition[];
  getNavigation(): readonly WorkspaceNavigationItem[];
}

export function createWorkspaceRegistry(): WorkspaceRegistry {
  const byId = new Map<WorkspaceId, WorkspaceDefinition>();

  return {
    register(definition: WorkspaceDefinition): void {
      if (byId.has(definition.id)) {
        throw new DuplicateWorkspaceError(definition.id);
      }
      byId.set(definition.id, definition);
    },

    unregister(id: WorkspaceId): void {
      if (!byId.delete(id)) {
        throw new WorkspaceNotFoundError(id);
      }
    },

    get(id: WorkspaceId): WorkspaceDefinition | undefined {
      return byId.get(id);
    },

    getAll(): readonly WorkspaceDefinition[] {
      return [...byId.values()].sort((a, b) => a.title.localeCompare(b.title));
    },

    getNavigation(): readonly WorkspaceNavigationItem[] {
      return this.getAll().map((workspace) => ({
        id: workspace.id,
        title: workspace.title,
        icon: workspace.icon,
        route: workspace.route,
      }));
    },
  };
}
