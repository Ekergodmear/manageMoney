# Feature 1 — Dogfood Notes

**Feature:** Generate Plan  
**App:** `pnpm dev`  
**Brief:** [feature-1-generate-plan.md](feature-1-generate-plan.md)

Ghi chú trong lúc dogfood — không cần issue hay RFC. Sửa `App.tsx` hoặc brief, rồi commit nhỏ.

---

## Checklist thử

- [ ] ~20 request khác nhau (vòng, lợi nhuận, hệ số)
- [ ] Nhập sai / trống / 0
- [ ] Số cực lớn / cực nhỏ
- [ ] Copy số từ Excel (dấu phẩy, khoảng trắng)
- [ ] Refresh browser
- [ ] Back / forward (form ↔ decision ↔ plan)
- [ ] Mobile width (~375px)
- [ ] Vốn tùy chọn &lt; required / &gt;= required / để trống

**Câu hỏi sau mỗi lần:** Nếu không biết SDK, mình có hiểu chuyện gì vừa xảy ra không?

---

## Notes

### #001

_Observation:_

_Action:_

---

### #002

_Observation:_

_Action:_

---

### #003

_Observation:_

_Action:_

---

## Đã sửa (Product Lead review trước dogfood)

| # | Vấn đề | Sửa |
| - | ------ | --- |
| — | Required bankroll ngang hàng với các số khác | Hero size + divider |
| — | "Your plan is ready" | → "Your betting plan is ready." |
| — | "View Plan" mơ hồ | → "View Betting Plan" |

---

## Sau dogfood

- [ ] Feature 1 DoD tick trong brief
- [ ] Mở Feature 2 (Improve Plan) chỉ khi dogfood không còn blocker UX
