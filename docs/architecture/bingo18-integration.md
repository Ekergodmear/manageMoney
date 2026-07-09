# Bingo18 Integration — Game Integration v1

**Trạng thái:** Thiết kế đã review — tài liệu, chưa implement  
**Nền tảng:** Stake Planner Platform v1 (Architecture v1 Frozen)  
**Prerequisite:** Internal RC Stable + daily-notes chứng minh nhu cầu draw feed

---

## Tóm tắt

Stake Planner trở thành **trung tâm điều khiển Bingo18**: thu kết quả, thống kê, match tự động, thông báo — **Session không fetch, không match, không notify**.

```text
Game Data (bounded context)
│
├── DrawFeedAdapter          ← Bingo18 · Mock · Future (SunWin, Go88…)
├── Collector                ← chỉ gọi adapter.fetchLatest()
├── DrawStore
├── StatisticsAggregator       ← chạy khi draw mới
├── StatisticsSnapshot       ← Dashboard đọc snapshot, không scan 500k rows
├── RoundSettlementEngine    ← DrawResultSaved → SettlementResult
├── AlertService               ← SessionUpdated → notification
└── Dashboard (Game Monitor + Heatmap + Collector Health)

Session (aggregate root)
│
├── ApplySettlementUseCase nhận SettlementResult
├── PlayedRound[] (entity riêng — replay)
└── không fetch · không settle · không notify
```

---

## Quan hệ với Architecture v1 Frozen

| Giữ nguyên                                  | Mở rộng                              |
| ------------------------------------------- | ------------------------------------ |
| Session = aggregate root                    | `PlayedRound[]`, play stats          |
| Planning / Continue / Capital / … pipelines | `GamePolicy` markets                 |
| Cloud Session mirror opaque                 | DrawStore + Snapshot API trên server |
| Manual Tick (fallback)                      | Giữ khi Collector chết               |

**Không** unfreeze: `PlanFactory`, `SessionFactory`, `RecommendationSet`, Cloud Session payload semantics.

---

## Bingo18 — Markets (qua GamePolicy)

3 xúc xắc. Markets: **Tổng 3–18** · **Hoa 111–666** · **Nhỏ / Hòa / Lớn**.

Planning và engine **chỉ đọc `GamePolicy`** — không hardcode Bingo18.

```ts
interface GamePolicyPreset {
  readonly gameId: string; // 'bingo18' | 'sunwin' | …
  readonly marketVersion: number;
  readonly markets: readonly MarketDefinition[];
  // rewardPolicy, bet limits… hiện có
}
```

---

## Game Data — cấu trúc module

### Client

```text
src/features/game-data/
├── adapters/
│   ├── draw-feed-adapter.ts       # interface
│   ├── bingo18-adapter.ts
│   ├── mock-adapter.ts
│   └── manual-entry-adapter.ts    # fallback nhập tay
├── collector/
│   └── collector-health.ts        # read model UI
├── draw/
│   ├── draw-result.ts
│   └── draw-store-client.ts       # cache + API client
├── statistics/
│   ├── statistics-aggregator.ts   # server-side hoặc trigger
│   └── statistics-snapshot.ts
├── settlement/
│   ├── round-settlement-engine.ts
│   ├── settlement-result.ts
│   └── apply-settlement-use-case.ts  # Session chỉ persist outcome
├── alerts/
│   └── alert-service.ts           # subscribe SessionUpdated
├── entities/
│   └── played-round.ts
└── dashboard/
    ├── game-monitor.tsx
    ├── statistics-heatmap.tsx
    └── collector-health-panel.tsx
```

### Backend

```text
apps/collector/   (hoặc worker/)
├── collector.ts                   # adaptive poll — KHÔNG biết bingo18.top
├── polling-scheduler.ts
└── adapters/
    ├── draw-source-adapter.ts     # interface: fetchLatest()
    ├── bingo18-adapter.ts
    └── mock-adapter.ts

apps/api/src/
├── routes/draws.ts
├── routes/statistics.ts           # GET snapshot
├── routes/collector/health.ts
└── stores/
    ├── draw-store.ts
    └── statistics-snapshot-store.ts
```

### DrawFeedAdapter (pluggable)

Collector **không** gắn Bingo18. Chỉ biết:

```ts
interface DrawSourceAdapter {
  readonly id: string;
  fetchLatest(): Promise<RawDrawPayload | null>;
}
```

Implementations: `Bingo18Adapter` · `MockAdapter` · `FutureAdapter` (SunWin, Go88…).

**Nguồn website (đã chốt):** ưu tiên API ẩn → Playwright → scrape HTML cuối cùng. **Không OCR.**

---

## Aggregate: DrawResult

```ts
interface DrawResult {
  readonly id: string;
  readonly gameId: string;
  readonly marketVersion: number;
  readonly drawNumber: string;
  readonly drawTime: string; // thời điểm kỳ quay (nguồn)
  readonly publishedAt: string; // khi website công bố (nếu có)
  readonly collectedAt: string; // khi Collector ghi
  readonly latencyMs: number; // collectedAt − publishedAt (hoặc drawTime)
  readonly dice: readonly [number, number, number];
  readonly total: number;
  readonly flower: string | null;
  readonly smallLarge: 'small' | 'tie' | 'large';
  readonly rawPayload: unknown; // dữ liệu gốc — parser sai vẫn audit được
  readonly source: string; // adapter id
}
```

**DrawStore:** append-only, **immutable** — không update, không delete row. Server authoritative, không giới hạn số lượng.

Nếu parser sai: không sửa row — tạo **Correction** hoặc **Reimport** (bản ghi mới). Statistics luôn reproducible.

---

## Collector — Adaptive Polling

Mục tiêu: _Đã có Draw mới chưa?_ — gọi `adapter.fetchLatest()`.

| Giai đoạn (từ draw trước) | Interval |
| ------------------------- | -------- |
| 0–4 phút                  | 60s      |
| 4–6 phút                  | 20s      |
| > 6 phút                  | 10s      |

Tận dụng countdown / drawNumber từ `rawPayload` khi adapter cung cấp.

### Collector Health (Health Dashboard)

```text
Collector

🟢 Running

Last Poll      12s ago
Last Success   48s ago
Latency Avg    121s
Failures       0
```

```ts
interface CollectorHealth {
  readonly status: 'running' | 'degraded' | 'stopped';
  readonly lastPollAt: string | null;
  readonly lastSuccessAt: string | null;
  readonly averageLatencyMs: number;
  readonly failureCount: number;
  readonly activeAdapterId: string;
}
```

---

## Statistics — Snapshot đa cấp, không realtime scan

```text
Collector → DrawStore (append-only) → StatisticsAggregator → Snapshot → Dashboard
```

**Không** scan 500.000 draw mỗi lần mở Dashboard.

### Cấp snapshot

```text
Daily Snapshot       → hôm nay: tổng 4 xuất hiện 18 lần
Monthly Snapshot
Quarterly Snapshot
Yearly Snapshot
```

Mỗi cấp là bản ghi riêng — Dashboard chọn bucket, đọc snapshot tương ứng.

```ts
type SnapshotBucket = 'daily' | 'monthly' | 'quarterly' | 'yearly' | 'custom';

interface StatisticsSnapshot {
  readonly id: string;
  readonly gameId: string;
  readonly bucket: SnapshotBucket;
  readonly rangeStart: string;
  readonly rangeEnd: string;
  readonly generatedAt: string;
  readonly totals: Readonly<Record<number, { count: number; percentage: number }>>;
  readonly flowers: Readonly<Record<string, { count: number; percentage: number }>>;
}
```

Sau này: `last_1000_draws` snapshot — cùng pattern, không đổi Dashboard contract.

Aggregator chạy khi: draw mới lưu · cron theo bucket · rebuild (admin).

---

## Round Settlement — Engine tách khỏi Session

`MatchService` quá hẹp — engine thực tế **settle** cả vòng: thắng/thua, prize, thuế, profit, chuẩn bị `PlayedRound`.

```text
DrawResultSaved (event)
        ↓
RoundSettlementEngine
        ↓
SettlementResult
        ↓
ApplySettlementUseCase
        ↓
Session (+ PlayedRound)
```

**Session không tự settle.** Chỉ persist kết quả từ `ApplySettlementUseCase`.

`RoundSettlementEngine` (pure): nhận `DrawResult` + market đang cược + `GamePolicy` → tính toán đầy đủ.

```ts
interface SettlementResult {
  readonly drawResult: DrawResult;
  readonly marketMatched: boolean;
  readonly prize: number;
  readonly tax: number;
  readonly netPrize: number;
  readonly profit: number;
  readonly settlementTime: string;
}
```

`ApplySettlementUseCase`: map `SettlementResult` + context (`sessionId`, `round`, `stake`, `marketId`) → `PlayedRound` + cập nhật Session stats.

### Multi-session (đã chốt)

**Chỉ `activeSessionId`.** Session khác = archive.

### Tax (đã chốt)

`RewardPolicy`: `prize → tax → netPrize → profit`. Collector chỉ biết kết quả xổ.

### Manual Tick (đã chốt)

**Có fallback.** Collector chết → `ManualEntryAdapter` → cùng luồng `RoundSettlementEngine`.

---

## Entity: PlayedRound

Entity riêng — thuộc Session aggregate, dễ replay.

```ts
interface PlayedRound {
  readonly id: string;
  readonly round: number;
  readonly drawNumber: string;
  readonly bet: number;
  readonly market: string; // 'total-4' | …
  readonly draw: DrawResult; // hoặc drawResultId + snapshot
  readonly win: boolean;
  readonly stake: number;
  readonly prize: number;
  readonly profit: number;
  readonly matchedAt: string;
}
```

`Session.playedRounds: PlayedRound[]` — không nhúng mơ hồ trong Plan.

Timeline events vẫn có; **PlayedRound** là nguồn sự thật cho replay và Library stats.

---

## AlertService

**Không** `Session.notify()`.

```text
SessionUpdated (domain event)
        ↓
AlertService
        ↓
Browser Notification / in-app toast
```

| Trigger                          | Alert                    |
| -------------------------------- | ------------------------ |
| Còn 5, 4, 3, 2, 1 vòng           | Sắp hết kế hoạch         |
| Settlement WIN (`marketMatched`) | Trúng — netPrize, profit |
| Plan hoàn thành                  | Hết kế hoạch             |

AlertService subscribe Event Bus client — Session domain không gọi notification API.

---

## Dashboard — Game Monitor

### 4 vùng + Heatmap

```text
┌─ 🎲 Live Result ─────────────────────────────────────┐
│ Kỳ #124567 · ⏳ Còn 01:52 · 2-1-1 · Tổng 4          │
├─ Collector Health ───────────────────────────────────┤
│ 🟢 Running · Poll 12s · Success 48s · Latency 121s │
├─ Statistics (Snapshot) ────────────────────────────┤
│ Bar chart: ngày / tháng / quý / năm                │
│ Heatmap hôm nay:                                     │
│   3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18   │
│   ·  █  ·  ·  █  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·   │
│   (ô = count — tổng nào xuất hiện nhiều hôm nay)    │
├─ Active Session ─────────────────────────────────────┤
│ Tổng 4 (×40) · Vòng 38/100 · P/L: -380.000đ        │
└────────────────────────────────────────────────────┘
```

Dashboard **chỉ đọc** `StatisticsSnapshot` + `CollectorHealth` + latest `DrawResult` — không aggregate realtime.

---

## Library — derived fields

```ts
interface SessionLibraryStats {
  // … hiện có
  readonly actualHitRate: number;
  readonly expectedProbability: number; // từ GamePolicy / theory
  readonly variance: number;
}
```

Ví dụ UI:

```text
Tổng 4
Expected  2.78%
Actual    3.14%
```

---

## Insights

Nguồn kép: **StatisticsSnapshot (draw)** + **Library (session đã chơi)**.

```text
"Bạn chơi Total 4: 28 phiên, ROI -6%.
 Tổng 4 xuất hiện 2.9% (30 ngày)."
```

---

## Cloud

| Entity                          | Vai trò                |
| ------------------------------- | ---------------------- |
| Session · Preset · Setting      | Mirror opaque (như cũ) |
| DrawResult · StatisticsSnapshot | Server authoritative   |
| Staging / Telemetry             | Không sync             |

### Prisma (đề xuất)

```prisma
model DrawResult {
  // append-only — không UPDATE/DELETE trong application code
  id            String   @id @default(cuid())
  gameId        String
  marketVersion Int
  drawNumber    String   @unique
  drawTime      DateTime
  publishedAt   DateTime?
  collectedAt   DateTime @default(now())
  latencyMs     Int
  dice          Json
  total         Int
  flower        String?
  smallLarge    String
  rawPayload    Json
  source        String

  @@index([gameId, drawTime])
  @@index([total])
}

model StatisticsSnapshot {
  id          String   @id @default(cuid())
  gameId      String
  bucket      String
  rangeStart  DateTime
  rangeEnd    DateTime
  generatedAt DateTime @default(now())
  payload     Json     // totals + flowers

  @@index([gameId, bucket, rangeEnd])
}
```

---

## Luồng dữ liệu tổng

```text
DrawSourceAdapter.fetchLatest()
        ↓
Collector (adaptive poll)
        ↓
DrawStore (append-only, immutable)
        ├→ StatisticsAggregator → Daily | Monthly | Quarterly | Yearly Snapshot
        └→ DrawResultSaved
                ↓
           RoundSettlementEngine (activeSession only)
                ↓
           SettlementResult
                ↓
           ApplySettlementUseCase → Session + PlayedRound
                ↓
           SessionUpdated → AlertService

Client DrawFeedAdapter ← API (latest, snapshots, health)
Dashboard ← snapshots only (chọn bucket)
Manual Entry → DrawResult → (cùng luồng Settlement)
```

---

## Ma trận module

| Module                                     | Thay đổi                                       |
| ------------------------------------------ | ---------------------------------------------- |
| `game-policy-types`                        | `gameId`, `marketVersion`, `markets`           |
| `game-data/*`                              | **Mới** — toàn bộ bounded context              |
| `session-domain`                           | `applySettlement` — **không** settlement logic |
| `PlayedRound`                              | Entity riêng trên Session                      |
| `DashboardScreen`                          | Game Monitor + heatmap                         |
| `AlertService`                             | **Mới** — subscribe events                     |
| `apps/collector`                           | Worker + adapters                              |
| `apps/api`                                 | draws, statistics, collector health            |
| Planning / Continue / Capital / Experiment | **Không đổi** pipeline                         |

---

## Migration

- `PersistedAppState` v3 → v4: `playedRounds[]` rỗng cho session cũ
- `GamePolicy`: thiếu `gameId` → `'generic'`
- Draw / Snapshot: bảng mới, không migrate từ client

---

## Roadmap (rev 2)

```text
Internal RC Stable
        ↓
B0  Game Policy (markets Bingo18)
        ↓
B1  Draw Feed (adapter interface + Mock + client API stub)
        ↓
B2  Collector (worker + adaptive poll + adapters)
        ↓
B3  Draw Store (Prisma + API)
        ↓
B4  Statistics (Aggregator + Daily/Monthly/Quarterly/Yearly Snapshots)
        ↓
B5  Round Settlement (Engine + PlayedRound + Manual fallback)
        ↓
B6  Dashboard (Game Monitor + Heatmap + Collector Health)
        ↓
B7  Alerts (AlertService)
        ↓
B8  Insights + Library (actual vs expected)
        ↓
Bingo18 Stable
```

Chi tiết: [`bingo18-roadmap.md`](../product/bingo18-roadmap.md).

---

## Quyết định đã chốt

| #   | Quyết định                                                    |
| --- | ------------------------------------------------------------- |
| 1   | Nguồn: API ẩn → Playwright → HTML scrape. Không OCR.          |
| 2   | Settlement chỉ `activeSessionId`                              |
| 3   | Manual Tick / manual entry khi Collector chết                 |
| 4   | Tax qua `RewardPolicy`                                        |
| 5   | **Không code** trước Internal RC — Game Data = Future Product |

---

## Future Ideas (ngoài B0–B8)

Khi Draw History đủ dày — **không** đưa vào roadmap hiện tại:

| Ý tưởng               | Ví dụ                                       |
| --------------------- | ------------------------------------------- |
| **Drought**           | Tổng 4 — 48 kỳ liên tiếp không ra (30 ngày) |
| **Last seen**         | Hoa 666 — lần cuối 421 kỳ trước             |
| **Rolling frequency** | Tần suất rolling 100 / 1000 / 10000 kỳ      |

Insights đọc DrawStore + Snapshot — implement sau Bingo18 Stable.

---

## Internal RC

|          |                                         |
| -------- | --------------------------------------- |
| **Loại** | 🟦 Future (Game Integration v1)         |
| **Code** | Sau RC + daily-notes chứng minh nhu cầu |

---

## Đọc thêm

- [`0006-game-data-bounded-context.md`](../adr/0006-game-data-bounded-context.md)
- [`bingo18-roadmap.md`](../product/bingo18-roadmap.md)
- [`cloud-backend.md`](cloud-backend.md)
