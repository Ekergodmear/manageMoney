import type { ReactNode } from 'react';

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

export interface WorkspaceItem {
  readonly id: WorkspaceId;
  readonly label: string;
  readonly icon: ReactNode;
}

export const WORKSPACE_LABELS: Record<WorkspaceId, string> = {
  dashboard: 'Dashboard',
  'game-monitor': 'Game Monitor',
  'game-designer': 'Game Designer',
  scenario: 'Scenario Planner',
  capital: 'Capital Planner',
  session: 'Session',
  planning: 'Planning',
  analysis: 'Insights',
  allocation: 'Account Planner',
  history: 'Session Library',
  settings: 'Settings',
  diagnostics: 'Diagnostics',
};

export function buildWorkspaces(icons: Record<WorkspaceId, ReactNode>): readonly WorkspaceItem[] {
  return (Object.keys(WORKSPACE_LABELS) as WorkspaceId[]).map((id) => ({
    id,
    label: WORKSPACE_LABELS[id],
    icon: icons[id],
  }));
}
