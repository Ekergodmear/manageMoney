# Known Limitations

**Status:** FROZEN — do not "fix" these with unapproved features.

Stake Planner is a **deterministic constraint solver** for bankroll distribution. It is NOT a gambling prediction system.

---

## Current Limitations (MVP)

| Limitation                | Detail                                                                                                          |
| ------------------------- | --------------------------------------------------------------------------------------------------------------- |
| No probability model      | Win/loss probability is not modeled or estimated                                                                |
| No Kelly Criterion        | Not implemented; do not add without ADR + spec                                                                  |
| No Monte Carlo            | No random simulation or probabilistic optimization                                                              |
| No multi-player strategy  | Single-user bankroll only                                                                                       |
| No distributed solving    | Single-process, in-memory only                                                                                  |
| No GPU optimization       | CPU only                                                                                                        |
| No cloud sync             | Client-side / local only in MVP                                                                                 |
| No database               | No persistence in MVP                                                                                           |
| No decimal bets           | Integer monetary values only                                                                                    |
| Amount types are aliases  | `BetAmount = number` today; may migrate to branded types in a future major version — see `KNOWN_LIMITATIONS.md` |
| No live odds              | Fixed payout multiplier only                                                                                    |
| No Martingale as strategy | May simulate for education later — not a solver mode today                                                      |

---

## Amount Type Roadmap

Amount value objects (`BetAmount`, `RewardAmount`, etc.) are currently plain `number` aliases.

They may migrate to **branded types** in a future major version:

```typescript
type Brand<K, T> = K & { readonly __brand: T };
type BetAmount = Brand<number, 'BetAmount'>;
```

This will let the compiler reject passing `RewardAmount` where `BetAmount` is required. No migration until a planned major version bump + ADR.

---

- Calculates bet sequence under user constraints
- Validates inputs per `constraints.md`
- Satisfies invariants per `invariants.md`
- Returns `Result<T,E>` — deterministic output

---

## AI Instructions

**Do NOT:**

- Add "smart" features that imply winning probability
- Implement Kelly, Monte Carlo, or ML without explicit sprint spec
- Expand scope to "make it more intelligent"
- Work around limitations silently

**If user requests a limited feature:** create new spec folder + ADR, do not patch engine ad hoc.

---

_Update only when a limitation is officially removed in CHANGELOG._
