# Beta Roadmap

Xem kiến trúc đầy đủ: [product-architecture.md](./product-architecture.md)

Thay vì nhảy thẳng "Feature 2", mỗi beta có **một mục tiêu rõ** — học từ người dùng trước khi code tiếp.

## Positioning (10 giây đầu)

**Không nói:** "Ứng dụng tính toán chiến lược cược."

**Nói:** Stake Planner giúp bạn biết **cần bao nhiêu vốn**, **khi nào nên dừng**, và **nếu thiếu vốn thì điều chỉnh kế hoạch thế nào**.

---

## Lộ trình

| Phiên bản | Mục tiêu | Trạng thái |
|-----------|----------|------------|
| **Beta 0.1** | Generate Plan + Session preview | ✅ Đang chạy |
| **Beta 0.2** | Improve Plan (thiếu vốn → gợi ý điều chỉnh) | Chờ feedback |
| **Beta 0.3** | Continue Session (mở rộng vòng, không tạo lại) | Chờ feedback |
| **Beta 0.4** | Simulation (thắng vòng N → chuyện gì xảy ra) | Chờ feedback |
| **Beta 0.5** | History (+ Export) | Chờ feedback |
| **v1.0** | Ổn định, polish, mobile | Sau Beta |

---

## Giai đoạn hiện tại: Beta 0.1

**Không code Feature 2 ngay.** Một tuần chỉ thu thập phản hồi → cập nhật `beta-feedback.md`.

**Analytics:** Vercel Analytics (traffic, quốc gia, desktop/mobile). Hành vi sâu (click funnel) → PostHog / Clarity sau nếu cần.
