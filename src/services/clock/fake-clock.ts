import type { Clock } from '@/services/clock/clock';

export class FakeClock implements Clock {
  constructor(private fixed: Date) {}

  setFixed(date: Date): void {
    this.fixed = date;
  }

  now(): Date {
    return new Date(this.fixed);
  }

  today(): Date {
    return new Date(this.fixed.getFullYear(), this.fixed.getMonth(), this.fixed.getDate());
  }

  timestamp(): number {
    return this.fixed.getTime();
  }

  format(date: Date, locale = 'vi-VN'): string {
    return date.toLocaleString(locale);
  }
}
