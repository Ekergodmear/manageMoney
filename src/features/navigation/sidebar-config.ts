import type { ReactNode } from 'react';

export type NavItemId =
  | 'create'
  | 'session'
  | 'history'
  | 'improve'
  | 'continue'
  | 'simulation'
  | 'allocation'
  | 'game'
  | 'settings'
  | 'guide';

export type NavBadge = 'beta' | 'soon';

export type SidebarContext = 'initial' | 'active';

export interface NavItem {
  readonly id: NavItemId;
  readonly label: string;
  readonly icon: ReactNode;
  readonly badge?: NavBadge;
  readonly emphasized?: boolean;
}

export interface NavSection {
  readonly items: readonly NavItem[];
}

export function resolveSidebarContext(hasActivePlan: boolean): SidebarContext {
  return hasActivePlan ? 'active' : 'initial';
}

export function buildSidebarSections(
  context: SidebarContext,
  icons: Record<NavItemId, ReactNode>,
): readonly NavSection[] {
  const item = (
    id: NavItemId,
    label: string,
    opts?: { badge?: NavBadge; emphasized?: boolean },
  ): NavItem => ({
    id,
    label,
    icon: icons[id],
    ...(opts?.badge !== undefined ? { badge: opts.badge } : {}),
    ...(opts?.emphasized === true ? { emphasized: true } : {}),
  });

  if (context === 'initial') {
    return [
      {
        items: [
          item('create', 'Tạo kế hoạch'),
          item('history', 'Lịch sử', { badge: 'soon' }),
        ],
      },
      {
        items: [
          item('game', 'Game', { badge: 'soon' }),
          item('settings', 'Cài đặt'),
          item('guide', 'Hướng dẫn', { badge: 'beta' }),
        ],
      },
    ];
  }

  return [
    {
      items: [
        item('create', 'Tạo kế hoạch'),
        item('session', 'Phiên đang chơi', { emphasized: true }),
        item('continue', 'Tiếp tục phiên', { badge: 'soon' }),
        item('simulation', 'Mô phỏng', { badge: 'beta' }),
      ],
    },
    {
      items: [
        item('improve', 'Cải thiện kế hoạch', { badge: 'soon' }),
        item('allocation', 'Phân bổ tài khoản', { badge: 'soon' }),
        item('history', 'Lịch sử', { badge: 'soon' }),
      ],
    },
    {
      items: [
        item('game', 'Game', { badge: 'soon' }),
        item('settings', 'Cài đặt'),
        item('guide', 'Hướng dẫn', { badge: 'beta' }),
      ],
    },
  ];
}

export const NAV_LABELS: Record<NavItemId, string> = {
  create: 'Tạo kế hoạch',
  session: 'Phiên đang chơi',
  history: 'Lịch sử',
  improve: 'Cải thiện kế hoạch',
  continue: 'Tiếp tục phiên',
  simulation: 'Mô phỏng',
  allocation: 'Phân bổ tài khoản',
  game: 'Game',
  settings: 'Cài đặt',
  guide: 'Hướng dẫn',
};
