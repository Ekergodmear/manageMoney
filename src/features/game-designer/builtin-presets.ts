import type { GamePolicyPreset } from '@/features/game-designer/game-policy-types';
import { buildBingo18Markets } from '@/features/game-data/markets/bingo18-markets';

export const DEFAULT_PRESET_ID = 'bingo-120';

const BINGO18_TIER_TAX = { type: 'tier-tax' as const, threshold: '10.000.000', ratePercent: '10' };
const BINGO18_MARKETS = buildBingo18Markets(BINGO18_TIER_TAX);

export const BUILTIN_GAME_PRESETS: readonly GamePolicyPreset[] = [
  {
    id: 'bingo-120',
    name: 'Bingo ×120',
    category: 'Casino',
    gameId: 'bingo18',
    marketVersion: 1,
    markets: BINGO18_MARKETS,
    rewardMultiplier: '120',
    minimumBet: '10.000',
    maximumBet: '1.000.000',
    betStep: '10.000',
    rewardPolicy: { type: 'tier-tax', threshold: '10.000.000', ratePercent: '10' },
    continuePolicy: { maximumRounds: 5000, presets: [1000, 1500, 2000, 5000] },
    builtin: true,
  },
  {
    id: 'bingo-20',
    name: 'Bingo ×20',
    category: 'Casino',
    gameId: 'bingo18',
    marketVersion: 1,
    markets: buildBingo18Markets({ type: 'no-tax' }),
    rewardMultiplier: '20',
    minimumBet: '10.000',
    maximumBet: '500.000',
    betStep: '10.000',
    rewardPolicy: { type: 'no-tax' },
    continuePolicy: { maximumRounds: 3000, presets: [1000, 1500, 2000, 3000] },
    builtin: true,
  },
  {
    id: 'crash-195',
    name: 'Crash 1.95',
    category: 'Casino',
    rewardMultiplier: '1.95',
    minimumBet: '1.000',
    maximumBet: '500.000',
    betStep: '1.000',
    rewardPolicy: { type: 'no-tax' },
    continuePolicy: { maximumRounds: 2000, presets: [1000, 1500, 2000] },
    builtin: true,
  },
  {
    id: 'dice',
    name: 'Dice',
    category: 'Casino',
    rewardMultiplier: '2',
    minimumBet: '5.000',
    maximumBet: '200.000',
    betStep: '5.000',
    rewardPolicy: { type: 'no-tax' },
    continuePolicy: { maximumRounds: 1500, presets: [1000, 1500] },
    builtin: true,
  },
  {
    id: 'custom',
    name: 'Custom',
    category: 'Custom',
    rewardMultiplier: '120',
    minimumBet: '10.000',
    maximumBet: '1.000.000',
    betStep: '10.000',
    rewardPolicy: { type: 'tier-tax', threshold: '10.000.000', ratePercent: '10' },
    continuePolicy: { maximumRounds: 5000, presets: [1000, 1500, 2000, 5000] },
    builtin: true,
  },
];
