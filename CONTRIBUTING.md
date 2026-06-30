# Contributing

Thank you for contributing to **Stake Planner**.

This repo contains two layers. Know which one you are changing:

```text
Platform changes     →  @stake/constraint-engine (src/public/, src/core/)
Product changes      →  Stake Planner app logic, CLI, workflows
UI changes           →  Screens, components, styling (src/features/, src/pages/)
```

| Layer        | Where                                | Question to ask                                           |
| ------------ | ------------------------------------ | --------------------------------------------------------- |
| **Platform** | `src/public/`, `src/core/`, `tests/` | Does this change the SDK contract or engine behavior?     |
| **Product**  | `apps/`, `examples/`, product flows  | Does this help users plan faster or with more confidence? |
| **UI**       | `src/features/`, `src/pages/`        | Is the experience clear in under 30 seconds?              |

---

## Platform changes

Read before editing the SDK:

1. [`PUBLIC_API.md`](PUBLIC_API.md) and [`API_FREEZE.md`](API_FREEZE.md) — capabilities are **frozen**.
2. [`docs/CORE-STABILITY.md`](docs/CORE-STABILITY.md) — frozen modules need a design gate.
3. [`docs/CODING-STANDARD.md`](docs/CODING-STANDARD.md).

Any change to `src/public/index.ts` is a **public contract change**:

- Run `pnpm verify` (includes compat snapshot tests).
- Update `PUBLIC_API.md` if the supported surface changes.
- Follow [`docs/COMPATIBILITY-POLICY.md`](docs/COMPATIBILITY-POLICY.md) for SemVer.

Do **not** add new platform capabilities without maintainer approval.

Refactors under `src/core/**` must not export implementation details from `src/public/`.

---

## Product & UI changes

No RFC required. Before starting a feature, answer:

1. What does the user want to do?
2. What friction do they have today?
3. How much faster or clearer is it after this change?
4. What gets worse if we skip it?

Product spec: [`docs/rfc/product/`](docs/rfc/product/README.md)  
Roadmap: [`ROADMAP.md`](ROADMAP.md)

Import **only** from `@stake/constraint-engine` in product code — no deep imports into `src/core/`.

---

## Development

```bash
pnpm install
pnpm verify
```

| Script               | Layer                              |
| -------------------- | ---------------------------------- |
| `pnpm build:lib`     | Platform → `dist/`                 |
| `pnpm build:app`     | Product UI → `dist-app/`           |
| `pnpm test`          | Platform tests                     |
| `pnpm test:property` | Platform property tests (optional) |

---

## Pull requests

- One concern per PR when possible.
- Platform PRs: include tests for behavior changes.
- Product/UI PRs: describe user outcome, not just implementation.
- Golden fixture updates require explicit justification (often MAJOR).

---

## Questions

Open an issue or discuss in the PR.

- **Platform:** cite `docs/MATHEMATICAL-SPECIFICATION.md`, `docs/CONTRACTS.md`
- **Product:** cite `docs/rfc/product/RFC-102-user-journey.md`
