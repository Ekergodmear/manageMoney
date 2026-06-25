# Definition of Done (DoD)

A task or mini-sprint is complete **ONLY IF** all conditions below are true.

Otherwise status remains **In Progress**.

---

## Build & Quality Gates

- [ ] Build passes
- [ ] Tests pass (including `tests/architecture/`)
- [ ] Lint passes
- [ ] Types pass (strict TypeScript, no `any`)
- [ ] Benchmarks pass (when engine exists)
- [ ] Tech stack matches `docs/TECH-STACK.md`

---

## Invariants & Constraints

- [ ] All 7 invariants in `invariants.md` verified
- [ ] All input constraints in `constraints.md` enforced by ValidationEngine
- [ ] Terminology matches `glossary.md` (Reward ≠ Profit)

---

## Memory Bank

- [ ] `progress.md` updated
- [ ] `current-task.md` updated (next task defined, not auto-started)
- [ ] `CHANGELOG.md` updated (Keep a Changelog format)
- [ ] `TASKS.md` status → Done with commit hash
- [ ] `DECISIONS.md` updated if architecture changed
- [ ] `docs/API.md` updated if public API changed

---

## Code Quality

- [ ] Public APIs documented (JSDoc)
- [ ] No `TODO` left in changed files
- [ ] No placeholder implementation
- [ ] No business logic in UI (if UI touched)
- [ ] Self Review completed (`review-checklist.md` — all items pass)
- [ ] QA Agent completed (no Critical/High issues open)

---

## Workflow

- [ ] Architect plan approved before implementation
- [ ] Review fixes approved (if any)
- [ ] QA findings addressed or explicitly accepted by user
- [ ] **One git commit** for this mini-sprint
- [ ] Did NOT auto-continue to next sprint/task

---

## Sprint-Specific (Engine)

After Sprint 2 mini-sprints:

- [ ] `docs/Algorithm.md` written
- [ ] `docs/Validation.md` written
- [ ] All `examples.md` values verified by tests
- [ ] All `test-cases.md` cases implemented

After Sprint 4 (Optimization):

- [ ] `docs/Optimization.md` written
- [ ] `docs/Mathematical-Proof.md` written

---

## Git Recovery Rule

If implementation drifts: checkout last good commit, reset `current-task.md`, retry.
Do not patch forward on broken architecture.

---

**If any checkbox is unchecked → sprint remains In Progress.**
