# Domain Knowledge

Stake Planner does NOT increase winning probability.

It only distributes bankroll.

Winning probability is independent between rounds.

The optimizer minimizes bankroll while satisfying constraints.

## Definitions

### Round

One betting attempt.

### Bet

Money placed in a round.

### Reward

Money received after winning.

### Profit

Reward - TotalSpent

### Capital

Total money invested.

### Strategy

A **deterministic sequence of bets** wrapped in the `Strategy` domain model.

Built by **StrategyBuilder** from ConstraintSolver output.

---

### ConstraintSolver

Pure math module. Does not format output for UI.

---

### StrategyBuilder

Transforms solver output into `Strategy` model for UI, export, and simulation.
