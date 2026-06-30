export type StatusTone = 'ok' | 'warning' | 'error' | 'disabled' | 'neutral';

export interface StatusSegmentSnapshot {
  readonly id: string;
  readonly label: string;
  readonly detail?: string;
  readonly tone?: StatusTone;
  readonly onClick?: () => void;
}

export interface CollectorStatusSnapshot extends StatusSegmentSnapshot {
  readonly id: 'collector';
}

export interface CloudStatusSnapshot extends StatusSegmentSnapshot {
  readonly id: 'cloud';
}

export interface SessionStatusSnapshot extends StatusSegmentSnapshot {
  readonly id: 'session';
}

export interface BuildStatusSnapshot extends StatusSegmentSnapshot {
  readonly id: 'build';
}
