export interface ActionHistoryEntry {
  readonly commandId: string;
  readonly recordedAt: number;
}

export interface ActionHistory {
  record(commandId: string): void;
  recent(limit: number): readonly ActionHistoryEntry[];
  clear(): void;
}

const DEFAULT_MAX = 50;

export function createActionHistory(maxEntries: number = DEFAULT_MAX): ActionHistory {
  const entries: ActionHistoryEntry[] = [];

  return {
    record(commandId: string): void {
      const trimmed = commandId.trim();
      if (trimmed.length === 0) {
        return;
      }
      entries.push({ commandId: trimmed, recordedAt: Date.now() });
      if (entries.length > maxEntries) {
        entries.splice(0, entries.length - maxEntries);
      }
    },

    recent(limit: number): readonly ActionHistoryEntry[] {
      const capped = Math.max(0, Math.floor(limit));
      if (capped === 0) {
        return [];
      }
      return entries.slice(-capped).reverse();
    },

    clear(): void {
      entries.length = 0;
    },
  };
}
