import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Gamepad2,
  History,
  LayoutDashboard,
  LineChart,
  Moon,
  Settings,
  SlidersHorizontal,
  Sun,
  Target,
  Users,
} from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { FeedbackButton } from '@/components/FeedbackButton';
import { Tooltip, TooltipProvider } from '@/components/ui/tooltip';
import {
  buildWorkspaces,
  type WorkspaceId,
  type WorkspaceItem,
} from '@/features/navigation/workspace-nav';
import { cn } from '@/lib/utils';

export type { WorkspaceId };

const SIDEBAR_COLLAPSED_KEY = 'stake-planner-sidebar-collapsed';

const WORKSPACE_ICONS: Record<WorkspaceId, ReactNode> = {
  dashboard: <LayoutDashboard className="h-4 w-4" />,
  'game-designer': <SlidersHorizontal className="h-4 w-4" />,
  planning: <Target className="h-4 w-4" />,
  playing: <Gamepad2 className="h-4 w-4" />,
  analysis: <LineChart className="h-4 w-4" />,
  allocation: <Users className="h-4 w-4" />,
  history: <History className="h-4 w-4" />,
  settings: <Settings className="h-4 w-4" />,
};

export interface AppLayoutProps {
  readonly activeWorkspace: WorkspaceId;
  readonly onWorkspaceSelect: (id: WorkspaceId) => void;
  readonly theme: 'light' | 'dark';
  readonly onThemeChange: (dark: boolean) => void;
  readonly main: ReactNode;
  readonly rightPanel: ReactNode;
  readonly showRightPanel?: boolean;
}

export function AppLayout({
  activeWorkspace,
  onWorkspaceSelect,
  theme,
  onThemeChange,
  main,
  rightPanel,
  showRightPanel = true,
}: AppLayoutProps): ReactNode {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';
  });
  const isDark = theme === 'dark';
  const workspaces = useMemo(() => buildWorkspaces(WORKSPACE_ICONS), []);

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0');
  }, [collapsed]);

  function renderNavButton(item: WorkspaceItem, active: boolean, compact: boolean): ReactNode {
    const button = (
      <button
        type="button"
        onClick={() => {
          setMobileOpen(false);
          onWorkspaceSelect(item.id);
        }}
        className={cn(
          'flex w-full items-center rounded-lg text-sm font-medium transition-colors',
          compact ? 'justify-center p-2' : 'gap-2.5 px-2.5 py-2',
          active ? 'bg-accent text-accent-foreground' : 'text-foreground hover:bg-muted',
        )}
      >
        {item.icon}
        {!compact ? <span className="truncate text-xs">{item.label}</span> : null}
      </button>
    );
    return compact ? <Tooltip content={item.label}>{button}</Tooltip> : button;
  }

  const sidebarInner = (compact: boolean): ReactNode => (
    <>
      <div className={cn('mb-4', compact ? 'flex justify-center' : 'relative')}>
        {compact ? (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Target className="h-4 w-4" />
          </div>
        ) : (
          <>
            <p className="pr-8 text-sm font-bold">Stake Planner</p>
            <p className="text-[11px] text-muted-foreground">Quản lý phiên cược</p>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-7 w-7"
              aria-label="Thu gọn sidebar"
              onClick={() => setCollapsed(true)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </>
        )}
        {compact ? (
          <Button
            variant="ghost"
            size="icon"
            className="mt-2 h-7 w-7"
            aria-label="Mở rộng sidebar"
            onClick={() => setCollapsed(false)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      <nav className="scrollbar-none flex flex-1 flex-col gap-0.5 overflow-y-auto">
        {workspaces.map((item) => (
          <div key={item.id}>{renderNavButton(item, activeWorkspace === item.id, compact)}</div>
        ))}
      </nav>

      <div className={cn('mt-3 border-t border-border pt-3', compact && 'flex justify-center')}>
        <Tooltip content={isDark ? 'Chế độ sáng' : 'Chế độ tối'}>
          <button
            type="button"
            className={cn(
              'inline-flex items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground',
              compact ? 'p-2' : 'gap-2 px-2.5 py-2 text-xs',
            )}
            onClick={() => onThemeChange(!isDark)}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {!compact ? <span>Dark Mode</span> : null}
          </button>
        </Tooltip>
      </div>
    </>
  );

  return (
    <TooltipProvider>
      <div className={cn('flex h-screen flex-col overflow-hidden bg-background', isDark && 'dark')}>
        <header className="flex h-11 shrink-0 items-center justify-between border-b border-border bg-card px-3 lg:hidden">
          <button
            type="button"
            className="rounded-md border border-border px-1.5 py-0.5 text-sm"
            onClick={() => setMobileOpen(true)}
            aria-label="Mở menu"
          >
            ☰
          </button>
          <span className="text-sm font-semibold">Stake Planner</span>
          <FeedbackButton />
        </header>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <aside
            className={cn(
              'fixed inset-y-0 left-0 z-40 flex w-56 flex-col border-r border-border bg-card p-3 pt-12 transition-transform lg:hidden',
              mobileOpen ? 'translate-x-0' : '-translate-x-full',
            )}
          >
            {sidebarInner(false)}
          </aside>

          <aside
            className={cn(
              'relative hidden shrink-0 flex-col border-r border-border bg-card p-3 lg:flex',
              collapsed ? 'w-14' : 'w-56',
            )}
          >
            {sidebarInner(collapsed)}
          </aside>

          {mobileOpen ? (
            <button
              type="button"
              className="fixed inset-0 z-30 bg-black/40 lg:hidden"
              aria-label="Đóng menu"
              onClick={() => setMobileOpen(false)}
            />
          ) : null}

          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <div className="hidden shrink-0 items-center justify-end border-b border-border bg-card/95 px-4 py-2 lg:flex">
              <FeedbackButton />
            </div>
            <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden lg:flex-row">
              <motion.main
                key={activeWorkspace}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15 }}
                className="scrollbar-none min-h-0 min-w-0 flex-1 overflow-y-auto p-3 sm:p-4 lg:p-5"
              >
                {main}
              </motion.main>
              {showRightPanel ? (
                <aside className="scrollbar-none hidden min-h-0 w-72 shrink-0 overflow-y-auto border-l border-border bg-muted/30 p-4 lg:block xl:w-80">
                  <div className="flex flex-col gap-2">{rightPanel}</div>
                </aside>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

export function FormSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}): ReactNode {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-foreground">{title}</p>
      {children}
    </div>
  );
}
