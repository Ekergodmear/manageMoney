# Project Status

**Purpose:** Where the project stands — at a glance.  
**Branch:** `optimization-v1`  
**Last updated:** 2026-06-25

---

## Platform

| | |
| --- | --- |
| **Package** | `@stake/constraint-engine` |
| **Version** | `v1.0.0-rc.1` |
| **Status** | **Stable** — decimal multiplier shipped (`28d5800`) |
| **Proof** | 380+ tests, property + differential, regression M=20, arithmetic migration brief |

Platform work is **complete** for current product needs. Further changes require SemVer gate — see [`PUBLIC_API.md`](../PUBLIC_API.md).

---

## Product

| | |
| --- | --- |
| **Name** | Stake Planner |
| **Status** | **Feature 1 — awaiting user evidence** |
| **Spec** | [feature-1-generate-plan.md](product/feature-1-generate-plan.md) |
| **App** | `src/App.tsx` — decimal input + decision cards (`d6c6153`) |

---

## Current focus

**#018 — Stranger usability test** — comprehension + user expectation — [`feature-1-dogfood-notes.md`](product/feature-1-dogfood-notes.md) §#018

> Script: *500.000đ, lời 100.000, 50 vòng.* 3 câu hỏi / màn. Ghi **User expectation**. Quay màn hình nếu đồng ý.

**Freeze khi:** insight lặp — không còn phát hiện mới từ Feature 1.

**Không viết code** cho đến khi freeze hoặc có blocker rõ ràng.

---

## Roadmap (chốt)

```text
⏳  #018 stranger test
    ↓
✅  Freeze Feature 1 (Released)
    ↓
📝  Feature 2 brief — Improve Plan
    ↓
🚀  Feature 2 implement
    ↓
✨  UX Polish Sprint (animation, a11y, dark mode — sau F2)
```

Full roadmap: [`ROADMAP.md`](../ROADMAP.md)

---

## Quick links

| Topic | Document |
| ----- | -------- |
| Feature 1 dogfood + #018 script | [`product/feature-1-dogfood-notes.md`](product/feature-1-dogfood-notes.md) |
| Arithmetic migration | [`design/arithmetic-migration-brief.md`](design/arithmetic-migration-brief.md) |
| Product problem | [`rfc/product/RFC-101-user-problem.md`](rfc/product/RFC-101-user-problem.md) |
| User journey | [`rfc/product/RFC-102-user-journey.md`](rfc/product/RFC-102-user-journey.md) |
| SDK cookbook | [`cookbook/README.md`](cookbook/README.md) |

---

## Branch policy

- `main` — Core SDK release line (`v1.0.0-rc.1`)
- `optimization-v1` — Optimization + Stake Planner product line
