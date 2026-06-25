# Spec 001 — Acceptance Criteria

## Commands (all exit 0)

```bash
pnpm install
pnpm run lint          # zero warnings
pnpm run format:check
pnpm run typecheck     # zero TS warnings
pnpm run test
pnpm run build
pnpm run verify        # aggregate gate (check = alias)
```

## Quality gates

- [ ] No TypeScript warnings
- [ ] No ESLint warnings (`--max-warnings 0`)
- [ ] No business code in `src/core/**` (only `.gitkeep`)
- [ ] No stub `Not implemented` functions anywhere
- [ ] Path aliases work (smoke: optional tiny test importing `@/tests/architecture` path)
- [ ] Forbidden deps absent (tailwind, redux, jest…)
- [ ] `.vscode/` committed
- [ ] `.github/workflows/ci.yml` passes locally equivalent

## Structure

- [ ] All FOLDER-STRUCTURE folders exist
- [ ] Architecture tests pass

## Workflow

- [ ] Architect plan approved
- [ ] Review + QA + Release Manager pass
- [ ] One commit with conventional prefix
- [ ] CHANGELOG `[0.2.0] - Sprint 1`
- [ ] Update progress, current-task, TASKS only

## Stop

Do NOT start Sprint 2.1.

## Release Manager

Run `pnpm check`. Tag `v0.2.0` optional.
