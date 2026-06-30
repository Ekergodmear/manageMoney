# Soak Report

Date: 2026-06-30T08:26:51.502Z
Commit: 6f9ddcc1dadcf6b56920bf2f1ea2c05a6966a315
Branch: release/internal-rc
Collector: http://localhost:8788

---

## Collector

Uptime: 0h 0m since last success
Status: running
Adapter: mock
Draw count: 193

## Latest draw

- Key: 100192
- Draw at: 2026-06-30T08:26:35.196Z
- Published: 2026-06-30T08:26:35.196Z
- Total: 10 | Flower: —

---

## Integrity

Duplicate count: 0
Gap detection: 0 gap(s)

Average publish delay: 10095 ms
API failures (collector): 0

---

## Collector health

PASS

---

## Statistics

### Top variance

- Tổng 10: variance 5.88
- Tổng 12: variance 3.66
- Tổng 16: variance 3.64
- Tài: variance 3.63
- Tổng 15: variance 3.06

### Top drought

- Hoa 333: drought 193
- Hoa 555: drought 193
- Tổng 18: drought 140
- Hoa 666: drought 140
- Hoa 444: drought 139

### Rolling 100

Draws in window: 100
- Hot: Tổng 9 (Δ 5.43%)
- Cold: Tổng 18 (drought 100)

### Rolling 500

Draws in window: 193
- Hot: Tổng 10 (Δ 3.04%)
- Cold: Hoa 333 (drought 193)

### Rolling 1000

Draws in window: 193
- Hot: Tổng 10 (Δ 3.04%)
- Cold: Hoa 333 (drought 193)

---

## Notifications

_NotificationCenter state is browser-local (persist v6)._

| Metric | Value |
| --- | --- |
| Unread | N/A (run app) |
| Read | N/A (run app) |
| Win notifications | N/A |
| Collector notifications | N/A |
| Offline events | N/A |

---

## Performance

Measured at: 2026-06-25T08:56:11.550Z

- validateCalculationRequest / small: 0.38 µs/op
- solve / small: 0.17 µs/op
- buildStrategy / small: 0.01 µs/op
- buildStatistics / small: 0.05 µs/op
- simulateWinAtRound / small: 0.12 µs/op
- validateCalculationRequest / medium: 0.20 µs/op
- solve / medium: 0.96 µs/op
- buildStrategy / medium: 0.02 µs/op

_Library/Dashboard render benchmarks not yet instrumented._
_PlayedRound count requires browser session state._