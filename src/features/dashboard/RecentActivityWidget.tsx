import type { ReactNode } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AppNotification } from '@/features/notifications/notification-types';

interface RecentActivityWidgetProps {
  readonly notifications: readonly AppNotification[];
  readonly onOpenNotifications?: () => void;
}

export function RecentActivityWidget({
  notifications,
  onOpenNotifications,
}: RecentActivityWidgetProps): ReactNode {
  const recent = notifications.slice(0, 6);

  if (recent.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-semibold">Hoạt động gần đây</CardTitle>
        {onOpenNotifications !== undefined ? (
          <button
            type="button"
            className="text-xs text-primary hover:underline"
            onClick={onOpenNotifications}
          >
            Tất cả
          </button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-2 p-4 pt-0">
        {recent.map((n) => (
          <div key={n.id} className="flex items-start gap-2 text-sm">
            <span>{n.emoji}</span>
            <div className="min-w-0">
              <p className="font-medium leading-tight">{n.title}</p>
              <p className="text-xs text-muted-foreground">{n.body}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
