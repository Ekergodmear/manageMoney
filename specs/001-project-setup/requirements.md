# Spec 001 — Requirements

## Principle

**Sprint 1 = infrastructure only. Zero business code.**

### FORBIDDEN (no files, no placeholders)

- `calculateStrategy()`, `generateStrategy()`, `StrategyInput`
- `ValidationEngine`, `ConstraintSolver`, `SimulationEngine`, `StrategyBuilder`
- Stub exports such as `throw new Error('Not implemented')`
- Empty `.ts` files in `src/core/**` except none at all — folders stay `.gitkeep` only

---

## Must Deliver

### Config files

- [ ] `package.json` — pnpm, scripts (see below)
- [ ] `pnpm-lock.yaml`
- [ ] `tsconfig.json` — strict, zero TS warnings
- [ ] `vite.config.ts`
- [ ] `eslint.config.js` — flat, **zero ESLint warnings** (`--max-warnings 0`)
- [ ] `prettier.config.js`
- [ ] `vitest.config.ts`
- [ ] `.gitignore`

### Path aliases (only these)

```text
@/*              → src/*
@/core/*         → src/core/*
@/application/*  → src/application/*
@/features/*     → src/features/*
@/components/*   → src/components/*
@/hooks/*        → src/hooks/*
@/pages/*        → src/pages/*
@/tests/*        → tests/*
```

No `@/solver`, `@/models`, etc.

### Scripts (locked)

```json
{
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "lint": "eslint . --max-warnings 0",
  "lint:fix": "eslint . --fix",
  "format": "prettier --write .",
  "format:check": "prettier --check .",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage",
  "benchmark": "node -e \"console.log('benchmark: Sprint 2.5')\"",
  "verify": "pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && pnpm build",
  "check": "pnpm verify"
}
```

Release Manager runs `pnpm verify` (alias: `pnpm check`).

No `depcheck` in Sprint 1. Add **knip** in a later sprint if needed.

### Dev dependencies (Sprint 1)

TypeScript 5.x, Vite, Vitest, ESLint, Prettier, React 19 + react-dom (minimal Vite shell only).

**Do NOT add:** MUI, Zod, Tailwind, Redux, Jest, depcheck.

Use single `tsconfig.json` unless project references are truly required (no `tsconfig.node.json` by default).

### Minimal Vite shell (infrastructure, not business)

- `index.html`
- `src/main.tsx` — mount React
- `src/App.tsx` — static title only, e.g. "Stake Planner"

No engine imports. No `@/core` usage in App.

### VS Code

- [ ] `.vscode/settings.json` — format on save, ESLint, Prettier, TS SDK
- [ ] `.vscode/extensions.json` — recommended extensions

### GitHub CI

- [ ] `.github/workflows/ci.yml` — install, lint, typecheck, test, build (no deploy)

### Commit convention

```
feat: | fix: | refactor: | docs: | test: | chore: | ci: | build: | perf:
```

Sprint 1 commit: `chore: sprint(1) project foundation` or `build: sprint(1) project foundation`

### Folder structure

All paths in `docs/FOLDER-STRUCTURE.md` — `.gitkeep` only under `src/core/**`, `application/**`.

### Architecture smoke test

`tests/architecture/import-rules.test.ts` must pass.

---

## Must NOT

- Business logic or placeholder engine files
- Modify frozen docs
- Forbidden dependencies

## Package manager

**pnpm only.**
