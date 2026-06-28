# Personal Roadmap — Stake Planner

> Công cụ cho chính mình, dùng mỗi ngày trong 5 năm.

---

## Ngôn ngữ sản phẩm

| Module kỹ thuật | Tên sản phẩm |
|-----------------|--------------|
| Generate | **Planning** |
| Improve | **Improve** (trong Session — sửa plan có sẵn) |
| Scenario Planner | **Scenario Planner** (Lab — sandbox what-if) |
| Capital Planner | **Capital Planner** (workspace — quyết định trước khi chơi) |
| Continue | **Session Planner** |
| Allocation | **Account Planner** |
| Rule Editor | **Game Designer** |
| History | **Session Library** |
| Analytics | **Insights** |

---

## Kiến trúc sản phẩm

```
Game Designer
        │
        ▼
Scenario Planner (Lab)
        │
        ▼
Capital Planner
        │
        ▼
Session
        │
        ▼
Playing
        │
        ▼
Session Library
        │
        ▼
Insights (đọc từ Library)
```

Planning chỉ khởi tạo session thủ công khi cần.

---

## Platform v1 ✅

```
SDK / Engine        ✅
Planning            ✅
Session 2.0         ✅
Library 2.0         ✅
Insights 2.0        ✅
```

---

## Roadmap tiếp theo

```
Product Polish Sprint (1–2 tuần)
        │
        ▼
Replay
        │
        ▼
Search++
        │
        ▼
Cloud (nếu cần)
        │
        ▼
AI Assistant (rất xa)
```

---

## Giai đoạn 9 — Insights 2.0 ✅

**Đóng băng** — chỉ thêm generator mới hoặc tinh chỉnh thuật toán.

```
Library → Insight Engine → InsightsScreen
```

- **Reflection** — period động + câu kết `=>` + Confidence
- **Quick** — insight đáng nhớ + Mở Session
- **Recommendation** — Scenario / Capital / Session cụ thể
- **Outlier** — 🔴 Bất thường / 🟡 Đáng chú ý
- **Trends** — sparkline + xu hướng một câu
- **Records** — Hall of Fame + Mở Session
- **Confidence** — Low · Medium · High · Very High
- **Updated** — thời gian + số phiên

## Giai đoạn 10 — Product Polish Sprint

- Typography & spacing thống nhất
- Icon, màu, microcopy
- Skeleton / loading / empty states
- Responsive desktop + mobile
- Accessibility (keyboard, focus, contrast)
- Performance Library (virtualized list nếu cần)

---

*Nguyên tắc: không thêm workspace mới trừ khi mở năng lực mới. Đào sâu chất lượng module hiện có.*

---

*Câu hỏi định hướng: "Nếu mình dùng app này mỗi ngày trong 5 năm thì mình còn muốn có gì?"*
