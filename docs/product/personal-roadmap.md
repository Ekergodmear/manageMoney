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
        │
        ▼
Session Library
        │
        ▼
Insights (đọc từ Library)
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
Scenario Planner ✅
        │
        ▼
Session 2.0 ✅
        │
        ▼
Library 2.0 ✅
        │
        ▼
Insights 2.0
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

## Giai đoạn 7 — Session 2.0 ✅

Polish workspace Session — không thêm module mới.

- **Session Cockpit** — overview thành cockpit: progress, plan, bet, spent, target, actions
- **Playing** — hero round card, shortcuts (B/Enter, W, Z), animation, auto-scroll
- **Timeline** dọc với giờ (HH:mm)
- **Notes** + **Statistics** — panel cố định, không popup

## Giai đoạn 8 — Library 2.0 ✅

Library = bộ não kinh nghiệm chơi — Insights đọc từ đây sau này. **Đóng băng** trừ bug.

- **Header stats** — Active, Completed, Won, Lost
- **4 khu vực** — Active (ghim ĐANG CHƠI), Recent (nhóm thời gian), Collections (folder), Archive
- **Search + filter** — game, status, continue ≥N, max bet, tag
- **Session card** — thumbnail trạng thái, metrics, export menu ⋮
- **Favorite** ☆/★ + animation · **Duplicate** thông minh `(2)(3)` + đổi tên lần đầu
- **Compare** drawer bên phải + cột Δ · **Tags** + **Collections**

## Giai đoạn 9 — Insights 2.0 (tiếp theo)

## Giai đoạn 9+

Calendar · Notes · Search · Resume · Backup/Restore · PWA · Cloud

---

*Nguyên tắc từ đây: không thêm workspace mới trừ khi mở năng lực mới. Đào sâu chất lượng module hiện có.*

---

*Câu hỏi định hướng: "Nếu mình dùng app này mỗi ngày trong 5 năm thì mình còn muốn có gì?"*
