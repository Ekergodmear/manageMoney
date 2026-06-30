export type NotificationKind =
  | 'win'
  | 'rounds-remaining'
  | 'plan-finished'
  | 'collector-offline'
  | 'collector-online'
  | 'recommendation-new';

export interface AppNotification {
  readonly id: string;
  readonly kind: NotificationKind;
  readonly title: string;
  readonly body: string;
  readonly emoji: string;
  readonly createdAt: string;
  readonly read: boolean;
  readonly sessionId?: string;
  readonly amount?: number;
}

export interface NotificationPreferences {
  readonly win: boolean;
  readonly remaining: boolean;
  readonly collector: boolean;
  readonly recommendation: boolean;
  readonly desktop: boolean;
  readonly sound: boolean;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  win: true,
  remaining: true,
  collector: true,
  recommendation: true,
  desktop: false,
  sound: true,
};

export const NOTIFICATION_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

export interface NotificationState {
  readonly notifications: readonly AppNotification[];
  readonly preferences: NotificationPreferences;
}

export const EMPTY_NOTIFICATION_STATE: NotificationState = {
  notifications: [],
  preferences: DEFAULT_NOTIFICATION_PREFERENCES,
};
