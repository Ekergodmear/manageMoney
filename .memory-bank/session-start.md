# Session Start Checklist

## Doc Freeze (ACTIVE)

After Sprint 1 code begins, only edit:

- `progress.md`
- `current-task.md`
- `CHANGELOG.md`
- `TASKS.md`
- Current sprint folder in `specs/00X-*/`

Do **not** edit architecture, roadmap, contracts, decisions, or other memory-bank files unless ADR + user approval.

---

## What to Read (NOT entire Memory Bank)

### Global Memory (every session)

1. `project.md`
2. `architecture.md`
3. `coding-rules.md`
4. `business-rules.md`
5. `constraints.md`
6. `current-task.md`
7. `KNOWN_LIMITATIONS.md`

### Current Sprint Spec ONLY

Read all files in the active `specs/00X-*/` folder:

- `overview.md`
- `requirements.md`
- `acceptance.md`
- `examples.md`

### Do NOT Read

- Future spec folders
- Full ROADMAP
- Optimization / UI / Export specs (until that sprint)

---

## Agent Chain

```
Architect → Developer → Reviewer → QA → Release Manager → Done
```

Wait for user **Approved** before Implement.

---

## Prompt

```text
Read Global Memory + Current Sprint Spec ONLY.

Ignore future sprints.
Ignore unfinished roadmap.
Focus exclusively on current deliverables.
```
