# Stake Planner — Product RFCs

**Branch:** `optimization-v1` (cùng line phát triển sản phẩm)  
**Giai đoạn:** Sau khi Optimization Engine frozen (Sprint 3.3)  
**Vai trò:** Product specification — **không** phải technical RFC

---

## Phân tách với RFC kỹ thuật

| Loại | Thư mục | Đối tượng | Ngôn ngữ vấn đề |
| ---- | ------- | --------- | ---------------- |
| Engine / SDK | `docs/rfc/optimization/` | Maintainer, implementer | Thuật toán, contract, invariant |
| **Product** | `docs/rfc/product/` | User, Product Lead, UI | Vấn đề, hành trình, giá trị |

Product RFC **không** mô tả kiến trúc nội bộ engine. Chỉ mô tả **ai cần gì** và **thành công trông như thế nào**.

---

## RFC index

| RFC | Tiêu đề | Status | Gate |
| --- | ------- | ------ | ---- |
| [RFC-101](RFC-101-user-problem.md) | User Problem | ✅ Accepted | Sprint 3.5 |
| [RFC-102](RFC-102-user-journey.md) | User Journey | ✅ Accepted | Demo CLI gate |

---

## Thứ tự đề xuất (Product Lead)

```text
1. RFC-101  User Problem          ✅ Accepted
2. RFC-102  User Journey          ✅ Accepted
3. Demo CLI   stake-planner generate | optimize  ← gate tiếp theo
4. Sprint 4+  Product (React)     sau CLI
```

**Chuỗi phát triển:**

```text
RFC → CLI → React App
```

---

## References

- `docs/PROJECT-STATUS.md`
- `docs/design/optimization-formal-verification.md` — engine đã sẵn sàng
