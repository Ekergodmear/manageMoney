/** So sánh drawKey dạng YYYYMMDDHHmmss — thứ tự từ điển = thứ tự thời gian. */
export function newerDrawKey(a: string | null, b: string | null): string | null {
  if (a === null) return b;
  if (b === null) return a;
  return a >= b ? a : b;
}
