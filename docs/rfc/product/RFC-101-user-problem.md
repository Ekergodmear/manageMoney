# RFC-101 — User Problem

**Status:** ✅ **Accepted** (Product Lead, 2026-06-25)  
**Sprint:** 3.5 (Product Specification — không code)  
**Prerequisite:** Optimization Engine Production Ready (Sprint 3.3 ✅)  
**Next:** [RFC-102 User Journey](RFC-102-user-journey.md)

---

## Mục đích

Tài liệu này trả lời **một câu hỏi**:

> **Stake Planner là sản phẩm dành cho ai, và họ đang đau ở đâu?**

Không mô tả cách phần mềm hoạt động bên trong. Chỉ mô tả **người dùng**, **vấn đề**, và **lời hứa sản phẩm**.

---

## Tên sản phẩm

**Stake Planner** — công cụ lập kế hoạch vốn và lợi nhuận theo chiến lược nhiều vòng (progressive staking), với quy tắc thưởng do người dùng chọn.

---

## User là ai?

### Persona chính (v1)

> **User = người cần lập kế hoạch đặt cược theo một quy tắc thưởng xác định.**

Họ đã có **ý định** — biết mình muốn:

- Một **hệ số thưởng** cố định (quy tắc nhân thưởng — có thể là ×15, ×18, ×20, ×25, …)
- Một số **vòng** nhất định
- Một **lợi nhuận mục tiêu**

nhưng **không chắc** mình có đủ vốn để theo kế hoạch đó hay không.

**Persona không gắn với một hệ số cụ thể.** ×20 chỉ là **ví dụ minh họa** phổ biến trong giai đoạn đầu — không phải định nghĩa sản phẩm.

```text
Persona  →  Use case chung  →  Ví dụ hiện tại = ×20
```

Không phải:

```text
Persona = người chơi ×20
```

Lý do: người dùng thật mang quy tắc thưởng khác nhau; sản phẩm phải mô tả **hành vi lập kế hoạch**, không khóa vào một game hay một bội số.

### Ví dụ cụ thể (minh họa — ×20)

```text
Quy tắc thưởng ×20   ← ví dụ, không phải persona

    Muốn lời 100.000

    Dự định chơi 50 vòng

    Trong tay chỉ có 500.000
```

Câu hỏi trong đầu họ **không** phải “thuật toán tối ưu thế nào” mà là:

> _“Kế hoạch này có khả thi không? Nếu không — tôi nên điều chỉnh gì để vẫn gần với ý muốn nhất?”_

### Ai **không** phải user v1

| Không nhắm tới (v1)                                         | Lý do                                                         |
| ----------------------------------------------------------- | ------------------------------------------------------------- |
| Người muốn “AI chọn hộ mọi thứ”                             | Stake Planner giữ **ý định** của user, chỉ điều chỉnh khi cần |
| Người so sánh nhiều quy tắc thưởng cùng lúc trong một phiên | v1: một kế hoạch, một câu trả lời                             |
| Trader / bot tự động                                        | Không phải execution platform                                 |

---

## Pain — Hôm nay họ làm gì?

Khi không có Stake Planner, người dùng mục tiêu thường:

| Cách làm                            | Vấn đề                                                       |
| ----------------------------------- | ------------------------------------------------------------ |
| **Excel / Google Sheet**            | Tự lập công thức; dễ sai; khó bảo trì khi đổi tham số        |
| **Bấm máy**                         | Chậm; không nhất quán; khó thử nhiều kịch bản                |
| **Nhẩm**                            | Sai số lớn; không giải thích được vì sao thiếu vốn           |
| **Hỏi group / kinh nghiệm cá nhân** | Không reproducible; không gắn với **kế hoạch cụ thể** của họ |

### Hệ quả

1. **Không biết cần bao nhiêu vốn** trước khi vào lệnh thật
2. **Không biết nên giảm lợi nhuận hay giảm vòng** khi vốn không đủ
3. **Mất niềm tin** vào con số — “chắc tính sai rồi”
4. **Mất thời gian** — 30 phút trên sheet thay vì 30 giây ra quyết định

### Câu pain cốt lõi

```text
Tôi có một kế hoạch trong đầu.

Tôi không biết nó có sống được với số tiền tôi có hay không.

Và nếu không — tôi không biết nên sửa chỗ nào ít đau nhất.
```

---

## Product Promise — Stake Planner giúp gì?

### Lời hứa một câu

> **Từ ý định của bạn → ra một kế hoạch rõ ràng, kèm con số vốn, lời giải thích đáng tin — trong vài giây.**

### Hành trình giá trị (ngôn ngữ người dùng)

```text
~5 giây

    ↓

Có plan (bảng cược từng vòng)

    ↓

Biết chính xác cần bao nhiêu vốn

    ↓

Nếu vốn không đủ

    ↓

Đề xuất kế hoạch gần ý bạn nhất

    ↓

Có thể giải thích tại sao — không phải “AI bảo vậy”
```

### USP: Explainable Planning

Lợi thế cốt lõi **không** phải “tối ưu hóa phức tạp” mà là **kế hoạch có thể giải thích**:

```text
Bạn cần 1.520.000 vốn

    ↓

Vì với 50 vòng

    ↓

Muốn giữ lợi nhuận 100.000

    ↓

Theo quy tắc thưởng bạn đã chọn
```

Người dùng hiểu **vì sao** con số xuất hiện — từ kế hoạch gốc đến đề xuất điều chỉnh. Đó là **confidence**, không phải hộp đen.

### Stake Planner **là**

- Máy tính kế hoạch **đáng tin** — cùng input → cùng output
- **Explainable planning** — mọi con số gắn với lý do người dùng đọc được
- Công cụ **“what-if”**: thử ngân sách, xem đề xuất thay đổi
- Nơi **mô phỏng** nếu thắng ở vòng X thì chuyện gì xảy ra (hiểu rủi ro trước khi chơi)

### Stake Planner **không phải**

- Ứng dụng đặt cược / kết nối sàn
- Lời khuyên đầu tư hay cam kết lợi nhuận
- “AI bảo vậy” — không có giải thích
- Thuật ngữ kỹ thuật trên màn hình

Người dùng thấy:

```text
“Với quy tắc ×20, bạn muốn lời 100.000 / 50 vòng — cần 1.520.000 vốn.”

“Với 500.000 — gợi ý: lời 70.000, giữ 50 vòng.
 Vì giữ nguyên số vòng, lợi nhuận giảm từ 100.000 xuống 70.000 để vừa ngân sách.”
```

---

## Jobs to be done (v1)

| #   | Việc user cần làm                                | Stake Planner                  |
| --- | ------------------------------------------------ | ------------------------------ |
| J1  | Kiểm tra kế hoạch có khả thi với vốn dự kiến     | Generate + hiển thị vốn cần    |
| J2  | Khi vốn không đủ — biết nên sửa gì **và vì sao** | Optimize + giải thích bằng lời |
| J3  | Hiểu diễn biến từng vòng nếu thắng sớm           | Simulation / timeline          |
| J4  | Lưu hoặc chia sẻ kế hoạch                        | Export (Sprint 4.6)            |

---

## Success Metrics

Đo **hành vi và kết quả** người dùng — không đo độ phức tạp code.

### North Star (v1)

```text
User tạo được plan đầu tiên có ý nghĩa
mà không phải tính tay (Excel / máy tính / nhẩm)
```

### UX metrics

| Metric                  | Target v1                 | Ý nghĩa                                       |
| ----------------------- | ------------------------- | --------------------------------------------- |
| **Time-to-plan**        | **90%** user < **30s**    | Từ mở app → có kết quả generate hoặc optimize |
| **Task completion**     | **≥ 80%**                 | Hoàn thành flow không bỏ giữa chừng           |
| **Explanation clarity** | Qualitative (5-user test) | User hiểu _vì sao_ con số / đề xuất           |
| **Return usage**        | Baseline sau launch       | Cùng user quay lại trong 7 ngày               |

### Outcome metrics

| Metric                             | Target v1               | Ý nghĩa                                                 |
| ---------------------------------- | ----------------------- | ------------------------------------------------------- |
| **No manual calculation**          | **≥ 85%** phiên đầu     | Plan hoàn thành **không** mở Excel / máy tính song song |
| **First plan without spreadsheet** | **≥ 70%** user mới      | Tạo plan đầu tiên thành công mà không dựa sheet có sẵn  |
| **Self-reported replacement**      | Qualitative             | “Tôi không cần file Excel cũ nữa” (survey sau 2 tuần)   |
| **Trust in explanation**           | **≥ 4/5** (5-user test) | User đồng ý “Tôi hiểu vì sao con số này”                |

**Không chỉ nhanh — mà giảm công việc thủ công.**

### Anti-metrics (không tối ưu v1)

- Số tính năng trên màn hình
- Độ sâu của thuật toán
- Số dòng code UI

---

## Phạm vi v1 (product)

### Có

- Một kế hoạch, một câu trả lời tốt nhất (không bảng xếp hạng nhiều phương án)
- Quy tắc thưởng do user nhập — không khóa ×20
- Điều chỉnh **lợi nhuận mục tiêu** và **số vòng** (khi user cho phép)
- Giải thích dạng câu: _“Giảm lợi nhuận từ 100k xuống 70k, giữ 50 vòng — vì ngân sách 500k”_

### Chưa có (v1)

- Đa mục tiêu / Pareto / “phương án B tốt hơn phương án A”
- Tự động hóa đặt cược
- Tài khoản / đăng nhập / lưu cloud (có thể sau)

---

## Rủi ro sản phẩm cần theo dõi

| Rủi ro                    | Giảm thiểu                                                    |
| ------------------------- | ------------------------------------------------------------- |
| User không tin con số     | Explainable planning + deterministic; Demo CLI làm bằng chứng |
| UI quá kỹ thuật           | RFC-102 journey; copy tiếng Việt đời thường                   |
| Persona gắn chặt một game | Persona = quy tắc thưởng tùy chọn; ×20 chỉ là ví dụ           |
| Scope creep (thêm knob)   | Khóa v1 theo RFC-101; mọi knob mới → RFC mới                  |

---

## Sign-off (Product Lead)

- [x] Persona = lập kế hoạch theo quy tắc thưởng — không gắn ×20
- [x] Product Promise + **Explainable Planning** (confidence)
- [x] UX metrics + **Outcome metrics** (giảm tính tay)
- [x] Phạm vi v1 / không-v1 rõ ràng

**Accepted** → [RFC-102 User Journey](RFC-102-user-journey.md)

---

## References (nội bộ)

- `docs/design/optimization-formal-verification.md`
- `docs/rfc/product/README.md`
