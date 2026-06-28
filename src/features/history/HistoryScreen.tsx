import type { ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function HistoryScreen(): ReactNode {
  const items = [
    { label: '500 vòng', status: 'Thắng', period: 'Tháng này' },
    { label: '100 vòng', status: 'Thua', period: 'Tháng này' },
    { label: '200 vòng', status: 'Đã hủy', period: 'Tháng trước' },
  ] as const;

  return (
    <div className="w-full space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Lịch sử</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Xem lại phiên đã chơi — lọc theo kết quả, mở lại hoặc xuất.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {['Tất cả', 'Thắng', 'Thua', 'Đã hủy'].map((f) => (
          <Badge key={f} variant={f === 'Tất cả' ? 'default' : 'outline'} className="cursor-pointer">
            {f}
          </Badge>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tháng này</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              className="flex w-full items-center justify-between py-3 text-left text-sm hover:bg-muted/30"
            >
              <span className="font-medium">{item.label}</span>
              <Badge variant="outline">{item.status}</Badge>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
