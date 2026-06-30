import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import type { AppNotification } from '@/features/notifications/notification-types';
import { cn } from '@/lib/utils';

interface NotificationBellProps {
  readonly notifications: readonly AppNotification[];
  readonly unreadCount: number;
  readonly onMarkRead: (id: string) => void;
  readonly onMarkAllRead: () => void;
  readonly onClearAll: () => void;
  readonly onOpenSession?: (sessionId: string) => void;
}

export function NotificationBell({
  notifications,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
  onClearAll,
  onOpenSession,
}: NotificationBellProps): ReactNode {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (panelRef.current !== null && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label="Thông báo"
        onClick={() => {
          setOpen((v) => !v);
        }}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-border bg-card shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <p className="text-sm font-semibold">Thông báo</p>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onMarkAllRead}
                title="Đánh dấu đã đọc"
              >
                <CheckCheck className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onClearAll}
                title="Xóa tất cả"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                Chưa có thông báo.
              </p>
            ) : (
              notifications.slice(0, 30).map((n) => (
                <button
                  key={n.id}
                  type="button"
                  className={cn(
                    'flex w-full gap-2 border-b border-border/50 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/50',
                    !n.read && 'bg-primary/5',
                  )}
                  onClick={() => {
                    onMarkRead(n.id);
                    if (n.sessionId !== undefined && onOpenSession !== undefined) {
                      onOpenSession(n.sessionId);
                      setOpen(false);
                    }
                  }}
                >
                  <span className="text-base leading-none">{n.emoji}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{n.title}</span>
                    <span className="block text-xs text-muted-foreground">{n.body}</span>
                    <span className="mt-0.5 block text-[10px] text-muted-foreground">
                      {formatRelative(n.createdAt)}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const diffMin = Math.floor((Date.now() - then) / 60_000);
  if (diffMin < 1) {
    return 'Vừa xong';
  }
  if (diffMin < 60) {
    return `${String(diffMin)} phút trước`;
  }
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) {
    return `${String(diffHours)} giờ trước`;
  }
  return new Date(iso).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' });
}
