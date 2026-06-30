# Cloud Backend — Thiết kế (chưa implement)

**Trạng thái:** Thiết kế **đã khóa** (rev 4) — implement **sau Internal RC Stable** (xem [`stability-gate.md`](../release/stability-gate.md)).

**Nguyên tắc:** Backend **chỉ mirror dữ liệu** — Cloud Layer mỏng, "ngu ngốc". Không solve, không optimize, không simulate, không domain events. **Không import domain client.**

---

## Kiến trúc cuối (offline-first)

```text
                           Stake Planner

                    ┌─────────────────────┐
                    │      apps/web       │
                    │ React + Vite        │
                    └─────────┬───────────┘
                              │
               Constraint Engine / SDK (local)
                              │
                     PersistenceService
                              │
                 IndexedDB (Source of Truth)
                              │
                       SyncService (queue)
                              │
                    packages/contracts
                              │
                HTTPS (Bearer Supabase JWT)
                              │
                    ┌─────────▼─────────┐
                    │      apps/api     │
                    │ Hono + Prisma     │
                    └─────────┬─────────┘
                              │
                        SessionStore
                              │
                    Supabase PostgreSQL
```

**Production:** Supabase Database (PostgreSQL được quản lý) + Hono API trên Railway / Fly.io / Render. **Không** tự vận hành PostgreSQL production.

**Local dev:** `docker/postgres/compose.yaml` — chỉ phát triển và test.

**Vì sao Hono:** Server không chứa domain. Hono = ít boilerplate, startup/build nhanh, deploy đơn giản.

---

## Monorepo

```text
stake-planner/
├── apps/
│   ├── web/                  ← React (hiện tại)
│   └── api/                  ← Hono (Node)
├── packages/
│   ├── constraint-engine/
│   ├── sdk/
│   └── contracts/            ← API contract only (KHÔNG shared-types)
└── docker/
    ├── postgres/
    └── compose.yaml
```

**Không** `packages/shared-types` — tránh coupling domain client ↔ server.

---

## Ba lớp type (tách biệt)

| Lớp              | Thuộc                              | Ví dụ                                                         |
| ---------------- | ---------------------------------- | ------------------------------------------------------------- |
| **Domain model** | Client (`apps/web`)                | `Session`, `Plan`, `RecommendationSet`, `GamePolicy`          |
| **API contract** | `packages/contracts`               | `SessionDto`, `UpdateSessionRequest`, `UpdateSessionResponse` |
| **Engine types** | `packages/sdk` / constraint-engine | `CalculationRequest`, `Strategy`, `Statistics`                |

Backend **không biết domain version** — chỉ biết `SessionRecord`:

```ts
interface SessionRecord {
  id: string;
  userId: string;
  version: number; // optimistic lock — không phải domain version
  schemaVersion: number; // client payload shape — server không interpret
  payload: unknown; // opaque JSON — không deserialize
  updatedAt: Date;
}
```

**Không có** trên server: `Session` · `Plan` · `Timeline` · `Statistics` · `RecommendationSet`.

Refactor Session ở client 20 lần → backend **không cần build lại**, miễn client migrate `payload` theo `schemaVersion`.

Client map: `Session` (domain) ↔ `payload` (wire) trong `SyncService` → `CloudAdapter`.

---

## Luồng đồng bộ (client → cloud)

```text
PersistenceService
      ↓
SyncService (queue, debounce, conflict UI)
      ↓
CloudAdapter          ← swap provider tại đây
      ↓
packages/contracts    (DTO only)
      ↓
Hono API
      ↓
SessionStore → Prisma → PostgreSQL
```

### CloudAdapter (pattern khóa)

`SyncService` không gọi HTTP trực tiếp. Nó gọi `CloudAdapter`:

```text
SyncService → CloudAdapter → (Hono API | Supabase REST | tRPC | …)
```

Đổi provider sau này → chỉ thay Adapter. `PersistenceService` không đổi.

Phase 1: `HonoCloudAdapter` implement interface chung (sessions · presets · settings).

---

## Stack

| Layer     | Công nghệ                                                    |
| --------- | ------------------------------------------------------------ |
| API       | **Hono** (`/api/v1`)                                         |
| Runtime   | Node.js                                                      |
| ORM       | Prisma (`apps/api/prisma/migrations/`)                       |
| DB (prod) | **Supabase Database** (managed PostgreSQL)                   |
| DB (dev)  | Docker Postgres (`docker/postgres/`)                         |
| API host  | Railway · Fly.io · Render (chọn khi deploy)                  |
| Auth      | **Supabase Auth** — API chỉ verify JWT; không login endpoint |
| Log       | **Pino** (`hono-pino` hoặc middleware tương đương)           |
| Infra     | `docker/compose.yaml` (không để Docker ở root)               |
| Docs      | OpenAPI `/api/docs`                                          |
| CI        | GitHub Actions (lint + test)                                 |

**Không dùng:** NestJS, Firebase, tự viết JWT/password, Solver trên server, Supabase Functions thay backend đầy đủ.

### Supabase Auth

```text
React → Supabase Auth → JWT → Authorization: Bearer → API verify
```

- OAuth, email login, password reset, refresh — Supabase lo
- API **không** quản lý danh tính, chỉ quản lý dữ liệu
- Không `POST /auth/login` · `POST /auth/register`
- Phase 1: `GET /api/v1/auth/me` — profile từ token đã verify

---

## `packages/contracts` — DTO only (ranh giới cứng)

**Có:**

```ts
UpdateSessionRequest · UpdateSessionResponse
CreatePresetRequest · PresetDto
HealthResponse · ConflictResponse
```

**Không export:**

```ts
Session · Plan · Timeline · Statistics · RecommendationSet
```

Contract tests (`apps/api/tests/contract/`) đảm bảo OpenAPI ↔ `contracts` khớp.

---

## Layout (`apps/api/src`)

```text
index.ts              ← serve (Node)
app.ts                ← Hono app + mount routes
routes/
  sessions.ts
  presets.ts
  settings.ts
  auth.ts
  health.ts
middleware/
  auth.ts             ← verify Supabase JWT
  error.ts
stores/
  session-store.ts
  preset-store.ts
  settings-store.ts
lib/
  prisma.ts
  env.ts
```

**Naming:** `SessionStore` / `PresetStore` / `SettingsStore` — persistence only. Tránh nhầm `SessionRepository` client (domain + Unit of Work).

### SessionStore — chỉ CRUD

```text
list(userId)
load(id, userId)
save(record)
delete(id, userId)
```

**Không có** domain methods: `archive()` · `favorite()` · `duplicate()` — đó là client.

Không module/decorator Nest — route handler gọi store trực tiếp:

```ts
app.patch('/api/v1/sessions/:id', authMiddleware, async (c) => { ... });
```

**Phase 1 API — không có:** `telemetry/`, `devices/` routes, realtime, share.

---

## Prisma models

`userId` lấy từ Supabase JWT — **không bảng User** cho đến khi cần metadata riêng.

```prisma
model Session {
  id            String    @id
  userId        String
  version       Int
  payload       Json
  schemaVersion Int
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  lastSyncedAt  DateTime?

  @@index([userId])
}

model Preset {
  id            String   @id
  userId        String
  name          String
  payload       Json
  schemaVersion Int
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([userId])
}

model Setting {
  userId        String   @id
  payload       Json
  schemaVersion Int
  updatedAt     DateTime @updatedAt
}

model Device {
  id         String   @id
  userId     String
  name       String?
  lastSeenAt DateTime?
  createdAt  DateTime @default(now())

  @@index([userId])
}
```

- `Device` — migration sẵn; **API routes Phase 2**
- `payload` — opaque JSON (client aggregate serialized)
- `schemaVersion` — client payload shape version (không validate nội dung Plan)

Migrations: `apps/api/prisma/migrations/` — không lẫn source.

---

## API mỏng — validation giới hạn

```http
PATCH /api/v1/sessions/:id
```

```json
{
  "version": 14,
  "schemaVersion": 1,
  "payload": { "... opaque client aggregate ..." }
}
```

Server **chỉ** validate:

- `version` (number, required)
- `schemaVersion` (number, required)
- required fields có mặt
- JSON hợp lệ (syntax)
- ownership (`userId` từ JWT)

Server **không** validate:

- `Plan`
- `Timeline`
- `Statistics`
- `RecommendationSet`

Đó là việc của client.

---

## API Phase 1 (giới hạn rõ)

| Nhóm     | Endpoints                                  |
| -------- | ------------------------------------------ |
| Auth     | `GET /api/v1/auth/me` (từ token)           |
| Session  | CRUD + sync via `PATCH` với version        |
| Preset   | CRUD                                       |
| Settings | `GET` · `PATCH`                            |
| Health   | `GET /health` · `GET /ready` · `GET /live` |
| Docs     | OpenAPI `/api/docs`                        |

**Hết Phase 1.** Không Share, Devices API, Realtime, Telemetry API, Logger API, AI, Solver API.

**Sau Bingo18 (mở rộng):** Draw History + Collector API — xem [`bingo18-integration.md`](bingo18-integration.md). Session mirror vẫn opaque.

### Session routes

```text
GET    /api/v1/sessions
GET    /api/v1/sessions/:id
POST   /api/v1/sessions
PATCH  /api/v1/sessions/:id      ← sync + update
DELETE /api/v1/sessions/:id
```

### Preset routes

```text
GET    /api/v1/presets
POST   /api/v1/presets
PATCH  /api/v1/presets/:id
DELETE /api/v1/presets/:id
```

### Sync / conflict

| Điều kiện                    | Kết quả             |
| ---------------------------- | ------------------- |
| `body.version == db.version` | 200 OK, `version++` |
| `body.version != db.version` | **409 Conflict**    |

Không merge. Không CRDT. Client resolve.

---

## Backend logging — không Domain Events

| Client EventBus                                     | Backend                  |
| --------------------------------------------------- | ------------------------ |
| `PlanGenerated` · `SessionCreated` · `PlanPromoted` | **Không có**             |
| Telemetry · Insights đọc Session local              | **Không sync telemetry** |

Backend chỉ log (Pino):

- HTTP request / response
- `409 Conflict`
- Storage / DB errors

Cloud không subscribe Event Bus. Giữ Cloud hoàn toàn "ngu ngốc".

**Telemetry:** local only — không cần cloud, tốn storage, Insights đọc từ Session là đủ.

---

## Health (Kubernetes-ready)

```text
GET /health   — tổng quan
GET /ready    — DB connected, sẵn sàng nhận traffic
GET /live     — process alive
```

---

## Testing

```text
apps/api/tests/
├── integration/    ← Prisma + fetch/supertest against Hono app
└── contract/     ← OpenAPI ↔ packages/contracts
```

Ít unit test — business logic gần như không có trên server. Integration + contract là trọng tâm.

---

## Docker (local dev only)

```text
docker/
├── postgres/
│   └── ...           ← init scripts nếu cần
└── compose.yaml      ← postgres local (+ api optional)
```

Production DB = **Supabase** — không deploy Postgres riêng.

Không `docker-compose.yml` ở root — sau này thêm Redis sạch hơn.

---

## Không sync (client local only)

| State                     | Lý do                            |
| ------------------------- | -------------------------------- |
| `RecommendationSet`       | Staging                          |
| `PlanCandidate`           | Staging                          |
| `PlanningDraft`           | Phase 1: local; sync sau nếu cần |
| Telemetry / usage metrics | Local only — không sync cloud    |

---

## Scaffold — một milestone sau Internal RC

Toàn bộ scaffold **một lần**, không dựng từng phần nhỏ:

- [ ] `packages/contracts` — DTO only (không domain types)
- [ ] Client `CloudAdapter` + `HonoCloudAdapter`
- [ ] `apps/api` — Hono + routes + stores (CRUD only)
- [ ] Prisma schema (`Session`, `Preset`, `Setting`, `Device`) + migrations
- [ ] Supabase JWT middleware
- [ ] Pino logging
- [ ] `/api/v1` prefix
- [ ] `/health` · `/ready` · `/live`
- [ ] OpenAPI
- [ ] `docker/compose.yaml`
- [ ] `.env.example`
- [ ] `tests/integration` + `tests/contract`
- [ ] GitHub Actions

**Không:** import `Session` từ web, `shared-types`, NestJS, Solver endpoint.

---

## Phân vai rõ

```text
Client    → Domain (Session, Plan, UseCase, Repository)
Backend   → Persistence (SessionStore, Prisma, JWT verify)
Contracts → HTTP DTO giữa hai bên
```

Cloud là **lớp lưu trữ và đồng bộ**, không định nghĩa lại domain.

---

## Thứ tự thực hiện (không đổi)

```text
✅ Architecture v1 (client)
    ↓
P1 Persistence
    ↓
P2 Recommendation
    ↓
P4 Timeline
    ↓
P3 Playing UseCases
    ↓
Internal RC (2–4 tuần)
    ↓
Scaffold Backend (một milestone)
    ↓
Client SyncService (dùng contracts)
    ↓
Cloud Phase 1 Stable
```

**Không scaffold backend trước Internal RC.**

---

## Đọc thêm

- [`decisions.md`](decisions.md) — Session aggregate root; Cloud mirror only
- [`stability-gate.md`](../release/stability-gate.md) — Cloud Phase 1 Stable gate
- [`known-limitations.md`](../release/known-limitations.md)
