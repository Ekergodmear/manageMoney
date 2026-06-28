import type { InsightTrend, SessionInsightMetrics } from '@/features/insights/insight-types';
import { confidenceFromSampleSize } from '@/features/insights/insight-confidence';
import { formatAmount } from '@/lib/money-format';

const SPARK_CHARS = '▁▂▃▄▅▆▇█';

export function generateTrends(metrics: readonly SessionInsightMetrics[]): InsightTrend[] {
  if (metrics.length < 2) {
    return [];
  }

  const recent = [...metrics]
    .sort((a, b) => b.session.updatedAt.localeCompare(a.session.updatedAt))
    .slice(0, 8)
    .reverse();

  const usageSeries = recent.map((m) => m.capitalUsagePercent ?? 0);
  const continueSeries = recent.map((m) => m.continueCount);
  const betSeries = recent.map((m) => m.highestBet);

  const trends: InsightTrend[] = [];
  const sessionCount = recent.length;
  const confidence = confidenceFromSampleSize(sessionCount);

  if (usageSeries.some((v) => v > 0)) {
    const latest = recent[recent.length - 1];
    trends.push({
      id: 'trend-capital-usage',
      label: 'Capital Usage',
      sparkline: toSparkline(usageSeries),
      latestLabel:
        latest?.capitalUsagePercent !== null && latest !== undefined
          ? `${String(latest.capitalUsagePercent)}%`
          : '—',
      summary: summarizePoints(usageSeries, sessionCount, 'điểm %'),
      confidence,
    });
  }

  trends.push({
    id: 'trend-continue',
    label: 'Continue',
    sparkline: toSparkline(continueSeries),
    latestLabel:
      recent[recent.length - 1] !== undefined
        ? `${String(recent[recent.length - 1]!.continueCount)} lần`
        : '—',
    summary: summarizeCount(continueSeries, sessionCount, 'lần'),
    confidence,
  });

  trends.push({
    id: 'trend-highest-bet',
    label: 'Highest Bet',
    sparkline: toSparkline(betSeries),
    latestLabel:
      recent[recent.length - 1] !== undefined
        ? `${formatAmount(recent[recent.length - 1]!.highestBet)} đ`
        : '—',
    summary: summarizePercentChange(betSeries, sessionCount),
    confidence,
  });

  return trends;
}

function toSparkline(values: readonly number[]): string {
  if (values.length === 0) {
    return '—';
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return values
    .map((v) => {
      const idx = Math.min(7, Math.max(0, Math.round(((v - min) / range) * 7)));
      return SPARK_CHARS[idx] ?? '▁';
    })
    .join('');
}

function summarizePoints(values: readonly number[], count: number, unit: string): string {
  if (values.length < 3) {
    return 'Chưa đủ phiên để nhận diện xu hướng.';
  }
  const half = Math.floor(values.length / 2);
  const early = average(values.slice(0, half));
  const late = average(values.slice(half));
  const delta = Math.round(late - early);
  if (Math.abs(delta) < 5) {
    return `→ Khá ổn định trong ${String(count)} phiên gần đây.`;
  }
  if (delta > 0) {
    return `↑ Tăng đều +${String(delta)} ${unit} so với nửa đầu.`;
  }
  return `↓ Giảm ${String(Math.abs(delta))} ${unit} trong ${String(count)} phiên gần đây.`;
}

function summarizeCount(values: readonly number[], count: number, unit: string): string {
  if (values.length < 3) {
    return 'Chưa đủ phiên để nhận diện xu hướng.';
  }
  const half = Math.floor(values.length / 2);
  const early = average(values.slice(0, half));
  const late = average(values.slice(half));
  const delta = Math.round((late - early) * 10) / 10;
  if (Math.abs(delta) < 0.3) {
    return `→ Số lần Continue ổn định trong ${String(count)} phiên gần đây.`;
  }
  if (delta > 0) {
    return `↑ Continue tăng ~${String(delta)} ${unit} so với trước.`;
  }
  return `↓ Continue giảm ~${String(Math.abs(delta))} ${unit} gần đây.`;
}

function summarizePercentChange(values: readonly number[], count: number): string {
  if (values.length < 3) {
    return 'Chưa đủ phiên để nhận diện xu hướng.';
  }
  const half = Math.floor(values.length / 2);
  const early = average(values.slice(0, half));
  const late = average(values.slice(half));
  if (early <= 0) {
    return `→ Theo dõi ${String(count)} phiên gần đây.`;
  }
  const pct = Math.round(((late - early) / early) * 100);
  if (Math.abs(pct) < 10) {
    return `→ Max bet khá ổn định trong ${String(count)} phiên gần đây.`;
  }
  if (pct > 0) {
    return `↑ Tăng khoảng ${String(pct)}% so với nửa đầu.`;
  }
  return `↓ Giảm khoảng ${String(Math.abs(pct))}% trong ${String(count)} phiên gần đây.`;
}

function average(values: readonly number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((a, b) => a + b, 0) / values.length;
}
