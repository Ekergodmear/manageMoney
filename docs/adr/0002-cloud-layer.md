# ADR 0002 — Cloud Layer (Supabase Mirror)

**Trạng thái:** Accepted (triển khai v0.9)  
**Ngày:** 2026-06-25

## Bối cảnh

Sau v0.8 Internal, cần backup, đa thiết bị, và health cloud — nhưng không muốn biến Supabase thành backend tính toán hay phá vỡ offline-first.

## Quyết định

- Supabase = **Cloud Layer** only: Auth + PostgreSQL mirror JSON (`sessions.payload jsonb`, `version`).
- **SyncService** subscribe domain events → queue → debounced push (v0.9).
- Workspace **không** import `@supabase/supabase-js` — chỉ `src/services/cloud/`.
- Feature flags: `flags.isEnabled('cloud')` — v0.8 stub, v0.9 wire.

## Hệ quả

| Tích cực | Tiêu cực |
|----------|----------|
| Tách biệt rõ client/cloud | Conflict resolution phức tạp (v1.0) |
| Có thể ship v0.8 không cloud | Thêm schema migration v4 (sync metadata) |
| UI đọc Sync Status, không biết Supabase | Cần Health check cloud disconnected |

**Không bao giờ:** `POST /solve` · `POST /optimize` · server-side insights

**v0.8:** `sync/` stub — markDirty local only.

---

*Liên quan: ADR 0001-local-first.md · docs/product/backend-architecture.md*
