import { Check, Circle, Flag, Play, RotateCcw, Trophy } from 'lucide-react';
import type { ReactNode } from 'react';

import type { SessionTimelineEvent } from '@/features/session/session-types';
import { cn } from '@/lib/utils';

const ICONS: Record<SessionTimelineEvent['type'], ReactNode> = {
  generated: <Circle className="h-3 w-3" />,
  started: <Play className="h-3 w-3" />,
  bet: <Check className="h-3 w-3" />,
  undo: <RotateCcw className="h-3 w-3" />,
  won: <Trophy className="h-3 w-3" />,
  lost: <Flag className="h-3 w-3" />,
  continued: <Play className="h-3 w-3" />,
  finished: <Flag className="h-3 w-3" />,
};

function labelForEvent(event: SessionTimelineEvent): string {
  if (event.label !== undefined) {
    return event.label;
  }
  switch (event.type) {
    case 'generated':
      return 'Đã tạo kế hoạch';
    case 'started':
      return 'Bắt đầu phiên';
    case 'bet':
      return event.roundIndex !== undefined && event.betAmount !== undefined
        ? `Cược vòng ${String(event.roundIndex)} · ${event.betAmount.toLocaleString('vi-VN')} đ`
        : 'Đã cược';
    case 'undo':
      return 'Hoàn tác cược';
    case 'won':
      return 'Thắng — kết thúc phiên';
    case 'lost':
      return 'Hết vòng — không trúng';
    case 'continued':
      return 'Tiếp tục kế hoạch';
    case 'finished':
      return 'Hoàn thành';
    default:
      return event.type;
  }
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
                event.type === 'won' && 'border-success bg-success/20 text-success-foreground',
                event.type === 'lost' && 'border-muted-foreground/30 bg-muted',
                event.type !== 'won' && event.type !== 'lost' && 'border-border bg-card',
              )}
            >
              <span className="text-muted-foreground">{ICONS[event.type]}</span>
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
