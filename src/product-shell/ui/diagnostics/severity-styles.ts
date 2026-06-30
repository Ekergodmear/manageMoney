import type { Severity } from '@/product-shell/types/diagnostics';

export const SEVERITY_PANEL_CLASS: Record<Severity, string> = {
  info: 'border-blue-500/40 bg-blue-500/5',
  warning: 'border-amber-500/40 bg-amber-500/5',
  critical: 'border-red-500/40 bg-red-500/5',
};

export const SEVERITY_TEXT_CLASS: Record<Severity, string> = {
  info: 'text-blue-700 dark:text-blue-300',
  warning: 'text-amber-700 dark:text-amber-300',
  critical: 'text-red-700 dark:text-red-300',
};

export const SEVERITY_BADGE_CLASS: Record<Severity, string> = {
  info: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
  warning: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  critical: 'bg-red-500/15 text-red-700 dark:text-red-300',
};
