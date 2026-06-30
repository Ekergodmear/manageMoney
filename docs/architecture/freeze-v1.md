# Architecture v1 — Frozen

**Ngày:** 2025-06-25  
**Trạng thái:** **Architecture v1 Frozen** — client domain hoàn thành; cloud design khóa (chưa implement)

---

## Đã ship (không thêm module trước Internal RC)

| Area                                    | Trạng thái |
| --------------------------------------- | ---------- |
| Architecture v1                         | ✅         |
| Design System                           | ✅         |
| Planning · Session · Improve · Continue | ✅         |
| Capital · Experiment                    | ✅         |
| Library · Insights                      | ✅         |

---

## Đã đóng băng (không đổi semantics)

| Abstraction         | Ghi chú                                               |
| ------------------- | ----------------------------------------------------- |
| `PlanningDraft`     | Staging trước Session                                 |
| `Session`           | **Aggregate root** — mọi workflow xoay quanh đây      |
| `PlanFactory`       | 3 entry: initial · fromCandidate · continuation       |
| `RecommendationSet` | Pipeline Capital / Experiment                         |
| `PlanCandidate`     | Review trước promote                                  |
| `Continue`          | Session → ContinuationContext → Plan, không Candidate |
| `GamePolicy`        | Preset + ContinuationPolicy                           |
| `EventBus`          | Domain + system events                                |
| `UseCase` pattern   | Planning · Capital · Improve · Continue · Experiment  |

---

## Cloud design đã khóa (chưa code)

Thiết kế chi tiết: [`cloud-backend.md`](cloud-backend.md)

| Quyết định                           | Ghi chú                                                         |
| ------------------------------------ | --------------------------------------------------------------- |
| Hono + Prisma + Supabase Auth + Pino | Cloud Layer mỏng                                                |
| `packages/contracts`                 | DTO only — không `Session` · `Plan` domain                      |
| `SessionRecord` opaque `payload`     | Backend không biết domain version                               |
| `CloudAdapter`                       | SyncService → Adapter → API; đổi provider không đổi Persistence |
| `SessionStore` CRUD only             | `list` · `load` · `save` · `delete` — không domain methods      |
| Không Domain Events trên server      | Chỉ HTTP / conflict / storage logs                              |
| Telemetry local only                 | Không sync cloud                                                |
| Deploy                               | Supabase DB + Hono trên Railway/Fly/Render                      |
| Scaffold                             | **Sau Internal RC** — một milestone                             |

**Quy tắc từ giờ:**

- Thay đổi **client** → chứng minh bằng `daily-notes.md` (local — copy từ [`daily-notes.template.md`](../product/daily-notes.template.md))
- Thay đổi **backend** → chỉ phục vụ đồng bộ, lưu trữ, chia sẻ
- **Không abstraction mới** nếu không có bằng chứng từ sử dụng thật

---

## Giai đoạn 1 (1–2 ngày): P1 / P2 / P4 — cleanup only

### P1 — Thống nhất persistence (ưu tiên cao nhất)

**Hiện tại:** UseCase → `Repository.save()` **và** App → `persist()` / `savePersistedState()`.

**Mục tiêu:**

```text
UseCase → Repository → PersistenceService
App.tsx → execute() + đọc state (không save trực tiếp)
```

- [ ] Bỏ dual write sau use case
- [ ] Gom `upsertSession` với `SessionRepository`; deprecate `upsert` / `promoteActive` dead API

### P2 — RecommendationSet thuần

- [ ] `selectRecommendation(set, id)` pure function trên aggregate
- [ ] Repository chỉ: `get` · `save` · `clear`

### P4 — Timeline normalize (migration only)

- [ ] `continue` / `improve` legacy → `plan-added` + `origin`
- [ ] Không đổi UI

---

## Giai đoạn 2 (2–3 ngày): P3 — Playing UseCases

Prerequisite Cloud. Tách khỏi App:

- [ ] `PlaceBetUseCase` · `UndoBetUseCase` · `WinSessionUseCase` · `StopSessionUseCase` · `StartPlanUseCase`

---

## Giai đoạn 3 (2–4 tuần): Internal RC — **bắt đầu ngay**

**Ưu tiên usage trước refactor P1.** Dùng app như người dùng thật trên branch `release/internal-rc`.

Checklist mỗi tối: [`internal-rc-checklist.md`](../releases/internal-rc-checklist.md)  
Ghi chú: `daily-notes.md` (local) — template: [`daily-notes.template.md`](../product/daily-notes.template.md)

**Không refactor** (P1/P2/P4/P3) trong giai đoạn này — trừ **blocker** (crash, mất data, logic sai).

**Local usage metrics** (không telemetry cloud):

```text
Planning opened · Capital opened · Continue executed
Improve executed · Experiment promoted · Insight viewed
```

→ heatmap sau ~2 tuần để biết đầu tư UX ở đâu.

---

## Sau Internal RC

### Cloud Phase 1

Sync: `Sessions` · `Presets` · `Settings`

**Không sync:** `RecommendationSet` · `PlanCandidate` · Telemetry (state tạm)

Thiết kế chi tiết: [`cloud-backend.md`](cloud-backend.md)

### Cloud Phase 2

Share Session · Backup · Restore · Public Link

### AI

Chờ **100+ Sessions** thật — không làm sớm.

---

## Roadmap tổng

```text
✅ Architecture v1 + toàn bộ workflow
        ↓
P1 Persistence Stable
        ↓
P2 Recommendation Stable
        ↓
P4 Timeline Stable
        ↓
P3 Playing Stable
        ↓
Internal RC Stable (2–4 tuần)
        ↓
Cloud Phase 1 Stable
        ↓
v0.9 Personal Stable
        ↓
Cloud Phase 2 → v1.0
```

**Không thêm abstraction hay module mới** trước Internal RC.

**Definition of Stable:** [`../release/stability-gate.md`](../release/stability-gate.md)  
**Giới hạn hiện tại:** [`../release/known-limitations.md`](../release/known-limitations.md)

**Quy tắc phạm vi:** Chỉ làm việc giải quyết vấn đề trong `daily-notes.md` (local) hoặc pass một stability gate.

**Thực tế làm việc:** Internal RC **trước** P1 — tag `architecture-v1`, branch `release/internal-rc`, dùng app 2–4 tuần, rồi mới P1→P2→P4→P3. Checklist: [`internal-rc-checklist.md`](../releases/internal-rc-checklist.md).

---

## Verdict

**Architecture v1 Frozen.** Domain client đủ chín. Cloud design khóa — implement sau Internal RC.

Quyết định tiếp theo do **trải nghiệm sử dụng thật** (`daily-notes.md`), không do kiến trúc mới. Xem [`decisions.md`](decisions.md).

---

## Mở rộng sau v1 — Game Integration v1 (Bingo18)

Bounded context **Game Data** — không unfreeze Session pipeline:

- [`bingo18-integration.md`](bingo18-integration.md)
- [`bingo18-roadmap.md`](../product/bingo18-roadmap.md)
- ADR [`0006-game-data-bounded-context.md`](../adr/0006-game-data-bounded-context.md)

Implement **sau Internal RC** + daily-notes chứng minh nhu cầu.

**Song song Internal RC:** [`apps/collector/`](../../apps/collector/) — draw acquisition service. Không tích hợp app.
