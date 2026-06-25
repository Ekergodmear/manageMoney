# Review Checklist

Before considering a task complete, run a **Self Review** pass.
Do NOT modify code during review — only report findings.

Use this checklist after every Implement step.

---

## Architecture

- [ ] Does this violate Clean Architecture?
- [ ] Is business logic inside UI?
- [ ] Any duplicated code?

---

## Performance

- [ ] Any unnecessary loops?
- [ ] Any unnecessary allocations?

---

## Correctness

- [ ] Integer overflow?
- [ ] Rounding errors?
- [ ] Edge cases covered?
- [ ] Results match `examples.md` for same inputs?
- [ ] All `test-cases.md` scenarios accounted for?
- [ ] **All 7 invariants pass?** (`invariants.md`)
- [ ] Import direction matches `system-map.md`?

---

## Architecture (extended)

- [ ] No reverse imports (lower layer importing upper)?
- [ ] Module names match architecture (ConstraintSolver, not CalculationEngine)?

- [ ] Backward compatible?
- [ ] Matches `docs/CONTRACTS.md`?
- [ ] Stack matches `docs/TECH-STACK.md`?
- [ ] Paths match `docs/FOLDER-STRUCTURE.md`?
- [ ] Public interfaces documented (JSDoc)?
- [ ] No undocumented exported symbols?

---

## Testing

- [ ] Unit tests for every public function?
- [ ] Edge case tests?
- [ ] Invalid input tests?
- [ ] Tests use expected values from `test-cases.md`?

---

## Documentation

- [ ] Memory Bank updated?
- [ ] `progress.md` updated?
- [ ] `CHANGELOG.md` updated?
- [ ] `TASKS.md` status updated?
- [ ] `DECISIONS.md` / ADR updated if architecture changed?
- [ ] `docs/API.md` matches implementation?

---

## QA

- [ ] QA Agent pass (malicious input / edge cases)?
- [ ] Stress test Case 10 considered?

---

## Definition of Done

- [ ] All items in `done-definition.md` satisfied?

---

**Never mark a task complete until every item passes.**

After review, rate issues (Critical / High / Medium / Low) and wait for user approval before fixing.
