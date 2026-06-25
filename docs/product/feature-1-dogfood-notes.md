# Feature 1 — Dogfood Notes

**Feature:** Generate Plan  
**App:** `pnpm dev` → http://localhost:5173  
**Brief:** [feature-1-generate-plan.md](feature-1-generate-plan.md)  
**Tester:** Automated + browser session (2026-06-25)  
**Scenarios run:** 20 logic paths + 8 UI flows

Ghi chú trong lúc dogfood — không cần issue hay RFC. Sửa `App.tsx` hoặc brief, rồi commit nhỏ.

---

## Checklist

- [x] ~20 request khác nhau (vòng, lợi nhuận, hệ số)
- [x] Nhập sai / trống / 0
- [x] Số cực lớn / cực nhỏ
- [x] Copy số từ Excel (dấu phẩy)
- [x] Back navigation (form ↔ decision ↔ plan)
- [x] Mobile width (~375px)
- [x] Vốn tùy chọn &lt; required / để trống
- [ ] Refresh browser (state mất — chấp nhận được Feature 1)
- [ ] 5–10 plan liên tiếp bởi người thật (chờ bạn dogfood thêm)

**Câu hỏi sau mỗi lần:** Nếu không biết SDK, mình có hiểu chuyện gì vừa xảy ra không?

---

## Tóm tắt

| Mức độ | Số lượng | Blocker Feature 2? |
| ------ | -------- | ------------------ |
| OK | 6 | — |
| Minor | 7 | Không |
| Medium | 5 | 2 cần xem xét (#004, #007) |
| Blocker | 0 | — |

**Gate Feature 2:** Chưa pass hoàn toàn — còn **#004** (Excel) và **#007** (Expected profit) nên sửa trước. Bạn dogfood thêm 2–3 ngày để xác nhận gate “người lạ hoàn thành được không”.

---

## Notes

### #001 — Default 100k / 50 vòng

**Thử:** Generate với giá trị mặc định.

**Quan sát:** Decision screen hiện `1,520,000` required bankroll. Hero size dễ đọc. `✓ Your betting plan is ready.` → `View Betting Plan` rõ bước tiếp.

**Mức độ:** OK  
**Hành động:** Giữ nguyên.

---

### #002 — Required bankroll có phân cách hàng nghìn

**Thử:** S01 default.

**Quan sát:** Output `1,520,000` — đã có comma separator.

**Mức độ:** OK  
**Hành động:** Giữ nguyên.

---

### #003 — Flow Generate → Decision → Plan

**Thử:** Default → View Betting Plan → ← Kết quả → ← Sửa ý định.

**Quan sát:** Back navigation hoạt động. Form giữ giá trị cũ. Không bị “ủa tiếp theo bấm gì?” sau Generate.

**Mức độ:** OK  
**Hành động:** Giữ nguyên.

---

### #004 — Lỗi khi nhập 0 vòng

**Thử:** Số vòng = `0` → Generate.

**Quan sát:** Inline error dưới field: `roundCount must be at least 1` — **tiếng Anh kỹ thuật**, tên field SDK. Label form là tiếng Việt.

**Mức độ:** Minor  
**Hành động:** Map `ValidationCodes` → copy tiếng Việt thân thiện (vd. *“Số vòng phải từ 1 trở lên”*).

---

### #005 — Lỗi generic khi nhập số thập phân / trống

**Thử:** Số vòng `5.5` hoặc để trống một field bắt buộc.

**Quan sát:** Lỗi chung phía trên nút: `Please enter whole numbers in all required fields.` — **không chỉ đúng field**.

**Mức độ:** Medium  
**Hành động:** Gán lỗi client-side vào từng field trống / không hợp lệ thay vì message chung.

---

### #006 — Paste số từ Excel (có dấu phẩy)

**Thử:** Lợi nhuận mục tiêu = `1,000,000` → Generate.

**Quan sát:** Fail với `Please enter whole numbers in all required fields.` — **không** báo ở field lợi nhuận. User paste từ Excel rất hay gặp.

**Mức độ:** Medium (**gần blocker** cho user thực tế)  
**Hành động:** Strip `,` và khoảng trắng khi parse (product layer) hoặc báo rõ *“Bỏ dấu phẩy trong số”* tại field.

---

### #007 — Expected profit khác lợi nhuận mục tiêu

**Thử:** 50k profit / 20 vòng / ×20 (scenario S02).

**Quan sát:** User nhập `50,000` nhưng Decision hiện Expected profit `68,000`. Dễ hiểu nhầm đây là “lợi nhuận mục tiêu” — thực ra là lợi nhuận **nếu thắng vòng cuối** theo plan solver.

**Mức độ:** Medium  
**Hành động:** Đổi label → *“Expected profit (if you win)”* hoặc hiện thêm dòng *“Your target: 50,000”* tách biệt.

---

### #008 — Required bankroll có thể bị hiểu là “tiền sẽ mất”

**Thử:** Nhìn decision screen với mắt user mới.

**Quan sát:** “Required bankroll” chưa giải thích đây là **vốn tối đa cần chuẩn bị** (peak exposure), không phải tổng tiền mất hết.

**Mức độ:** Minor  
**Hành động:** Thêm một dòng phụ: *“Maximum capital needed during the plan”* hoặc tiếng Việt tương đương.

---

### #009 — Trộn ngôn ngữ UI

**Thử:** Toàn flow.

**Quan sát:**

| Khu vực | Ngôn ngữ |
| ------- | -------- |
| Form labels | Tiếng Việt |
| CTA Generate / View Betting Plan | English |
| Decision screen | English |
| Plan screen title | Tiếng Việt (*Kế hoạch — 50 vòng*) |
| Back links | Tiếng Việt (*Sửa ý định*, *Kết quả*) |

**Mức độ:** Medium  
**Hành động:** Chọn một ngôn ngữ chính (VN hoặc EN) cho toàn Feature 1 — không cần i18n framework, chỉ thống nhất copy.

---

### #010 — Cảnh báo vốn không đủ (optional bankroll)

**Thử:** Vốn của bạn = `1,000,000`, plan cần `1,520,000`.

**Quan sát:** `⚠ Your bankroll is only 1,000,000. Required: 1,520,000.` — hoạt động đúng. Chưa có Improve Plan (đúng scope Feature 1).

**Mức độ:** OK  
**Hành động:** Giữ nguyên. Feature 2 thêm nút Improve Plan cùng vị trí.

---

### #011 — Bảng 50 vòng trên mobile

**Thử:** 375px width, View Betting Plan.

**Quan sát:** Bảng scroll dọc được, không tràn ngang. 50 dòng = scroll dài — chấp nhận được nhưng mệt.

**Mức độ:** Minor  
**Hành động:** Có thể sau này: sticky header / chỉ hiện 10 vòng đầu + “xem thêm”. Không blocker Feature 1.

---

### #012 — Lỗi bet step không chia hết minimum bet

**Thử:** minimumBet 10000, betStep 3000.

**Quan sát:** `minimumBet must be a multiple of betStep` — inline đúng field nhưng message kỹ thuật.

**Mức độ:** Minor  
**Hành động:** Cùng batch với #004 — user-facing validation copy.

---

### #013 — Số vòng rất lớn (100)

**Thử:** 50k profit, 100 vòng.

**Quan sát:** Required bankroll `10,535,500` — hiển thị OK. Generate nhanh, không lag.

**Mức độ:** OK  
**Hành động:** Giữ nguyên.

---

### #014 — Lợi nhuận mục tiêu = 0

**Thử:** targetProfit `0`, 10 vòng.

**Quan sát:** Generate **thành công** — plan hợp lệ theo SDK. User có thể bối rối “tại sao 0 vẫn được?”.

**Mức độ:** Minor  
**Hành động:** Cân nhắc cảnh báo UI nếu profit = 0 (*“Bạn chưa đặt lợi nhuận mục tiêu”*) — không bắt buộc nếu SDK cho phép.

---

### #015 — Vốn tùy chọn nhập chữ

**Thử:** Vốn = `abc`.

**Quan sát:** `Please enter a whole number.` inline — OK nhưng English.

**Mức độ:** Minor  
**Hành động:** Gộp với #009 localization.

---

### #016 — View Betting Plan — mục đích

**Thử:** User mới trên decision screen.

**Quan sát:** Sau status line, một CTA duy nhất `View Betting Plan` — đủ rõ là “xem chi tiết từng vòng”. Không cần thêm giải thích dài.

**Mức độ:** OK  
**Hành động:** Giữ nguyên.

---

### #017 — Refresh mất state

**Thử:** (logic) React state only, không URL persistence.

**Quan sát:** F5 quay về form — mất plan. Chấp nhận Feature 1.

**Mức độ:** OK (out of scope)  
**Hành động:** Không sửa Feature 1.

---

### #019 — Vốn cần chuẩn bị nghĩa là gì?

**Thử:** User mới nhìn số vốn lớn (PM bổ sung).

**Quan sát:** Thiếu giải thích → dễ hiểu nhầm là “tiền mất hết”.

**Mức độ:** Medium  
**Hành động:** ✅ Thêm dòng phụ dưới vốn cần: *“Đây là mức vốn tối đa bạn cần có nếu chưa thắng vòng nào.”*

---

### #018 — Dogfood người lạ (gate Feature 1)

**Lời dẫn duy nhất:** *"Bạn muốn lời 100.000 trong 50 vòng. Hãy thử dùng ứng dụng."*  
**Sau đó:** không giải thích thêm. Chỉ quan sát.

| Quan sát | Có / Không |
| -------- | ---------- |
| Tự biết nhập dữ liệu | |
| Hiểu "Vốn cần chuẩn bị" | |
| Hiểu "Lợi nhuận ước tính" | |
| Biết bấm "Xem kế hoạch cược" | |
| Hỏi "tiếp theo làm gì?" | |

**Câu hỏi phụ (nếu xuất hiện):**

| Câu hỏi của họ | Ý nghĩa |
| -------------- | ------- |
| *"Ủa, lợi nhuận này là gì?"* | #007 chưa đủ |
| *"Ủa, vốn này là mình mất luôn hả?"* | #019 chưa đủ |

**Kết quả:** _[Điền sau buổi thử]_

**Mức độ:**

**Hành động:**

**Nếu pass →** freeze Feature 1 (`Released`), mở Product Brief Feature 2. **Không polish thêm.**

---

## Đã sửa (trước dogfood)

| # | Vấn đề | Sửa |
| - | ------ | --- |
| — | Required bankroll ngang hàng | Hero size + divider |
| — | "Your plan is ready" | → "Your betting plan is ready." |
| — | "View Plan" | → "View Betting Plan" |

---

## Đề xuất thứ tự sửa (sau dogfood chung)

| Ưu tiên | Note | Trạng thái |
| ------- | ---- | ---------- |
| 1 | #006 Excel commas | ✅ UI normalize |
| 2 | #007 Expected profit label | ✅ Tách mục tiêu / ước tính |
| 3 | #005 Generic client errors | ✅ Per-field VN |
| 4 | #004 / #012 Validation copy VN | ✅ Map thông dụng |
| 5 | #009 Thống nhất ngôn ngữ | ✅ 100% VN product |
| 6 | #008 / #019 Bankroll helper | ✅ #019 done |
| 7 | #018 Người lạ test | ⏳ Chờ |

Mỗi fix → commit riêng.

---

## Release gate Feature 2

Chỉ mở **Improve Plan** khi:

- [x] **#006** resolved — normalize dấu phẩy khi parse (UI layer)
- [x] **#007** resolved — tách *Mục tiêu của bạn* vs *Lợi nhuận ước tính (nếu thắng)*
- [x] **#009** resolved — product UI 100% tiếng Việt (SDK giữ English)
- [x] **#019** resolved — dòng phụ giải thích vốn cần chuẩn bị
- [ ] **Người chưa biết sản phẩm** hoàn thành Feature 1 trong ~30s không cần giải thích

**Trạng thái gate:** 🟡 Chờ buổi thử với người lạ (#018).

---

## PM review (2026-06-25)

> Feature 1 chưa release, không cần thiết kế lại — một vòng polish UX.

**Đã polish:** `fix(product): improve Generate Plan clarity and input handling` — #006, #007, #009, #019  
**Không sửa (theo PM):** #014 profit=0, #011 scroll 50 vòng  
**Rủi ro còn lại:** ngôn ngữ & kỳ vọng user — đã giảm sau polish; cần xác nhận người lạ.

