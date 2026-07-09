import { describe, expect, it } from 'vitest';

import type { AppCommand } from '@/product-shell/types/command';
import {
  groupCommandsByCategory,
  sortRankedCommands,
  uiRankScore,
} from '@/product-shell/ui/palette/palette-query';
import { buildPaletteRows } from '@/product-shell/ui/palette/palette-items';

function command(
  id: string,
  title: string,
  category: AppCommand['category'],
  keywords: string[] = [],
): AppCommand {
  return {
    id,
    title,
    category,
    keywords,
    visible: () => true,
    enabled: () => true,
    execute: () => Promise.resolve(),
  };
}

describe('palette query ranking', () => {
  it('prefers title prefix over keyword contains', () => {
    const planning = command('planning.generate', 'Planning Setup', 'Planning', ['setup']);
    const display = command('dashboard.display', 'Display Dashboard', 'Dashboard', ['plan']);
    expect(uiRankScore(planning, 'pla')).toBeGreaterThan(uiRankScore(display, 'pla'));
    expect(sortRankedCommands([display, planning], 'pla')[0]?.id).toBe('planning.generate');
  });

  it('groups commands by category labels', () => {
    const groups = groupCommandsByCategory([
      command('navigation.open-planning', 'Open Planning', 'Navigation'),
      command('planning.generate', 'Generate Plan', 'Planning'),
    ]);
    expect(groups.map((group) => group.category)).toEqual(['Navigation', 'Planning']);
  });
});

describe('palette recent rows', () => {
  it('shows recent commands when query is empty', () => {
    const rows = buildPaletteRows({
      query: '',
      recent: [
        { commandId: 'planning.generate', outcome: 'success', recordedAt: 1 },
        { commandId: 'planning.export', outcome: 'failure', recordedAt: 2 },
      ],
      visibleCommands: [],
      resolveCommandTitle: (id) => (id === 'planning.generate' ? 'Generate Plan' : 'Export CSV'),
    });
    expect(rows[0]).toEqual({ kind: 'header', label: 'Recent' });
    expect(rows[1]).toEqual(
      expect.objectContaining({ kind: 'recent', title: 'Generate Plan', outcome: 'success' }),
    );
    expect(rows[2]).toEqual(
      expect.objectContaining({ kind: 'recent', title: 'Export CSV', outcome: 'failure' }),
    );
  });

  it('lists all commands when query is empty and recent history is empty', () => {
    const rows = buildPaletteRows({
      query: '',
      recent: [],
      visibleCommands: [command('navigation.open-planning', 'Open Planning', 'Navigation')],
      resolveCommandTitle: () => undefined,
    });
    expect(rows.some((row) => row.kind === 'command')).toBe(true);
    expect(rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'command', command: expect.objectContaining({ id: 'navigation.open-planning' }) }),
      ]),
    );
  });
});
