# Personal Roadmap — Stake Planner

> Công cụ cho chính mình, dùng mỗi ngày trong 5 năm.

---

## Ngôn ngữ sản phẩm

| Module kỹ thuật | Tên sản phẩm |
|-----------------|--------------|
| Generate | **Planning** |
| Improve | **Improve** (trong Session — sửa plan có sẵn) |
| Capital Planner | **Capital Planner** (workspace — quyết định trước khi chơi) |
| Continue | **Session Planner** |
| Allocation | **Account Planner** |
| Rule Editor | **Game Designer** |
| History | **Session Library** |
| Analytics | **Insights** |

---

## Kiến trúc 3 tầng

```
Game Designer
        │
        ▼
Capital Planner
        │
        ▼
Session
        │
        ▼
Playing
```

Planning không còn là trung tâm — chỉ khởi tạo session thủ công khi cần.

---

## Roadmap 5 năm

```
Game Designer ✅
        │
        ▼
Capital Planner ✅
        │
        ▼
Session ✅
        │
        ▼
Improve (trong Session) ✅
        │
        ▼
Scenario Planner (sandbox what-if)
        │
        ▼
Simulation
        │
        ▼
Account Planner
        │
        ▼
Insights
        │
        ▼
Session Library ✅
        │
        ▼
Resume (khi cần đa session / đa thiết bị)
        │
        ▼
Backup / Restore / Cloud
```

---

## Giai đoạn 1 — Session Management ✅

Dashboard · Planning · Playing · Session Planner (continue) · Session Library · Insights (slider) · Export · IndexedDB

## Giai đoạn 2 — Improve ✅

5 mode optimize · UI Improve trong Session (plan đã có → làm khả thi hơn)

## Giai đoạn 3 — Game Designer + Presets ✅

- **Game Designer** workspace — rules, reward policy, continue policy
- Builtin: Bingo ×120, ×20, Crash 1.95, Dice, Custom
- Save custom preset → IndexedDB
- **Planning** — preset picker auto-fill form
- `maximumBet` lưu trong preset (solver wire Phase 2 platform)

## Giai đoạn 4 — Session (aggregate root) ✅

- **Session** = aggregate root (plans[], timeline, notes, statistics)
- **Plan** tree: Generate → Improve → Continue với `parentPlanId`
- Workspace **Session** = trang làm việc chính (80% thời gian)
- **Session Library** thay history đơn lẻ
- Export full session JSON (policy, plans, timeline, notes, stats)

## Giai đoạn 5 — Capital Planner ✅ (hiện tại)

- Workspace **Capital Planner** — vốn + game + mục tiêu + rủi ro → engine tự quyết profit/rounds
- Không nhập profit/rounds thủ công
- Multi-session split qua **Strategy Profile** → `CapitalAllocationPolicy` (không hardcode trong service)
- **Planning Strategy Engine** — Capital Planner không gọi `optimize()` trực tiếp
- **Generate Session** → tạo Session aggregate từ khuyến nghị
- Dashboard: Capital / Allocated / Available
- Tách rõ **Improve** (sửa plan) vs **Capital Planner** (chiến lược từ vốn)

## Giai đoạn 6 — Scenario Planner

Sandbox what-if: vốn khác, multiplier đổi, tax đổi — không sửa session thật

## Giai đoạn 7 — Account Planner

Chia plan trên session, không chỉ strategy đơn

## Giai đoạn 8+

Insights sâu · Calendar · Notes · Search · Resume · Backup/Restore · Shortcuts · PWA · AI

## Backend

Chỉ khi cần sync đa thiết bị — local-first trước.

---

*Câu hỏi định hướng: "Nếu mình dùng app này mỗi ngày trong 5 năm thì mình còn muốn có gì?"*
