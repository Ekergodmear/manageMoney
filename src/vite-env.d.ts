/// <reference types="vite/client" />

interface AppBuildInfo {
  readonly buildVersion: string;
  readonly commitHash: string;
  readonly buildDate: string;
}

declare const __APP_BUILD_INFO__: AppBuildInfo;
