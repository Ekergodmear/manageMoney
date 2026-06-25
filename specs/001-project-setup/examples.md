# Spec 001 — Examples

No business examples in Sprint 1.

## Expected test output

```bash
pnpm test

 ✓ tests/architecture/import-rules.test.ts
   ✓ exists: src/application/strategy
   ✓ exists: src/core/solver
   …
```

## Expected package.json scripts snippet

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  }
}
```

## Non-example

Do not add sample `generateStrategy()` calls — no engine yet.
