# Release Engineering — Stake Planner

> Quản lý theo **milestone release**, không sprint.

Stake Planner ~**85–90% hoàn chỉnh**. v0.8 = ổn định nội bộ · v0.9 = cloud · v1.0 = share.

---

## Milestones

```
v0.8  Internal        — UI + Core Services + E2E + PWA
v0.9  Personal Stable — Cloud Layer + daily usage 1 tháng
v1.0  Cloud           — Share · Realtime · Conflict
```

---

## v0.8 — thứ tự thực thi (đã khóa)

```text
① Library Design System Rollout
        │
        ▼
② Foundation Freeze        ← DONE — docs/design-system/freeze-report.md
        │
        ▼
③ Core Services (local only)
   • Storage (PersistenceService)
   • Clock (Clock.now / today / format — không new Date() trực tiếp)
   • Event Bus (domain events **past tense**: PlanGenerated, SessionWon…)
   • Telemetry (subscribe — PlanningViewed, không Opened Planning)
   • Logger (subscriber)
   • Health (subscriber)
   • Feature Flags
   • Sync (stub, chưa Supabase)
        │
        ▼
④ Session Rollout
⑤ Planning Rollout
⑥ Capital Rollout
⑦ Scenario Rollout
⑧ Game Designer Rollout
        │
        ▼
⑨ Playwright E2E
⑩ PWA
        │
        ▼
v0.8 Internal
```

**Library trước Core Services** — Insights chỉ chứng minh ~70–80% DS. Nếu Library cần token/component mới → quay Foundation, **không** scaffold Core Services.

**Không nhảy Session ngay sau Library** — Foundation Freeze rồi Core Services trước rollout feature.

Chi tiết Core Services: `docs/product/core-services.md`

---

## v0.8 checklist

```
□ Foundation Freeze Review   ← DONE 2026-06-25 (freeze-report.md)
□ Library migrate (DS)       ← DONE pilot
□ Core Services M1 — storage · clock · events · registry ✅
□ Core Services M2 — telemetry · logger · health ✅
□ Core Services M3.1 — config · flags · buildInfo ✅
□ Core Services M4 — Planning pilot (GeneratePlanUseCase) ✅
□ Workspace rollout — Session → Capital → Scenario → Game Designer
□ Core Services M3.2 — CloudSyncService stub (trước v0.9)
□ Empty · Skeleton · Motion · Keyboard · Responsive
□ Playwright E2E
□ PWA (manifest, icon, offline)
□ Bug fixing
```

**Gate → v0.9:** DS frozen · E2E green · Core Services wired · telemetry local

---

## Design System freeze gate

Chỉ freeze sau **Library migrate pass**:

### Pass criteria (Library)

1. `SessionLibraryScreen` chỉ compose Product Components — không `div.rounded-xl.p-6` rải rác
2. Không còn `text-2xl`, `font-semibold`, `shadow-md`, `border-red` hardcode trong workspace Library
3. Spacing qua `spacing={16}` hoặc token — không `mt-7`, `mb-5`
4. `EmptyState` reuse — không `LibraryEmpty` riêng
5. Compare Drawer = Product `Drawer` — không one-off

### Foundation Freeze

- Migrate Library **không** cần token/primitive mới
- Workspace chỉ compose Product Components
- Không còn Tailwind rải rác trong workspace

→ Nếu workspace tiếp theo cần token mới → quay Foundation, **không freeze**.

---

## v0.9 Personal Stable

```
□ Supabase Auth (Google · Email)
□ sync/ wire cloud adapter
□ Session + Preset sync · auto backup
□ Sync Status footer · Health (+ cloud)
□ Telemetry sync
□ Daily usage 1 tháng
```

---

## v1.0 Cloud

Share · Realtime · Conflict resolution — chi tiết `backend-architecture.md`.

---

## Playwright (v0.8)

Specs:

```text
planning
session
continue
improve
library
insights
sync          (v0.9)
```

---

## PWA (v0.8)

Manifest · icon · offline shell — sau E2E green.

---

_Roadmap chi tiết: `personal-roadmap.md`_
