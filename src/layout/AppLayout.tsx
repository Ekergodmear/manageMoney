import { motion } from 'framer-motion';
import {
  BarChart3,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock,
  Dices,
  FileText,
  Lightbulb,
  Moon,
  Settings,
  Sparkles,
  Sun,
  Zap,
} from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
  readonly headerBadge?: string;
  readonly main: ReactNode;
  readonly rightPanel: ReactNode;
  readonly showRightPanel?: boolean;
}

export function AppLayout({
  activeNav,
  onNavSelect,
  theme,
  onThemeChange,
  headerBadge = 'Platform Ready',
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

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0');
  }, [collapsed]);

  function toggleCollapsed(): void {
    setCollapsed((prev) => !prev);
  }

  function renderNavButton(item: NavItem, active: boolean, compact: boolean): ReactNode {
    const button = (
      <button
        type="button"
        disabled={!item.enabled && !active}
        title={compact ? item.label : undefined}
        onClick={() => {
          setMobileOpen(false);
          onNavSelect(item.id);
        }}
        className={cn(
          'flex w-full items-center rounded-xl text-sm font-medium transition-colors',
          compact ? 'justify-center px-2 py-2.5' : 'gap-2 px-3 py-2.5',
          active
            ? 'bg-accent text-accent-foreground'
            : item.enabled
              ? 'text-foreground hover:bg-muted'
              : 'cursor-not-allowed text-muted-foreground opacity-60',
        )}
      >
        {item.icon}
        {!compact ? <span className="truncate">{item.label}</span> : null}
      </button>
    );

    if (compact) {
      return <Tooltip content={item.label}>{button}</Tooltip>;
    }

    return button;
  }

  const sidebarInner = (compact: boolean): ReactNode => (
    <>
      <div
        className={cn(
          'mb-4 flex items-center',
          compact ? 'justify-center' : 'justify-between gap-2 px-1',
        )}
      >
        <div className={cn('flex items-center gap-2', compact && 'justify-center')}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BarChart3 className="h-5 w-5" />
          </div>
          {!compact ? (
            <div className="min-w-0">
              <div className="truncate text-sm font-bold">Stake Planner</div>
              <div className="text-xs text-muted-foreground">v1.0.0</div>
            </div>
          ) : null}
        </div>
        {!compact ? (
          <Button
            variant="ghost"
            size="icon"
            className="hidden h-8 w-8 shrink-0 lg:inline-flex"
            aria-label="Thu gọn sidebar"
            onClick={toggleCollapsed}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      {compact ? (
        <div className="mb-2 hidden justify-center lg:flex">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label="Mở rộng sidebar"
            onClick={toggleCollapsed}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      ) : null}

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <div key={item.id}>{renderNavButton(item, activeNav === item.id, compact)}</div>
        ))}
      </nav>

      {!compact ? (
        <Card className="mt-4 border-accent/50 bg-accent/30 shadow-none">
          <CardContent className="flex gap-2 p-3">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="text-xs leading-relaxed text-muted-foreground">
              <span className="font-semibold text-foreground">Mẹo sử dụng</span>
              <br />
              Điền đủ thông tin để nhận kế hoạch phù hợp nhất.
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tooltip content="Mẹo: điền đủ thông tin để có kế hoạch tốt nhất">
          <div className="mt-4 hidden justify-center lg:flex">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/50 text-primary">
              <Lightbulb className="h-4 w-4" />
            </div>
          </div>
        </Tooltip>
      )}

      <div
        className={cn(
          'mt-4 border-t border-border pt-4 text-xs text-muted-foreground',
          compact ? 'flex justify-center' : 'flex items-center justify-between',
        )}
      >
        <Tooltip content={isDark ? 'Chế độ sáng' : 'Chế độ tối'}>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full border border-border p-2"
            onClick={() => onThemeChange(!isDark)}
            aria-label="Đổi theme"
          >
            {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>
        </Tooltip>
        {!compact ? <span>© 2026</span> : null}
      </div>
    </>
  );

  return (
    <TooltipProvider>
      <div className={cn('flex min-h-screen flex-col bg-background', isDark && 'dark')}>
        {/* Header — full width */}
        <header className="sticky top-0 z-30 flex w-full items-center justify-between border-b border-border bg-card/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="rounded-lg border border-border px-2 py-1 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Mở menu"
            >
              ☰
            </button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-bold sm:text-xl">Stake Planner</h1>
                <Badge variant="secondary" className="hidden sm:inline-flex">
                  {headerBadge}
                </Badge>
              </div>
              <p className="hidden text-sm text-muted-foreground sm:block">
                Lập kế hoạch đặt cược theo luật game
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" aria-label="Trợ giúp">
              <CircleHelp className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Đổi theme"
              className="hidden sm:inline-flex"
              onClick={() => onThemeChange(!isDark)}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <div className="hidden h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground sm:flex">
              SP
            </div>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          {/* Mobile drawer sidebar */}
          <aside
            className={cn(
              'fixed inset-y-0 left-0 z-40 flex w-64 -translate-x-full flex-col border-r border-border bg-card p-4 transition-transform lg:hidden',
              mobileOpen && 'translate-x-0',
            )}
          >
            {sidebarInner(false)}
          </aside>

          {/* Desktop sidebar */}
          <aside
            className={cn(
              'hidden shrink-0 flex-col border-r border-border bg-card p-3 transition-[width] duration-200 ease-in-out lg:flex',
              collapsed ? 'w-[4.5rem]' : 'w-64',
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

          {/* Main + right */}
          <div className="flex min-w-0 flex-1 flex-col xl:flex-row">
            <motion.main
              key={activeNav}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8"
            >
              {main}
            </motion.main>

            {showRightPanel ? (
              <aside className="w-full shrink-0 border-t border-border bg-muted/40 p-4 sm:p-6 xl:w-80 xl:border-l xl:border-t-0">
                <div className="flex flex-col gap-4">{rightPanel}</div>
              </aside>
            ) : null}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

export function SectionTitle({
  icon,
  title,
}: {
  icon: ReactNode;
  title: string;
}): ReactNode {
  return (
    <div className="mb-4 flex items-center gap-2">
      <div className="text-primary">{icon}</div>
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
    </div>
  );
}

export function FormSection({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}): ReactNode {
  return (
    <div className="rounded-xl border border-border/80 bg-muted/30 p-4 sm:p-5">
      <SectionTitle icon={icon} title={title} />
      {children}
    </div>
  );
}
