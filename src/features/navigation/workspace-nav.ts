import type { ReactNode } from 'react';

export type WorkspaceId =
  | 'dashboard'
  | 'game-designer'
  | 'session'
  | 'planning'
  | 'analysis'
  | 'allocation'
  | 'history'
  | 'settings';

export interface WorkspaceItem {
  readonly id: WorkspaceId;
  readonly label: string;
  readonly icon: ReactNode;
}

export const WORKSPACE_LABELS: Record<WorkspaceId, string> = {
  dashboard: 'Dashboard',
  'game-designer': 'Game Designer',
  session: 'Session',
  planning: 'Planning',
  analysis: 'Insights',
  allocation: 'Account Planner',
  history: 'Session Library',
  settings: 'Settings',
};

export function buildWorkspaces(icons: Record<WorkspaceId, ReactNode>): readonly WorkspaceItem[] {
  return (Object.keys(WORKSPACE_LABELS) as WorkspaceId[]).map((id) => ({
    id,
    label: WORKSPACE_LABELS[id],
    icon: icons[id],
  }));
}
