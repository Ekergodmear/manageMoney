# Stake Planner — System Map

Một trang. Không phải ADR. Không phải roadmap.

Mục tiêu: người mới đọc xong hiểu **ai làm gì**, **luồng nào đi đâu**, **aggregate nào persist**.

---

## Bốn pipeline nghiệp vụ

| Hành động        | Câu hỏi                              | Pipeline                             |
| ---------------- | ------------------------------------ | ------------------------------------ |
| Tạo mới          | _Tôi muốn chơi như thế nào?_         | Planning → Session                   |
| Đề xuất thay đổi | _Có cách nào tốt hơn / với vốn này?_ | Recommendation → Candidate → Promote |
| Tiếp tục chơi    | _Đã hết plan hiện tại — làm tiếp?_   | Session → Continue → Plan            |
| Quản lý phiên    | _Đang chơi / dừng / thắng?_          | Session aggregate (timeline + plans) |

---

## Sơ đồ tổng thể

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PLATFORM (Constraint Engine)                        │
│   Solver · Optimization · GamePolicy (preset) · Statistics · Simulation       │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         APPLICATION (Use Cases)                             │
│                                                                             │
│   GeneratePlan          PromoteDraft         GenerateCapital                │
│   CreateImproveCand     PromoteCandidate     ContinuePlan                   │
│   CreateCandFromRec     PromoteToSession                                    │
└─────────────────────────────────────────────────────────────────────────────┘
          │                    │                      │                │
          ▼                    ▼                      ▼                ▼
┌──────────────┐      ┌──────────────┐      ┌─────────────────┐   ┌──────────┐
│PlanningDraft │      │   Session    │      │RecommendationSet│   │ Session  │
│  (staging)   │─────▶│  (aggregate) │◀─────│   (staging)     │   │ (append) │
└──────────────┘      └──────┬───────┘      └────────┬────────┘   └──────────┘
                             │                       │
                    ┌────────┼──────────┐            ▼
                    ▼        ▼          ▼    ┌──────────────┐
               Improve   Continue    Capital  │ PlanCandidate│
                    │        │          │    │  (staging)   │
                    └────────┴──────────┘    └──────┬───────┘
                             │                      │
                             ▼                      ▼
                      ┌─────────────┐        Promote (append
                      │ PlanFactory │         or new session)
                      │─────────────│
                      │ createInitial
                      │ createFromCandidate
                      │ createContinuation
                      └──────┬──────┘
                             ▼
                           Plan
                             │
                             ▼
                    Session.plans[] + timeline[]
```

---

## Planning → Session

```text
Form + GamePolicy
        │
        ▼
 GeneratePlanUseCase
        │
        ▼
 PlanningDraft          ← aggregate staging, 1 active
        │
        ▼
 PromotePlanningDraftUseCase
        │
        ▼
 SessionFactory.createSessionFromDraft
        │
        ▼
 Session (Plan A, origin=generate)
```

**Events:** `PlanGenerated` · `PlanningDraftSaved` · `SessionCreated`

---

## Improve (append plan)

```text
Session (playing)
        │
        ▼
 ImproveOption (engine, ephemeral)
        │
        ▼
 CreateImprovementCandidateUseCase
        │
        ▼
 PlanCandidate (target=append-plan)
        │
        ▼  review UI
 PromoteCandidateToPlanUseCase
        │
        ▼
 PlanFactory.createFromCandidate → Plan (origin=improve)
        │
        ▼
 timeline: plan-added, origin=improve
```

**Events:** `ImprovementCandidateCreated` · `PlanPromoted`

---

## Capital (new session)

```text
Capital Planner form
        │
        ▼
 GenerateCapitalRecommendationsUseCase
        │
        ▼
 RecommendationSet          ← aggregate staging, nguồn sự thật UI
        │
        ▼  user chọn 1
 CreateCandidateFromRecommendationUseCase
        │
        ▼
 PlanCandidate (target=new-session)
        │
        ▼  review UI
 PromoteCandidateToSessionUseCase
        │
        ▼
 SessionFactory.createSessionFromCandidate → Session mới
```

**Events:** `RecommendationGenerated` · `RecommendationSelected` · `ImprovementCandidateCreated` · `SessionCreated` · `PlanPromoted`

---

## Continue (append plan, không Candidate)

```text
Session (plan exhausted)
        │
        ▼
 ContinuePlanUseCase
        │
        ▼
 ContinuationContext (value object)
        │
        ▼
 continuePlan() → engine
        │
        ▼
 PlanFactory.createContinuation → Plan (origin=continue)
        │
        ▼
 parent superseded · timeline: plan-added, origin=continue
```

**Events:** `ContinuationCreated` · `PlanPromoted`

**Policy:** `ContinuationPolicy { maximumRounds, presets[] }` trong GamePolicy preset.

---

## Scenario (Experiment wire)

```text
ExperimentLab
        │
        ▼
 GenerateExperimentRecommendationsUseCase
        │
        ▼
 RecommendationSet (source=scenario)
        │
        ▼
 CreateCandidateFromRecommendationUseCase
        │
        ▼
 PromoteCandidateToSessionUseCase
        │
        ▼
 SessionFactory.createFromCandidate()
```

**Events:** `RecommendationGenerated` · `RecommendationSelected` · `ImprovementCandidateCreated` · `SessionCreated` · `PlanPromoted`

Domain code: `Experiment`, `ExperimentLab` — UI vẫn **Scenario Planner**.

---

## Session playing (chưa bọc UseCase)

```text
App shell
        │
        ▼
 session-domain: startCurrentPlan · placeBet · undo · win · stop
        │
        ▼
 Session.timeline (bet, undo, plan-started, session-won, …)
```

Domain logic đúng chỗ (`session-domain.ts`). Orchestration + persist vẫn trong `App.tsx` — nợ kỹ thuật trước Cloud.

---

## PersistedAppState (local-first document)

```text
PersistedAppState
├── planningDraft: PlanningDraft | null
├── recommendationSet: RecommendationSet | null
├── planCandidate: PlanCandidate | null
├── sessions: Session[]
├── activeSessionId
├── capitalPlanner (form prefs only)
├── customGamePresets / activePresetId
└── libraryCollections
```

**Repositories:** thin accessors trên blob — `PlanningDraftRepository`, `RecommendationSetRepository`, `PlanCandidateRepository`, `SessionRepository` (thực chất Unit of Work).

**Cloud (sau):** mirror `Session` · `Presets` · `Settings` only. Staging aggregates không sync. Không compute. Không solve.

```text
SyncService → CloudAdapter → packages/contracts → Hono API → SessionStore
```

Chi tiết: [`cloud-backend.md`](cloud-backend.md)

---

## Timeline contract

Chỉ một event type cho plan mới:

```text
plan-added + origin: generate | improve | continue | capital | scenario
```

Legacy (`continue`, `improve`, `generated`, `started`) — đọc khi migrate, không emit mới.

---

## Factory API (đóng băng)

```text
PlanFactory
├── createInitialPlan()
├── createPlanFromCandidate()
└── createContinuationPlan()

SessionFactory
├── createSessionFromDraft()
└── createSessionFromCandidate()
```

---

## Kiến trúc end-to-end (đã khóa)

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

Offline-first: IndexedDB luôn thắng. Cloud mirror sau. Chi tiết deploy + ranh giới: [`cloud-backend.md`](cloud-backend.md).

---

## Layer map

| Layer           | Thành phần                                                                          |
| --------------- | ----------------------------------------------------------------------------------- |
| **Platform**    | `@stake/constraint-engine`, GamePolicy, Improve/Capital engines                     |
| **Domain**      | Session, Plan, PlanningDraft, RecommendationSet, PlanCandidate, ContinuationContext |
| **Application** | Use cases, repositories, EventBus                                                   |
| **Product**     | Planning, Session, Capital, Scenario, Library, Insights, Game Designer              |

---

## Đọc thêm

- `docs/domain/glossary.md` — thuật ngữ
- `docs/adr/` — quyết định kiến trúc
- `docs/architecture/freeze-v1.md` — Architecture v1 Frozen + punch list
