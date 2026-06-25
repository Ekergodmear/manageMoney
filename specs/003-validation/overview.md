# Validation Taxonomy

See `docs/MATHEMATICAL-SPECIFICATION.md` §12.

| Layer            | Examples                              |
| ---------------- | ------------------------------------- |
| **Structural**   | undefined, NaN, Infinity, non-integer |
| **Business**     | rewardMultiplier ≤ 1, roundCount < 1  |
| **Mathematical** | overflow risk, infeasible target      |

Output on success: `ValidatedCalculationRequest`.
