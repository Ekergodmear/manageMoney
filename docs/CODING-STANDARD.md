# Coding Standard

**Status:** FROZEN — Sprint 0.5  
**Applies to:** All TypeScript in `src/`, `tests/`, `benchmarks/`

Complements `.memory-bank/coding-rules.md`. On conflict, **this file wins for style**; **coding-rules.md wins for architecture limits**.

---

## Imports

Order (separated by blank line):

1. Third-party (React, MUI, Zod…)
2. Internal aliases (`@/application/...`, `@/core/...`, `@/features/...`)
3. Relative (`./`, `../`)

```typescript
import { useMemo } from 'react';
import { Box } from '@mui/material';

import { generateStrategy } from '@/core/strategy';
import type { StrategyInput } from '@/core/types';

import { PlanSummary } from './PlanSummary';
```

**Rules:**

- Use `import type` for type-only imports
- No wildcard imports (`import * as X`) except MUI tree-shaking exceptions with ADR
- No circular imports — Review Agent must reject

---

## Exports

- **Always named export**
- **Never default export**

```typescript
// ✅ GOOD
export function generateStrategy(input: StrategyInput): StrategyResult {}

export const PLAN_STORE = 'plan-store';

// ❌ BAD
export default function generateStrategy() {}
```

Exception: Vite/React entry files (`main.tsx`) may use default export for framework requirement only — document in file comment.

### Barrel exports (`index.ts`)

Allowed **only at module boundaries**:

- `@/core/models/index.ts`
- `@/core/contracts/index.ts`
- `@/application/dto/index.ts` (when present)

**Forbidden:** `src/index.ts` or any barrel that re-exports entire layers.

---

## Variables

| Prefer                              | Avoid                                   |
| ----------------------------------- | --------------------------------------- |
| `const`                             | `let` (only when reassignment required) |
| `readonly` on interfaces/properties | Mutable when unnecessary                |
| `as const` for literal unions       | Magic strings                           |

**Never use `var`.**

---

## Types

| Prefer                        | Avoid                                             |
| ----------------------------- | ------------------------------------------------- |
| `interface` for object shapes | `type` for simple objects (either OK for objects) |
| `type` for unions and aliases | —                                                 |
| String union types            | `enum`                                            |

```typescript
// ✅ GOOD
export type ProfitMode = 'break-even' | 'fixed-profit' | 'percentage-profit';

// ❌ BAD
export enum ProfitMode {
  BreakEven = 'break-even',
}
```

---

## Functions

- Pure functions in `src/core/` — no side effects
- Max **60 lines** per function (see coding-rules.md)
- JSDoc on every **public** exported function
- Explicit return types on public API

```typescript
/**
 * Generates a deterministic staking plan.
 * @param input - Validated strategy constraints
 * @returns Full round table and summary
 */
export function generateStrategy(input: StrategyInput): StrategyResult {}
```

---

## React Components (Sprint 6+)

- Functional components only
- Max **200 lines** per component file
- No business logic — delegate to `@/core/` via hooks
- Props: `interface` + `readonly` fields

```typescript
interface PlanTableProps {
  readonly rows: readonly RoundResult[];
}

export function PlanTable({ rows }: PlanTableProps): JSX.Element {}
```

---

## Naming

| Item               | Convention                 | Example                                   |
| ------------------ | -------------------------- | ----------------------------------------- |
| Files (core)       | kebab-case                 | `solver.ts`, `validate-strategy-input.ts` |
| Files (components) | PascalCase                 | `PlanTable.tsx`                           |
| Functions          | camelCase                  | `generateStrategy`                        |
| Types/Interfaces   | PascalCase                 | `StrategyInput`                           |
| Constants          | UPPER_SNAKE                | `MAX_ROUNDS`                              |
| Test files         | `*.test.ts` / `*.test.tsx` | `solver.test.ts`                          |

---

## Error Handling

- **Core:** return `Result<T, E>` — **never throw** in public API
- **Application:** propagate `Result` or map to `ApplicationError`
- **UI:** display user-friendly messages — never expose stack traces
- Never empty `catch` blocks

```typescript
export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };
```

See `docs/CONTRACTS.md` Contract 0.

---

## Numbers / Money

- Integers for Bet, Reward, Spent, Profit
- ROI may be `number` (float) for display
- See `invariants.md`

---

## Comments

- Explain **why**, not **what**
- No commented-out code in commits
- No TODO in merged code — use `TASKS.md`

---

## Git / Commits

- One mini-sprint = one commit
- Message format: `sprint(X.Y): description`
- No unrelated changes in sprint commits

---

_ESLint + Prettier configs in Sprint 1 enforce these automatically where possible._
