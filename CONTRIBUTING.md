# Contributing

Thank you for contributing to the Calculation Engine SDK.

---

## Before you code

1. Read [`PUBLIC_API.md`](PUBLIC_API.md) and [`API_FREEZE.md`](API_FREEZE.md) — Core SDK v1 capabilities are **frozen**.
2. Read [`docs/CORE-STABILITY.md`](docs/CORE-STABILITY.md) — frozen modules need a design gate.
3. Read [`docs/CODING-STANDARD.md`](docs/CODING-STANDARD.md).

---

## Public API changes

Any change to `src/public/index.ts` is a **public contract change**:

- Run `pnpm verify` (includes compat snapshot tests).
- Update `PUBLIC_API.md` if the supported surface changes.
- Follow [`docs/COMPATIBILITY-POLICY.md`](docs/COMPATIBILITY-POLICY.md) for SemVer.
- Breaking architecture → ADR in `DECISIONS.md` (ADR-037).

Do **not** add new v1 capabilities without maintainer approval (`API_FREEZE.md`).

---

## Internal changes

Refactors under `src/core/**` are allowed with design gate for frozen modules.  
Do not export implementation details from `src/public/`.

---

## Development

```bash
pnpm install
pnpm verify
```

Optional property tests:

```bash
pnpm test:property
```

---

## Pull requests

- One concern per PR when possible.
- Include tests for behavior changes.
- Golden fixture updates require explicit justification (often MAJOR).

---

## Questions

Open an issue or discuss in the PR. For algorithm or contract questions, cite `docs/MATHEMATICAL-SPECIFICATION.md` and `docs/CONTRACTS.md`.
