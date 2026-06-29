# Domain Glossary — Stake Planner

Ngôn ngữ chung của dự án. Không phải tài liệu người dùng cuối.

| Thuật ngữ | Ý nghĩa |
| --------- | ------- |
| **PlanningDraft** | Kế hoạch vừa được tạo nhưng chưa bắt đầu chơi. Aggregate riêng, promote thành Session. |
| **Session** | Một phiên chơi thực tế của người dùng. Chứa `plans[]`, `timeline[]`, trạng thái chơi. |
| **Plan** | Một chiến lược cược cụ thể thuộc Session (Plan A, B, C…). |
| **RecommendationSet** | Một lần generate — tập các Recommendation cùng `source`, `generatedAt`. Nguồn sự thật duy nhất cho UI Capital/Scenario. |
| **Recommendation** | Một phương án trong RecommendationSet — trả lời *nên chọn phương án nào*. Chưa commit. |
| **PlanCandidate** | Phương án người dùng đã chọn và sẵn sàng promote — trả lời *đây là phương án sẽ commit*. Một active candidate mỗi app state. |
| **ImproveOption** | Đề xuất từ engine Improve; chọn option → tạo Candidate trực tiếp (không qua Recommendation bundle). |
| **GamePolicy** | Bộ luật trò chơi (multiplier, bet limits, tax…) qua preset. |
| **ContinuationContext** | Value object cho Continue: `sessionId`, `currentPlanId`, `completedRounds`, `accumulatedSpent`, `lastBetAmount`, `targetTotalRounds` — không truyền Session nguyên. |
| **ContinuationPolicy** | `maximumRounds` + `presets[]` (target total rounds, ví dụ 1000/1500) — cấu hình trong Game Designer. |
| **Experiment** | Biến thể trong ExperimentLab (Baseline, Experiment A…) — domain; UI workspace vẫn gọi Scenario Planner. |
| **ExperimentLab** | Tập experiments so sánh; promote qua RecommendationSet pipeline. |
| **DrawResult** | Một kỳ quay thật (3 xúc xắc). Aggregate Game Data — có `rawPayload`, `gameId`, `publishedAt`. |
| **Game Data** | Bounded context: Adapter · Collector · DrawStore · StatisticsAggregator · RoundSettlementEngine · AlertService. |
| **DrawSourceAdapter** | `fetchLatest()` — Bingo18, Mock, Manual, Future. Collector không biết website cụ thể. |
| **StatisticsSnapshot** | Thống kê đã tính — daily / monthly / quarterly / yearly. Dashboard không scan DrawStore. |
| **RoundSettlementEngine** | `DrawResultSaved` → `SettlementResult` — match, prize, tax, profit. Session không tự settle. |
| **SettlementResult** | Kết quả settle một vòng: `marketMatched`, prize, tax, netPrize, profit. |
| **ApplySettlementUseCase** | Map `SettlementResult` → `PlayedRound` + Session. |
| **PlayedRound** | Entity riêng trên Session — round, bet, market, draw, win, stake, prize, profit (replay). |
| **AlertService** | Subscribe `SessionUpdated` → browser notification. Không `Session.notify()`. |
| **CollectorHealth** | Running, last poll, last success, latency avg, failures. |
| **MarketDefinition** | Cấu hình market trong `GamePolicy` (total, flower, small/tie/large). |

## Pipeline chuẩn

```text
Planning:     Form → PlanningDraft → Promote → Session
Improve:      Option → PlanCandidate → Review → Promote → Plan (append)
Capital:      Search → Recommendation[] → Select → PlanCandidate → Promote → Session (mới)
Scenario:     Experiment → RecommendationSet → PlanCandidate → Promote → Session (mới)
Continue:     Session → ContinuePlanUseCase → ContinuationContext → Engine → PlanFactory.createContinuation → Plan (append, không Candidate)
Game Data:    Adapter → Collector → DrawStore (append-only)
              → Aggregator → Snapshot (daily|monthly|quarterly|yearly)
              DrawResultSaved → RoundSettlementEngine → SettlementResult
              → ApplySettlementUseCase → Session
              SessionUpdated → AlertService
```

Chi tiết Bingo18: [`bingo18-integration.md`](../architecture/bingo18-integration.md).

## Events (domain)

| Event | Khi nào |
| ----- | ------- |
| `PlanGenerated` | Planning engine hoàn thành |
| `PlanningDraftSaved` | Draft persist |
| `SessionCreated` | Session mới (Planning promote hoặc Capital promote) |
| `RecommendationGenerated` | RecommendationSet persist (`source`: capital \| scenario) |
| `RecommendationSelected` | User chọn một recommendation |
| `PlanCandidateCreated` | Candidate persist (Improve hoặc Capital) |
| `PlanPromoted` | Candidate → Plan trong Session, hoặc Continue append plan |
| `ContinuationCreated` | ContinuePlanUseCase tạo plan mới từ session đang chơi |
| `DrawResultCollected` | Collector append vào DrawStore (immutable) |
| `StatisticsSnapshotUpdated` | Aggregator tạo snapshot (daily/monthly/…) |
| `RoundSettled` | RoundSettlementEngine tạo SettlementResult |
| `SettlementApplied` | Session nhận PlayedRound từ ApplySettlementUseCase |

## Timeline

Chỉ `plan-added` với metadata `origin`: `generate` \| `improve` \| `continue` \| `capital` \| `scenario`.
