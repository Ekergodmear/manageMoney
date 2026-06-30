# Personal Roadmap — Stake Planner

> Release engineering: **v0.8 → v0.9 → v1.0**

---

## Release map

```
v0.8 Internal
  ① Library DS → ② Foundation Freeze → ③ Core Services
  → rollout Session…Game Designer → E2E → PWA
        ↓
v0.9 Personal Stable
  Cloud Layer · Health · daily usage 1 tháng
        ↓
v1.0 Cloud
  Share · Realtime · Conflict
```

| Doc                       | Nội dung                                         |
| ------------------------- | ------------------------------------------------ |
| `release-engineering.md`  | Checklist · gate · Playwright · PWA              |
| `core-services.md`        | Event bus · storage · clock · telemetry · health |
| `backend-architecture.md` | Cloud Layer (v0.9)                               |

---

## Đang làm (v0.8)

1. **Library** — DS migrate (bài test đầy đủ DS trước Foundation Freeze)
2. **Foundation Freeze** — ✅ DONE (`docs/design-system/freeze-report.md`)
3. **Core Services** — M1–M3.1 ✅ · **M4 Planning pilot ✅**
4. **Workspace rollout** — Session → Capital → Scenario → Game Designer
5. Playwright · PWA

---

## Core Services (ưu tiên, sau Foundation Freeze)

```text
storage → clock → events → telemetry → logger → health → feature-flags → sync (stub)
```

**Event Bus:** domain events **past tense** (`PlanGenerated`, `SessionWon`, `ContinuationCreated`).

**Telemetry:** hành vi có ý nghĩa (`PlanningViewed`), không page-click rải rác.

**Clock:** `src/services/clock/` — toàn app dùng `Clock.now()`, không `new Date()` trực tiếp.

Không Supabase trong v0.8.

---

## DS freeze gate

- Library pass criteria (compose only · spacing tokens · EmptyState · Drawer)
- Library migrate không cần token mới
- Nếu cần token mới → quay Foundation, không scaffold Core Services

---

## Platform ✅

Constraint Engine · Planning · Session · Continue · Improve · Capital · Scenario · Game Designer · Library · Insights · DS (rollout)

---

_Client = compute + events. Cloud = mirror (v0.9)._
