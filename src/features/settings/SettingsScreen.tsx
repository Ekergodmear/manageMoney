import { useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { DesignPlayground } from '@/design/playground/DesignPlayground';
import { useServices } from '@/services/registry/AppServicesProvider';

interface SettingsScreenProps {
  readonly theme: 'light' | 'dark';
  readonly onThemeChange: (dark: boolean) => void;
  readonly onExportHistory?: () => void;
}

export function SettingsScreen({ theme, onThemeChange, onExportHistory }: SettingsScreenProps): ReactNode {
  const { config } = useServices();
  const isDark = theme === 'dark';
  const [showPlayground, setShowPlayground] = useState(false);

  if (showPlayground) {
    return (
      <div className="w-full">
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => setShowPlayground(false)}>
          ← Cài đặt
        </Button>
        <DesignPlayground />
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg space-y-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Cài đặt</h2>
        <p className="mt-1 text-sm text-muted-foreground">Tùy chỉnh giao diện và định dạng hiển thị.</p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Giao diện</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label className="text-sm text-muted-foreground">Theme</Label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={!isDark ? 'default' : 'outline'}
              size="sm"
              onClick={() => onThemeChange(false)}
            >
              Sáng
            </Button>
            <Button
              variant={isDark ? 'default' : 'outline'}
              size="sm"
              onClick={() => onThemeChange(true)}
            >
              Tối
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Dữ liệu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Phiên được lưu tự động trên trình duyệt (IndexedDB). Chỉnh luật game tại{' '}
            <strong className="text-foreground">Game Designer</strong>.
          </p>
          {onExportHistory !== undefined ? (
            <Button variant="outline" size="sm" onClick={onExportHistory}>
              Xuất lịch sử JSON
            </Button>
          ) : null}
        </CardContent>
      </Card>

      {config.developer.showDesignPlayground ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Design System</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Xem nhanh component và token trước khi rollout workspace mới.
            </p>
            <Button variant="outline" size="sm" onClick={() => setShowPlayground(true)}>
              Mở Design Playground
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-dashed opacity-80">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-muted-foreground">Sắp có</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-muted-foreground">
          <p>Ngôn ngữ · Định dạng số · PDF · Excel</p>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Stake Planner v{config.build.buildVersion} · {config.build.commitHash.slice(0, 7)} · Built{' '}
        {config.build.buildDate}
      </p>
    </div>
  );
}
