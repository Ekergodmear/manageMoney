import { motion } from 'framer-motion';
import {
  BarChart3,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Clock,
  Dices,
  FileText,
  Moon,
  Settings,
  Sparkles,
  Sun,
  Zap,
} from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export type NavItemId =
  | 'create'
  | 'plans'
  | 'history'
  | 'simulation'
  | 'optimize'
  | 'allocate'
  | 'settings';

interface NavItem {
  readonly id: NavItemId;
  readonly label: string;
  readonly icon: ReactNode;
  readonly enabled: boolean;
}

const NAV_ITEMS: readonly NavItem[] = [
  { id: 'create', label: 'Tạo kế hoạch', icon: <Sparkles className="h-4 w-4" />, enabled: true },
  { id: 'plans', label: 'Kế hoạch của tôi', icon: <FileText className="h-4 w-4" />, enabled: false },
  { id: 'history', label: 'Lịch sử', icon: <Clock className="h-4 w-4" />, enabled: false },
  { id: 'simulation', label: 'Mô phỏng', icon: <Dices className="h-4 w-4" />, enabled: false },
  { id: 'optimize', label: 'Tối ưu kế hoạch', icon: <Zap className="h-4 w-4" />, enabled: false },
  { id: 'allocate', label: 'Phân bổ vốn', icon: <Briefcase className="h-4 w-4" />, enabled: false },
  { id: 'settings', label: 'Cài đặt', icon: <Settings className="h-4 w-4" />, enabled: false },
];

const SIDEBAR_COLLAPSED_KEY = 'stake-planner-sidebar-collapsed';

export interface AppLayoutProps {
  readonly activeNav: NavItemId;
  readonly onNavSelect: (id: NavItemId) => void;
  readonly theme: 'light' | 'dark';
  readonly onThemeChange: (dark: boolean) => void;
  readonly main: ReactNode;
  readonly rightPanel: ReactNode;
  readonly showRightPanel?: boolean;
}

export function AppLayout({
  activeNav,
  onNavSelect,
  theme,
  onThemeChange,
  main,
  rightPanel,
  showRightPanel = true,
}: AppLayoutProps): ReactNode {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') {
      return true;
    }
    const stored = window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    return stored === '1';
  });
  const isDark = theme === 'dark';

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0');
  }, [collapsed]);

  function renderNavButton(item: NavItem, active: boolean, compact: boolean): ReactNode {
    const button = (
      <button
        type="button"
        disabled={!item.enabled && !active}
        onClick={() => {
          setMobileOpen(false);
          onNavSelect(item.id);
        }}
        className={cn(
          'flex w-full items-center rounded-lg text-sm font-medium transition-colors',
          compact ? 'justify-center p-2' : 'gap-2 px-2.5 py-2',
          active
            ? 'bg-accent text-accent-foreground'
            : item.enabled
              ? 'text-foreground hover:bg-muted'
              : 'cursor-not-allowed text-muted-foreground opacity-50',
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
      <div className={cn('mb-2 flex items-center', compact ? 'justify-center' : 'justify-between')}>
        {!compact ? (
          <Button
            variant="ghost"
            size="icon"
            className="hidden h-7 w-7 lg:inline-flex"
            aria-label="Thu gọn sidebar"
            onClick={() => setCollapsed(true)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-label="Mở rộng sidebar"
            onClick={() => setCollapsed(false)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <div key={item.id}>{renderNavButton(item, activeNav === item.id, compact)}</div>
        ))}
      </nav>
    </>
  );

  return (
    <TooltipProvider>
      <div className={cn('flex h-screen flex-col overflow-hidden bg-background', isDark && 'dark')}>
        <header className="flex h-11 shrink-0 items-center justify-between border-b border-border bg-card px-3 sm:px-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-md border border-border px-1.5 py-0.5 text-sm lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Mở menu"
            >
              ☰
            </button>
            <BarChart3 className="hidden h-4 w-4 text-primary lg:block" />
            <h1 className="text-sm font-semibold sm:text-base">Stake Planner</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label="Đổi theme"
            onClick={() => onThemeChange(!isDark)}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </header>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <aside
            className={cn(
              'fixed inset-y-0 left-0 z-40 flex w-52 -translate-x-full flex-col border-r border-border bg-card p-2 pt-12 transition-transform lg:hidden',
              mobileOpen && 'translate-x-0',
            )}
          >
            {sidebarInner(false)}
          </aside>

          <aside
            className={cn(
              'hidden shrink-0 flex-col border-r border-border bg-card p-3 lg:flex',
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

          <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden lg:flex-row">
            <motion.main
              key={activeNav}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
              className="min-h-0 min-w-0 flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6"
            >
              {main}
            </motion.main>

            {showRightPanel ? (
              <aside className="hidden min-h-0 w-72 shrink-0 overflow-y-auto border-l border-border bg-muted/30 p-4 lg:block xl:w-80">
                <div className="flex flex-col gap-2">{rightPanel}</div>
              </aside>
            ) : null}
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
      <p className="mb-3 text-sm font-semibold text-foreground">{title}</p>
      {children}
    </div>
  );
}
