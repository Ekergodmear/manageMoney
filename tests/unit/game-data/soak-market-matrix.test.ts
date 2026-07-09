/**
 * Soak gate — 4 market đại diện cho toàn bộ MarketResolver + Settlement pipeline.
 * Chạy trước khi freeze MarketDefinition / StatisticsSnapshot.
 *
 * Manual soak (Planning → Session → Collector → Dashboard) vẫn cần làm tay;
 * file này khóa phần engine thuần.
 */
import { describe, expect, it } from 'vitest';

import {
  applyMarketToForm,
  applyPresetToForm,
  mergePresets,
} from '@/features/game-designer/preset-utils';
import { buildBingo18Markets } from '@/features/game-data/markets/bingo18-markets';
import { computeMarketEconomics } from '@/features/game-data/markets/market-metrics';
import { findMarketById, marketMatchesDraw } from '@/features/game-data/markets/market-resolver';
import type { MarketDefinition } from '@/features/game-data/markets/market-definition';
import { applySettlementToSession } from '@/features/game-data/settlement/apply-settlement-use-case';
import { settleRound } from '@/features/game-data/settlement/round-settlement-engine';
import { DEFAULT_PLANNER_FORM, generatePlan } from '@/features/planner/plan-service';
import { createInitialPlan } from '@/features/session/plan-factory';
import type { Session } from '@/features/session/session-domain';

/** Matrix soak — 4 loại market đại diện. */
export const SOAK_MARKET_IDS = [
  'total-4', // total hiếm
  'total-10', // total phổ biến (27/216, đỉnh cùng total-11)
  'flower-666', // flower
  'size-large', // size / Tài
] as const;

const REWARD_POLICY = { type: 'no-tax' as const };
const markets = buildBingo18Markets(REWARD_POLICY);
const presets = mergePresets([]);

function market(id: (typeof SOAK_MARKET_IDS)[number]): MarketDefinition {
  const m = findMarketById(markets, id);
  if (m === undefined) {
    throw new Error(`Missing soak market: ${id}`);
  }
  return m;
}

const baseDraw = {
  drawKey: '20260629220000',
  gameId: 'bingo18',
  marketVersion: 1,
  drawAt: '2026-06-29T22:00:00+07:00',
  publishedAt: '2026-06-29T22:00:00+07:00',
  publishedEstimated: true,
  collectedAt: '2026-06-29T22:02:01+07:00',
  latencyMs: 121_000,
  source: 'bingo18',
};

function minimalPlayingSession(marketId: string): Session {
  const preset = presets.find((p) => p.id === 'bingo-120');
  if (preset === undefined) {
    throw new Error('bingo-120 preset missing');
  }
  const formValues = applyMarketToForm(
    applyPresetToForm({ ...DEFAULT_PLANNER_FORM, userBankroll: '10.000.000' }, preset),
    preset,
    marketId,
  );
  const generated = generatePlan(formValues);
  if (generated.result === undefined) {
    throw new Error('Failed to generate plan for soak session');
  }
  const plan = createInitialPlan({
    index: 0,
    origin: 'capital',
    formValues,
    generated: generated.result,
    status: 'playing',
    completedThroughRound: 0,
    createdAt: '2026-06-29T21:00:00.000Z',
  });
  return {
    id: 'soak-session',
    title: 'Soak',
    presetId: 'bingo-120',
    sessionNumber: 1,
    currentPlanId: plan.id,
    status: 'playing',
    profitAmount: null,
    favorite: false,
    archived: false,
    tags: [],
    notes: '',
    lastSettledDrawKey: null,
    playedRounds: [],
    plans: [{ ...plan, marketId }],
    timeline: [],
    startedAt: '2026-06-29T21:00:00.000Z',
    createdAt: '2026-06-29T21:00:00.000Z',
    updatedAt: '2026-06-29T21:00:00.000Z',
  };
}

describe('Soak gate — 4 market matrix', () => {
  it('catalog chứa đủ 4 market soak', () => {
    for (const id of SOAK_MARKET_IDS) {
      expect(findMarketById(markets, id)).toBeDefined();
    }
  });

  describe.each([
    {
      id: 'total-4' as const,
      winDraw: {
        ...baseDraw,
        dice: [1, 1, 2] as const,
        total: 4,
        flower: null,
        smallLarge: 'small' as const,
      },
      loseDraw: {
        ...baseDraw,
        drawKey: 'lose',
        dice: [3, 4, 4] as const,
        total: 11,
        flower: null,
        smallLarge: 'large' as const,
      },
      multiplier: 40,
      ways: 3,
    },
    {
      id: 'total-10' as const,
      winDraw: {
        ...baseDraw,
        drawKey: 't10',
        dice: [3, 3, 4] as const,
        total: 10,
        flower: null,
        smallLarge: 'tie' as const,
      },
      loseDraw: {
        ...baseDraw,
        drawKey: 't10lose',
        dice: [1, 1, 2] as const,
        total: 4,
        flower: null,
        smallLarge: 'small' as const,
      },
      multiplier: 4.4,
      ways: 27,
    },
    {
      id: 'flower-666' as const,
      winDraw: {
        ...baseDraw,
        drawKey: 'f666',
        dice: [6, 6, 6] as const,
        total: 18,
        flower: '666',
        smallLarge: 'large' as const,
      },
      loseDraw: {
        ...baseDraw,
        drawKey: 'f666lose',
        dice: [1, 2, 3] as const,
        total: 6,
        flower: null,
        smallLarge: 'small' as const,
      },
      multiplier: 120,
      ways: 1,
    },
    {
      id: 'size-large' as const,
      winDraw: {
        ...baseDraw,
        drawKey: 'tai',
        dice: [4, 5, 6] as const,
        total: 15,
        flower: null,
        smallLarge: 'large' as const,
      },
      loseDraw: {
        ...baseDraw,
        drawKey: 'tailose',
        dice: [1, 2, 3] as const,
        total: 6,
        flower: null,
        smallLarge: 'small' as const,
      },
      multiplier: 2,
      ways: 81,
    },
  ])('$id — matcher + settlement', ({ id, winDraw, loseDraw, multiplier, ways }) => {
    const m = market(id);

    it('Planning economics — EV và house edge từ probability × multiplier', () => {
      expect(m.multiplier).toBe(multiplier);
      expect(m.probability).toBeCloseTo(ways / 216, 6);
      const { expectedReturn, houseEdge } = computeMarketEconomics(m.multiplier, m.probability);
      expect(m.expectedReturn).toBeCloseTo(expectedReturn, 6);
      expect(m.houseEdge).toBeCloseTo(houseEdge, 6);
      expect(m.expectedReturn + m.houseEdge).toBeCloseTo(1, 6);
    });

    it('matcher thắng / thua đúng draw', () => {
      expect(marketMatchesDraw(m, winDraw)).toBe(true);
      expect(marketMatchesDraw(m, loseDraw)).toBe(false);
    });

    it('settleRound — prize, profit, marketId', () => {
      const bet = 100_000;
      const win = settleRound({
        draw: winDraw,
        roundIndex: 1,
        bet,
        accumulatedSpentBefore: 0,
        market: m,
      });
      expect(win.marketId).toBe(id);
      expect(win.marketMatched).toBe(true);
      expect(win.prize).toBe(Math.round(bet * multiplier));
      expect(win.netPrize).toBe(Math.round(bet * multiplier));
      expect(win.tax).toBe(0);
      expect(win.profit).toBe(win.netPrize - bet);

      const loss = settleRound({
        draw: loseDraw,
        roundIndex: 2,
        bet,
        accumulatedSpentBefore: bet,
        market: m,
      });
      expect(loss.marketId).toBe(id);
      expect(loss.marketMatched).toBe(false);
      expect(loss.prize).toBe(0);
      expect(loss.profit).toBe(-bet);
    });
  });

  it('applySettlementToSession — PlayedRound đủ field từ plan.marketId', () => {
    const preset = presets.find((p) => p.id === 'bingo-120');
    expect(preset).toBeDefined();
    if (preset === undefined) {
      return;
    }

    const session = minimalPlayingSession('total-4');
    expect(session.plans[0]?.marketId).toBe('total-4');

    const draw = {
      ...baseDraw,
      dice: [1, 1, 2] as const,
      total: 4,
      flower: null,
      smallLarge: 'small' as const,
    };

    const outcome = applySettlementToSession(session, draw, preset);
    expect(outcome).not.toBeNull();
    if (outcome === null) {
      return;
    }

    const pr = outcome.playedRound;
    const roundBet = session.plans[0]?.generated.strategy.rounds[0]?.betAmount;
    expect(roundBet).toBeDefined();
    if (roundBet === undefined) {
      return;
    }
    const total4 = market('total-4');
    expect(pr.drawKey).toBe(draw.drawKey);
    expect(pr.market).toBe('total-4');
    expect(pr.won).toBe(true);
    expect(pr.prize).toBe(roundBet * total4.multiplier);
    expect(pr.tax).toBe(0);
    expect(pr.netPrize).toBe(roundBet * total4.multiplier);
    expect(pr.profit).toBeGreaterThan(0);
    expect(pr.bankrollAfter).toBe(roundBet);
    expect(outcome.session.lastSettledDrawKey).toBe(draw.drawKey);
  });

  it('Plan.marketId là nguồn sự thật — không infer từ rewardMultiplier', () => {
    const session = minimalPlayingSession('flower-666');
    const plan = session.plans[0];
    expect(plan).toBeDefined();
    if (plan === undefined) {
      return;
    }
    expect(plan.marketId).toBe('flower-666');
    expect(plan.formValues.marketId).toBe('flower-666');
    const m = market('flower-666');
    expect(plan.formValues.rewardMultiplier).toBe(String(m.multiplier));
  });
});
