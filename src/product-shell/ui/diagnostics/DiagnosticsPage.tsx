import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { DiagnosticCard } from '@/product-shell/ui/diagnostics/DiagnosticCard';
import { useDiagnostics } from '@/product-shell/ui/diagnostics/DiagnosticsProvider';

export function DiagnosticsPage(): ReactNode {
  const { capabilities, snapshots, refreshing, refreshCapability, refreshAll } = useDiagnostics();
  const anyRefreshing = Object.values(refreshing).some(Boolean);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Diagnostics</h1>
          <p className="text-sm text-muted-foreground">Operational health across Product Shell capabilities.</p>
        </div>
        <Button type="button" variant="outline" disabled={anyRefreshing} onClick={() => void refreshAll()}>
          {anyRefreshing ? 'Refreshing…' : 'Refresh All'}
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {capabilities.map((capability) => (
          <DiagnosticCard
            key={capability.id}
            capability={capability}
            snapshot={snapshots[capability.id]}
            refreshing={refreshing[capability.id] === true}
            onRefresh={() => {
              void refreshCapability(capability.id);
            }}
          />
        ))}
      </div>
    </div>
  );
}
