# Specs

Per-sprint specifications. **Cursor reads Global Memory + current spec ONLY.**

Do not read future specs. Do not read full ROADMAP during implementation.

---

## Doc Freeze (active after Sprint 1 code starts)

After Sprint 1, **only these files may change each sprint:**

- `.memory-bank/progress.md`
- `.memory-bank/current-task.md`
- `CHANGELOG.md`
- `TASKS.md`

**Frozen unless ADR + user approval:**

- Architecture, ROADMAP, Memory Bank (other files), FOLDER-STRUCTURE, CONTRACTS, DECISIONS

**Specs:** update only the **current** sprint spec during that sprint.

---

## Global Memory (read every session)

```
.memory-bank/project.md
.memory-bank/architecture.md
.memory-bank/coding-rules.md
.memory-bank/business-rules.md
.memory-bank/constraints.md
.memory-bank/current-task.md
KNOWN_LIMITATIONS.md
```

Plus **one spec folder** below.

---

## Spec Index

| Folder                    | Sprint | Scope                                          |
| ------------------------- | ------ | ---------------------------------------------- |
| `001-project-setup/`      | 1      | pnpm, Vite, configs, folders                   |
| `002-models/`             | 2.1    | Domain models, Result, StrategyAlgorithm       |
| `003-validation/`         | 2.2    | ValidationEngine                               |
| `004-constraint-solver/`  | 2.3    | ConstraintSolver (6-step algorithm paper gate) |
| `005-strategy-builder/`   | 2.4    | StrategyBuilder (transform only)               |
| `006-statistics-builder/` | 2.5    | StatisticsBuilder (derived metrics)            |
| `006-simulation/`         | 2.6    | SimulationEngine                               |
| `007-optimization/`       | 3      | OptimizationEngine                             |

Sprint 4+ specs added when those sprints start.

---

## Prompt Template

```text
Read Global Memory + specs/00X-current/ ONLY.

Ignore future sprints.
Ignore unfinished roadmap.
Focus exclusively on current deliverables.
```

---

## Each Spec Contains

| File              | Purpose                 |
| ----------------- | ----------------------- |
| `overview.md`     | What and why            |
| `requirements.md` | Must-have behavior      |
| `acceptance.md`   | Done criteria           |
| `examples.md`     | Concrete inputs/outputs |
