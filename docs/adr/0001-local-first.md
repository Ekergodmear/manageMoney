# ADR 0001 — Local-first Architecture

**Trạng thái:** Accepted  
**Ngày:** 2026-06-25

## Bối cảnh

Stake Planner xử lý dữ liệu nhạy cảm (vốn, kế hoạch cược, lịch sử phiên). Người dùng cần app hoạt động offline, phản hồi tức thì, không phụ thuộc server để generate plan hay optimize.

## Quyết định

- **Client là nguồn sự thật** cho compute: constraint engine, planning, session, insights.
- **IndexedDB** là persistence chính (v0.8).
- Mọi thao tác user **ghi local trước**, luôn thành công trên device.
- Cloud (v0.9+) chỉ **mirror** JSON aggregate — không thay thế compute.

## Hệ quả

| Tích cực                   | Tiêu cực                                     |
| -------------------------- | -------------------------------------------- |
| Offline-first, privacy     | Phải tự xử lý sync/conflict (v1.0)           |
| Không POST /solve          | Supabase không phải backend logic            |
| Test/replay dễ trên client | Cloud layer thêm sau, không rewrite features |

**Không làm:** `Generate → POST server → wait → Session`

**Làm:** `Generate → solve() local → PersistenceService.save() → (v0.9) sync queue`

---

_Liên quan: ADR 0002-cloud-layer.md · docs/product/backend-architecture.md_
