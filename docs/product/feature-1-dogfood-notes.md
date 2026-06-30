# Feature 1 — Dogfood Notes & Usability Protocol

**Feature:** Generate Plan  
**App (local):** `pnpm dev` → http://localhost:5173  
**App (#018):** **https://stake-planner.vercel.app**  
**Deploy (nhánh `optimization-v1`):** https://manage-money-git-optimization-v1-just-me-yess.vercel.app  
**Brief:** [feature-1-generate-plan.md](feature-1-generate-plan.md)  
**Commits:** `28d5800` (decimal SDK) · `d6c6153` (decimal input + card layout)  
**Tester:** Automated + browser session (2026-06-25)  
**Scenarios run:** 20 logic paths + 8 UI flows

---

> **Purpose**
>
> This document is not a bug list.
>
> Its purpose is to discover whether users understand the product without explanation.
>
> Only observations that affect **product understanding** should be recorded.

**Sau #018 freeze → Feature 1 `Released`. Không polish thêm trừ blocker từ usability test.**

---

## Out of scope (không phải lỗi Feature 1)

Nếu tester nói một trong các điều sau → **không** ghi _"Feature 1 failed"_:

| Tester nói                        | Ghi như thế nào                                            | Maps to                    |
| --------------------------------- | ---------------------------------------------------------- | -------------------------- |
| _"Tôi muốn Export / in ra."_      | **Expectation** — user expected to keep the generated plan | Feature 4 — Export         |
| _"Tôi muốn lưu."_                 | **Expected Feature** — Keep Plan                           | Feature 4 — Keep Plan      |
| _"Tôi muốn xem nếu chỉ có 500k."_ | **Expected Feature** — Improve Plan                        | Feature 2 — Improve Plan   |
| _"So sánh hai kế hoạch."_         | **Expected Feature**                                       | Feature 4+ — Compare plans |

**Không ghi trong #018:**

- Màu chưa đẹp, margin lệch 2px, animation hơi nhanh
- Dark mode, typography polish, spacing tinh chỉnh

Đó là UX Polish Sprint — **sau Feature 2**, không phải mục tiêu usability validation.

---

## Quy tắc ghi nhận

**Không phải mọi thứ người dùng muốn đều phải làm ngay.**

### ❌ Không ghi là bug

```text
User: "Tôi muốn Export."
→ Bug: thiếu nút Export
```

### ✅ Ghi là Expectation

```text
Expectation
User expected to keep the generated plan.

Maps to:
Feature 4 – Export
```

### Ví dụ khác

```text
User: "Tôi muốn lưu."
→ Expected Feature: Keep Plan (Feature 4)
   NOT: Feature 1 failed.
```

```text
User: "Improve Plan đâu?"
→ Expected Feature: Improve Plan (Feature 2)
   NOT: blocker — đây là signal tích cực cho roadmap.
```

**Chỉ ghi blocker** khi ảnh hưởng **hiểu sản phẩm**: không generate được, hiểu vốn là _"tiền mất"_, kẹt Decision không biết bấm gì.

---

## Trạng thái hiện tại (2026-06-25)

| Lớp          | Đã xong                                                               | Còn thiếu                        |
| ------------ | --------------------------------------------------------------------- | -------------------------------- |
| **Platform** | Decimal multiplier, regression, property, differential                | —                                |
| **Product**  | Form, validation VN, decision cards, decimal input, responsive cơ bản | **Bằng chứng người dùng** (#018) |

**Không viết code thêm** cho đến khi #018 freeze — trừ **blocker** ảnh hưởng hiểu sản phẩm.

**Feature 1 chỉ còn một việc:** chạy usability test (#018). Không đổi copy, spacing, refactor App, animation.

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

| Mức độ  | Số lượng | Blocker Feature 2?         |
| ------- | -------- | -------------------------- |
| OK      | 6        | —                          |
| Minor   | 7        | Không                      |
| Medium  | 5        | 2 cần xem xét (#004, #007) |
| Blocker | 0        | —                          |

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
**Hành động:** Map `ValidationCodes` → copy tiếng Việt thân thiện (vd. _“Số vòng phải từ 1 trở lên”_).

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
**Hành động:** Strip `,` và khoảng trắng khi parse (product layer) hoặc báo rõ _“Bỏ dấu phẩy trong số”_ tại field.

---

### #007 — Expected profit khác lợi nhuận mục tiêu

**Thử:** 50k profit / 20 vòng / ×20 (scenario S02).

**Quan sát:** User nhập `50,000` nhưng Decision hiện Expected profit `68,000`. Dễ hiểu nhầm đây là “lợi nhuận mục tiêu” — thực ra là lợi nhuận **nếu thắng vòng cuối** theo plan solver.

**Mức độ:** Medium  
**Hành động:** Đổi label → _“Expected profit (if you win)”_ hoặc hiện thêm dòng _“Your target: 50,000”_ tách biệt.

---

### #008 — Required bankroll có thể bị hiểu là “tiền sẽ mất”

**Thử:** Nhìn decision screen với mắt user mới.

**Quan sát:** “Required bankroll” chưa giải thích đây là **vốn tối đa cần chuẩn bị** (peak exposure), không phải tổng tiền mất hết.

**Mức độ:** Minor  
**Hành động:** Thêm một dòng phụ: _“Maximum capital needed during the plan”_ hoặc tiếng Việt tương đương.

---

### #009 — Trộn ngôn ngữ UI

**Thử:** Toàn flow.

**Quan sát:**

| Khu vực                          | Ngôn ngữ                             |
| -------------------------------- | ------------------------------------ |
| Form labels                      | Tiếng Việt                           |
| CTA Generate / View Betting Plan | English                              |
| Decision screen                  | English                              |
| Plan screen title                | Tiếng Việt (_Kế hoạch — 50 vòng_)    |
| Back links                       | Tiếng Việt (_Sửa ý định_, _Kết quả_) |

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
**Hành động:** Cân nhắc cảnh báo UI nếu profit = 0 (_“Bạn chưa đặt lợi nhuận mục tiêu”_) — không bắt buộc nếu SDK cho phép.

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
**Hành động:** ✅ Thêm dòng phụ dưới vốn cần: _“Đây là mức vốn tối đa bạn cần có nếu chưa thắng vòng nào.”_

---

### #018 — Stranger usability test (gate Feature 1)

**Mục tiêu:** Không chỉ _hoàn thành được_ — mà biết **người dùng nghĩ ứng dụng đang làm gì ở từng bước**.

**Không làm:** Nhờ một người bạn bấm thử rồi hỏi _"thấy ổn không?"_.

---

#### Chuẩn bị

|                     |                                                                                                                                                                                  |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Số người**        | 2–3 người chưa biết dự án, không biết SDK                                                                                                                                        |
| **Thời lượng**      | ~5 phút / người                                                                                                                                                                  |
| **URL**             | Gửi tester: **https://stake-planner.vercel.app** (ngắn, dễ nhớ). Dự phòng: [manage-money-git-optimization-v1…](https://manage-money-git-optimization-v1-just-me-yess.vercel.app) |
| **Thiết bị**        | Ưu tiên mobile (~375px) — **URL production**, không localhost                                                                                                                    |
| **Vai trò của bạn** | Chỉ đọc script — **không giải thích, không chỉ tay**                                                                                                                             |
| **Ghi hình**        | Quay màn hình (OBS / Xbox Game Bar) **nếu người tham gia đồng ý**                                                                                                                |

**Vì sao quay video:** 5 phút video thường giá trị hơn nhiều dòng ghi chú — rê chuột ở đâu, dừng bao lâu, đọc dòng nào, bỏ qua dòng nào, có cuộn không.

Lưu file: `docs/product/sessions/#018-session-N.mp4` (hoặc thư mục riêng ngoài repo).

**URL dễ nhớ (`stake-planner.vercel.app`):** Vercel → project **manage-money** → **Settings → Domains** → Add `stake-planner.vercel.app` → trỏ Production. (Hoặc đổi Project Name thành `stake-planner`.) Tắt **Deployment Protection** trước #018 nếu tester không có tài khoản Vercel.

---

#### Script mở đầu (đọc nguyên văn)

> Bạn có **500.000đ**. Bạn muốn **lời 100.000** trong **50 vòng**.  
> Hãy dùng ứng dụng để xem **có làm được không**.

Sau đó im lặng. Chỉ can thiệp nếu họ hỏi trực tiếp — trả lời tối thiểu, không dạy flow.

**Gợi ý nhập (nếu họ tự hỏi “nhập gì?”):** _“Bạn thử điền theo ý bạn.”_ — không đọc từng field.

---

#### Câu hỏi hiểu biết (sau mỗi màn — đúng 3 lần)

Hỏi **ngay sau khi họ xong màn đó**, trước khi họ tự khám phá tiếp (trừ khi họ đã bấm sang màn kế).

##### Sau Generate → Decision

> _"Theo bạn, ứng dụng vừa tính ra cái gì?"_

| Trả lời kiểu                               | Ý nghĩa                                              |
| ------------------------------------------ | ---------------------------------------------------- |
| _"Số tiền tôi sẽ mất."_                    | ❌ Copy / helper vốn chưa đủ — **blocker tiềm năng** |
| _"Đây là số vốn tối đa tôi cần chuẩn bị."_ | ✅ Copy thành công                                   |
| _"Không biết / không chắc"_                | ⚠ Ghi verbatim — xem video lại                       |

##### Sau Decision (trước khi họ bấm, hoặc ngay sau khi đọc xong)

> _"Bạn sẽ bấm nút nào tiếp theo?"_

| Trả lời kiểu                               | Ý nghĩa           |
| ------------------------------------------ | ----------------- |
| _"Xem kế hoạch cược."_                     | ✅ Flow tốt       |
| _"Tiếp theo làm gì?"_ / im lặng / bấm Back | ❌ CTA chưa đủ rõ |

##### Sau Plan (đã xem bảng vòng)

> _"Nếu hôm nay bạn chơi thật, màn hình này đã đủ chưa?"_

Câu này **sinh roadmap** — ghi nguyên văn:

| Họ nói                            | User expectation             | Feature tương lai     |
| --------------------------------- | ---------------------------- | --------------------- |
| _"Đủ rồi."_                       | Tin plan, sẵn sàng chơi      | —                     |
| _"Tôi muốn in ra."_               | Muốn mang theo khi chơi      | Export                |
| _"Tôi muốn lưu."_                 | Muốn quay lại sau            | History / Keep Plan   |
| _"Tôi muốn xem nếu chỉ có 500k."_ | Muốn phương án khác          | **Improve Plan (F2)** |
| _"Improve Plan đâu?"_             | Muốn tối ưu khi vốn không đủ | **Improve Plan (F2)** |

---

#### Quan sát + User expectation (ghi trong lúc họ dùng)

| #   | Observation                           | User expectation                | S1  | S2  | S3  |
| --- | ------------------------------------- | ------------------------------- | --- | --- | --- |
| 1   | Nút / field chạm **đầu tiên**         |                                 |     |     |     |
| 2   | Tự nhập đủ **không hỏi**              |                                 |     |     |     |
| 3   | Đọc / bỏ qua helper vốn               | Hiểu peak capital vs tiền mất   |     |     |     |
| 4   | Nhầm lợi nhuận ước tính với mục tiêu  | Cần label rõ hơn                |     |     |     |
| 5   | Bấm **Xem kế hoạch cược** tự nhiên    | Muốn chi tiết từng vòng         |     |     |     |
| 6   | Hỏi _"tiếp theo làm gì?"_             | CTA / hierarchy chưa rõ         |     |     |     |
| 7   | Hỏi Improve Plan / giảm vốn           | Muốn phương án khác             |     |     |     |
| 8   | Copy bankroll ra giấy / chụp màn hình | Muốn Export / Share             |     |     |     |
| 9   | Kéo lên kéo xuống nhiều ở Decision    | Muốn summary sticky / ít scroll |     |     |     |
| 10  | Thử hệ số thập phân (19.6)            | Kỳ vọng game thật               |     |     |     |
| 11  | Hoàn thành flow **&lt; 30s**          |                                 |     |     |     |

**Ví dụ ghi nhanh:**

| Observation               | User expectation       |
| ------------------------- | ---------------------- |
| Hỏi _"Improve Plan đâu?"_ | Muốn có phương án khác |
| Copy lại bankroll ra giấy | Muốn Export            |
| Kéo lên kéo xuống nhiều   | Muốn summary sticky    |
| Chụp màn hình             | Muốn Share             |

**Ghi chú tự do:** hesitation, biểu cảm khi thấy số vốn lớn, back navigation.

---

#### Tiêu chí pass / freeze

**Pass flow (tối thiểu):**

- **≥ 2/3** session: tự nhập, hiểu vốn (câu hỏi Decision), biết CTA _Xem kế hoạch cược_, không kẹt _"tiếp theo làm gì?"_
- **Blocker:** không generate được / hiểu vốn là _"tiền mất"_ / kẹt Decision

**Freeze Feature 1 — tiêu chí chính:**

> **Không còn phát hiện insight mới từ Feature 1.**

Không phải _"không còn bug"_.

Nếu sau người thứ ba, phản hồi **lặp lại** cùng kỳ vọng:

- _"Tôi muốn Improve Plan."_
- _"Tôi muốn Export."_

→ Feature 1 **đã hoàn thành nhiệm vụ**. Đừng tiếp tục polish.

|                   |                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------- |
| **Không blocker** | Hỏi Improve Plan — signal **Feature 2**, ghi vào User expectation                                 |
| **Insight mới**   | Quan sát / câu trả lời **chưa từng thấy** ở session trước → có thể cần fix nhỏ hoặc session thứ 4 |
| **Insight lặp**   | Cùng kỳ vọng ≥2 session → ghi roadmap, **freeze**                                                 |

---

#### Kết quả

| Session | Người | Video? | Comprehension (3 câu) | Blocker? | Insights mới? |
| ------- | ----- | ------ | --------------------- | -------- | ------------- |
| 1       |       |        |                       |          |               |
| 2       |       |        |                       |          |               |
| 3       |       |        |                       |          |               |

**User expectations tổng hợp (sau cả 3 session):**

| Expectation                | Lần xuất hiện | → Roadmap  |
| -------------------------- | ------------- | ---------- |
| Improve Plan / chỉ có 500k |               | Feature 2  |
| Export / in                |               | Feature 4+ |
| Lưu / history              |               | Feature 4  |
| Share                      |               | Feature 4+ |
| _[khác]_                   |               |            |

**Tổng kết:** _[Điền sau buổi thử]_

**Freeze?** _[Có — insight lặp, không blocker / Không — insight mới cần xử lý]_

**Hành động:** _[Released Feature 1 / Fix blocker / Session thêm]_

---

#### Nếu freeze → Feature 1 Released

```text
Feature 1 — Generate Plan
Status: Released
```

- **Không** quay lại Feature 1 — không polish, không animation, không refactor App
- Chuyển hẳn sang **Product Brief — Feature 2: Improve Plan** (1 trang)
- Animation → sau Feature 2 (UX Polish Sprint)

#### Nếu blocker

Chỉ sửa **blocker** từ quan sát / comprehension — một commit nhỏ — rồi chạy lại #018. Không mở Feature 2.

---

## Đã sửa (trước dogfood)

| #   | Vấn đề                       | Sửa                             |
| --- | ---------------------------- | ------------------------------- |
| —   | Required bankroll ngang hàng | Hero size + divider             |
| —   | "Your plan is ready"         | → "Your betting plan is ready." |
| —   | "View Plan"                  | → "View Betting Plan"           |

---

## Đề xuất thứ tự sửa (sau dogfood chung)

| Ưu tiên | Note                           | Trạng thái                  |
| ------- | ------------------------------ | --------------------------- |
| 1       | #006 Excel commas              | ✅ UI normalize             |
| 2       | #007 Expected profit label     | ✅ Tách mục tiêu / ước tính |
| 3       | #005 Generic client errors     | ✅ Per-field VN             |
| 4       | #004 / #012 Validation copy VN | ✅ Map thông dụng           |
| 5       | #009 Thống nhất ngôn ngữ       | ✅ 100% VN product          |
| 6       | #008 / #019 Bankroll helper    | ✅ #019 done                |
| 7       | #018 Stranger usability test   | ⏳ **Gate hiện tại**        |

**Sau #018 pass:** Freeze Feature 1 → Brief Feature 2 → Implement → UX Polish Sprint (animation cuối).

---

## Release gate Feature 2

Chỉ mở **Improve Plan** khi:

- [x] **#006** resolved — normalize dấu phẩy khi parse (UI layer)
- [x] **#007** resolved — tách _Mục tiêu của bạn_ vs _Lợi nhuận ước tính (nếu thắng)_
- [x] **#009** resolved — product UI 100% tiếng Việt (SDK giữ English)
- [x] **#019** resolved — dòng phụ giải thích vốn cần chuẩn bị
- [ ] **#018** — stranger test: comprehension + user expectation (không chỉ pass/fail)
- [ ] **Insight lặp** sau 2–3 session → freeze Feature 1

**Trạng thái gate:** 🟡 Chờ #018 — script đầy đủ ở mục #018 (comprehension questions + User expectation).

**Freeze khi:** không còn insight mới từ Feature 1 — không phải khi hết bug.

**Sau freeze:** Feature 1 `Released` → **chỉ** Feature 2 brief — không quay lại F1.

---

## PM review (2026-06-25)

> Feature 1 chưa release, không cần thiết kế lại — một vòng polish UX.

**Đã polish:** `fix(product): improve Generate Plan clarity and input handling` — #006, #007, #009, #019  
**Không sửa (theo PM):** #014 profit=0, #011 scroll 50 vòng  
**Rủi ro còn lại:** ngôn ngữ & kỳ vọng user — đã giảm sau polish; cần xác nhận người lạ.
