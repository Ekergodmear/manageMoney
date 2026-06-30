import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type {
  DiagnosticCapability,
  DiagnosticSnapshot,
} from '@/product-shell/types/diagnostics';

export interface DiagnosticsContextValue {
  readonly capabilities: readonly DiagnosticCapability[];
  readonly snapshots: Readonly<Record<string, DiagnosticSnapshot | undefined>>;
  readonly refreshing: Readonly<Record<string, boolean>>;
  readonly refreshCapability: (id: string) => Promise<void>;
  readonly refreshAll: () => Promise<void>;
}

const DiagnosticsContext = createContext<DiagnosticsContextValue | null>(null);

export interface DiagnosticsProviderProps {
  readonly capabilities: readonly DiagnosticCapability[];
  readonly children: ReactNode;
}

export function DiagnosticsProvider({
  capabilities,
  children,
}: DiagnosticsProviderProps): ReactNode {
  const [snapshots, setSnapshots] = useState<Record<string, DiagnosticSnapshot | undefined>>({});
  const [refreshing, setRefreshing] = useState<Record<string, boolean>>({});

  const refreshCapability = useCallback(
    async (id: string): Promise<void> => {
      const capability = capabilities.find((entry) => entry.id === id);
      if (capability === undefined) {
        return;
      }
      setRefreshing((current) => ({ ...current, [id]: true }));
      try {
        const snapshot = await capability.refresh();
        setSnapshots((current) => ({ ...current, [id]: snapshot }));
      } catch {
        setSnapshots((current) => ({
          ...current,
          [id]: {
            status: 'error',
            severity: 'critical',
            summary: 'Refresh failed',
            rows: [{ label: 'Capability', value: capability.title }],
            checkedAt: new Date().toISOString(),
          },
        }));
      } finally {
        setRefreshing((current) => ({ ...current, [id]: false }));
      }
    },
    [capabilities],
  );

  const refreshAll = useCallback(async (): Promise<void> => {
    await Promise.all(capabilities.map((capability) => refreshCapability(capability.id)));
  }, [capabilities, refreshCapability]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  const value = useMemo(
    () => ({
      capabilities,
      snapshots,
      refreshing,
      refreshCapability,
      refreshAll,
    }),
    [capabilities, refreshAll, refreshCapability, refreshing, snapshots],
  );

  return <DiagnosticsContext.Provider value={value}>{children}</DiagnosticsContext.Provider>;
}

export function useDiagnostics(): DiagnosticsContextValue {
  const context = useContext(DiagnosticsContext);
  if (context === null) {
    throw new Error('useDiagnostics must be used within DiagnosticsProvider');
  }
  return context;
}
