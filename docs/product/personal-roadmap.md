# Personal Roadmap — Stake Planner

> Công cụ cho chính mình, dùng mỗi ngày trong 5 năm.

---

## Ngôn ngữ sản phẩm

| Module kỹ thuật | Tên sản phẩm |
|-----------------|--------------|
| Generate | **Planning** |
| Improve | **Improve** (trong Session — sửa plan có sẵn) |
| Scenario Planner | **Scenario Planner** (Lab — sandbox what-if) |
| Capital Planner | **Capital Planner** (workspace — quyết định trước khi chơi) |
| Continue | **Session Planner** |
| Allocation | **Account Planner** |
| Rule Editor | **Game Designer** |
| History | **Session Library** |
| Analytics | **Insights** |

---

## Kiến trúc sản phẩm

```
Game Designer
        │
        ▼
Scenario Planner (Lab)
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

Planning chỉ khởi tạo session thủ công khi cần.

---

## Roadmap

```
Game Designer ✅
        │
        ▼
Planning Strategy Engine ✅
        │
        ▼
Capital Planner ✅
        │
        ▼
Session ✅
        │
        ▼
Playing ✅
        │
        ▼
Scenario Planner ✅
        │
        ▼
Insights
        │
        ▼
Account Planner
        │
        ▼
Resume · Backup · Cloud
```

---

## Giai đoạn 1–5 ✅

Session Management · Improve · Game Designer · Session aggregate · Capital Planner

(xem commit history cho chi tiết)

## Giai đoạn 6 — Scenario Planner ✅

- Workspace **Scenario Planner** — Lab sandbox, không persist IndexedDB
- **Experiments** (không dùng "branch") — Baseline + Experiment A/B/C
- **Compare** với cột Δ so với Baseline (vốn, max bet, profit, ROI…)
- **Duplicate** experiment · **Notes** trên từng experiment
- Quick forks · Promote → Session / Preset
- Recent 5 trong `sessionStorage`

## Giai đoạn 7 — Session 2.0 (hiện tại)

Polish workspace Session — không thêm module mới.

- **Session Cockpit** — overview thành cockpit: progress, plan, bet, spent, target, actions
- **Playing** — hero round card, shortcuts (B/Enter, W, Z), animation, auto-scroll
- **Timeline** dọc với giờ (HH:mm)
- **Notes** + **Statistics** — panel cố định, không popup

## Giai đoạn 8 — Library 2.0

Capital Usage · Planned vs Played vs Released · Efficiency

## Giai đoạn 9 — Insights 2.0

## Giai đoạn 9+

Calendar · Notes · Search · Resume · Backup/Restore · PWA · Cloud

---

*Nguyên tắc từ đây: không thêm workspace mới trừ khi mở năng lực mới. Đào sâu chất lượng module hiện có.*

---

*Câu hỏi định hướng: "Nếu mình dùng app này mỗi ngày trong 5 năm thì mình còn muốn có gì?"*
