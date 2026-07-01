import { lazy, type ReactNode } from 'react';

/** Deferred workspaces — not on the default planning/session path. */
export const LazyDashboardScreen = lazy(() =>
  import('@/features/dashboard/DashboardScreen').then((module) => ({
    default: module.DashboardScreen,
  })),
);

export const LazyGameMonitorScreen = lazy(() =>
  import('@/features/game-monitor/GameMonitorScreen').then((module) => ({
    default: module.GameMonitorScreen,
  })),
);

export const LazyGameDesignerScreen = lazy(() =>
  import('@/features/game-designer/GameDesignerScreen').then((module) => ({
    default: module.GameDesignerScreen,
  })),
);

export const LazyInsightsScreen = lazy(() =>
  import('@/features/insights/InsightsScreen').then((module) => ({
    default: module.InsightsScreen,
  })),
);

export const LazySessionLibraryScreen = lazy(() =>
  import('@/features/library/SessionLibraryScreen').then((module) => ({
    default: module.SessionLibraryScreen,
  })),
);

export const LazyAllocationScreen = lazy(() =>
  import('@/features/allocation/AllocationScreen').then((module) => ({
    default: module.AllocationScreen,
  })),
);

export const LazySettingsScreen = lazy(() =>
  import('@/features/settings/SettingsScreen').then((module) => ({
    default: module.SettingsScreen,
  })),
);

export const LazyDiagnosticsPage = lazy(() =>
  import('@/product-shell/ui/diagnostics/DiagnosticsPage').then((module) => ({
    default: module.DiagnosticsPage,
  })),
);

export function WorkspaceLoadingFallback(): ReactNode {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
      Đang tải…
    </div>
  );
}
