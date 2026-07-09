# Bingo18 — Roadmap & Gates

**Trạng thái:** Thiết kế — implement **sau Internal RC Stable**  
**Thiết kế:** [`bingo18-integration.md`](../architecture/bingo18-integration.md) (Game Integration v1)

---

## Vị trí timeline

```text
Stake Planner Platform v1 (Architecture v1 Frozen) ✅
        ↓
Internal RC (đang chạy)
        ↓
Game Integration v1 (B0–B8)
        ↓
P1 → P2 → P4 → P3 (nếu chưa)
        ↓
Cloud + Draw API deploy
```

---

## B0 — Game Policy

- [ ] `gameId`, `marketVersion`, `markets[]`
- [ ] Builtin preset Bingo18 đầy đủ
- [ ] Game Designer UI
- [ ] Engine không hardcode game id

---

## B1 — Draw Feed

- [ ] `DrawSourceAdapter` (`fetchLatest`)
- [ ] `MockAdapter`, `Bingo18Adapter` (skeleton), `ManualEntryAdapter` (spec)
- [ ] Client `DrawFeedAdapter`
- [ ] `DrawResult` types (`rawPayload`, `publishedAt`, …)

---

## B2 — Collector

- [ ] Worker adaptive poll — **không** gắn website trong core
- [ ] `CollectorHealth`
- [ ] Spike: API ẩn → Playwright → HTML

---

## B3 — Draw Store

- [ ] Prisma `DrawResult` — **append-only, immutable**
- [ ] `DrawStore`: save, list, latest — **không** update/delete
- [ ] Correction / Reimport spec (doc + API sau)
- [ ] `GET /api/v1/draws/latest`, `/history`

---

## B4 — Statistics

- [ ] `StatisticsAggregator`
- [ ] Snapshots: **daily · monthly · quarterly · yearly**
- [ ] `GET /api/v1/statistics/snapshots?bucket=…`
- [ ] Dashboard contract: đọc snapshot, không scan DrawStore

---

## B5 — Round Settlement

- [ ] `RoundSettlementEngine` + `SettlementResult`
- [ ] Chỉ `activeSessionId`
- [ ] `ApplySettlementUseCase` → `PlayedRound` + Session stats
- [ ] `RewardPolicy` → prize, tax, netPrize, profit
- [ ] Manual entry → cùng engine
- [ ] Migration `PersistedAppState` v4
- [ ] Playing UI

---

## B6 — Dashboard

- [ ] Game Monitor 4 vùng + **heatmap**
- [ ] Collector Health panel
- [ ] Đọc snapshot theo bucket

---

## B7 — Alerts

- [ ] `AlertService` ← `SessionUpdated`
- [ ] 5→1 vòng, WIN, hết plan

---

## B8 — Insights + Library

- [ ] Library: `actualHitRate`, `expectedProbability`, `variance`
- [ ] Insights join Snapshot + Library
- [ ] `packages/contracts` Draw + Snapshot DTOs
- [ ] Deploy

---

## Gate: Bingo18 Stable

- [ ] Collector ≥95% uptime (7 ngày)
- [ ] Settlement đúng manual verify ≥50 kỳ
- [ ] DrawStore immutable — không sửa row production
- [ ] Dashboard <2s (snapshot)
- [ ] Daily notes không còn “phải mở bingo18.top”

---

## Future Ideas (không trong B0–B8)

- Drought (48 kỳ không ra tổng 4)
- Last seen (hoa 666 — 421 kỳ trước)
- Rolling frequency 100 / 1000 / 10000 kỳ

---

## Không làm

- Update/delete `DrawResult`
- `MatchService` naming (dùng RoundSettlementEngine)
- Session.settle() / Session.notify()
- Statistics realtime scan
- Code trước Internal RC
