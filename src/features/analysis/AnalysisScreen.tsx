import type { ReactNode } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function AnalysisScreen(): ReactNode {
  return (
    <div className="w-full space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Phân tích</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Mô phỏng, cải thiện kế hoạch và thống kê phiên.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mô phỏng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Nếu thắng vòng 30 → lời 100.000 · ROI …</p>
            <p>Nếu thắng vòng 200 → …</p>
            <p>Nếu thắng vòng 500 → …</p>
            <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs">
              Slider chọn vòng thắng — cập nhật realtime
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cải thiện kế hoạch</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-muted-foreground">Thiếu vốn 25 triệu? Chọn phương án phù hợp:</p>
            <div className="rounded-lg border border-border p-3">
              <p className="font-medium">Phương án A — 400 vòng</p>
              <p className="text-muted-foreground">Cần ~31 triệu</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="font-medium">Phương án B — 350 vòng</p>
              <p className="text-muted-foreground">Cần ~27 triệu</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="font-medium">Phương án C — 300 vòng</p>
              <p className="text-muted-foreground">Cần ~22 triệu</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thống kê tổng quan</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-4 text-sm">
          <div><p className="text-muted-foreground">Tổng phiên</p><p className="text-xl font-bold">—</p></div>
          <div><p className="text-muted-foreground">Thắng</p><p className="text-xl font-bold">—</p></div>
          <div><p className="text-muted-foreground">Thua</p><p className="text-xl font-bold">—</p></div>
          <div><p className="text-muted-foreground">ROI</p><p className="text-xl font-bold">—</p></div>
        </CardContent>
      </Card>
    </div>
  );
}
