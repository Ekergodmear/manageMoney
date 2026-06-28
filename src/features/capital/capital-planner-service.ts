import type {
  CapitalPlannerInput,
  CapitalPlannerResult,
  CapitalSessionRecommendation,
  SafetyLevel,
} from '@/features/capital/capital-planner-types';
import type { PlannerFormValues } from '@/features/planner/plan-service';
import {
  searchStrategyCandidates,
  type StrategyCandidate,
} from '@/features/planning-strategy/planning-strategy-engine';
import {
  getStrategyProfile,
  pickBestCandidate,
  profitCandidates,
  roundCandidates,
  sessionSlices,
  shouldUseMultiSession,
  usableBankroll,
} from '@/features/planning-strategy/strategy-profiles';

function safetyLevel(required: number, budget: number): SafetyLevel {
  if (budget <= 0) {
    return 'risky';
  }
  const ratio = required / budget;
  if (ratio <= 0.75) {
    return 'safe';
  }
  if (ratio <= 0.95) {
    return 'tight';
  }
  return 'risky';
}

function toRecommendation(
  candidate: StrategyCandidate,
  label: string,
  allocatedCapital: number,
): CapitalSessionRecommendation {
  return {
    id: crypto.randomUUID(),
    label,
    allocatedCapital,
    targetProfit: candidate.profit,
    roundCount: candidate.rounds,
    requiredBankroll: candidate.requiredBankroll,
    maxBet: candidate.maxBet,
    safety: safetyLevel(candidate.requiredBankroll, allocatedCapital),
    formValues: candidate.formValues,
    result: candidate.result,
  };
}

function findBestForSlice(
  baseForm: PlannerFormValues,
  sliceAmount: number,
  profile: ReturnType<typeof getStrategyProfile>,
  risk: CapitalPlannerInput['risk'],
): StrategyCandidate | null {
  const candidates = searchStrategyCandidates(
    baseForm,
    sliceAmount,
    roundCandidates(profile),
    profitCandidates(profile, risk, sliceAmount),
  );
  return pickBestCandidate(candidates, profile);
}

function buildSingleRecommendation(
  input: CapitalPlannerInput,
  budget: number,
): CapitalSessionRecommendation | null {
  const profile = getStrategyProfile(input.strategy);
  const best = findBestForSlice(input.baseForm, budget, profile, input.risk);
  if (best === null) {
    return null;
  }
  return toRecommendation(best, 'Khuyến nghị', budget);
}

function buildMultiRecommendations(input: CapitalPlannerInput): CapitalSessionRecommendation[] {
  const profile = getStrategyProfile(input.strategy);
  const slices = sessionSlices(profile, input.bankroll);
  const balancedProfile = getStrategyProfile('balanced');
  const recommendations: CapitalSessionRecommendation[] = [];

  for (const slice of slices) {
    const best = findBestForSlice(input.baseForm, slice.amount, balancedProfile, input.risk);
    if (best === null) {
      continue;
    }
    recommendations.push(toRecommendation(best, slice.label, slice.amount));
  }

  return recommendations;
}

export function planCapitalStrategy(input: CapitalPlannerInput): CapitalPlannerResult | null {
  if (input.bankroll <= 0) {
    return null;
  }

  const profile = getStrategyProfile(input.strategy);
  const usable = usableBankroll(profile, input.risk, input.bankroll);
  const singleBest = buildSingleRecommendation(input, usable);

  const useMulti = shouldUseMultiSession(profile, input.bankroll, input.risk);

  const recommendations = useMulti
    ? buildMultiRecommendations(input)
    : singleBest !== null
      ? [singleBest]
      : [];

  if (recommendations.length === 0) {
    return null;
  }

  const allocated = recommendations.reduce((sum, r) => sum + r.requiredBankroll, 0);
  const reserve = Math.max(0, input.bankroll - allocated);
  const totalTargetProfit = recommendations.reduce((sum, r) => sum + r.targetProfit, 0);

  return {
    totalBankroll: input.bankroll,
    usableBankroll: usable,
    reserve,
    strategy: input.strategy,
    risk: input.risk,
    presetId: input.presetId,
    recommendations,
    totalTargetProfit,
    singleBest,
  };
}
