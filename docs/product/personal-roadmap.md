# Personal Roadmap — Stake Planner

> Công cụ cho chính mình, dùng mỗi ngày trong 5 năm.

---

## Ngôn ngữ sản phẩm

| Module kỹ thuật | Tên sản phẩm |
|-----------------|--------------|
| Generate | **Planning** |
| Improve | **Capital Planner** |
| Continue | **Session Planner** |
| Allocation | **Account Planner** |
| Rule Editor | **Game Designer** |
| History | **Session Library** |
| Analytics | **Insights** |

---

## Roadmap 5 năm

```
Game Designer ✅
        │
        ▼
Planning (+ presets) ✅
        │
        ▼
Session Planner ✅
        │
        ▼
Capital Planner ✅
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
Backup / Restore
```

---

## Giai đoạn 1 — Session Management ✅

Dashboard · Planning · Playing · Session Planner (continue) · Session Library · Insights (slider) · Export · IndexedDB

## Giai đoạn 2 — Capital Planner ✅

5 mode optimize · UI Capital Planner

## Giai đoạn 3 — Game Designer + Presets ✅ (hiện tại)

- **Game Designer** workspace — rules, reward policy, continue policy
- Builtin: Bingo ×120, ×20, Crash 1.95, Dice, Custom
- Save custom preset → IndexedDB
- **Planning** — preset picker auto-fill form
- `maximumBet` lưu trong preset (solver wire Phase 2 platform)

## Giai đoạn 4 — Session Planner (aggregate root) ✅ (hiện tại)

- **Session** = aggregate root (plans[], timeline, notes, statistics)
- **Plan** tree: Generate → Improve → Continue với `parentPlanId`
- Workspace **Session** = trang làm việc chính (80% thời gian)
- **Planning** chỉ khởi tạo session mới
- **Session Library** thay history đơn lẻ
- Export full session JSON (policy, plans, timeline, notes, stats)

## Giai đoạn 5 — Account Planner

Chia plan trên session, không chỉ strategy đơn

## Giai đoạn 6+ 

Insights sâu · Calendar · Notes · Search · Backup/Restore · Shortcuts · PWA · AI

## Capital Planner (tương lai)

Quản lý vốn: 30M → bao nhiêu vòng/ngày, bao nhiêu session song song.

## Backend

Chỉ khi cần sync đa thiết bị — local-first trước.

---

*Câu hỏi định hướng: "Nếu mình dùng app này mỗi ngày trong 5 năm thì mình còn muốn có gì?"*
