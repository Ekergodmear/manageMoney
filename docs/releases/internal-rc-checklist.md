# Internal RC — Checklist sử dụng hằng ngày

**Branch:** `release/internal-rc`  
**Tag tham chiếu:** `architecture-v1`  
**Thời gian:** 2–4 tuần (tối thiểu 14 ngày để pass gate)

---

## Quy tắc trong giai đoạn này

| Làm                                            | Không làm                         |
| ---------------------------------------------- | --------------------------------- |
| Dùng app như người dùng thật                   | Refactor P1/P2/P4/P3              |
| Ghi `daily-notes.md` (local, copy từ template) | Đổi màu · icon · wording · layout |
| Tick checklist mỗi tối                         | Mở thêm tài liệu kiến trúc        |
| Sửa **blocker** (crash, mất data, logic sai)   | Feature mới                       |

**Blocker** = mất dữ liệu · crash · hydrate lỗi · Continue/Improve sai kết quả · không thể hoàn thành workflow cốt lõi.

Sau Internal RC ổn định → quay lại P1 → P2 → P4 → P3.

---

## Cách dùng checklist

- Mỗi buổi tối: tick những gì đã thử trong phiên đó.
- Không cần tick hết mỗi ngày — nhưng sau **2 tuần** nên tick phần lớn ít nhất một lần.
- Ghi **3 câu mỗi tối** vào `daily-notes.md` (file local — xem template).

**Phiên hôm nay:** `____-__-__`

---

## Ba câu mỗi tối (quan trọng hơn checklist)

```text
1. Có muốn mở Stake Planner lần nữa ngày mai không?  YES / NO
2. Điều khó chịu nhất hôm nay?  (chỉ 1 ý)
3. Nếu chỉ được sửa 1 thứ ngày mai thì sửa gì?
```

Template: [`daily-notes.template.md`](../product/daily-notes.template.md)

---

## Planning

- [ ] Mở workspace Planning
- [ ] Generate plan (form → bảng)
- [ ] Refresh / generate lại
- [ ] Chỉnh form trước promote
- [ ] Promote → Session mới
- [ ] Reload trang — draft không còn, session còn

---

## Session — Overview & Playing

- [ ] Mở Session active
- [ ] Xem overview / cockpit
- [ ] Start plan → chuyển Playing
- [ ] Tick (place bet) vài vòng
- [ ] Undo bet
- [ ] Win session
- [ ] Stop session (nếu dùng)
- [ ] Xem timeline sau các hành động
- [ ] Reload — state playing giữ nguyên

---

## Continue

- [ ] Continue từ session đã hết plan (preset 1000)
- [ ] Continue preset khác (1500 / 2000)
- [ ] Plan cũ → superseded; plan mới active
- [ ] Timeline có `plan-added` + origin continue
- [ ] Reload — continue vẫn đúng

---

## Improve

- [ ] Mở Improve từ session
- [ ] Generate candidate
- [ ] Review candidate (màn review)
- [ ] Promote → plan append vào session
- [ ] Reload — plan improve còn

---

## Capital Planner

- [ ] Mở Capital
- [ ] Generate recommendations
- [ ] Chọn một recommendation
- [ ] Review candidate
- [ ] Promote → Session mới
- [ ] Reload — session capital còn

---

## Scenario Planner (Experiment)

- [ ] Mở Scenario Planner
- [ ] Chạy experiment / generate
- [ ] Chọn recommendation
- [ ] Promote → Session mới
- [ ] Reload — session còn

---

## Session Library

- [ ] Mở Library
- [ ] Tìm / lọc session
- [ ] Favorite session
- [ ] Duplicate session
- [ ] Mở session read-only (không phải active)
- [ ] So sánh 2 session (nếu dùng)
- [ ] Reload — library đầy đủ

---

## Insights

- [ ] Mở Insights
- [ ] Xem thống kê / recommendation cards
- [ ] Dữ liệu khớp với sessions đã chơi

---

## Game Designer

- [ ] Mở Game Designer
- [ ] Xem / chọn preset
- [ ] Tạo hoặc chỉnh custom preset (nếu dùng)
- [ ] Preset áp dụng được ở Planning / Continue

---

## Settings & Persistence

- [ ] Mở Settings
- [ ] Đổi theme / preference (nếu có)
- [ ] Reload — settings giữ
- [ ] Đóng tab, mở lại — không mất sessions
- [ ] Hard refresh (Ctrl+F5) — không mất IndexedDB

---

## Navigation & shell

- [ ] Chuyển workspace (sidebar / nav)
- [ ] Dashboard
- [ ] Quay lại session sau khi đi workspace khác
- [ ] Không crash khi chuyển nhanh giữa các màn

---

## Gate — sau 2 tuần

Đánh dấu khi đủ điều kiện pass [Internal RC Stable](../release/stability-gate.md#internal-rc-stable):

- [ ] ≥ 14 ngày ghi `daily-notes.md` (local)
- [ ] Không crash trong usage thường ngày
- [ ] Không migrate / hydrate lỗi
- [ ] Không mất dữ liệu session / library
- [ ] Không cần DevTools / sửa IndexedDB thủ công
- [ ] Không blocker khiến bỏ dùng app
- [ ] Biết feature nào dùng nhiều / ít (heatmap usage)

**Kết luận:** ☐ Chưa pass · ☐ Pass → bắt đầu P1

---

## Đọc thêm

- [`daily-notes.template.md`](../product/daily-notes.template.md) — copy thành `daily-notes.md` (local, gitignored)
- [`stability-gate.md`](../release/stability-gate.md) — Definition of Stable
- [`freeze-v1.md`](../architecture/freeze-v1.md) — Architecture v1 Frozen
