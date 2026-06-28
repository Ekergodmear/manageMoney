# Stake Planner — Product Architecture

Stake Planner là **hệ thống quản lý vòng đời phiên cược**, không phải máy tính tạo bảng.

Generate chỉ chiếm ~5% giá trị sản phẩm.

---

## 7 Module

| Module | Workspace | Mô tả |
|--------|-----------|--------|
| **Dashboard** | Trang đầu | Tổng quan phiên, hành động nhanh, kế hoạch gần đây |
| **Planning** | Kế hoạch | Tạo, xem sẵn sàng, Improve, Continue |
| **Playing** | Phiên chơi | Bảng vòng, tick tiến độ, progress |
| **Analysis** | Phân tích | Mô phỏng, thống kê, biểu đồ |
| **Allocation** | Phân bổ tài khoản | Chia plan đa account |
| **History** | Lịch sử | Lưu, lọc, mở lại phiên |
| **Settings** | Cài đặt | Theme, preset game, export, format |

---

## Vòng đời phiên

```
Dashboard → Tạo kế hoạch → Kế hoạch sẵn sàng → Bắt đầu chơi
    → Tick từng vòng → (Thắng | Hết vòng)
    → Improve | Continue | Allocation → Kết thúc → History → Analytics
```

---

## Nguyên tắc UX

- Sidebar = **workspace**, không phải menu feature với trạng thái Soon/Beta.
- Mọi module **mở được** — phần chưa xong hiển thị UI shell có ý nghĩa, không disable.
- Bảng 500 dòng chỉ ở **Phiên chơi**, không sau Generate.
- Sau Generate → màn **Kế hoạch đã sẵn sàng** với hành động: Bắt đầu | Xem bảng | Mô phỏng | Xuất.

---

## Roadmap triển khai

1. **Shell** — 7 workspace + Dashboard + luồng Planning → Ready → Playing ✅
2. **Session hoàn chỉnh** — Playing UX, Undo, Win, Continue, Timeline, IndexedDB autosave *(hiện tại)* ✅
3. **Planning** — Improve tích hợp engine
4. **History + Analytics** — persist, filter, stats cards ✅ (cơ bản)
5. **Simulation** — slider realtime ✅ (cơ bản)
6. **Export** — JSON + Print ✅ · PDF/Excel sau
7. **Allocation** — cuối cùng
8. **v1.0** — polish, mobile
