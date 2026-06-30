import { useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { requestNotificationPermission } from '@/features/notifications/browser-notification';
import type { NotificationPreferences } from '@/features/notifications/notification-types';
import { DesignPlayground } from '@/design/playground/DesignPlayground';
import { useServices } from '@/services/registry/AppServicesProvider';

interface SettingsScreenProps {
  readonly theme: 'light' | 'dark';
  readonly onThemeChange: (dark: boolean) => void;
  readonly notificationPreferences?: NotificationPreferences;
  readonly onNotificationPreferencesChange?: (prefs: Partial<NotificationPreferences>) => void;
  readonly onExportHistory?: () => void;
}

export function SettingsScreen({
  theme,
  onThemeChange,
  notificationPreferences,
  onNotificationPreferencesChange,
  onExportHistory,
}: SettingsScreenProps): ReactNode {
  const { config } = useServices();
  const isDark = theme === 'dark';
  const [showPlayground, setShowPlayground] = useState(false);

  if (showPlayground) {
    return (
      <div className="w-full">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={() => {
            setShowPlayground(false);
          }}
        >
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
        <p className="mt-1 text-sm text-muted-foreground">
          Tùy chỉnh giao diện và định dạng hiển thị.
        </p>
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
              onClick={() => {
                onThemeChange(false);
              }}
            >
              Sáng
            </Button>
            <Button
              variant={isDark ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                onThemeChange(true);
              }}
            >
              Tối
            </Button>
          </div>
        </CardContent>
      </Card>

      {notificationPreferences !== undefined && onNotificationPreferencesChange !== undefined ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Thông báo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <PreferenceToggle
              label="Trúng thưởng"
              checked={notificationPreferences.win}
              onChange={(v) => {
                onNotificationPreferencesChange({ win: v });
              }}
            />
            <PreferenceToggle
              label="Còn N kỳ"
              checked={notificationPreferences.remaining}
              onChange={(v) => {
                onNotificationPreferencesChange({ remaining: v });
              }}
            />
            <PreferenceToggle
              label="Collector"
              checked={notificationPreferences.collector}
              onChange={(v) => {
                onNotificationPreferencesChange({ collector: v });
              }}
            />
            <PreferenceToggle
              label="Khuyến nghị mới"
              checked={notificationPreferences.recommendation}
              onChange={(v) => {
                onNotificationPreferencesChange({ recommendation: v });
              }}
            />
            <PreferenceToggle
              label="Âm thanh"
              checked={notificationPreferences.sound}
              onChange={(v) => {
                onNotificationPreferencesChange({ sound: v });
              }}
            />
            <PreferenceToggle
              label="Desktop notification"
              checked={notificationPreferences.desktop}
              onChange={(v) => {
                onNotificationPreferencesChange({ desktop: v });
                if (v) {
                  void requestNotificationPermission();
                }
              }}
            />
          </CardContent>
        </Card>
      ) : null}

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
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowPlayground(true);
              }}
            >
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

function PreferenceToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}): ReactNode {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => {
          onChange(e.target.checked);
        }}
        className="h-4 w-4 accent-primary"
      />
    </label>
  );
}
