# Arithmetic Migration Brief

**Package:** `@stake/constraint-engine`  
**Lane:** A (Platform)  
**Status:** **Implemented** — signed off 2026-06-25  
**Scope:** Representation change only — **no new features**, no solver algorithm change

---

## 1. Goal

Allow `rewardMultiplier` values with **up to 2 decimal places** (e.g. `1.95`, `9.8`, `19.6`) while preserving:

- Constructive proof and existing solver structure
- Integer-only monetary arithmetic (no IEEE float in solver paths)
- Deterministic output: valid input → pure solver → deterministic strategy
- Existing property, differential, and formal verification suites (extended, not replaced)

**Public contract (only):**

> `rewardMultiplier` supports up to **2 decimal places**.

Scale, fixed-point encoding, and internal constants are **implementation details** — not exported, not documented in `PUBLIC_API.md`, and not semver-breaking if changed later.

### Compatibility matrix

| Input | Supported |
| ----- | --------- |
| Integer multiplier (e.g. `20`, `35`) | ✅ |
| Decimal multiplier, ≤ 2 decimal places (e.g. `1.95`, `9.8`, `19.6`) | ✅ |
| More than 2 decimal places (e.g. `1.333`, `19.678`) | ❌ |

---

## 2. Representation

**Input surface:** `rewardMultiplier` remains `number` on `CalculationRequest` (e.g. `9.8`, `20`).

**Internal (solver only):** fixed-point encoding after validation passes.

| User value | Internal (example, scale = 100) |
| ---------- | ------------------------------- |
| `19.6`     | `Mᵢ = 1960`                     |
| `1.95`     | `Mᵢ = 195`                      |
| `9.8`      | `Mᵢ = 980`                      |
| `20`       | `Mᵢ = 2000`                     |

Internal scale is chosen by implementation (e.g. `100` for 2 decimal places). It may change without a public API bump.

**Reward (solver):**

```text
R = (b × Mᵢ) / scale          // scaled integer arithmetic — no IEEE float multiply
```

**Minimal feasible bet (solver):**

```text
// Today:  ceilToStep(A + P*, M − 1, S)
// After:  ceilToStep((A + P*) × scale, Mᵢ − scale, S)
```

`ceilDiv` / `ceilToStep` helpers unchanged — only scaled numerators/denominators.

---

## 3. Validation rules

**Principle:** reward rounding is **not** a solver concern. Validation checks **multiplier representability only** — not coupling to `betStep` or other request fields.

**Rejected:** Option B (floor reward) and Option C (round reward) in the solver — they would change I5 semantics and require proof revision.

### New rule (in addition to existing B001, S002, …)

| Rule | Layer | Check | Example failure |
| ---- | ----- | ----- | ----------------- |
| **Decimal precision** | structural | `rewardMultiplier` is exactly representable with **at most 2 decimal places** | `1.333`, `19.678` |

| Multiplier | Valid |
| ---------- | ----- |
| `1.95`     | ✅    |
| `19.6`     | ✅    |
| `9.80`     | ✅    |
| `1.333`    | ❌    |
| `19.678`   | ❌    |

The solver ensures integer rewards via scaled arithmetic over the `betStep` lattice. Validation does **not** inspect `betStep × rewardMultiplier`.

### Unchanged invariants

- I5: `Rᵢ = bᵢ × M` (exact integer) — scaled multiplication on the bet lattice
- I6: all amount fields are integers
- Solver trust boundary (ADR-027): no validation inside solver

### Pipeline

```text
validateCalculationRequest
  → ValidatedCalculationRequest   (M precision-safe)
  → solve                         (scaled integer arithmetic only)
  → buildStrategy / buildStatistics
```

---

## 4. Solver impact

| Area | Change |
| ---- | ------ |
| Algorithm / state machine | **None** |
| Constructive proof | **None** — scaled arithmetic preserves structure |
| `solve-minimal-feasible-bet.ts` | Pass scaled `Mᵢ − scale` instead of `M − 1` |
| `solve.ts` | Reward via `(bet × Mᵢ) / scale`, not `bet * M` |
| `integer-math.ts` | **No change** |
| `validateCalculationRequest` | New decimal-precision rule |
| `mathematical-rules.ts` | Overflow check uses scaled product, not float multiply |
| Public API types | **No change** to field names or shapes |
| `PUBLIC_API.md` | One line: up to 2 decimal places on `rewardMultiplier` |

**SemVer:** patch or minor (additive capability). Not major — no breaking public contract.

---

## 5. Verification plan

### Implementation order

```text
1. Representation
      ↓
2. Regression tests (M = 20)
      ↓
3. Validation
      ↓
4. Scaled solver
      ↓
5. Decimal smoke (9.8)
      ↓
6. Property + Differential
```

### Regression guarantee (first test)

```text
rewardMultiplier = 20

→ Strategy output must be byte-identical to pre-migration SDK output.
```

If `M = 20` differs by even one unit after migration, the migration has failed. Write this test before changing solver arithmetic.

| Step | Action |
| ---- | ------ |
| **Regression guarantee** | `M = 20` — byte-identical JSON to pre-migration baseline |
| Decimal smoke | Golden cases: `1.95`, `9.8`, `19.6`, `20.2` — no float artifacts (`9.8 × 12000` case) |
| Validation | Reject `1.333`, `19.678`; assert error `path` |
| Property tests | Extend `rewardMultiplier` arbitrary: integers + 2-decimal values |
| Differential | Re-run brute-force oracle on extended multiplier set |
| Formal / architecture | No proof rewrite; update `MATHEMATICAL-SPECIFICATION.md` §validation + I5 note only |
| Consumer | `examples/minimal-consumer` unchanged API; optional decimal example |

**Sign-off gate:** regression guarantee passes; decimal `9.8` case passes; validation rejects >2-decimal multipliers before `solve` is called.

---

## Out of scope

- Rational arithmetic / BigInt / Decimal.js as public dependency
- Changing `betStep` / `minimumBet` integer rules
- Product UI (`App.tsx`) — Lane B; accepts decimals only after this ships
- Feature 2 (optimize) — separate; inherits scaled solver automatically
