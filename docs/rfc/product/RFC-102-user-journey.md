# RFC-102 — User Journey

**Status:** ✅ **Accepted** (Product Lead, 2026-06-25)  
**Sprint:** 3.5 (Product Specification — không code)  
**Prerequisite:** [RFC-101 User Problem](RFC-101-user-problem.md) ✅ Accepted  
**Next:** Demo CLI (`generate` + `optimize`) → Sprint 4 Product

---

## Mục đích

RFC này mô tả **hành trình người dùng** qua Stake Planner — không phải wireframe, không phải component tree.

Trả lời:

> **User đi từ đâu → làm gì → rẽ nhánh thế nào → kết thúc ở đâu?**

Tài liệu này **quyết định** cấu trúc Demo CLI và Stake Planner (Sprint 4+).

---

## Tư duy sản phẩm

User **không** mở app để “optimize”. Họ mở app vì:

> **“Tôi muốn chơi thế này.”**

Hệ thống trả lời:

- **Được** — đây là plan và vốn cần
- **Không được** — đây là phương án gần nhất, kèm giải thích

Đó là flow tự nhiên.

---

## Nguyên tắc hành trình

### 1. Generate là entry point

```text
Intent → Generate → Result → …
```

**Không bao giờ:** `Optimize → Generate` ❌

### 2. Suggested Plan — không phải Compare

Sau Optimize, user thấy **một phương án đề xuất** — không phải màn so sánh song song kiểu editor.

Nếu hợp lý → **Use This Plan**. Compare có thể là tính năng sau; **v1 chưa cần**.

### 3. Simulation tạo niềm tin — không phải “bonus”

Simulation đứng **trước Export**, không phải bước phụ ở cuối.

User muốn biết _“Nếu thắng vòng 17 thì sao?”_ **trước khi** mang plan ra ngoài.

### 4. Explainable Planning (RFC-101)

Mọi con số quan trọng kèm lý do người dùng đọc được.

### 5. Một plan active tại một thời điểm (v1)

---

## Sơ đồ hành trình tổng thể

```text
┌─────────┐
│  Home   │
└────┬────┘
     ▼
┌─────────────────┐
│  Generate Plan  │
└────────┬────────┘
         ▼
┌─────────────────┐
│     Result      │
└────────┬────────┘
         ▼
    Đủ vốn?
    ┌────┴────┐
   YES       NO
    │         │
    │         ▼
    │    ┌──────────────┐
    │    │   Optimize   │
    │    └──────┬───────┘
    │           ▼
    │    ┌──────────────┐
    │    │ Suggested    │
    │    │    Plan      │
    │    └──────┬───────┘
    │           ▼
    │    ┌──────────────┐
    │    │ Use This Plan│
    │    └──────┬───────┘
    │           │
    └─────┬─────┘
          ▼
   ┌─────────────┐
   │ Simulation  │  ← niềm tin, không phải bonus
   └──────┬──────┘
          ▼
   ┌─────────────┐
   │   Export    │
   └─────────────┘
```

---

## Chi tiết từng bước

### Home

| Element  | Nội dung                              |
| -------- | ------------------------------------- |
| Headline | Lập kế hoạch — biết cần bao nhiêu vốn |
| CTA      | **Tạo kế hoạch** → Generate           |
| Không có | Nút Optimize độc lập                  |

---

### Generate Plan

Thu thập **ý định** — ngân sách **không bắt buộc**.

| Input (v1)                 | Bắt buộc    | Ghi chú                                                         |
| -------------------------- | ----------- | --------------------------------------------------------------- |
| Quy tắc thưởng             | ✅          | Hệ số tùy chọn (×15, ×20, ×25, …)                               |
| Số vòng                    | ✅          |                                                                 |
| Lợi nhuận mục tiêu         | ✅          |                                                                 |
| Cược tối thiểu / bước cược | ✅          | Môi trường user                                                 |
| **Expected bankroll**      | ❌ Optional | User mới thường chưa biết; nếu có → gợi ý nhánh sớm trên Result |

**Action:** Generate → Result

---

### Result

| Hiển thị       | Mô tả                                                     |
| -------------- | --------------------------------------------------------- |
| Bảng từng vòng | Cược, tích lũy                                            |
| **Vốn cần**    | Nổi bật                                                   |
| Thống kê       | Tóm tắt                                                   |
| Giải thích     | _“Với quy tắc bạn chọn, 50 vòng, 100k lợi nhuận → cần …”_ |

**Phân nhánh:**

| Tình huống                                 | Tiếp theo      |
| ------------------------------------------ | -------------- |
| Đủ vốn (hoặc chưa nhập — user tự đánh giá) | **Simulation** |
| Không đủ vốn                               | **Optimize**   |

**Actions:** Mô phỏng · Điều chỉnh kế hoạch (Optimize) · Sửa ý định (Generate)

---

### Optimize (khi không đủ vốn)

| Input               | Ví dụ         |
| ------------------- | ------------- |
| Budget              | 500.000       |
| Cho phép giảm vòng? | Toggle        |
| Bước giảm lợi nhuận | Default 5.000 |

**Thoát:** → **Suggested Plan** (không qua Compare)

---

### Suggested Plan

**Một màn — một đề xuất.** User đọc plan + explanation, quyết định dùng hay không.

| Hiển thị               |                                                              |
| ---------------------- | ------------------------------------------------------------ |
| Plan đề xuất           | Lợi nhuận / vòng đã điều chỉnh                               |
| Vốn cần                | ≤ budget                                                     |
| **Explanation**        | _“Giảm lợi nhuận 100k → 70k, giữ 50 vòng vì ngân sách 500k”_ |
| So với ý định (inline) | Một dòng tóm tắt thay đổi — **không** màn Compare riêng      |

| Action            | Kết quả                            |
| ----------------- | ---------------------------------- |
| **Use This Plan** | Plan active = đề xuất → Simulation |
| Thử budget khác   | Quay Optimize                      |
| Sửa ý định        | Quay Generate                      |

**Không dùng:** “Accept”, “Compare” (v1).

---

### Simulation

**Vai trò:** Tạo **niềm tin** — user hiểu hành vi plan trước khi export.

| Input      | Ví dụ |
| ---------- | ----- |
| Vòng thắng | 17    |

| Output | Timeline / kết quả kịch bản |

**Vào từ:** Result (plan gốc) hoặc sau Use This Plan (plan đề xuất).

**Luôn trước Export.**

---

### Export

Mang plan ra ngoài — thay Excel. Format v1: TBD Sprint 4.6 (Copy / CSV / PDF).

---

## Nhánh tóm tắt

### Nhánh A — Đủ vốn

```text
Generate → Result → Simulation → Export
```

### Nhánh B — Không đủ vốn

```text
Generate → Result → Optimize → Suggested Plan → Use This Plan
    → Simulation → Export
```

---

## Demo CLI (gate tiếp theo)

**Hai command duy nhất.** Không menu. Không interactive.

```bash
stake-planner generate \
    --multiplier 20 \
    --rounds 50 \
    --profit 100000
```

→ Required bankroll + plan summary

```bash
stake-planner optimize \
    --budget 500000
```

→ Suggested plan + explanation

**Gate:** Nếu CLI phải deep-import → sửa public API, **không** sửa UI.

Nếu hai command chạy trơn tru → public API **đủ để xây app**.

---

## Sprint 4+ — Product Sprint (preview)

Sau CLI — không còn “Frontend Sprint” thuần. Trọng tâm: user hoàn thành công việc, hiểu & tin kết quả.

| Phase | Phạm vi          | Journey                             |
| ----- | ---------------- | ----------------------------------- |
| 4.1   | App Shell        | Home, routing                       |
| 4.2   | Calculation Form | Generate                            |
| 4.3   | Result           | Result + nhánh                      |
| 4.4   | Suggested Plan   | Optimize output + **Use This Plan** |
| 4.5   | Simulation       | Simulation (trước Export)           |
| 4.6   | Export           | Export                              |

---

## v1 — không làm

| Không                       | Lý do                                    |
| --------------------------- | ---------------------------------------- |
| Optimize từ Home            | Generate là entry                        |
| Màn Compare riêng           | Suggested Plan + Use This Plan đủ cho v1 |
| Simulation chỉ “bonus” cuối | Phải trước Export                        |
| CLI menu / interactive      | Hai command, đúng journey                |
| Nhiều plan song song        | RFC-101                                  |

---

## Success criteria

| #   | Criterion                                                   |
| --- | ----------------------------------------------------------- |
| J1  | User hoàn thành Nhánh A hoặc B không cần hướng dẫn          |
| J2  | 0% vào Optimize trước Generate                              |
| J3  | Sau Suggested Plan, user hiểu đã đổi gì (explanation)       |
| J4  | User mô phỏng ít nhất 1 kịch bản trước Export (5-user test) |
| J5  | CLI `generate` + `optimize` khớp journey                    |

---

## Sign-off (Product Lead)

- [x] Generate = entry point
- [x] Suggested Plan + **Use This Plan** (không Compare/Accept v1)
- [x] Simulation trước Export — niềm tin, không bonus
- [x] Expected bankroll optional trên Generate
- [x] Demo CLI: hai command, mapping rõ

**Accepted** → triển khai **Demo CLI**

---

## References

- [RFC-101 User Problem](RFC-101-user-problem.md)
- `docs/rfc/product/README.md`
