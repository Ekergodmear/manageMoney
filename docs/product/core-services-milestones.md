# Core Services Milestones — v0.8

> Mini platform với **Definition of Done** — không scaffold hàng loạt một commit.

| Doc                                        | Nội dung                     |
| ------------------------------------------ | ---------------------------- |
| `core-services.md`                         | Tổng quan                    |
| `../adr/0005-domain-event-architecture.md` | Event taxonomy · subscribers |

---

## Tổng quan

```text
src/services/
├── registry/          AppServices · useServices() · useFlags()
├── storage/           M1 ✅
├── clock/             M1 ✅
├── events/            M1 ✅
├── telemetry/         M2 ✅
├── logger/            M2 ✅
├── health/            M2 ✅
├── config/            M3.1 ✅
├── feature-flags/     M3.1 ✅
└── cloud-sync/        M3.2 ⏳ (trước v0.9 — CloudSyncService, không SyncService)
```

**M4** = Planning pilot only  
**Rollout** = Planning → Session → Capital → Scenario → Game Designer

---

## Milestone 1 — Runtime Foundation ✅

`storage/` · `clock/` · `events/` · `registry/`

**Status:** ✅ 2026-06-25

---

## Milestone 2 — Operational Services ✅

`telemetry/` · `logger/` · `health/`

**Status:** ✅ 2026-06-25

---

## Milestone 3.1 — Runtime Configuration ✅

```
config/
  AppConfig · Environment · CloudConfig · TelemetryConfig
  UiConfig · DeveloperConfig · BuildInfo

feature-flags/
  Flags · FlagProvider · useFlags
```

**Không Sync** — dời M3.2 ngay trước v0.9.

### AppConfig

```ts
interface AppConfig {
  environment: Environment;
  build: BuildInfo;
  telemetry: TelemetryConfig;
  cloud: CloudConfig;
  ui: UiConfig;
  developer: DeveloperConfig;
}
```

### Flags

```ts
flags.isEnabled('cloud'); // false default
flags.isEnabled('telemetry'); // true default
flags.isEnabled('playwright'); // true in test env
```

### DoD M3.1 ✅

```ts
services.flags.isEnabled(...)  // chạy được
```

Planning **chưa đổi**.

Tests: `config.spec.ts` · `flags.spec.ts`

**Status:** ✅ 2026-06-25

---

## Milestone 3.2 — Cloud Sync Stub ⏳

**Chỉ ngay trước v0.9** — khi có Cloud Layer thật.

Tên: **`CloudSyncService`** (không `SyncService`) — tránh nhầm Local/Import/Backup sync.

**Status:** ⏳ Deferred

---

## Milestone 4 — Planning Pilot ✅

**GeneratePlanUseCase** — application layer duy nhất biết workflow.

```text
features/planning/generate-plan-use-case.ts

validate → solve → statistics
    → PersistenceService.save(planningDraft)
    → emit PlanGenerated
    → Telemetry · Logger
```

App.tsx: `await generatePlanUseCase.execute(form)` — không emit/save orchestration.

### Planning workspace

```text
Form → Generate → Decision → View Plan
```

**Không** promote Session aggregate (M4).

### DoD M4 ✅

- Regression: output **byte-identical** với `generatePlan()`
- `planningDraft` persisted, sessions unchanged
- Telemetry: `PlanGenerated` + sessionId + planId + schemaVersion + occurredAt
- Logger: `[Planning] PlanGenerated session=… plan=…`

Tests: `tests/unit/planning/milestone-4.spec.ts`

**Status:** ✅ 2026-06-25

---

## Rollout (sau M4)

```text
Planning ✅ (pilot)
    ↓
Session
    ↓
Capital
    ↓
Scenario
    ↓
Game Designer
```

---

## AppServices

```ts
const { flags, config, events } = useServices();
useFlags().isEnabled('telemetry');
```

`getAppServices()` — core/bootstrap only.

---

## Architecture tests

`tests/architecture/services-boundary.test.ts`

- `features/` không `import.meta.env`
- `features/` không import config internals trực tiếp
- operational services không import React

---

_M4 hoàn tất — rollout Session tiếp theo._
