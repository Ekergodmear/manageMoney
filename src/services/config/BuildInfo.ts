export interface BuildInfo {
  readonly buildVersion: string;
  readonly commitHash: string;
  readonly buildDate: string;
}

/** Injected at build time via vite.config define */
export function resolveBuildInfo(): BuildInfo {
  if (typeof __APP_BUILD_INFO__ !== 'undefined') {
    return __APP_BUILD_INFO__;
  }
  return {
    buildVersion: '0.8.0-dev',
    commitHash: 'local',
    buildDate: new Date().toISOString().slice(0, 10),
  };
}
