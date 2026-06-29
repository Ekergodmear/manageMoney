export interface Clock {
  now(): Date;
  today(): Date;
  timestamp(): number;
  format(date: Date, locale?: string): string;
}
