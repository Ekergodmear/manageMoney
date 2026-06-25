# SimulationEngine — Mapping Spec (Sprint 2.6)

**Status:** ✅ **FROZEN** — maintainer sign-off 2025-06-25  
**Authority:** ADR-036

---

## 1. Terminology

> **SimulationEngine interprets deterministic scenarios.**

`simulateWinAtRound` is **scenario evaluation**, not Monte Carlo / random simulation.  
Future probabilistic modules use different terminology to avoid concept collision.

---

## 2. Purpose

Deterministic **scenario interpreter** of `Strategy` — not executor, optimizer, or mutator.

```text
Strategy → interpret scenario → SimulationResult
```

Observational, never transformational (ADR-035 philosophy).

| Rule | Detail                                            |
| ---- | ------------------------------------------------- |
| R1   | Deterministic scenario interpreter — not executor |
| R2   | `Strategy` only — no `StrategyStatistics`         |
| R3   | `SimulationResult` ≠ `StrategyResult`             |
| R4   | No randomness                                     |
| R5   | Pure function — no cache / singleton / memo       |

**OptimizationEngine must not call SimulationEngine** (ADR-036).

---

## 3. API

```typescript
function simulateWinAtRound(
  strategy: Strategy,
  winAtRound: number,
): Result<SimulationResult, SimulationError>;
```

`SimulationError` describes invalid **scenario parameters** (optional alias: ScenarioError).

---

## 4. Models

```typescript
interface SimulationResult {
  readonly winningRoundIndex: number; // self-contained output
  readonly profitAmount: ProfitAmount; // terminal scenario profit (doc: terminalProfitAmount)
  readonly requiredBankrollAmount: BankrollAmount;
  readonly rounds: readonly RoundSimulation[];
}

interface RoundSimulation {
  readonly index: number;
  readonly result: RoundResult;
  readonly betAmount: BetAmount;
  readonly accumulatedSpent: BankrollAmount;
}
```

`RoundSimulation` is a **projection** — not a full `Round` copy. No `rewardAmount`. No `runningBalance` (visualization layer).

---

## 5. Scenario semantics — win at W

```text
Lose* → Win → NotPlayed*
```

**Invariant: exactly one `Win`.**

| Round index | Result      |
| ----------- | ----------- |
| `< W`       | `Lose`      |
| `= W`       | `Win`       |
| `> W`       | `NotPlayed` |

```text
requiredBankrollAmount = round[W].accumulatedSpent
profitAmount           = round[W].rewardAmount − round[W].accumulatedSpent
```

`profitAmount` = **terminal profit of scenario** — not cumulative strategy profit.

---

## 6. Errors

| Error                    | Condition                 |
| ------------------------ | ------------------------- |
| `EMPTY_STRATEGY`         | `rounds.length === 0`     |
| `WIN_ROUND_NOT_INTEGER`  | non-integer `winAtRound`  |
| `WIN_ROUND_OUT_OF_RANGE` | `winAtRound < 1` or `> N` |

---

## 7. Implementation

- Single O(N) loop
- Build `RoundSimulation[]` projection
- No Strategy mutation, no statistics, no cache, no random

Path: `src/core/simulation/`

---

## References

- ADR-035, ADR-036
- `docs/CORE-STABILITY.md`
- `docs/CONTRACTS.md` Contract 9
