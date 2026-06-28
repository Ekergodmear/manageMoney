import type { ReactNode } from 'react';

export type WorkspaceId =
  | 'dashboard'
  | 'planning'
  | 'playing'
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
  planning: 'Kế hoạch',
  playing: 'Phiên chơi',
  analysis: 'Phân tích',
  allocation: 'Phân bổ tài khoản',
  history: 'Lịch sử',
  settings: 'Cài đặt',
};

export function buildWorkspaces(icons: Record<WorkspaceId, ReactNode>): readonly WorkspaceItem[] {
  return (Object.keys(WORKSPACE_LABELS) as WorkspaceId[]).map((id) => ({
    id,
    label: WORKSPACE_LABELS[id],
    icon: icons[id],
  }));
}
