# Solver Golden Master Fixtures

Byte-stable expected `Strategy` output for ConstraintSolver regression tests.

**Status:** FROZEN — see ADR-033. Do not regenerate without PR justification.

## Files

| File                                    | Scenario                      |
| --------------------------------------- | ----------------------------- |
| `fixed-profit-x20-5-rounds.golden.json` | Fixed amount target, 5 rounds |
| `break-even-x20-5-rounds.golden.json`   | Break-even, 5 rounds          |
| `percentage-x20-3-rounds.golden.json`   | Percentage target, 3 rounds   |

## Updating a golden file

1. Confirm the output change is **intentional** (spec change via design gate, or bug fix with explanation).
2. Manually edit the `.golden.json` — **no** snapshot auto-update tooling.
3. PR description must state **why** `JSON.stringify(Strategy)` changed.

See `docs/RELEASE-RULES.md` Rule 1.
