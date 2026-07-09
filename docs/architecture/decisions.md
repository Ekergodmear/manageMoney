# Architectural Decisions — Tại sao?

Một trang. Không phải ADR. Không phải roadmap.

Mục tiêu: một năm sau đọc lại vẫn hiểu **vì sao** hệ thống được cấu trúc như vậy — không phải **cấu trúc ra sao** (xem [`system-map.md`](system-map.md)).

---

## PlanningDraft tồn tại vì…

Generate plan **chưa phải** bắt đầu chơi.

Người dùng cần xem bảng, chỉnh form, quyết định promote — trước khi có Session thật. Nếu gộp vào Session ngay, mọi lần thử form đều tạo phiên rác trong Library.

`PlanningDraft` là **staging aggregate**: một draft active, promote một lần → Session. Sau promote draft bị xóa.

---

## Session là aggregate root vì…

Mọi thứ xảy ra khi **đang chơi** đều thuộc một phiên: plans, timeline, trạng thái, ghi chú, thắng/thua.

`Plan` là entity **bên trong** Session — không có repository riêng, không promote độc lập (trừ khi là candidate mới). Session sở hữu lifecycle; App chỉ điều hướng UI.

Từ quyết định này, mọi thứ xếp đúng chỗ:

```text
Planning      → tạo Session
Improve       → thêm Plan (append)
Continue      → thêm Plan (append)
Capital       → Session mới
Experiment    → Session mới
Library       → lưu Session
Insights      → đọc Session
Cloud Phase 1 → sync Session (+ Presets, Settings)
```

Đó là dấu hiệu domain model khỏe — không cần thêm aggregate trung gian.

---

## RecommendationSet là aggregate vì…

Capital và Experiment không trả lời _"tạo session ngay"_.

Chúng trả lời _"đây là các phương án — chọn một"_. Đó là một **lần generate** với:

- nhiều `StrategyRecommendation`
- `selectedRecommendationId`
- `source` (`capital` | `scenario`)
- lifecycle: generate → chọn → candidate → promote → xóa

Đủ lifecycle + repository + hydration → aggregate, không phải Value Object.

UI **chỉ** render từ `RecommendationSet` — không rebuild từ engine output lẻ.

---

## PlanCandidate tồn tại vì…

Recommendation = _nên chọn gì_. Candidate = _sẽ commit cái gì_.

Khoảng cách giữa hai câu hỏi là **màn review**. User phải thấy số liệu, xác nhận, rồi mới promote. Một `planCandidate` active trong app state; promote xong thì clear.

Hai target:

- `append-plan` — Improve, Continue (append không qua candidate)
- `new-session` — Capital, Experiment

---

## Continue không qua Candidate vì…

Continue không phải _"có cách nào tốt hơn không?"_ (Improve).

Continue không phải _"với vốn này nên chơi thế nào?"_ (Capital).

Continue là: **đã chơi xong plan hiện tại — làm tiếp thế nào?**

Đó là hành động của Session đang chơi, không phải đề xuất thay đổi. Pipeline riêng:

```text
Session → ContinuationContext → Engine → PlanFactory.createContinuation → Plan
```

Không Recommendation. Không Candidate. Không wizard.

---

## Improve không qua RecommendationSet vì…

Improve sinh `ImproveOption` trực tiếp từ engine — một session, một plan cha, vài mode cố định. Không cần bundle nhiều phương án từ search/optimization.

Option → Candidate → Review → Promote. Đủ cho phạm vi hẹp.

---

## Capital và Experiment dùng chung RecommendationSet vì…

Cùng câu hỏi: _chọn phương án nào trong tập đã generate?_

Khác nhau ở **nguồn sinh** recommendations (capital planner vs experiment lab), không khác pipeline sau generate. Không tạo `PromoteScenarioUseCase`, không tạo event taxonomy riêng.

Events: `RecommendationGenerated` / `RecommendationSelected` + field `source`.

---

## Experiment (domain) vs Scenario Planner (UI) vì…

Trong domain, user tạo **Experiment** (Baseline, Experiment A, Tax 20%…) — danh từ cụ thể.

"Scenario" là tính từ/mơ hồ; giữ tên workspace **Scenario Planner** vì user đã quen, nhưng code dùng `Experiment`, `ExperimentLab`.

---

## Timeline ≠ Event Bus vì…

|               | Timeline                     | Event Bus                          |
| ------------- | ---------------------------- | ---------------------------------- |
| **Ai đọc**    | Người chơi (Session UI)      | Telemetry, Logger, Cloud (sau này) |
| **Lưu ở đâu** | `Session.timeline[]`         | Emit, không persist aggregate      |
| **Mục đích**  | Audit log trực quan khi chơi | Quan sát hệ thống, sync metadata   |

Nhiều dự án cố dùng Event Bus làm audit log — dễ mất ngữ cảnh Session và khó render timeline trong cockpit. Tách hai kênh từ đầu.

Playing lifecycle (bet, undo, win) ghi **timeline** trước; bus events cho promote/generate là đủ cho v1.

---

## PlanFactory / SessionFactory đóng băng vì…

Mọi `Plan` phải đi qua một trong ba entry:

```text
createInitialPlan · createFromCandidate · createContinuation
```

Mọi `Session` mới qua:

```text
createFromDraft · createFromCandidate
```

Không inline assembly trong domain hay App. Factory leak = hai con đường tạo session → semantics lệch (đã fix P0).

---

## GamePolicy / ContinuationPolicy trong preset vì…

Continue presets (1000, 1500, 2000…) là quyết định **game designer**, không hardcode UI. Game khác có thể chỉ `[300, 500]`.

`targetTotalRounds` thay `extendBy` — _"tiếp tục đến 1000"_ dễ hiểu hơn _"+500"_.

---

## Local-first document store vì…

Một `PersistedAppState` blob: draft, candidate, recommendation set, sessions. Repositories là thin accessor — chấp nhận được cho single-user, offline-first.

Cloud (sau) **mirror** bốn staging aggregates + sessions — không compute, không solve trên server.

---

## Không thêm module trước khi dùng thật

Architecture v1 đủ bốn pipeline. Thêm Manager/Coordinator/Service mới lúc này = over-engineering.

**Personal product** — chuẩn bị 5 năm sử dụng, không side project:

```text
P1/P2/P4 Cleanup (1–2 ngày, không feature)
        ↓
P3 Playing UseCases (2–3 ngày)
        ↓
Internal RC (2–4 tuần) + local usage metrics + daily-notes
        ↓
Cloud Phase 1: Sessions · Presets · Settings — payload JSON opaque; `packages/contracts` cho HTTP, không chia sẻ domain types.
        ↓
v0.9 Personal Stable
        ↓
Cloud Phase 2 · AI (sau 100+ sessions thật) → v1.0
```

Cloud không trả lời UX có hợp lý không — chỉ **đồng bộ**. Staging state (`RecommendationSet`, `PlanCandidate`) **không sync** — tạm thời trên thiết bị.

Local metrics (Planning opened, Continue executed, …) → heatmap usage trước khi đầu tư Cloud hay AI.

**Cloud backend:** Hono + Prisma + Supabase Auth — Cloud Layer mỏng. Không `shared-types`; chỉ `packages/contracts` (HTTP DTO). Backend chỉ biết `SessionRecord` opaque — không `Session` · `Plan`. `SyncService` → `CloudAdapter` → API. `SessionStore` CRUD only. Không domain events trên server. Telemetry local. Deploy: Supabase DB + Hono (Railway/Fly/Render). Xem [`cloud-backend.md`](cloud-backend.md).

---

## Backend không biết domain vì…

Client refactor `Session` bao nhiêu lần cũng được — server chỉ lưu `payload` JSON + `schemaVersion` (client tự migrate). Backend không deserialize `Plan` · `Timeline` · `Statistics`. Ranh giới cứng giữ Cloud "ngu ngốc" và domain linh hoạt trên thiết bị.

---

## CloudAdapter tồn tại vì…

`PersistenceService` là source of truth local. `SyncService` queue upload. Nhưng transport có thể đổi (Hono hôm nay, Supabase REST / tRPC ngày mai). Adapter che provider — đổi cloud không đụng persistence hay domain.

---

## SessionStore ≠ SessionRepository vì…

Client `SessionRepository` = Unit of Work trên domain aggregate. Backend `SessionStore` = `list` · `load` · `save` · `delete` — không `archive()` · `favorite()` · `duplicate()`. Hai tên gần nhau nhưng hai trách nhiệm khác hẳn.

---

## Event Bus chỉ ở client vì…

`PlanGenerated` · `SessionCreated` là domain events phục vụ UI, telemetry, logger. Cloud chỉ log HTTP request, conflict, storage error. Subscribe domain events trên server = bắt đầu đưa logic lên cloud — trái triết lý mirror-only.

**Stability gates:** mỗi giai đoạn có Definition of Stable — xem [`../release/stability-gate.md`](../release/stability-gate.md). Giới hạn cố ý vs nợ kỹ thuật: [`../release/known-limitations.md`](../release/known-limitations.md).

**Phạm vi:** Chỉ làm việc từ `daily-notes.md` (local) hoặc để pass gate — mọi đề xuất khác là ngoài phạm vi.

---

## Đọc thêm

- [`system-map.md`](system-map.md) — ai làm gì, luồng nào đi đâu
- [`freeze-v1.md`](freeze-v1.md) — đã đóng băng gì, punch list còn lại
- [`../domain/glossary.md`](../domain/glossary.md) — thuật ngữ
- [`../release/stability-gate.md`](../release/stability-gate.md) — Definition of Stable (gates trước Cloud)
- [`../release/known-limitations.md`](../release/known-limitations.md) — giới hạn cố ý vs nợ kỹ thuật
- [`daily-notes.template.md`](../product/daily-notes.template.md) — nhật ký usage (file local)
