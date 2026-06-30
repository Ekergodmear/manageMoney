import type { ActionHistoryEntry } from '@/product-shell/runtime/action-history';
import type { AppCommand } from '@/product-shell/types/command';

import {
  groupCommandsByCategory,
  matchesPaletteCategory,
  parsePaletteQuery,
  sortRankedCommands,
  type ParsedPaletteQuery,
} from '@/product-shell/ui/palette/palette-query';
import { PALETTE_CATEGORY_LABELS } from '@/product-shell/ui/palette/palette-query';

export type PaletteSelectableItem =
  | {
      readonly kind: 'recent';
      readonly commandId: string;
      readonly title: string;
      readonly outcome: ActionHistoryEntry['outcome'];
    }
  | {
      readonly kind: 'command';
      readonly command: AppCommand;
    };

export type PaletteRow =
  | { readonly kind: 'header'; readonly label: string }
  | PaletteSelectableItem;

export interface BuildPaletteRowsInput {
  readonly query: string;
  readonly recent: readonly ActionHistoryEntry[];
  readonly visibleCommands: readonly AppCommand[];
  readonly resolveCommandTitle: (commandId: string) => string | undefined;
}

function buildRecentRows(
  recent: readonly ActionHistoryEntry[],
  resolveCommandTitle: (commandId: string) => string | undefined,
): readonly PaletteRow[] {
  if (recent.length === 0) {
    return [];
  }
  const rows: PaletteRow[] = [{ kind: 'header', label: 'Recent' }];
  for (const entry of recent) {
    rows.push({
      kind: 'recent',
      commandId: entry.commandId,
      title: resolveCommandTitle(entry.commandId) ?? entry.commandId,
      outcome: entry.outcome,
    });
  }
  return rows;
}

function buildSearchRows(parsed: ParsedPaletteQuery, commands: readonly AppCommand[]): readonly PaletteRow[] {
  let filtered = commands;
  if (parsed.mode === 'category') {
    filtered = commands.filter((command) => matchesPaletteCategory(command, parsed.text));
  } else if (parsed.mode === 'search') {
    filtered = sortRankedCommands(commands, parsed.text);
  }

  const groups = groupCommandsByCategory(filtered);
  const rows: PaletteRow[] = [];
  for (const group of groups) {
    rows.push({ kind: 'header', label: PALETTE_CATEGORY_LABELS[group.category] });
    for (const command of group.commands) {
      rows.push({ kind: 'command', command });
    }
  }
  return rows;
}

export function buildPaletteRows(input: BuildPaletteRowsInput): readonly PaletteRow[] {
  const parsed = parsePaletteQuery(input.query);
  if (parsed.mode === 'recent') {
    return buildRecentRows(input.recent, input.resolveCommandTitle);
  }
  return buildSearchRows(parsed, input.visibleCommands);
}

export function listSelectableItems(rows: readonly PaletteRow[]): readonly PaletteSelectableItem[] {
  return rows.filter((row): row is PaletteSelectableItem => row.kind === 'recent' || row.kind === 'command');
}
