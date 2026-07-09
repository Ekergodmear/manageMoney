export interface CloudConfig {
  readonly enabled: boolean;
}

export const DEFAULT_CLOUD_CONFIG: CloudConfig = {
  enabled: false,
};
