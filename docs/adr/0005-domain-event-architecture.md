# ADR 0005 — Domain Event Architecture

**Trạng thái:** Accepted  
**Ngày:** 2026-06-25 · cập nhật M2 2026-06-25

## Bối cảnh

Stake Planner có nhiều cross-cutting concerns: persistence, telemetry, logging, sync, health. Gọi trực tiếp `logger`, `telemetry`, `sync.markDirty()` từ mỗi feature dẫn đến coupling chặt, khó test, và refactor lớn khi thêm Cloud Layer (v0.9).

## Quyết định

### 1. Event Bus typed (không Node EventEmitter)

- Mọi thay đổi có ý nghĩa **emit một event typed** qua `EventBus`.
- Catalog tại `src/services/events/event-types.ts`.

### 2. Event taxonomy — Domain vs System

| Loại | Ví dụ | Telemetry | Logger | Health |
|------|-------|-----------|--------|--------|
| **Domain** | PlanGenerated, SessionWon | ✓ | ✓ | ✗ |
| **System** | StorageOpened, SyncFailed | ✓ | ✓ | ✓ |

Health **không** nghe domain events (PlanningViewed, PlanGenerated).

### 3. Past tense

Event mô tả **điều đã xảy ra**:

| Không | Có |
|-------|-----|
| `GeneratePlan` | `PlanGenerated` |
| `Continue` | `ContinuationCreated` |
| `Opened Planning` | `PlanningViewed` |

### 4. schemaVersion (không `version`)

```ts
interface PlanGeneratedEvent {
  type: 'PlanGenerated';
  schemaVersion: 1;
  occurredAt: Date;
  …
}
```

Tránh nhầm với Session.version hay app version.

### 5. Subscribers only — Operational Services (M2)

```text
TelemetryStore → EventStore → StorageDriver
Logger → ConsoleSink (→ TelemetrySink → CloudSink)
Health → system events only
```

Features **emit** — không gọi telemetry/logger trực tiếp.

### 6. AppServices + useServices()

Workspace inject qua `useServices()` — không `getAppServices()` lung tung.

### 7. Architecture tests

`tests/architecture/services-boundary.test.ts` giữ ranh giới import.

## Hệ quả

| Tích cực | Tiêu cực |
|----------|----------|
| Cloud/Telemetry thêm subscriber | Catalog + taxonomy cần maintain |
| M4 wire từng workflow | Chưa emit everywhere until M4 |
| Insights đọc EventStore sau này | schemaVersion bump khi payload đổi |

**Triển khai:** `docs/product/core-services-milestones.md`

---

*Liên quan: ADR 0001 · ADR 0003 · ADR 0004*
