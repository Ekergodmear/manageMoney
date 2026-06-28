import type { ReactNode } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function AllocationScreen(): ReactNode {
  return (
    <div className="w-full space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Phân bổ tài khoản</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tự động chia kế hoạch cho nhiều tài khoản khi có thuế hoặc giới hạn.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">2 tài khoản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="rounded-lg border border-border p-3">
              <p className="font-medium">Account A</p>
              <p className="text-muted-foreground">Vòng 1 → 250</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="font-medium">Account B</p>
              <p className="text-muted-foreground">Vòng 251 → 500</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Theo thuế</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="rounded-lg border border-border p-3">
              <p className="font-medium">Account A</p>
              <p className="text-muted-foreground">Vòng 1 → 320</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="font-medium">Account B</p>
              <p className="text-muted-foreground">Vòng 321 → 500</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
