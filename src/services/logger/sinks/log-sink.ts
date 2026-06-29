import type { AppEvent } from '@/services/events/event-types';

export interface LogEntry {
  readonly level: 'info' | 'warn' | 'error';
  readonly message: string;
  readonly event: AppEvent;
}

export interface LogSink {
  write(entry: LogEntry): void;
}
