# ADR-0006 — Game Data Bounded Context

**Trạng thái:** Chấp nhận (tài liệu — implement sau Internal RC)  
**Liên quan:** [`bingo18-integration.md`](bingo18-integration.md)

## Bối cảnh

Stake Planner mở rộng sang Bingo18 (và game tương lai): thu kết quả thật, thống kê, settle vòng cược — **Session không fetch website**.

## Quyết định

Bounded context **Game Data**:

```text
DrawFeedAdapter (pluggable)
        ↓
Collector → DrawStore → StatisticsAggregator → Snapshot (daily|monthly|quarterly|yearly)
        ↓
DrawResultSaved → RoundSettlementEngine → SettlementResult
        ↓
ApplySettlementUseCase → Session + PlayedRound
        ↓
SessionUpdated → AlertService
```

### DrawStore — immutable

```text
DrawResult: append only
```

- **Không** update row.
- **Không** delete row.
- Parser sai → **Correction** hoặc **Reimport** (bản ghi mới), không sửa draw cũ.

Statistics và audit luôn **reproducible**.

### Ranh giới

| Game Data | Session |
| --------- | ------- |
| `DrawSourceAdapter.fetchLatest()` | Không fetch |
| `DrawStore` append-only | `PlayedRound[]` entity |
| `RoundSettlementEngine` | `ApplySettlementUseCase` — persist only |
| `StatisticsSnapshot` (đa cấp) | Play stats (stake, ROI) |
| `AlertService` | Không `notify()` |

Collector **không biết** website cụ thể — chỉ gọi adapter.

### Round Settlement

`RoundSettlementEngine` settle cả vòng: market match, prize, tax, netPrize, profit — không chỉ “match”.

### Multi-session

Settlement **chỉ `activeSessionId`**.

### Fallback

`ManualEntryAdapter` khi Collector chết.

## Hậu quả

- `apps/collector` worker + adapter plugins
- Prisma: `DrawResult` (immutable), `StatisticsSnapshot` (multi-bucket)
- Client: `game-data/` module
- `GamePolicy.gameId` + `markets`

## Không làm

- Update/delete `DrawResult` rows
- Collector hardcode một game/site
- `Session.settle()` / `Session.notify()`
- Realtime aggregate trên Dashboard
- Code trước Internal RC

## Thay thế đã xem xét

| Phương án | Lý do loại |
| --------- | ---------- |
| `MatchService` | Quá hẹp — không cover prize/tax/profit |
| Sửa row Draw khi parser sai | Phá reproducibility statistics |
| Một snapshot duy nhất | Không scale dashboard theo ngày/tháng/quý/năm |
| Session tự settle | Trộn bounded context |
