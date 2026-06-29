import type { Clock } from '@/services/clock/clock';

export const SystemClock: Clock = {
  now(): Date {
    return new Date();
  },

  today(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  },

  timestamp(): number {
    return Date.now();
  },

  format(date: Date, locale = 'vi-VN'): string {
    return date.toLocaleString(locale);
  },
};
