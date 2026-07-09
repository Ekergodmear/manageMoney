import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { DiagnosticCapability, DiagnosticSnapshot } from '@/product-shell/types/diagnostics';
import {
  SEVERITY_BADGE_CLASS,
  SEVERITY_PANEL_CLASS,
  SEVERITY_TEXT_CLASS,
} from '@/product-shell/ui/diagnostics/severity-styles';

export interface DiagnosticCardProps {
  readonly capability: DiagnosticCapability;
  readonly snapshot: DiagnosticSnapshot | undefined;
  readonly refreshing: boolean;
  readonly onRefresh: () => void;
}

export function DiagnosticCard({
  capability,
  snapshot,
  refreshing,
  onRefresh,
}: DiagnosticCardProps): ReactNode {
  const severity = snapshot?.severity ?? 'info';
  const summary = snapshot?.summary ?? 'Not checked yet';

  return (
    <section
      className={cn('rounded-lg border p-4', SEVERITY_PANEL_CLASS[severity])}
      aria-label={capability.title}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">{capability.title}</h2>
            <span
              className={cn(
                'rounded px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide',
                SEVERITY_BADGE_CLASS[severity],
              )}
            >
              {severity}
            </span>
          </div>
          <p className={cn('mt-1 text-sm', SEVERITY_TEXT_CLASS[severity])}>{summary}</p>
        </div>
        <Button type="button" size="sm" variant="outline" disabled={refreshing} onClick={onRefresh}>
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </Button>
      </div>

      {snapshot !== undefined && snapshot.rows.length > 0 ? (
        <dl className="grid gap-2 sm:grid-cols-2">
          {snapshot.rows.map((row) => (
            <div key={`${row.label}-${row.value}`} className="rounded-md border border-border/60 bg-background/60 px-3 py-2">
              <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{row.label}</dt>
              <dd className="text-sm text-foreground">{row.value}</dd>
              {row.hint !== undefined ? (
                <dd className="text-xs text-muted-foreground">{row.hint}</dd>
              ) : null}
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  );
}
