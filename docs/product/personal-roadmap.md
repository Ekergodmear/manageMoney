# Personal Roadmap — Stake Planner

> Công cụ cho chính mình, dùng mỗi ngày trong 5 năm — không phải checklist release.

---

## Giai đoạn 1 — Session Management ✅

- Dashboard (action-first)
- Generate
- Playing (todo UX, undo, win)
- Continue (+ until 1000/1500/2000/5000)
- History (cards)
- Simulation (slider)
- Export (JSON + Print)
- Autosave (IndexedDB)

## Giai đoạn 2 — Improve Engine ✅ (cơ bản)

| Mode | Mô tả | Engine |
|------|--------|--------|
| Giữ profit | Giảm vòng | Round search |
| Giữ rounds | Giảm profit | `optimize(allowRoundReduction: false)` |
| Giảm cả hai | Nested search | `optimize(allowRoundReduction: true)` |
| Vừa vốn | Tự tìm round + profit | `optimize` |
| Giới hạn cược max | Max bet ≤ ngưỡng | Round + profit search (app layer) |

**Tiếp theo:** Improve khi đang chơi (re-plan từ vòng hiện tại), Session Planner (nhiều plan/phiên).

## Giai đoạn 3 — Game & Policy

- **Game Presets** — Bingo 120x, 20x, Custom → auto-fill multiplier/step/min/tax
- **Reward Policy** — No tax, 10%, 15%, Tier, VIP
- **Rule Editor (Game Designer)** — UI trên `GamePolicy`, Save as Preset

## Giai đoạn 4 — Allocation & Session Planner

- Chia account A/B/C theo vòng hoặc thuế
- Một session = chuỗi Plan → Continue → Improve → Win

## Giai đoạn 5 — Analytics sâu

- Average bet, highest bet, capital growth
- Win round trung bình, expected bankroll, capital efficiency
- Calendar (session theo ngày)

## Giai đoạn 6 — Notes & Search

- Ghi chú per session
- Search: rounds, outcome, tháng

## Giai đoạn 7 — Backup / Restore / Shortcuts

- Backup → `session.json` · Restore
- Space = tick · Ctrl+Z undo · Ctrl+S backup · Ctrl+F search

## Giai đoạn 8 — PWA

- Install → desktop app → offline

## Giai đoạn 9 — AI Assistant

- Gợi ý dựa trên lịch sử cá nhân (sau cùng)

## Backend — chỉ khi cần

Đăng nhập đa thiết bị, sync, share link, subscription — **không trước khi local-first đủ mạnh**.

---

*Câu hỏi định hướng: "Nếu mình dùng app này mỗi ngày trong 5 năm thì mình còn muốn có gì?"*
