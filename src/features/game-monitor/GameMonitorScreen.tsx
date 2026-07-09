import { Activity, Dice5, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buildSourceMaintenanceCaption } from '@/features/game-data/adapters/draw-period-label';
import { useDrawFeedStatus } from '@/features/game-data/hooks/use-draw-feed-status';
import { fetchGameMonitorSnapshot } from '@/features/game-monitor/collector-api';
import type { GameMonitorSnapshot } from '@/features/game-monitor/collector-api-types';
import { SimpleBarChart } from '@/features/game-monitor/SimpleBarChart';
import { cn } from '@/lib/utils';

const POLL_MS = 15_000;

function formatDrawClock(drawAt: string): string {
  const m = drawAt.match(/T(\d{2}):(\d{2})/);
  if (m === null || m[1] === undefined || m[2] === undefined) {
    return drawAt;
  }
  return `${m[1]}:${m[2]}`;
}

function formatRelative(iso: string | null): string {
  if (iso === null) return '—';
  const sec = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (sec < 60) return `${String(sec)}s trước`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${String(min)} phút trước`;
  const hr = Math.floor(min / 60);
  return `${String(hr)} giờ trước`;
}

function smallLargeLabel(v: 'small' | 'tie' | 'large'): string {
  if (v === 'small') return 'Xỉu';
  if (v === 'tie') return 'Hòa';
  return 'Tài';
}

function statusDot(status: string | undefined): ReactNode {
  const ok = status === 'running' || status === 'healthy';
  return (
    <span
      className={cn(
        'inline-block h-2.5 w-2.5 rounded-full',
        ok ? 'bg-emerald-500' : 'bg-amber-500',
      )}
      aria-hidden
    />
  );
}

export function GameMonitorScreen(): ReactNode {
  const [snapshot, setSnapshot] = useState<GameMonitorSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const feedStatus = useDrawFeedStatus();

  const refresh = useCallback(async () => {
    const data = await fetchGameMonitorSnapshot();
    setSnapshot(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), POLL_MS);
    return () => {
      clearInterval(id);
    };
  }, [refresh]);

  const draw = snapshot?.latest ?? null;
  const health = snapshot?.health ?? null;
  const today = snapshot?.today ?? null;
  const collectorVersion = snapshot?.collector ?? null;
  const totals =
    today?.totals.map((t) => ({
      label: String(t.value),
      value: t.count,
    })) ?? [];
  const flowers =
    today?.flowers.map((f) => ({
      label: String(f.value),
      value: f.count,
    })) ?? [];
  const todayEmptyDueToMaintenance =
    (today?.drawCount ?? 0) === 0 &&
    feedStatus?.collectorReachable === true &&
    feedStatus.drawStale === true;
  const todayMaintenanceCaption = todayEmptyDueToMaintenance
    ? buildSourceMaintenanceCaption(feedStatus?.lastDrawPeriodLabel ?? null)
    : null;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Game Monitor</h2>
          <p className="text-sm text-muted-foreground">
            Đọc từ Collector HTTP — một request /dashboard mỗi {POLL_MS / 1000}s
            {collectorVersion != null && (
              <span className="ml-2 font-mono text-xs">
                v{collectorVersion.version}
                {collectorVersion.commit !== null && ` · ${collectorVersion.commit.slice(0, 7)}`}
              </span>
            )}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void refresh()} disabled={loading}>
          <RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} />
          Làm mới
        </Button>
      </div>

      {snapshot?.error != null && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">
            {snapshot.error}
            <p className="mt-2 text-xs text-muted-foreground">
              Chạy:{' '}
              <code className="rounded bg-muted px-1">
                COLLECTOR_ADAPTER=bingo18 pnpm collector:start
              </code>
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Dice5 className="h-4 w-4" />
              Latest Draw
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {draw === null ? (
              <p className="text-sm text-muted-foreground">Chưa có kỳ quay</p>
            ) : (
              <>
                <p className="text-3xl font-bold tabular-nums">{formatDrawClock(draw.drawAt)}</p>
                <div className="flex gap-3 text-2xl font-semibold">
                  {draw.dice.map((d, i) => (
                    <span
                      key={i}
                      className="flex h-12 w-12 items-center justify-center rounded-lg border bg-muted/50"
                    >
                      {d}
                    </span>
                  ))}
                </div>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Tổng</dt>
                    <dd className="font-semibold">{draw.total}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Hoa</dt>
                    <dd className="font-semibold">{draw.flower ?? 'Không'}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Xỉu / Hòa / Tài</dt>
                    <dd className="font-semibold">{smallLargeLabel(draw.smallLarge)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Draw key</dt>
                    <dd className="font-mono text-xs">{draw.drawKey}</dd>
                  </div>
                </dl>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4" />
              Collector Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            {health === null ? (
              <p className="text-sm text-muted-foreground">—</p>
            ) : (
              <dl className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  {statusDot(health.status)}
                  <span className="font-medium capitalize">{health.status}</span>
                  <span className="text-muted-foreground">({health.activeAdapterId})</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <dt className="text-muted-foreground">Last Poll</dt>
                    <dd className="font-medium">{formatRelative(health.lastPollAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Latency avg</dt>
                    <dd className="font-medium">{Math.round(health.averageLatencyMs / 1000)}s</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Failures</dt>
                    <dd className="font-medium">{health.failureCount}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Draws stored</dt>
                    <dd className="font-medium">{health.drawCount}</dd>
                  </div>
                </div>
              </dl>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Today — Tổng 3–18
              {today != null && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  {today.date} ({today.drawCount} kỳ)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayMaintenanceCaption !== null ? (
              <p className="text-sm text-amber-700 dark:text-amber-400">{todayMaintenanceCaption}</p>
            ) : totals.length === 0 ? (
              <p className="text-sm text-muted-foreground">—</p>
            ) : (
              <SimpleBarChart items={totals} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Today — Hoa 111–666</CardTitle>
          </CardHeader>
          <CardContent>
            {todayMaintenanceCaption !== null ? (
              <p className="text-sm text-amber-700 dark:text-amber-400">{todayMaintenanceCaption}</p>
            ) : flowers.length === 0 ? (
              <p className="text-sm text-muted-foreground">—</p>
            ) : (
              <SimpleBarChart items={flowers} />
            )}
          </CardContent>
        </Card>
      </div>

      {snapshot != null && snapshot.error == null && (
        <p className="text-center text-xs text-muted-foreground">
          Snapshot {formatRelative(snapshot.generatedAt)} · {today?.drawCount ?? 0} kỳ hôm nay
        </p>
      )}
    </div>
  );
}
