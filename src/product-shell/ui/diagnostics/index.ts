export { DiagnosticsProvider, useDiagnostics } from '@/product-shell/ui/diagnostics/DiagnosticsProvider';
export type { DiagnosticsContextValue, DiagnosticsProviderProps } from '@/product-shell/ui/diagnostics/DiagnosticsProvider';

export { DiagnosticCard } from '@/product-shell/ui/diagnostics/DiagnosticCard';
export type { DiagnosticCardProps } from '@/product-shell/ui/diagnostics/DiagnosticCard';

export { DiagnosticsPage } from '@/product-shell/ui/diagnostics/DiagnosticsPage';

export {
  createDiagnosticCapabilities,
} from '@/product-shell/ui/diagnostics/create-capabilities';
export type { DiagnosticsPorts } from '@/product-shell/ui/diagnostics/create-capabilities';
export { refreshPersistenceCapability } from '@/product-shell/ui/diagnostics/persistence-capability';
export {
  createAppDiagnosticsPorts,
  type AppDiagnosticsDeps,
} from '@/product-shell/ui/diagnostics/app-diagnostics-ports';

export {
  SEVERITY_BADGE_CLASS,
  SEVERITY_PANEL_CLASS,
  SEVERITY_TEXT_CLASS,
} from '@/product-shell/ui/diagnostics/severity-styles';
