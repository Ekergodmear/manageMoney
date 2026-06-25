# Cursor Workflow (Minimal)

**Stop adding workflow docs.** Fix problems when they appear in development.

---

## Read Scope

```text
Global Memory:
  project.md, architecture.md, coding-rules.md,
  business-rules.md, constraints.md, current-task.md,
  KNOWN_LIMITATIONS.md

+ specs/00X-current/ (all 4 files)

ONLY.
```

```text
Ignore future sprints.
Ignore unfinished roadmap.
Focus exclusively on current deliverables.
```

---

## Agent Chain

Architect → Developer → Reviewer → QA → **Release Manager** → Done

Rules: `00-architect`, `01-review-agent`, `02-qa-agent`, `03-release-manager`

---

## Sprint 1 — Active Spec

`specs/001-project-setup/`

Start: **Architect plan** → user Approved → Implement (max 3 files/response)

---

## Sprint 2.3 — Constraint Solver (4 rounds)

No TypeScript until:

1. Pseudo-code → approve
2. Flowchart → approve
3. **Manual calculation** (20x, 50 rounds, 100k profit) → approve
4. TypeScript

See `specs/004-constraint-solver/acceptance.md`

---

## Doc Freeze

After Sprint 1: only edit `progress.md`, `current-task.md`, `CHANGELOG.md`, `TASKS.md`, current spec folder.

---

## Spec Index

See `specs/README.md`
