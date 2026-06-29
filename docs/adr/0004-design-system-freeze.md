# ADR 0004 — Design System Foundation Freeze

**Trạng thái:** Accepted  
**Ngày:** 2026-06-25

## Bối cảnh

Insights pilot chứng minh ~70–80% Design System. Library migrate (Card, Drawer, Toolbar, Filter, EmptyState, ActionMenu) là bài test đầy đủ. Cần khóa Foundation trước Core Services để tránh vòng lặp sửa UI khi scaffold infrastructure.

## Quyết định

1. **Freeze** `src/design/tokens/`, `src/components/ui/`, `src/components/product/` sau review PASS.
2. **Không thêm token/primitive/product** mới nếu chưa có evidence (≥2 use case, không fit scale hiện tại).
3. **Workspace** chỉ compose product components — rollout từng màn (Session → …), không sửa Foundation khi một màn thiếu spacing lẻ.
4. **Design Playground** (`src/design/playground/`) thay Storybook — mọi component mới showcase trước rollout.
5. **Freeze report** (`docs/design-system/freeze-report.md`) là nguồn truth cho trạng thái PASS.

### Thứ tự sau freeze

```text
Foundation Freeze → Core Services → Workspace rollout → E2E → PWA
```

Core Services **không** bắt đầu trước Foundation Freeze Review.

## Hệ quả

| Tích cực | Tiêu cực |
|----------|----------|
| DS ổn định trước v0.9/v1.0 | Session rollout phải adapt layout, không thêm token |
| Một API Card/Button/Text | Select/Textarea primitive deferred |
| Playground = living catalog | Cần discipline cập nhật report |

**Pilot PASS:** Insights, Library (screen-level).

**Workspace grep:** PENDING — 15 màn chưa rollout.

**Evidence rule ví dụ:** cần `spacing=18` → dùng `16` hoặc `20`, không mở token.

---

*Liên quan: docs/design-system/freeze-report.md · docs/product/release-engineering.md*
