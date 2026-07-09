export type ActionOutcome = 'success' | 'failure';

export interface ActionHistoryEntry {
  readonly commandId: string;
  readonly outcome: ActionOutcome;
  readonly recordedAt: number;
}

export interface ActionHistory {
  record(commandId: string, outcome?: ActionOutcome): void;
  recordSuccess(commandId: string): void;
  recordFailure(commandId: string): void;
  recent(limit: number): readonly ActionHistoryEntry[];
  clear(): void;
}

const DEFAULT_MAX = 50;

export function createActionHistory(maxEntries: number = DEFAULT_MAX): ActionHistory {
  const entries: ActionHistoryEntry[] = [];

  function append(commandId: string, outcome: ActionOutcome): void {
    const trimmed = commandId.trim();
    if (trimmed.length === 0) {
      return;
    }
    entries.push({ commandId: trimmed, outcome, recordedAt: Date.now() });
    if (entries.length > maxEntries) {
      entries.splice(0, entries.length - maxEntries);
    }
  }

  return {
    record(commandId: string, outcome: ActionOutcome = 'success'): void {
      append(commandId, outcome);
    },

    recordSuccess(commandId: string): void {
      append(commandId, 'success');
    },

    recordFailure(commandId: string): void {
      append(commandId, 'failure');
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
