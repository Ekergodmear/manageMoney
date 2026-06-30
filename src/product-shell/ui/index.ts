export { ShellProvider } from '@/product-shell/ui/ShellProvider';
export type { ShellProviderProps } from '@/product-shell/ui/ShellProvider';

export { CommandPalette } from '@/product-shell/ui/CommandPalette';
export type { CommandPaletteProps } from '@/product-shell/ui/CommandPalette';

export { useShell } from '@/product-shell/ui/shell-context';
export type { ShellContextValue } from '@/product-shell/ui/shell-context';

export { registerShellCommands } from '@/product-shell/ui/register-shell-commands';
export type { ShellCommandHandlers } from '@/product-shell/ui/register-shell-commands';

export { isEditableTarget, keyboardEventToShortcut } from '@/product-shell/ui/keyboard';
export { useGlobalKeyboard } from '@/product-shell/ui/use-global-keyboard';

export { StatusBar } from '@/product-shell/ui/status/StatusBar';
export { CollectorStatusProvider, useCollectorStatus } from '@/product-shell/ui/status/CollectorStatusProvider';
export { CloudStatusProvider, useCloudStatus } from '@/product-shell/ui/status/CloudStatusProvider';
export { SessionStatusProvider, useSessionStatus } from '@/product-shell/ui/status/SessionStatusProvider';
export { BuildStatusProvider, useBuildStatus } from '@/product-shell/ui/status/BuildStatusProvider';

export type {
  BuildStatusSnapshot,
  CloudStatusSnapshot,
  CollectorStatusSnapshot,
  SessionStatusSnapshot,
  StatusSegmentSnapshot,
  StatusTone,
} from '@/product-shell/ui/status/status-types';
