/**
 * Giả lập Planning + Settlement trên draw tháng 6/2026.
 * Cần Collector chạy local (localhost:8788) — skip nếu offline.
 */
import { describe, expect, it, beforeAll } from 'vitest';

import type { CollectorDrawResult } from '@/features/game-monitor/collector-api-types';
import {
  applyMarketToForm,
  applyPresetToForm,
  mergePresets,
} from '@/features/game-designer/preset-utils';
import { buildBingo18Markets } from '@/features/game-data/markets/bingo18-markets';
import { findMarketById, marketMatchesDraw } from '@/features/game-data/markets/market-resolver';
import type { MarketDefinition } from '@/features/game-data/markets/market-definition';
import { settleRound } from '@/features/game-data/settlement/round-settlement-engine';
import { drawToSnapshot } from '@/features/game-data/entities/played-round';
import { DEFAULT_PLANNER_FORM, generatePlan } from '@/features/planner/plan-service';
import { loadJune2026Draws } from '@/tests/support/june-draws';

const SIM_MARKETS = [
  { id: 'total-3', multiplier: 120 },
  { id: 'total-4', multiplier: 40 },
  { id: 'total-5', multiplier: 20 },
  { id: 'total-6', multiplier: 12 },
  { id: 'total-8', multiplier: 5.5 },
  { id: 'flower-666', multiplier: 120 },
] as const;

const ROUND_COUNTS = [10, 25, 50, 100] as const;

const markets = buildBingo18Markets({ type: 'no-tax' });
const presets = mergePresets([]);
const bingoPreset = presets.find((p) => p.id === 'bingo-120');

function market(id: string): MarketDefinition {
  const m = findMarketById(markets, id);
  if (m === undefined) {
    throw new Error(`Missing market: ${id}`);
  }
  return m;
}

function countJuneHits(draws: readonly CollectorDrawResult[], m: MarketDefinition): number {
  let hits = 0;
  for (const draw of draws) {
    if (marketMatchesDraw(m, drawToSnapshot(draw))) {
      hits++;
    }
  }
  return hits;
}

function playSessionOnDraws(
  draws: readonly CollectorDrawResult[],
  m: MarketDefinition,
  roundCount: number,
  startIndex = 0,
): { won: boolean; roundsPlayed: number; profit: number; capital: number } | null {
  if (bingoPreset === undefined) {
    return null;
  }
  const formValues = applyMarketToForm(
    applyPresetToForm(
      { ...DEFAULT_PLANNER_FORM, userBankroll: '50.000.000', roundCount: String(roundCount) },
      bingoPreset,
    ),
    bingoPreset,
    m.id,
  );
  const generated = generatePlan(formValues);
  if (generated.result === undefined) {
    return null;
  }

  const planRounds = generated.result.strategy.rounds;
  expect(planRounds.length).toBe(roundCount);

  let spentBefore = 0;
  for (let r = 0; r < roundCount; r++) {
    const draw = draws[startIndex + r];
    if (draw === undefined) {
      break;
    }
    const bet = planRounds[r]?.betAmount ?? 0;
    const outcome = settleRound({
      draw,
      roundIndex: r + 1,
      bet,
      accumulatedSpentBefore: spentBefore,
      market: m,
    });
    spentBefore += bet;
    if (outcome.marketMatched) {
      return {
        won: true,
        roundsPlayed: r + 1,
        profit: outcome.profit,
        capital: generated.result.statistics.requiredBankrollAmount,
      };
    }
  }

  return {
    won: false,
    roundsPlayed: roundCount,
    profit: -spentBefore,
    capital: generated.result.statistics.requiredBankrollAmount,
  };
}

describe('June 2026 — market simulation', () => {
  let juneDraws: readonly CollectorDrawResult[] | null = null;

  beforeAll(async () => {
    juneDraws = await loadJune2026Draws();
  });

  it('Collector có draw tháng 6 (hoặc skip)', () => {
    if (juneDraws === null) {
      console.warn('[june-simulation] Collector offline — bỏ qua giả lập draw thật');
      return;
    }
    expect(juneDraws.length).toBeGreaterThan(1000);
    console.info(`[june-simulation] ${String(juneDraws.length)} draws (01–30/06/2026)`);
  });

  describe.each(SIM_MARKETS)('$id ×$multiplier', ({ id, multiplier }) => {
    const m = market(id);

    it('multiplier khớp bảng thưởng', () => {
      expect(m.multiplier).toBe(multiplier);
    });

    it.each(ROUND_COUNTS)('generate plan %i vòng — solver OK', (roundCount) => {
      if (bingoPreset === undefined) {
        return;
      }
      const formValues = applyMarketToForm(
        applyPresetToForm(
          { ...DEFAULT_PLANNER_FORM, userBankroll: '50.000.000', roundCount: String(roundCount) },
          bingoPreset,
        ),
        bingoPreset,
        id,
      );
      const generated = generatePlan(formValues);
      expect(generated.result).toBeDefined();
      expect(generated.result?.strategy.rounds.length).toBe(roundCount);
      expect(Number(formValues.rewardMultiplier)).toBe(multiplier);
      expect(generated.result?.statistics.requiredBankrollAmount).toBeGreaterThan(0);
    });

    it('thống kê hit tháng 6 + phiên mẫu', () => {
      if (juneDraws === null) {
        return;
      }

      const hits = countJuneHits(juneDraws, m);
      const hitRate = hits / juneDraws.length;
      console.info(
        `[june-simulation] ${id} ×${String(multiplier)}: ${String(hits)}/${String(juneDraws.length)} hits (${(hitRate * 100).toFixed(2)}%)`,
      );

      expect(hits).toBeGreaterThan(0);
      expect(hitRate).toBeCloseTo(m.probability, 1);

      const sample = playSessionOnDraws(juneDraws, m, 50, 0);
      expect(sample).not.toBeNull();
      if (sample === null) {
        return;
      }
      console.info(
        `[june-simulation] ${id} 50v từ đầu tháng 6: won=${String(sample.won)} rounds=${String(sample.roundsPlayed)} capital=${String(sample.capital)}`,
      );
      expect(sample.capital).toBeGreaterThan(0);
    });
  });

  it('tóm tắt ×5.5 / ×12 / ×20 / ×40 / ×120 trên các mức vòng', () => {
    if (juneDraws === null || bingoPreset === undefined) {
      return;
    }

    const summary: string[] = [];
    for (const { id, multiplier } of SIM_MARKETS) {
      for (const rounds of ROUND_COUNTS) {
        const gen = generatePlan(
          applyMarketToForm(
            applyPresetToForm(
              {
                ...DEFAULT_PLANNER_FORM,
                userBankroll: '50.000.000',
                roundCount: String(rounds),
              },
              bingoPreset,
            ),
            bingoPreset,
            id,
          ),
        );
        const capital = gen.result?.statistics.requiredBankrollAmount ?? 0;
        summary.push(`${id} ×${String(multiplier)} ${String(rounds)}v → vốn ${String(capital)}`);
      }
    }
    console.info('[june-simulation] Capital required:\n' + summary.join('\n'));
    expect(summary.length).toBe(SIM_MARKETS.length * ROUND_COUNTS.length);
  });
});
