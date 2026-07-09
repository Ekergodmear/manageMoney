/** Hiển thị nhãn kỳ quay HH:mm từ drawAt ISO (múi +07). */
export function formatDrawPeriodLabel(drawAt: string): string {
  const match = drawAt.match(/T(\d{2}):(\d{2})/);
  if (match?.[1] !== undefined && match[2] !== undefined) {
    return `${match[1]}:${match[2]}`;
  }
  return drawAt;
}

/** Nhãn kỳ + ngày từ drawKey (vd. `21:53 · 30/06`). */
export function formatLastDrawLabel(drawKey: string, drawAt: string): string {
  const period = formatDrawPeriodLabel(drawAt);
  if (/^\d{14}$/.test(drawKey)) {
    const day = drawKey.slice(6, 8);
    const month = drawKey.slice(4, 6);
    return `${period} · ${day}/${month}`;
  }
  return period;
}

export function buildSourceMaintenanceCaption(lastDrawPeriodLabel: string | null): string {
  if (lastDrawPeriodLabel === null) {
    return 'Web nguồn đang bảo trì — chưa thu thập được kỳ mới hôm nay.';
  }
  return `Web nguồn đang bảo trì — kỳ cuối ${lastDrawPeriodLabel}, chưa có kỳ mới hôm nay.`;
}
