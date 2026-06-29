# Cloud Layer Architecture — Stake Planner

> Supabase **không phải backend của app** — chỉ là **Cloud Layer**.  
> Client vẫn là nguồn sự thật cho Planning, Optimization, Simulation, Insights.

---

## Ranh giới

| Client (luôn) | Cloud Layer (Supabase) |
|---------------|------------------------|
| `@stake/constraint-engine` | Auth (Google · Email) |
| IndexedDB — primary offline | PostgreSQL — mirror JSON |
| PersistenceService | SyncService |
| Insights engine | Không compute |

**Không bao giờ:** `POST /solve` · `POST /optimize` · `POST /simulate`

---

## Luồng (offline-first)

```
User → Generate → solve() → Session
                              ↓
                         IndexedDB  ✓ (luôn thành công trước)
                              ↓
                         Sync Queue (debounce 2–5s)
                              ↓
                         Supabase (background)
```

**Không bao giờ:**

```
Generate → POST → wait → Session
```

UI không biết cloud — chỉ đọc Sync Status footer.

---

## Cấu trúc code (v0.8 Core → v0.9 Cloud)

Workspace **không** import `@supabase/supabase-js` trực tiếp.

```
src/services/
  events/           # Domain Event Bus (v0.8)
  storage/          # IndexedDB, persistence, migrations (v0.8)
  telemetry/        # domain events → event-store (v0.8)
  logger/           # subscribe → sinks (v0.8)
  feature-flags/    # flags.isEnabled("cloud") (v0.8)
  health/           # local v0.8 · + cloud v0.9
  sync/             # stub v0.8 → wire v0.9
  cloud/            # Supabase adapter — v0.9 only
  auth/             # v0.9

features/...  →  PersistenceService.save()
              →  DomainEvents.emit()
              →  Telemetry · Logger · Sync (subscribers)
```

Chi tiết v0.8: `docs/product/core-services.md`

Đổi Supabase → provider khác: chỉ sửa `cloud/`.

**Không tạo sớm:** `SessionRepositoryRemote` · `Hybrid` · …

---

## Session aggregate + sync metadata

Domain Session giữ nguyên. Thêm metadata sync (không normalize DB):

```ts
syncStatus: 'pending' | 'uploading' | 'synced' | 'failed'
lastSyncedAt: string | null
version: number
```

Cloud row:

```sql
sessions (
  id          uuid primary key,
  user_id     uuid references auth.users,
  version     int not null,
  payload     jsonb not null,   -- Session aggregate JSON
  created_at  timestamptz,
  updated_at  timestamptz
)

presets (
  id, user_id, version, payload jsonb, created_at, updated_at
)

shares (       -- Phase 1: migration only, chưa dùng
  id, resource_type, resource_id, token, expires_at, ...
)
```

**Đừng normalize sớm.** Session đã là aggregate — lưu aggregate.

RLS: `user_id = auth.uid()`.

---

## Sync Queue

Mỗi session (và preset) có trạng thái:

```
pending → uploading → synced
                   ↘ failed
```

- Ghi IndexedDB → `pending`
- Debounce **2–5 giây** (không upload từng keystroke)
- Flush khi online
- Footer: `✓ Đã đồng bộ` · `⟳ Đang đồng bộ` · `⚠ Chưa đồng bộ`

---

## Conflict (Phase 1)

Chỉ **version** + reject:

```
client version 17, server 18 → conflict (Phase 2 UI)
```

Phase 1: không merge. Phase 2: chọn local / remote.

PATCH gửi `expected_version`. Server reject nếu mismatch.

---

## Auth (Phase 1.2)

Một màn đăng nhập:

- Google
- Email (magic link hoặc password — chọn khi implement)

**Không Phase 1:** profile · avatar · role · admin · GitHub (có thể thêm sau)

---

## Supabase scaffold (Phase 1.1)

```
supabase/
  config.toml
  migrations/
    001_sessions.sql
    002_presets.sql
    003_shares.sql      -- chuẩn bị
  seed.sql
```

Chỉ chuẩn bị — chưa wire React.

---

## API (qua Supabase client + RLS)

```text
sessions:  SELECT · INSERT · UPDATE · DELETE  (payload + version)
presets:   SELECT · INSERT · UPDATE · DELETE
shares:    (Phase 2)
```

Không 200 REST endpoint tự viết.

---

## Phase map

### Phase 1 — Infrastructure Sprint

1.1 Supabase project + migrations  
1.2 Auth (Google · Email)  
1.3 Database jsonb aggregate  
1.4 SyncService + queue + Sync Status footer  
Auto backup (debounce, không nút Save)

### Phase 2

Share · Realtime · Conflict resolution · Multi-device polish

### Phase 3

Attachments (Storage) · Notification · AI (nếu daily notes chứng minh)

---

## Chi phí

Supabase Free — đủ 1 user: PostgreSQL · Auth · Storage · Realtime · Edge

---

## Ranh giới code

| Làm | Không làm |
|-----|-----------|
| Mirror Session JSON | Solver trên server |
| Document-level sync | Field-level sync |
| IndexedDB first | Wait for POST |
| `src/services/cloud` adapter | Feature import Supabase |
| Version optimistic lock | Merge Phase 1 |

---

*Prerequisite v0.8:* Core Services + Event Bus · Freeze DS · Playwright · Telemetry — `docs/product/core-services.md` · `docs/product/release-engineering.md`*
