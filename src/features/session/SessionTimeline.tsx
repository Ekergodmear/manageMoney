import type { SessionTimelineEvent } from '@/features/session/session-domain';
import { formatSessionTime } from '@/features/session/session-domain';
import { cn } from '@/lib/utils';
import {
  Check,
  Circle,
  Flag,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
} from 'lucide-react';
import type { ReactNode } from 'react';

export type TimelineNavigateTarget =
  | { readonly kind: 'plan'; readonly planId: string }
  | { readonly kind: 'round'; readonly roundIndex: number };

const ICONS: Partial<Record<SessionTimelineEvent['type'], ReactNode>> = {
  'session-created': <Circle className="h-3.5 w-3.5" />,
  'plan-added': <Circle className="h-3.5 w-3.5" />,
  'plan-started': <Play className="h-3.5 w-3.5" />,
  bet: <Check className="h-3.5 w-3.5" />,
  undo: <RotateCcw className="h-3.5 w-3.5" />,
  'plan-won': <Trophy className="h-3.5 w-3.5" />,
  'session-won': <Trophy className="h-3.5 w-3.5" />,
  'plan-lost': <Flag className="h-3.5 w-3.5" />,
  'session-stopped': <Flag className="h-3.5 w-3.5" />,
  improve: <Sparkles className="h-3.5 w-3.5" />,
  continue: <Play className="h-3.5 w-3.5" />,
  'note-updated': <Circle className="h-3.5 w-3.5" />,
};

function labelForEvent(event: SessionTimelineEvent): string {
  if (event.label !== undefined && event.label !== '') {
    if (event.type === 'bet' && event.roundIndex !== undefined) {
      return `Vòng ${String(event.roundIndex)}`;
    }
    return event.label;
  }
  if (event.type === 'bet' && event.roundIndex !== undefined) {
    return `Vòng ${String(event.roundIndex)}`;
  }
  const defaults: Partial<Record<SessionTimelineEvent['type'], string>> = {
    'session-created': 'Session tạo',
    'plan-added': 'Generate',
    'plan-started': 'Bắt đầu chơi',
    bet: 'Đã cược',
    undo: 'Hoàn tác',
    'plan-won': 'Plan thắng',
    'session-won': 'Thắng',
    'plan-lost': 'Plan thua',
    'session-stopped': 'Dừng session',
    improve: 'Cải thiện',
    continue: 'Continue',
    'note-updated': 'Ghi chú',
  };
  return defaults[event.type] ?? event.type.replace(/-/g, ' ');
}

function navigateTargetForEvent(event: SessionTimelineEvent): TimelineNavigateTarget | null {
  if (event.type === 'bet' && event.roundIndex !== undefined) {
    return { kind: 'round', roundIndex: event.roundIndex };
  }
  if (
    event.planId !== undefined &&
    (event.type === 'plan-added' ||
      event.type === 'plan-started' ||
      event.type === 'continue' ||
      event.type === 'improve' ||
      event.type === 'plan-won' ||
      event.type === 'plan-lost')
  ) {
    return { kind: 'plan', planId: event.planId };
  }
  return null;
}

interface SessionTimelineProps {
  readonly events: readonly SessionTimelineEvent[];
  readonly compact?: boolean;
  readonly variant?: 'horizontal' | 'vertical';
  readonly maxItems?: number;
  readonly onNavigate?: (target: TimelineNavigateTarget) => void;
}

function EventBody({
  event,
  onNavigate,
}: {
  event: SessionTimelineEvent;
  onNavigate?: (target: TimelineNavigateTarget) => void;
}): ReactNode {
  const target = navigateTargetForEvent(event);
  const clickable = target !== null && onNavigate !== undefined;
  const content = (
    <>
      <p className="font-mono text-xs text-muted-foreground">{formatSessionTime(event.at)}</p>
      <p className={cn('text-sm font-medium', clickable && 'group-hover:text-primary')}>
        {labelForEvent(event)}
      </p>
      {event.betAmount !== undefined ? (
        <p className="text-xs text-muted-foreground">
          {event.betAmount.toLocaleString('vi-VN')} đ
        </p>
      ) : null}
    </>
  );

  if (!clickable || target === null) {
    return <div className="pb-5 pt-0.5">{content}</div>;
  }

  return (
    <button
      type="button"
      className="group pb-5 pt-0.5 text-left transition-colors hover:opacity-90"
      onClick={() => onNavigate(target)}
    >
      {content}
    </button>
  );
}

export function SessionTimeline({
  events,
  compact = false,
  variant = 'horizontal',
  maxItems,
  onNavigate,
}: SessionTimelineProps): ReactNode {
  const ordered = [...events].reverse();
  const limit = maxItems ?? (compact ? 6 : ordered.length);
  const visible = ordered.slice(0, limit).reverse();

  if (visible.length === 0) {
    return <p className="text-xs text-muted-foreground">Chưa có sự kiện.</p>;
  }

  if (variant === 'vertical') {
    return (
      <ol className="space-y-0">
        {visible.map((event, index) => (
          <li key={`${event.at}-${event.type}-${String(index)}`} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border',
                  (event.type === 'session-won' || event.type === 'plan-won') &&
                    'border-success bg-success/15 text-success',
                  (event.type === 'plan-lost' || event.type === 'session-stopped') &&
                    'border-muted-foreground/30 bg-muted',
                  event.type !== 'session-won' &&
                    event.type !== 'plan-won' &&
                    event.type !== 'plan-lost' &&
                    event.type !== 'session-stopped' &&
                    'border-border bg-card',
                )}
              >
                {ICONS[event.type] ?? <Circle className="h-3.5 w-3.5" />}
              </span>
              {index < visible.length - 1 ? (
                <span className="my-1 w-px flex-1 min-h-[20px] bg-border" aria-hidden />
              ) : null}
            </div>
            <EventBody event={event} onNavigate={onNavigate} />
          </li>
        ))}
      </ol>
    );
  }

  return (
    <div className="overflow-x-auto">
      <ol className="flex min-w-max items-center gap-0">
        {visible.map((event, index) => {
          const target = navigateTargetForEvent(event);
          const clickable = target !== null && onNavigate !== undefined;
          return (
            <li key={`${event.at}-${event.type}-${String(index)}`} className="flex items-center">
              {clickable && target !== null ? (
                <button
                  type="button"
                  onClick={() => onNavigate(target)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors hover:border-primary/50',
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
                  <span className="text-muted-foreground">
                    {ICONS[event.type] ?? <Circle className="h-3 w-3" />}
                  </span>
                  <span className="whitespace-nowrap font-medium">{labelForEvent(event)}</span>
                </button>
              ) : (
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
                  <span className="text-muted-foreground">
                    {ICONS[event.type] ?? <Circle className="h-3 w-3" />}
                  </span>
                  <span className="whitespace-nowrap font-medium">{labelForEvent(event)}</span>
                </div>
              )}
              {index < visible.length - 1 ? (
                <span className="mx-1 text-muted-foreground" aria-hidden>
                  ↓
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
