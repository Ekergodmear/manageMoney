# ADR 0003 — Session as Aggregate Root

**Trạng thái:** Accepted  
**Ngày:** 2026-06-25

## Bối cảnh

Session là trung tâm product: planning → playing → continue/improve → won/lost. Cần một model nhất quán cho persistence, library, insights, và sync.

## Quyết định

- **`Session`** là aggregate root trong `session-domain.ts`.
- Một session chứa: metadata, tags, plans[], active plan, bet progress, status lifecycle.
- **Pure domain functions** — không I/O, không telemetry trong domain file.
- Persistence lưu **toàn bộ aggregate** (JSON) — không normalize plans ra bảng riêng (v0.8).
- Domain events mô tả thay đổi aggregate: `PlanGenerated`, `RoundCompleted`, `SessionWon`, …

## Hệ quả

| Tích cực                              | Tiêu cực                          |
| ------------------------------------- | --------------------------------- |
| Library/Insights đọc cùng shape       | JSON lớn theo thời gian           |
| Sync mirror 1 document                | Query phức tạp phải client-side   |
| Continue/Improve trong cùng aggregate | Migration cẩn thận khi đổi schema |

**Persistence:** `PersistenceService` load/save `PersistedAppState` — sessions[] là mảng aggregate.

**Cloud sync (v0.9):** mirror từng session document + `version` field.

---

_Liên quan: ADR 0001 · session-domain.ts · docs/product/core-services.md_
