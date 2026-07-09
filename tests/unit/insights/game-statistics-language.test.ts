import { describe, expect, it } from 'vitest';

import { buildBingo18Markets } from '@/features/game-data/markets/bingo18-markets';
import { computeGameStatistics } from '@/features/game-data/statistics/statistics-engine';
import type { DrawRecord } from '@/features/game-data/statistics/statistics-types';
import { generateGameStatisticsInsights } from '@/features/insights/insight-generators/game-statistics';

const FORBIDDEN_PHRASES = [
  'nên chơi',
  'nên đặt',
  'đặt cược',
  'đang nóng nên',
  'đang lạnh nên',
  'khuyên bạn',
  'cơ hội tốt',
  'sẽ trúng',
  'dự đoán',
];

function makeDraw(i: number, total: number): DrawRecord {
  return {
    drawKey: `k-${String(i)}`,
    drawAt: `2026-06-25T10:${String(i % 60).padStart(2, '0')}:00+07:00`,
    dice: [1, 2, 3],
    total,
    flower: null,
    smallLarge: total <= 9 ? 'small' : total <= 11 ? 'tie' : 'large',
  };
}

describe('Insights — ngôn ngữ soak (không cổ vũ đặt cược)', () => {
  it('game statistics insights không chứa cụm từ cấm', () => {
    const markets = buildBingo18Markets({ type: 'no-tax' });
    const draws = Array.from({ length: 1000 }, (_, i) => makeDraw(i, i % 40 === 0 ? 4 : 10));
    const snapshot = computeGameStatistics(draws, markets);
    const cards = generateGameStatisticsInsights(snapshot);

    expect(cards.length).toBeGreaterThan(0);

    for (const card of cards) {
      const text = `${card.title} ${card.body} ${card.conclusion ?? ''}`.toLowerCase();
      for (const phrase of FORBIDDEN_PHRASES) {
        expect(text).not.toContain(phrase);
      }
      expect(text).toContain('lịch sử');
    }
  });

  it('mọi insight có disclaimer về xác suất kỳ tiếp theo', () => {
    const markets = buildBingo18Markets({ type: 'no-tax' });
    const draws = Array.from({ length: 500 }, (_, i) => makeDraw(i, 11));
    const snapshot = computeGameStatistics(draws, markets);
    const cards = generateGameStatisticsInsights(snapshot);

    for (const card of cards) {
      expect(card.conclusion ?? '').toMatch(/kỳ tiếp theo/i);
    }
  });
});
