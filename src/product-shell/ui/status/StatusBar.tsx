import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';
import type { StatusSegmentSnapshot, StatusTone } from '@/product-shell/ui/status/status-types';
import { useBuildStatus } from '@/product-shell/ui/status/BuildStatusProvider';
import { useCloudStatus } from '@/product-shell/ui/status/CloudStatusProvider';
import { useCollectorStatus } from '@/product-shell/ui/status/CollectorStatusProvider';
import { useSessionStatus } from '@/product-shell/ui/status/SessionStatusProvider';
import { useShell } from '@/product-shell/ui/shell-context';

const TONE_CLASS: Record<StatusTone, string> = {
  ok: 'text-emerald-600 dark:text-emerald-400',
  warning: 'text-amber-600 dark:text-amber-400',
  error: 'text-red-600 dark:text-red-400',
  disabled: 'text-muted-foreground',
  neutral: 'text-foreground',
};

function StatusSegment({ segment }: { readonly segment: StatusSegmentSnapshot }): ReactNode {
  const tone = segment.tone ?? 'neutral';
  const content = (
    <>
      <span className={cn('font-medium', TONE_CLASS[tone])}>{segment.label}</span>
      {segment.detail !== undefined ? (
        <span className="text-muted-foreground"> · {segment.detail}</span>
      ) : null}
    </>
  );

  if (segment.onClick === undefined) {
    return <span className="inline-flex items-center text-xs">{content}</span>;
  }

  return (
    <button
      type="button"
      className="inline-flex items-center rounded px-1.5 py-0.5 text-xs transition-colors hover:bg-muted"
      onClick={segment.onClick}
    >
      {content}
    </button>
  );
}

export function StatusBar(): ReactNode {
  const collector = useCollectorStatus();
  const cloud = useCloudStatus();
  const session = useSessionStatus();
  const build = useBuildStatus();
  const { openPalette } = useShell();

  const segments = [collector, session, cloud, build];

  return (
    <footer
      className="flex shrink-0 items-center justify-between gap-3 border-t border-border bg-card/95 px-3 py-1.5 text-xs sm:px-4"
      aria-label="Application status"
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        {segments.map((segment, index) => (
          <span key={segment.id} className="inline-flex items-center gap-2">
            {index > 0 ? <span className="text-muted-foreground">·</span> : null}
            <StatusSegment segment={segment} />
          </span>
        ))}
      </div>
      <button
        type="button"
        className="shrink-0 rounded border border-border px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        onClick={openPalette}
      >
        Ctrl+K
      </button>
    </footer>
  );
}
