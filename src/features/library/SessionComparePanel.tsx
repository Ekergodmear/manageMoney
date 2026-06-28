import { X } from 'lucide-react';
import type { ReactNode } from 'react';

import type { SessionCompareResult } from '@/features/library/library-types';
import { cn } from '@/lib/utils';

interface SessionComparePanelProps {
  readonly result: SessionCompareResult;
  readonly onClose: () => void;
}

export function SessionComparePanel({ result, onClose }: SessionComparePanelProps): ReactNode {
  return (
    <>
      <button
        type="button"
        aria-label="Đóng so sánh"
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-card shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              So sánh session
            </p>
            <p className="mt-1 text-sm font-semibold leading-snug">
              {result.leftTitle}
              <span className="mx-1.5 font-normal text-muted-foreground">vs</span>
              {result.rightTitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="pb-2 text-left font-medium">Metric</th>
                <th className="pb-2 text-right font-medium">{shortTitle(result.leftTitle)}</th>
                <th className="pb-2 text-right font-medium">{shortTitle(result.rightTitle)}</th>
                <th className="pb-2 text-right font-medium">Δ</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row) => (
                <tr key={row.id} className="border-b border-border/50 last:border-0">
                  <td className="py-2.5 text-muted-foreground">{row.label}</td>
                  <td className="py-2.5 text-right tabular-nums font-medium">{row.values[0]}</td>
                  <td className="py-2.5 text-right tabular-nums font-medium">{row.values[1]}</td>
                  <td
                    className={cn(
                      'py-2.5 text-right tabular-nums text-xs font-semibold',
                      row.delta.startsWith('+') && 'text-emerald-600 dark:text-emerald-400',
                      row.delta.startsWith('−') && 'text-red-600 dark:text-red-400',
                      row.delta === '—' && 'text-muted-foreground',
                    )}
                  >
                    {row.delta}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </aside>
    </>
  );
}

function shortTitle(title: string): string {
  if (title.length <= 10) {
    return title;
  }
  return `${title.slice(0, 8)}…`;
}
