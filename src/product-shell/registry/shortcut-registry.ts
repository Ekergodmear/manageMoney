import type { ResolvedShortcut, ShortcutSpec } from '@/product-shell/types/shortcut';

export class DuplicateShortcutError extends Error {
  constructor(display: string) {
    super(`Shortcut already bound: ${display}`);
    this.name = 'DuplicateShortcutError';
  }
}

export class ShortcutNotFoundError extends Error {
  constructor(display: string) {
    super(`Shortcut not bound: ${display}`);
    this.name = 'ShortcutNotFoundError';
  }
}

function normalizeKey(key: string): string {
  return key.trim().toLowerCase();
}

function normalizeModifiers(
  modifiers: readonly ('ctrl' | 'shift' | 'alt' | 'meta')[] | undefined,
): readonly ('ctrl' | 'shift' | 'alt' | 'meta')[] {
  if (modifiers === undefined || modifiers.length === 0) {
    return [];
  }
  return [...modifiers].sort();
}

export function formatShortcutDisplay(spec: ShortcutSpec): string {
  const parts: string[] = [];
  const mods = normalizeModifiers(spec.modifiers);
  if (mods.includes('ctrl')) {
    parts.push('Ctrl');
  }
  if (mods.includes('shift')) {
    parts.push('Shift');
  }
  if (mods.includes('alt')) {
    parts.push('Alt');
  }
  if (mods.includes('meta')) {
    parts.push('Meta');
  }
  parts.push(spec.key.length === 1 ? spec.key.toUpperCase() : spec.key);
  return parts.join('+');
}

function shortcutKey(spec: ShortcutSpec): string {
  const mods = normalizeModifiers(spec.modifiers).join('+');
  return `${mods}|${normalizeKey(spec.key)}`;
}

function parseShortcutInput(input: string): ShortcutSpec {
  const trimmed = input.trim();
  const parts = trimmed.split('+').map((part) => part.trim()).filter((part) => part.length > 0);
  if (parts.length === 0) {
    throw new ShortcutNotFoundError(input);
  }

  const modifiers: ('ctrl' | 'shift' | 'alt' | 'meta')[] = [];
  let key = '';

  for (const part of parts) {
    const lower = part.toLowerCase();
    if (lower === 'ctrl' || lower === 'control') {
      modifiers.push('ctrl');
      continue;
    }
    if (lower === 'shift') {
      modifiers.push('shift');
      continue;
    }
    if (lower === 'alt') {
      modifiers.push('alt');
      continue;
    }
    if (lower === 'meta' || lower === 'cmd' || lower === 'command') {
      modifiers.push('meta');
      continue;
    }
    key = part;
  }

  if (key.length === 0) {
    throw new ShortcutNotFoundError(input);
  }

  const spec: ShortcutSpec = { key: key.length === 1 ? key.toLowerCase() : key };
  if (modifiers.length > 0) {
    return { ...spec, modifiers };
  }
  return spec;
}

export interface ShortcutRegistry {
  bind(shortcut: string | ShortcutSpec, commandId: string): void;
  unbind(shortcut: string | ShortcutSpec): void;
  resolve(shortcut: string | ShortcutSpec): string | undefined;
  list(): readonly ResolvedShortcut[];
}

export function createShortcutRegistry(): ShortcutRegistry {
  const byShortcut = new Map<string, string>();

  return {
    bind(shortcut: string | ShortcutSpec, commandId: string): void {
      const spec = typeof shortcut === 'string' ? parseShortcutInput(shortcut) : shortcut;
      const key = shortcutKey(spec);
      if (byShortcut.has(key)) {
        throw new DuplicateShortcutError(formatShortcutDisplay(spec));
      }
      byShortcut.set(key, commandId);
    },

    unbind(shortcut: string | ShortcutSpec): void {
      const spec = typeof shortcut === 'string' ? parseShortcutInput(shortcut) : shortcut;
      const key = shortcutKey(spec);
      if (!byShortcut.delete(key)) {
        throw new ShortcutNotFoundError(formatShortcutDisplay(spec));
      }
    },

    resolve(shortcut: string | ShortcutSpec): string | undefined {
      const spec = typeof shortcut === 'string' ? parseShortcutInput(shortcut) : shortcut;
      return byShortcut.get(shortcutKey(spec));
    },

    list(): readonly ResolvedShortcut[] {
      return [...byShortcut.entries()]
        .map(([key, commandId]) => {
          const [modsPart = '', rawKey = ''] = key.split('|');
          const modifiers =
            modsPart.length === 0
              ? undefined
              : (modsPart.split('+') as ('ctrl' | 'shift' | 'alt' | 'meta')[]);
          const spec: ShortcutSpec =
            modifiers === undefined ? { key: rawKey } : { key: rawKey, modifiers };
          return {
            commandId,
            spec,
            display: formatShortcutDisplay(spec),
          };
        })
        .sort((a, b) => a.display.localeCompare(b.display));
    },
  };
}
