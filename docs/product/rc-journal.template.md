# RC Journal — Stake Planner (30-day Internal RC)

> **Nhật ký hành vi** — không phải nhật ký lỗi.  
> Dữ liệu này quyết định roadmap v0.9.

Copy thành `rc-journal.md` (**local only, không commit**):

```bash
cp docs/product/rc-journal.template.md docs/product/rc-journal.md
```

**Phase:** Product Validation · baseline `reliability-v1`  
**Engineering:** 🟢 Complete for RC · **Product:** 🟡 Under Validation

Mỗi ngày **5–7 dòng**. Một block. Không cần ghi dài.

Checklist buổi tối (tùy chọn): [`releases/internal-rc-checklist.md`](../releases/internal-rc-checklist.md)

---

## Mẫu mỗi ngày

```text
Day __

Time to Daily Workflow:
__s

First Workspace:
(Session | Dashboard | Planning | …)

Excel Opened:
0

Pain:
(một ý — friction thật khi làm việc)

Unexpected:
(hành vi không phải bug — thứ bạn làm mà không lên kế hoạch)

Wish:
(một ý — nếu chỉ sửa một thứ ngày mai)
```

---

## Day 01 — 2026-07-01 (seed — phiên smoke, chưa phải dùng thật)

```text
Day 01

Time to Daily Workflow:
~14s

First Workspace:
Session

Excel Opened:
0

Pain:
Vào app có session active nhưng không thấy rõ "tiếp tục" — phải biết sidebar.

Unexpected:
Mở Diagnostics để kiểm tra Collector trước khi làm việc.

Wish:
Continue Last Session ngay từ màn đầu.
```

---

## Day 02

```text
Day 02

Time to Daily Workflow:
__s

First Workspace:


Excel Opened:


Pain:


Unexpected:


Wish:
```

---

## Quy tắc mở sprint (pattern)

| Lần gặp | Hành động |
| ------- | --------- |
| 1 | Ghi nhận |
| 2 | Theo dõi |
| 3+ | Cân nhắc **Planning Review** |
| 5+ | Gần như chắc chắn đáng ưu tiên |

Ghi pattern ở đây khi lặp (Pain hoặc Unexpected):

| Observation | ×1 | ×2 | ×3 | ×5 | Review? |
| ----------- | -- | -- | -- | -- | ------- |
| | | | | | |

---

## Sau 30 ngày

Tổng hợp thành `rc-summary.md` (local hoặc commit nếu muốn lưu kết luận):

```text
30-day RC

Opened Stake Planner:
__/30 ngày

Opened Excel:
__ lần

Average Daily Workflow:
__s

First Workspace (mode):
(Session | Dashboard | Planning | …)

Biggest Pain:


Biggest Unexpected:


Wish xuất hiện nhiều nhất:

```

**Câu hỏi north star:** Ngày 17 bạn có còn mở Stake Planner đầu tiên không?
