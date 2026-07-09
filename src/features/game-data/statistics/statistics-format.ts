import { formatPercent } from '@/features/planner/plan-display';

export function formatHitRate(rate: number): string {
  return `${formatPercent(rate * 100)}%`;
}

export function formatHitRateDelta(delta: number): string {
  const sign = delta >= 0 ? '+' : '';
  return `${sign}${formatPercent(delta * 100)}%`;
}

export function formatVariance(value: number, digits = 1): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toLocaleString('vi-VN', { maximumFractionDigits: digits, minimumFractionDigits: digits })}`;
}

export function formatDrawsAgo(drawsAgo: number | null): string {
  if (drawsAgo === null) {
    return '—';
  }
  if (drawsAgo === 0) {
    return 'kỳ vừa rồi';
  }
  return `${String(drawsAgo)} kỳ trước`;
}

export function formatTimeAgoFromIso(iso: string, referenceMs: number = Date.now()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) {
    return '—';
  }
  const diffMs = Math.max(0, referenceMs - then);
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) {
    return 'vừa xong';
  }
  if (diffMin < 60) {
    return `${String(diffMin)} phút trước`;
  }
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) {
    const mins = diffMin % 60;
    return mins > 0
      ? `${String(diffHours)}:${String(mins).padStart(2, '0')} trước`
      : `${String(diffHours)} giờ trước`;
  }
  const diffDays = Math.floor(diffHours / 24);
  return `${String(diffDays)} ngày trước`;
}
