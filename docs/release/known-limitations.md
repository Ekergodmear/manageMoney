# Known Limitations

Không phải TODO.

Tài liệu này ghi **giới hạn hiện tại** — phân biệt giới hạn **cố ý** (by design) và **nợ kỹ thuật** (sẽ gỡ qua stability gate).

Cập nhật khi pass gate (ví dụ Cloud Phase 1 → bỏ "chưa có đồng bộ cloud").

**Cập nhật lần cuối:** 2025-06-25 · Architecture v1

---

## Cố ý (by design)

| Giới hạn | Lý do |
| -------- | ----- |
| **Single user** | Personal product; không multi-tenant |
| **Local-first** | Offline mặc định; IndexedDB trên thiết bị |
| **RecommendationSet không sync** | Staging state — generate → chọn → promote → xóa |
| **PlanCandidate không sync** | Staging state — review trước commit |
| **Telemetry / usage metrics chỉ local** | Chưa gửi cloud; phục vụ Internal RC heatmap |
| **Timeline ≠ Event Bus** | Timeline cho người chơi; bus cho telemetry (xem [`decisions.md`](../architecture/decisions.md)) |
| **Continue không qua Candidate** | Semantics khác Improve/Capital — hành động Session |
| **Một `planCandidate` active** | Một review tại một thời điểm |
| **Một `recommendationSet` active** | Một lần generate Capital/Experiment tại một thời điểm |

---

## Nợ kỹ thuật (sẽ gỡ qua gate)

| Giới hạn | Gate | Ghi chú |
| -------- | ---- | ------- |
| **Dual persistence** — App `persist()` song song Repository | P1 | Ưu tiên cao nhất |
| **`RecommendationSetRepository.select()`** chứa domain logic | P2 | → pure `selectRecommendation()` |
| **Timeline legacy** `continue` / `improve` trong persisted data | P4 | Migration normalize |
| **Playing mutations trong App.tsx** | P3 | → Playing use cases |
| **`createSessionFromGenerate` deprecated** | — | Chỉ còn test fixtures |
| **`SessionRepository` misnamed** (Unit of Work trên full state) | P1 | Có thể rename sau |

---

## Sản phẩm / UX

| Giới hạn | Loại | Ghi chú |
| -------- | ---- | ------- |
| **Chưa đồng bộ cloud** | Nợ → Cloud P1 | Thiết kế: [`cloud-backend.md`](../architecture/cloud-backend.md) |
| **Chưa mobile-first** | UX | Desktop / responsive cơ bản |
| **Export print** có; export PDF chưa hoàn chỉnh | UX | JSON export đủ cho backup thủ công |
| **Insights** — chưa validate trên 100+ sessions thật | UX | Có thể ít giá trị sớm |
| **AI / gợi ý thông minh** | Out of scope | Sau 100+ sessions; xem roadmap |
| **Share session / public link** | Out of scope | Cloud Phase 2 |
| **Đa thiết bị real-time** | Out of scope | Cloud Phase 1 = sync, không collaborative |

---

## Môi trường

| Giới hạn | Ghi chú |
| -------- | ------- |
| **IndexedDB** — xóa site data = mất toàn bộ | Backup: export JSON session / library |
| **Một browser profile** | Không sync giữa Chrome / Edge / máy khác (cho đến Cloud) |
| **Private mode** | `sessionStorage` recent scenarios có thể không persist |

---

## Khi nào cập nhật file này

1. Pass một **stability gate** → chuyển mục từ "nợ" sang "đã giải quyết" hoặc xóa
2. Phát hiện limitation mới từ **daily-notes** → thêm với loại rõ ràng
3. **Không** thêm feature wishlist — chỉ giới hạn thật của bản hiện tại
