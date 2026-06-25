# Technology Stack

**Status:** FROZEN — Sprint 0.5  
**Last Updated:** 2025-06-25

AI must NOT add, replace, or upgrade libraries without ADR + user approval.

---

## Runtime

- **Node.js 22 LTS**

---

## Language

- **TypeScript 5.x**
- `strict: true` — always enabled
- No `any`, no `@ts-ignore`, no `@ts-expect-error` without ADR

---

## Package Manager

- **pnpm** only
- Do NOT use npm or yarn for this project
- Lockfile: `pnpm-lock.yaml`

---

## Frontend (Sprint 6+)

| Concern           | Choice              | Notes                      |
| ----------------- | ------------------- | -------------------------- |
| Framework         | **React 19**        | Functional components only |
| Bundler           | **Vite**            | Dev + production build     |
| UI Library        | **Material UI v7**  | Theme system only          |
| Icons             | **Lucide**          | Via `lucide-react`         |
| State             | **Zustand**         | Global UI state            |
| Forms             | **React Hook Form** | All forms                  |
| Client validation | **Zod**             | Form + shared schemas      |
| Charts            | **Recharts**        | Sprint 7                   |
| Tables            | **TanStack Table**  | Data grids                 |

---

## Theme Policy

- **Material UI only**
- **No Tailwind CSS**
- **No Bootstrap**
- **No Chakra UI**
- **No Ant Design**
- **No CSS-in-JS libraries outside MUI system**

---

## Testing

| Layer              | Tool                                           |
| ------------------ | ---------------------------------------------- |
| Unit / Integration | **Vitest**                                     |
| Component          | **Testing Library** (`@testing-library/react`) |
| Architecture       | Custom rules in `tests/architecture/`          |
| Benchmark          | Vitest bench or Node scripts in `benchmarks/`  |

**Do NOT use:** Jest, Mocha, Cypress (unless ADR for E2E later).

---

## Code Quality

| Tool           | Purpose                        |
| -------------- | ------------------------------ |
| **ESLint**     | Linting (flat config)          |
| **Prettier**   | Formatting                     |
| **TypeScript** | Type checking (`tsc --noEmit`) |

**Do NOT disable rules** inline or in config without ADR.

---

## Build

- **Vite** — single build tool for app
- Path aliases via `tsconfig.json` + `vite.config.ts`

---

## Folder Organization

- **Layer-first:** pages → features → application → core
- **Feature modules:** `src/features/planner/`
- **Orchestration:** `src/application/strategy/`
- Structure **locked** — see `docs/FOLDER-STRUCTURE.md`

---

## Database

| Phase            | Choice                      |
| ---------------- | --------------------------- |
| MVP (Sprint 1–8) | **None** — client-side only |
| Future v2        | SQLite (local)              |
| Future v3        | PostgreSQL (cloud)          |

**Do NOT add** Prisma, Drizzle, or database drivers in MVP.

---

## Forbidden Without ADR

| Category    | Forbidden                                      |
| ----------- | ---------------------------------------------- |
| State       | Redux, MobX, Recoil, Jotai                     |
| UI          | Tailwind, Bootstrap, Chakra, shadcn as primary |
| Forms       | Formik                                         |
| Validation  | Yup, Joi (use Zod)                             |
| Test        | Jest                                           |
| Package mgr | npm, yarn                                      |
| ORM         | Any (MVP)                                      |

---

## Path Aliases (Sprint 1)

| Alias                     | Path                        |
| ------------------------- | --------------------------- |
| `@/`                      | `src/`                      |
| `@/application/*`         | `src/application/*`         |
| `@/core/models`           | `src/core/models`           |
| `@/core/algorithms`       | `src/core/algorithms`       |
| `@/core/validation`       | `src/core/validation`       |
| `@/core/solver`           | `src/core/solver`           |
| `@/core/strategy-builder` | `src/core/strategy-builder` |
| `@/core/simulation`       | `src/core/simulation`       |
| `@/core/optimization`     | `src/core/optimization`     |
| `@/core/report`           | `src/core/report`           |
| `@/core/utils`            | `src/core/utils`            |
| `@/features/*`            | `src/features/*`            |
| `@/components/*`          | `src/components/*`          |
| `@/hooks/*`               | `src/hooks/*`               |
| `@/pages/*`               | `src/pages/*`               |

---

## Scripts (Sprint 1 deliverables)

| Script         | Command               |
| -------------- | --------------------- |
| `dev`          | Vite dev server       |
| `build`        | Vite production build |
| `preview`      | Vite preview          |
| `lint`         | ESLint                |
| `format`       | Prettier check        |
| `format:write` | Prettier write        |
| `typecheck`    | `tsc --noEmit`        |
| `test`         | Vitest run            |
| `test:watch`   | Vitest watch          |
| `benchmark`    | Run `benchmarks/`     |

---

## Version Pinning Policy

- Pin major versions in `package.json`
- Upgrades require: ADR entry + full test pass + user approval

---

_Violating this document is a Review-blocking defect._
