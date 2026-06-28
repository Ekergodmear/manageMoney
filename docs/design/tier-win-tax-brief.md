# Tier Win Tax Brief

**Package:** `@stake/constraint-engine` (Platform) · **Product:** Stake Planner  
**Status:** **Implemented** — Phase 1 slice (linear gross + tier tax on net)  
**Parent:** [game-policy-brief.md](./game-policy-brief.md) §2.4, Phase 3

---

## 1. Rule (user-confirmed)

When the player **wins** a round:

```text
grossReward(bet) = bet × rewardMultiplier

if grossReward < threshold:
    netReward = grossReward
else:
    netReward = floor(grossReward × (1 − ratePercent / 100))
```

**Default preset (Stake Planner):**

| Field | Value |
| ----- | ----- |
| `threshold` | 10_000_000 (10 triệu VND) |
| `ratePercent` | 10 |

Tax applies to **total gross win**, not profit only.  
Below threshold: no tax. At or above: full gross is taxed.

**Example** (multiplier 120, bet 100_000):

| | Gross | Net |
| --- | --- | --- |
| No tax | 12_000_000 | 12_000_000 |
| With tax | 12_000_000 | 10_800_000 |

---

## 2. API surface

Optional field on `CalculationRequest`:

```ts
interface WinTax {
  readonly threshold: number;    // positive integer, VND
  readonly ratePercent: number;  // integer 1–99
}

interface CalculationRequest {
  // …existing fields…
  readonly winTax?: WinTax;
}
```

Omitted `winTax` → legacy linear behavior (regression M=20 byte-identical).

---

## 3. Solver contract

Profit at win round *i*:

```text
πᵢ = netReward(bᵢ) − (accumulatedSpentBefore + bᵢ)  ≥  P*
```

`rewardAmount` on each `Round` stores **`netReward(bet)`** (what the player actually receives).

Minimal feasible bet: piecewise — untaxed lattice solve when `gross < threshold`, taxed margin when `gross ≥ threshold`, plus boundary at threshold crossing.

---

## 4. Product UI

Stake Planner form (Vietnamese):

- Checkbox **Áp dụng thuế khi thắng lớn** (default on)
- **Ngưỡng thuế** — default 10_000_000
- **Thuế (%)** — default 10

---

## 5. Verification

- Regression: requests without `winTax` unchanged (M=20 golden fixtures)
- Tier tax: user scenario M=120, bet 100k, accumulated 11.86M → profit negative without tax correction; solver raises bet when tax enabled
- Monotonicity: higher bet → higher `netReward` (property test)

---

## 6. Out of scope

- Multiple tax tiers
- Tax on stake / profit-only
- `validatePlanning({ policy, calculation })` full GamePolicy translator (future)
