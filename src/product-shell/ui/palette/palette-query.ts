import type { AppCommand, CommandCategory } from '@/product-shell/types/command';

export const PALETTE_CATEGORY_ORDER: readonly CommandCategory[] = [
  'Navigation',
  'Planning',
  'Session',
  'Library',
  'Dashboard',
  'Developer',
];

export const PALETTE_CATEGORY_LABELS: Record<CommandCategory, string> = {
  Navigation: 'Navigation',
  Planning: 'Planning',
  Session: 'Session',
  Library: 'Library',
  Dashboard: 'Dashboard',
  Developer: 'Diagnostics',
};

export interface ParsedPaletteQuery {
  readonly mode: 'recent' | 'search' | 'category';
  readonly text: string;
}

export function parsePaletteQuery(query: string): ParsedPaletteQuery {
  const trimmed = query.trim();
  if (trimmed.length === 0) {
    return { mode: 'recent', text: '' };
  }
  if (trimmed.startsWith('>')) {
    return { mode: 'category', text: trimmed.slice(1).trim().toLowerCase() };
  }
  return { mode: 'search', text: trimmed };
}

export function uiRankScore(command: AppCommand, query: string): number {
  const normalized = query.trim().toLowerCase();
  if (normalized.length === 0) {
    return 0;
  }

  const title = command.title.toLowerCase();
  if (title.startsWith(normalized)) {
    return 300;
  }
  if (command.keywords.some((keyword) => keyword.toLowerCase().startsWith(normalized))) {
    return 200;
  }
  if (title.includes(normalized)) {
    return 100;
  }
  if (command.keywords.some((keyword) => keyword.toLowerCase().includes(normalized))) {
    return 80;
  }
  if (command.description?.toLowerCase().includes(normalized)) {
    return 60;
  }
  return 0;
}

export function matchesPaletteCategory(command: AppCommand, categoryFilter: string): boolean {
  if (categoryFilter.length === 0) {
    return true;
  }
  const categoryLabel = PALETTE_CATEGORY_LABELS[command.category].toLowerCase();
  return (
    command.category.toLowerCase() === categoryFilter ||
    categoryLabel === categoryFilter ||
    categoryLabel.includes(categoryFilter)
  );
}

export function sortRankedCommands(
  commands: readonly AppCommand[],
  query: string,
): readonly AppCommand[] {
  return [...commands]
    .map((command) => ({ command, score: uiRankScore(command, query) }))
    .filter((entry) => entry.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.command.category.localeCompare(b.command.category) ||
        a.command.title.localeCompare(b.command.title),
    )
    .map((entry) => entry.command);
}

export function groupCommandsByCategory(
  commands: readonly AppCommand[],
): readonly { readonly category: CommandCategory; readonly commands: readonly AppCommand[] }[] {
  const grouped = new Map<CommandCategory, AppCommand[]>();
  for (const command of commands) {
    const bucket = grouped.get(command.category) ?? [];
    bucket.push(command);
    grouped.set(command.category, bucket);
  }

  return PALETTE_CATEGORY_ORDER.filter((category) => grouped.has(category)).map((category) => ({
    category,
    commands: [...(grouped.get(category) ?? [])].sort((a, b) => a.title.localeCompare(b.title)),
  }));
}
