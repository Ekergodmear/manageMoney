import { motion } from 'framer-motion';
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  CirclePlay,
  Dices,
  Gamepad2,
  HelpCircle,
  History,
  Moon,
  PlayCircle,
  Settings,
  Sparkles,
  Sun,
  Users,
  Zap,
} from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipProvider } from '@/components/ui/tooltip';
import { NavBadgePill } from '@/features/placeholders/FeaturePlaceholder';
import {
  buildSidebarSections,
  type NavItem,
  type NavItemId,
  resolveSidebarContext,
} from '@/features/navigation/sidebar-config';
import { cn } from '@/lib/utils';

export type { NavItemId };

const SIDEBAR_COLLAPSED_KEY = 'stake-planner-sidebar-collapsed';

const NAV_ICONS: Record<NavItemId, ReactNode> = {
  create: <Sparkles className="h-4 w-4" />,
  session: <PlayCircle className="h-4 w-4" />,
  history: <History className="h-4 w-4" />,
  improve: <Zap className="h-4 w-4" />,
  continue: <CirclePlay className="h-4 w-4" />,
  simulation: <Dices className="h-4 w-4" />,
  allocation: <Users className="h-4 w-4" />,
  game: <Gamepad2 className="h-4 w-4" />,
  settings: <Settings className="h-4 w-4" />,
  guide: <HelpCircle className="h-4 w-4" />,
};

export interface AppLayoutProps {
  readonly activeNav: NavItemId;
  readonly onNavSelect: (id: NavItemId) => void;
  readonly hasActivePlan: boolean;
  readonly theme: 'light' | 'dark';
  readonly onThemeChange: (dark: boolean) => void;
  readonly main: ReactNode;
  readonly rightPanel: ReactNode;
  readonly showRightPanel?: boolean;
}

export function AppLayout({
  activeNav,
  onNavSelect,
  hasActivePlan,
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

  const sidebarContext = resolveSidebarContext(hasActivePlan);
  const sections = useMemo(
    () => buildSidebarSections(sidebarContext, NAV_ICONS),
    [sidebarContext],
  );

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0');
  }, [collapsed]);

  function renderNavButton(item: NavItem, active: boolean, compact: boolean): ReactNode {
    const tooltipLabel =
      item.badge !== undefined ? `${item.label} (${item.badge === 'beta' ? 'Beta' : 'Soon'})` : item.label;

    const button = (
      <button
        type="button"
        onClick={() => {
          setMobileOpen(false);
          onNavSelect(item.id);
        }}
        className={cn(
          'flex w-full items-center rounded-lg text-sm font-medium transition-colors',
          compact ? 'justify-center p-2' : 'gap-2 px-2.5 py-2',
          active ? 'bg-accent text-accent-foreground' : 'text-foreground hover:bg-muted',
          item.emphasized && !active && 'ring-1 ring-primary/30',
        )}
      >
        <span className="relative shrink-0">
          {item.icon}
          {compact && item.badge !== undefined ? (
            <span
              className={cn(
                'absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full',
                item.badge === 'beta' ? 'bg-primary' : 'bg-muted-foreground',
              )}
              aria-hidden
            />
          ) : null}
        </span>
        {!compact ? (
          <span className="flex min-w-0 flex-1 items-center justify-between gap-1">
            <span className="truncate text-xs">{item.label}</span>
            {item.badge !== undefined ? <NavBadgePill badge={item.badge} /> : null}
          </span>
        ) : null}
      </button>
    );

    return compact ? <Tooltip content={tooltipLabel}>{button}</Tooltip> : button;
  }

  const sidebarInner = (compact: boolean): ReactNode => (
    <>
      <div className={cn('mb-3', compact ? 'flex justify-center' : 'space-y-1')}>
        {compact ? (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BarChart3 className="h-4 w-4" />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 pr-8">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <BarChart3 className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-bold">Stake Planner</p>
                  <NavBadgePill badge="beta" />
                </div>
                <p className="truncate text-[11px] text-muted-foreground">
                  Manage your betting sessions
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-3 hidden h-7 w-7 lg:inline-flex"
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

      <nav className="scrollbar-none flex flex-1 flex-col gap-2 overflow-y-auto">
        {sections.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            {sectionIndex > 0 ? <Separator className="mb-2" /> : null}
            <div className="flex flex-col gap-0.5">
              {section.items.map((item) => (
                <div key={item.id}>{renderNavButton(item, activeNav === item.id, compact)}</div>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className={cn('mt-3 border-t border-border pt-3', compact && 'flex flex-col items-center')}>
        <Tooltip content={isDark ? 'Chế độ sáng' : 'Chế độ tối'}>
          <button
            type="button"
            className={cn(
              'inline-flex items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
              compact ? 'p-2' : 'gap-2 px-2.5 py-2 text-xs',
            )}
            onClick={() => onThemeChange(!isDark)}
            aria-label="Đổi theme"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {!compact ? <span>Dark Mode</span> : null}
          </button>
        </Tooltip>
        {!compact ? (
          <div className="mt-2 flex items-center gap-2 px-2.5">
            <NavBadgePill badge="beta" />
            <span className="text-[10px] text-muted-foreground">Preview</span>
          </div>
        ) : null}
      </div>
    </>
  );

  return (
    <TooltipProvider>
      <div className={cn('flex h-screen flex-col overflow-hidden bg-background', isDark && 'dark')}>
        <header className="flex h-11 shrink-0 items-center border-b border-border bg-card px-3 sm:px-4 lg:hidden">
          <button
            type="button"
            className="rounded-md border border-border px-1.5 py-0.5 text-sm"
            onClick={() => setMobileOpen(true)}
            aria-label="Mở menu"
          >
            ☰
          </button>
          <h1 className="ml-2 flex items-center gap-2 text-sm font-semibold">
            Stake Planner
            <NavBadgePill badge="beta" />
          </h1>
        </header>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <aside
            className={cn(
              'fixed inset-y-0 left-0 z-40 flex w-56 -translate-x-full flex-col border-r border-border bg-card p-3 pt-12 transition-transform lg:hidden',
              mobileOpen && 'translate-x-0',
            )}
          >
            {sidebarInner(false)}
          </aside>

          <aside
            className={cn(
              'relative hidden shrink-0 flex-col border-r border-border bg-card p-3 lg:flex',
              collapsed ? 'w-14' : 'w-60',
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
              key={`${activeNav}`}
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
