import { describe, expect, it } from 'vitest';

import { BUILTIN_GAME_PRESETS } from '@/features/game-designer/builtin-presets';
import {
  formatMultiplierDisplay,
  marketPlanLabelFromPreset,
} from '@/features/game-data/markets/market-catalog';
import { BINGO18_PLAN_MULTIPLIER_TIERS } from '@/features/planner/plan-market-picker';

describe('plan market labels', () => {
  const preset = BUILTIN_GAME_PRESETS.find((p) => p.id === 'bingo-120');
  if (preset === undefined) {
    throw new Error('bingo-120 preset missing');
  }

  it('shows total with multiplier', () => {
    expect(marketPlanLabelFromPreset(preset, 'total-10')).toBe('Tổng 10 · ×4.4');
    expect(marketPlanLabelFromPreset(preset, 'total-3')).toBe('Tổng 3 · ×120');
  });

  it('shows flower with multiplier', () => {
    expect(marketPlanLabelFromPreset(preset, 'flower-555')).toBe('Hoa 555 · ×120');
  });

  it('formats decimal multipliers', () => {
    expect(formatMultiplierDisplay(5.5)).toBe('5.5');
    expect(formatMultiplierDisplay(120)).toBe('120');
  });

  it('documents bingo18 multiplier tiers', () => {
    expect(BINGO18_PLAN_MULTIPLIER_TIERS).toHaveLength(8);
    expect(BINGO18_PLAN_MULTIPLIER_TIERS[0]?.multiplier).toBe(120);
  });
});
