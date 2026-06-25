# ConstraintSolver — Coding Rules

**Status:** FROZEN — Production Ready (ADR-033). Do not modify without design gate.  
**Scope:** `src/core/solver/**` only — **not** project-wide.  
**Authority:** ADR-031, ADR-033, algorithm paper §10, frozen pseudo-code (2.3B)

---

## Pure function

ConstraintSolver is a **pure function over immutable input**:

- No mutation of `ValidatedCalculationRequest`
- No I/O, `Date`, `Math.random`, env reads
- Same input → same `Strategy` (deterministic)

---

## 1:1 name mapping (2.3E — mandatory)

Implementation MUST mirror frozen pseudo-code names. Do not rename for style.

| Pseudo-code                  | TypeScript                  |
| ---------------------------- | --------------------------- |
| `AccumulatedSpentBefore`     | `accumulatedSpentBefore`    |
| `AccumulatedSpentAfter`      | `accumulatedSpentAfter`     |
| `SOLVE_MINIMAL_FEASIBLE_BET` | `solveMinimalFeasibleBet()` |
| `RESOLVE_TARGET`             | `resolveTarget()`           |
| `CEIL_DIV`                   | `ceilDiv()`                 |
| `CEIL_TO_STEP`               | `ceilToStep()`              |
| `FLOOR_DIV`                  | `floorDiv()`                |

`Round.accumulatedSpent` stores **`accumulatedSpentAfter`** (`Aᵢ`).

---

## State machine loop

The solver is a **sequential state machine**. The round loop MUST use an explicit indexed loop:

```typescript
// ✅ Required pattern — maps to pseudo-code §4
for (let i = 1; i <= roundCount; i++) {
  const accumulatedSpentBefore = accumulatedSpent;
  const pStar = resolveTarget(targetProfit, accumulatedSpentBefore);
  const bet = solveMinimalFeasibleBet(accumulatedSpentBefore, pStar, m, bMin, s);
  const reward = bet * m;
  const accumulatedSpentAfter = accumulatedSpentBefore + bet;
  accumulatedSpent = accumulatedSpentAfter;
  // push Round { accumulatedSpent: accumulatedSpentAfter }
}
```

### Forbidden on solver hot path

```typescript
rounds.forEach(...)
rounds.map(...)
rounds.reduce(...)
Array.from(...).map(...)
```

**Why:** Sequential state machine — proof, debug, benchmark, and formal verification map 1:1 to `for i = 1..N`.

**Rule:** Specification drives implementation — never the reverse.  
If implementation requires pseudo-code change: stop code → amend frozen docs → re-approve gate → resume.

---

## No re-validation

Do not guard `roundCount`, `multiplier`, `betStep`, etc. inside solver — ADR-027.

---

## No statistics

Do not compute `requiredBankrollAmount`, averages, or metadata inside solver — StatisticsBuilder (Sprint 2.5).

---

## Integer arithmetic

Use integer `ceilDiv` / `ceilToStep` — no floating-point money intermediates (algorithm paper §8).
