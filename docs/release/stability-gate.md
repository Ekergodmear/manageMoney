# Definition of Stable — Stability Gates

Không phải Definition of Done cho từng task.

Đây là **gate** trước khi chuyển giai đoạn — mỗi gate phải pass trước khi làm việc tiếp theo.

Roadmap đã khóa:

```text
Architecture v1 ✅
    ↓
P1 Persistence Stable
    ↓
P2 Recommendation Stable
    ↓
P4 Timeline Stable
    ↓
P3 Playing Stable
    ↓
Internal RC Stable
    ↓
Cloud Phase 1 Stable
    ↓
v0.9 Personal Stable
    ↓
Cloud Phase 2 → v1.0
```

**Quy tắc phạm vi:** Mọi đề xuất sau này chỉ hợp lệ nếu (a) giải quyết vấn đề ghi trong `daily-notes.md` (local), hoặc (b) giúp hoàn thành một gate dưới đây. Template: [`daily-notes.template.md`](../product/daily-notes.template.md). Còn lại → **ngoài phạm vi**.

---

## P1 — Persistence Stable

**Mục tiêu:** Một đường ghi dữ liệu duy nhất.

### Tiêu chí pass

- [ ] `App.tsx` không gọi `persist()` / `savePersistedState()` trực tiếp cho domain mutations
- [ ] Không còn dual write (use case `saveState` + App `persist` cùng lúc)
- [ ] 100% workflow domain qua Repository → `PersistenceService`
- [ ] `SessionRepository.upsert` / `promoteActive` đã wire hoặc xóa (không dead API)
- [ ] Unit + regression tests pass (`vitest run`)
- [ ] `build:app` pass
- [ ] **Không thay đổi UI** (hành vi người dùng giữ nguyên)

### Kiểm tra nhanh

```text
grep -r "savePersistedState\|persist(" src/App.tsx
→ chỉ hydration / theme / shell được phép (nếu có)
```

---

## P2 — Recommendation Stable

**Mục tiêu:** Aggregate thuần; repository chỉ CRUD.

### Tiêu chí pass

- [ ] `selectRecommendation(set, id)` là pure function trên `RecommendationSet` (không trong repository)
- [ ] `RecommendationSetRepository` chỉ: `get` · `save` · `clear`
- [ ] Không domain logic trong repository layer
- [ ] Capital + Experiment pipeline tests pass
- [ ] **Không thay đổi UI**

---

## P4 — Timeline Stable

**Mục tiêu:** Dữ liệu persisted nhất quán; migration only.

### Tiêu chí pass

- [ ] Migration normalize legacy `continue` / `improve` → `plan-added` + `origin`
- [ ] Legacy types vẫn đọc được cho session cũ (hoặc đã migrate hết trên load)
- [ ] Không emit timeline type legacy trong code mới
- [ ] Migration tests pass
- [ ] **Không thay đổi UI** (timeline hiển thị như cũ)

---

## P3 — Playing Stable

**Mục tiêu:** Playing lifecycle qua use case; App chỉ wire.

### Tiêu chí pass

- [ ] `PlaceBetUseCase`
- [ ] `UndoBetUseCase`
- [ ] `WinSessionUseCase`
- [ ] `StopSessionUseCase`
- [ ] `StartPlanUseCase` (resume / bắt đầu plan)
- [ ] Không còn `placeBetOnPlan` / `winCurrentPlan` / … gọi trực tiếp từ `App.tsx`
- [ ] Session mutations playing qua Repository
- [ ] Playing flow regression pass (manual DoD: Planning → Playing → bet → win hoặc continue)
- [ ] UI giữ nguyên (chỉ đổi wiring)

---

## Internal RC Stable

**Mục tiêu:** Sản phẩm đủ tin cậy để dùng hàng ngày 2–4 tuần. **Có thể bắt đầu trước P1** — usage trước, refactor sau.

Checklist hằng ngày: [`internal-rc-checklist.md`](../releases/internal-rc-checklist.md)

### Tiêu chí pass

- [ ] Dùng liên tục **≥ 14 ngày** (ghi `daily-notes.md` local)
- [ ] Không crash trong usage thường ngày
- [ ] Không migrate lỗi (upgrade app version không mất state)
- [ ] Không mất dữ liệu session / library
- [ ] Không phải mở DevTools để xử lý
- [ ] Không phải sửa IndexedDB thủ công
- [ ] Không có blocker khiến bỏ dùng app
- [ ] Local usage metrics đủ để có heatmap cơ bản (biết feature nào dùng / không dùng)

### Gate trước Cloud

**Internal RC Stable** là điều kiện bắt buộc trước Cloud Phase 1.

---

## Cloud Phase 1 Stable

**Mục tiêu:** Sync durable state — Sessions, Presets, Settings.

**Không sync:** `RecommendationSet`, `PlanCandidate`, telemetry staging.

### Tiêu chí pass

- [ ] Chu trình offline → online → offline → online không mất dữ liệu
- [ ] Không duplicate Session sau sync
- [ ] Không conflict ngoài dự kiến (document resolution strategy)
- [ ] Staging state vẫn local-only sau sync
- [ ] v0.9 tag trên branch `release/v0.9` (hoặc tương đương)

---

## v0.9 Personal Stable

Sau Cloud Phase 1 Stable + daily usage ổn định thêm một giai đoạn ngắn.

- [ ] [`known-limitations.md`](known-limitations.md) cập nhật (bỏ mục đã giải quyết)
- [ ] Không blocker từ daily-notes chưa xử lý

---

## v1.0

Cloud Phase 2 (Share, Backup, Restore, Public Link) + limitations còn lại được chấp nhận hoặc đã xử lý.

---

## Đọc thêm

- [`known-limitations.md`](known-limitations.md) — giới hạn cố ý vs nợ kỹ thuật
- [`../architecture/freeze-v1.md`](../architecture/freeze-v1.md) — roadmap tổng
- [`../architecture/decisions.md`](../architecture/decisions.md) — tại sao
- [`daily-notes.template.md`](../product/daily-notes.template.md) — copy thành `daily-notes.md` (local, gitignored)
