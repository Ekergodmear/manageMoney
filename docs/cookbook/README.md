# SDK Cookbook

**Audience:** Developers building apps on `@stake/constraint-engine`.  
**Not for:** Internal architecture — see `docs/CORE-STABILITY.md` and RFCs.

Install and build once:

```bash
pnpm add @stake/constraint-engine
# monorepo: pnpm build:lib
```

Import **only** from the package entry:

```typescript
import { validateCalculationRequest, solve, /* … */ } from '@stake/constraint-engine';
```

---

## Getting Started (5 minutes)

1. Define a `CalculationRequest` (reward multiplier, rounds, bets, target profit).
2. **Generate** — validate → solve → build strategy → build statistics.
3. Compare `statistics.requiredBankrollAmount` with the user's budget.
4. If over budget → **optimize** for a suggested plan.
5. **Simulate** a win scenario to build confidence.
6. **Export** strategy + statistics as JSON for storage or sharing.

Runnable reference: [`examples/minimal-consumer/index.ts`](../../examples/minimal-consumer/index.ts)

```bash
pnpm example:minimal-consumer
```

---

## Common Workflows

| Recipe | When to use |
| ------ | ----------- |
| [Generate a plan](generate-plan.md) | User submits inputs — first screen |
| [Optimize for bankroll](optimize-for-bankroll.md) | Required bankroll exceeds budget |
| [Run simulation](run-simulation.md) | Show “what if I win at round _k_?” |
| [Export JSON](export-json.md) | Persist or share a plan |
| [Error codes](error-codes.md) | Map engine codes → UI copy |

---

## Product workflow (RFC-102)

```text
Generate  →  (need optimize?)  →  Suggested Plan  →  Simulation  →  Export
```

All steps use the public API only — no deep imports.
