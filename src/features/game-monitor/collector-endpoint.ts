const DEFAULT_COLLECTOR_API_BASE = 'http://localhost:8788';

let collectorApiBase = DEFAULT_COLLECTOR_API_BASE;

/** App bootstrap may override base URL from Vite env — features never read env directly. */
export function configureCollectorApiBase(url: string): void {
  collectorApiBase = url.length > 0 ? url : DEFAULT_COLLECTOR_API_BASE;
}

export function getCollectorApiBase(): string {
  return collectorApiBase;
}
