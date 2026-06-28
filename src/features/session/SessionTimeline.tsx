import { Check, Circle, Flag, Play, RotateCcw, Sparkles, Trophy } from 'lucide-react';
import type { ReactNode } from 'react';

import type { SessionTimelineEvent } from '@/features/session/session-domain';
import { cn } from '@/lib/utils';

const ICONS: Partial<Record<SessionTimelineEvent['type'], ReactNode>> = {
  'session-created': <Circle className="h-3 w-3" />,
  'plan-added': <Circle className="h-3 w-3" />,
  'plan-started': <Play className="h-3 w-3" />,
  bet: <Check className="h-3 w-3" />,
  undo: <RotateCcw className="h-3 w-3" />,
  'plan-won': <Trophy className="h-3 w-3" />,
  'session-won': <Trophy className="h-3 w-3" />,
  'plan-lost': <Flag className="h-3 w-3" />,
  'session-stopped': <Flag className="h-3 w-3" />,
  improve: <Sparkles className="h-3 w-3" />,
  continue: <Play className="h-3 w-3" />,
  'note-updated': <Circle className="h-3 w-3" />,
};

function labelForEvent(event: SessionTimelineEvent): string {
  if (event.label !== undefined) {
    return event.label;
  }
  return event.type.replace(/-/g, ' ');
}

interface SessionTimelineProps {
  readonly events: readonly SessionTimelineEvent[];
  readonly compact?: boolean;
}

export function SessionTimeline({ events, compact = false }: SessionTimelineProps): ReactNode {
  const visible = compact ? events.slice(-6) : events;

  if (visible.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto">
      <ol className="flex min-w-max items-center gap-0">
        {visible.map((event, index) => (
          <li key={`${event.at}-${event.type}-${String(index)}`} className="flex items-center">
            <div
              className={cn(
                'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs',
                (event.type === 'session-won' || event.type === 'plan-won') &&
                  'border-success bg-success/20 text-success-foreground',
                (event.type === 'plan-lost' || event.type === 'session-stopped') &&
                  'border-muted-foreground/30 bg-muted',
                event.type !== 'session-won' &&
                  event.type !== 'plan-won' &&
                  event.type !== 'plan-lost' &&
                  event.type !== 'session-stopped' &&
                  'border-border bg-card',
              )}
            >
              <span className="text-muted-foreground">{ICONS[event.type] ?? <Circle className="h-3 w-3" />}</span>
              <span className="whitespace-nowrap font-medium">{labelForEvent(event)}</span>
            </div>
            {index < visible.length - 1 ? (
              <span className="mx-1 text-muted-foreground" aria-hidden>
                ↓
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
