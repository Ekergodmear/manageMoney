# Core Services — Stake Planner

> Mini platform v0.8 — **4 milestone** với DoD rõ. Không scaffold 8 thư mục một commit.

| Doc                                        | Nội dung                             |
| ------------------------------------------ | ------------------------------------ |
| `core-services-milestones.md`              | Milestone 1–4 · DoD · status         |
| `../adr/0005-domain-event-architecture.md` | Event bus · past tense · subscribers |

Chi tiết release: `docs/product/release-engineering.md`

---

## Status (2026-06-25)

| Milestone                  | Trạng thái                             |
| -------------------------- | -------------------------------------- |
| M1 Runtime Foundation      | ✅ storage · clock · events · registry |
| M2 Operational Services    | ✅ telemetry · logger · health         |
| M3.1 Runtime Configuration | ✅ config · flags · buildInfo          |
| M3.2 Cloud Sync Stub       | ⏳ trước v0.9 (CloudSyncService)       |
| M4 Planning Pilot          | ✅ GeneratePlanUseCase                 |

---

## Thứ tự dựng

Xem **`core-services-milestones.md`** — tóm tắt:

```text
M1: storage → clock → events → registry     ✅
M2: telemetry → logger → health             (subscribe EventBus)
M3: feature-flags → sync stub
M4: wire workspace (Planning emit PlanGenerated, …)
```

**Wire point App.tsx emit:** Milestone 4 — không sửa workspace trước M2 pass.

---

## Cấu trúc

```text
src/services/

├── clock/
│   ├── clock.ts              # Clock interface + SystemClock
│   └── fake-clock.ts         # inject trong test / Playwright

├── events/
│   ├── domain-events.ts      # emit / subscribe API
│   ├── event-types.ts        # typed union — mỗi event một interface
│   └── subscribers.ts        # register logger, telemetry, sync, …

├── storage/
│   ├── indexeddb.ts
│   ├── persistence.ts        # load/save PersistedAppState
│   └── migrations/
│       ├── v1.ts … v3.ts
│       └── registry.ts

├── telemetry/
│   ├── telemetry.ts
│   ├── event-types.ts        # re-export / map from domain
│   └── event-store.ts        # IndexedDB table `events`

├── logger/
│   ├── logger.ts             # không biết console — chỉ gọi sinks
│   └── sinks/
│       ├── console.ts        # v0.8
│       ├── telemetry.ts      # forward → event-store
│       └── cloud.ts          # v0.9+

├── feature-flags/
│   └── flags.ts              # flags.isEnabled("cloud")

├── health/
│   └── health-service.ts

└── sync/                     # v0.9 wire cloud/
    ├── sync-service.ts
    ├── sync-queue.ts
    └── sync-status.ts
```

Workspace **không** import Supabase. Không gọi `logger` + `telemetry` rải rác.

---

## Domain Event Bus

Thay vì mỗi nơi:

```ts
saveSession();
logger.info();
telemetry.track();
sync.markDirty();
```

Chỉ:

```ts
DomainEvents.emit({
  type: 'PlanGenerated',
  sessionId,
  planId,
  occurredAt: clock.now(),
});
```

**Không dùng string rời** — mỗi event là interface typed:

```ts
interface PlanGeneratedEvent {
  type: 'PlanGenerated';
  sessionId: string;
  planId: string;
  occurredAt: Date;
}

type DomainEvent =
  | PlanGeneratedEvent
  | SessionWonEvent
  | ContinuationCreatedEvent
  | …;
```

Subscribers filter theo `event.type` — Telemetry, Logger, Sync không import nhau.

| Subscriber     | Ví dụ `SessionWon`                       |
| -------------- | ---------------------------------------- |
| Telemetry      | Ghi event vào event-store                |
| Logger         | `logger.info(event)` → ConsoleSink       |
| Sync           | `markDirty(sessionId)`                   |
| Insights cache | Invalidate / schedule refresh (optional) |

### Quy tắc đặt tên — **past tense**

Domain event mô tả **điều đã xảy ra**, không phải mệnh lệnh:

| Không          | Có                    |
| -------------- | --------------------- |
| `GeneratePlan` | `PlanGenerated`       |
| `Continue`     | `ContinuationCreated` |
| `SessionWin`   | `SessionWon`          |

### Domain events (không phải page views)

```text
PlanGenerated
PlanningCreated
PlanningViewed          ← telemetry: hành vi có ý nghĩa, không Opened Planning
SessionStarted
RoundCompleted
ContinuationCreated
ImproveApplied
SessionFinished
SessionWon
SessionArchived
ScenarioPromoted
PresetSaved
CapitalStrategyGenerated
…
```

Telemetry lưu **cùng shape** (past tense / viewed) — Insights đọc trực tiếp sau này, không convert.

---

## Clock

Interface injectable — hỗ trợ unit test, Playwright, replay, timezone.

```ts
export interface Clock {
  now(): Date;
  today(): Date;
  format(value: Date | string, locale?: string): string;
}

export const SystemClock: Clock = { … };

// Test / E2E
export class FakeClock implements Clock {
  constructor(private fixed: Date) {}
  now() { return this.fixed; }
  …
}
```

App và domain dùng `clock` inject (default `SystemClock`) — **không** `new Date()` trực tiếp trong features.

`occurredAt` trên domain events lấy từ `clock.now()`.

---

## Storage

Di chuyển từ `features/session/session-persistence.ts` → `storage/persistence.ts`.

- `indexeddb.ts` — open DB, schema
- `migrations/registry.ts` — v1 → v3 hiện tại; **v4** thêm `version`, `syncStatus`, `lastSyncedAt`
- App gọi `PersistenceService.load()` / `.save()` — không biết IndexedDB chi tiết

---

## Logger

Logger **không biết console** — chỉ gọi danh sách sinks đã đăng ký.

```ts
// logger.ts — API ổn định
logger.info(message, context?)
logger.warn(…)
logger.error(…)

// sinks/console.ts — v0.8
// sinks/telemetry.ts — forward structured log
// sinks/cloud.ts — v0.9+
```

Subscribe Domain Events — không phải layer đầu tiên. Phase 1 chỉ **ConsoleSink**.

Thêm CloudSink v0.9 **không sửa** Logger API.

Không `console.log` trong `features/`.

---

## Feature flags

```ts
flags.isEnabled('cloud'); // không ENABLE_CLOUD hardcode
flags.isEnabled('share');
flags.isEnabled('realtime');
flags.isEnabled('ai');
```

Nguồn: default object → override `localStorage` → sau này remote config.

---

## Health Service

Không chỉ cloud. Checks:

```text
storage      — IndexedDB readable
migration    — schema version OK
session      — có thể load state
preset       — presets valid
telemetry    — event-store OK
sync         — v0.8: queue local; v0.9: cloud connected
```

Dashboard (v0.8 local / v0.9 + cloud):

```text
✓ Storage
✓ Session
✓ Presets
✓ Telemetry
✓ Migration
⚠ Cloud disconnected    (v0.9+)
```

---

## Sync (stub v0.8 → wire v0.9)

v0.8: subscribe `Session*` events → `syncStatus: pending` in memory/local.

v0.9: queue → Supabase (`src/services/cloud/`).

UI chỉ đọc `sync-status.ts` + Health.

---

## Luồng một thay đổi Session

```text
User action
    ↓
session-domain (pure)
    ↓
PersistenceService.save()
    ↓
DomainEvents.emit('RoundCompleted', …)
    ↓
    ├── Telemetry → event-store
    ├── Logger → console
    └── Sync → markDirty (v0.9 → queue)
```

Features không gọi Telemetry/Logger/Sync trực tiếp.

---

## Ranh giới

| Làm                        | Không làm                         |
| -------------------------- | --------------------------------- |
| Event bus decouple         | `telemetry.track()` mọi nơi       |
| Storage trước logger       | Logger trước persistence          |
| Domain events (past tense) | `GeneratePlan`, `Opened Planning` |
| `Clock` abstraction        | `new Date()` rải rác              |
| `flags.isEnabled()`        | `#define ENABLE_*` rải rác        |
| Local core trước cloud     | Supabase trong v0.8               |

---

_Wire point: sau Foundation Freeze, trước Session migrate._
