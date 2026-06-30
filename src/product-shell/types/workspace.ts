export type WorkspaceId =
  | 'dashboard'
  | 'game-monitor'
  | 'game-designer'
  | 'scenario'
  | 'capital'
  | 'session'
  | 'planning'
  | 'analysis'
  | 'allocation'
  | 'history'
  | 'settings'
  | 'diagnostics';

export interface WorkspaceNavigationItem {
  readonly id: WorkspaceId;
  readonly title: string;
  readonly icon: string;
  readonly route: string;
}

export interface WorkspaceDefinition {
  readonly id: WorkspaceId;
  readonly title: string;
  readonly icon: string;
  readonly route: string;
}
