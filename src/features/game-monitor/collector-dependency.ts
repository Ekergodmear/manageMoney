/** Messages emitted when Statistics depends on Collector and the service is absent or empty. */
export function isCollectorDependencyMessage(message: string): boolean {
  return (
    message === 'Không tải được thống kê draw' ||
    message === 'Chưa có dữ liệu draw từ Collector'
  );
}
