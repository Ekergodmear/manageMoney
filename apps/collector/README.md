# @stake/collector

Draw acquisition service — chạy song song Internal RC.

```text
DrawSourceAdapter → Parser → DrawSink (SQLite) → collector_state
```

## Chạy

```bash
# từ repo root
pnpm collector:start      # mock (mặc định)
pnpm collector:doctor     # health check (exit 0/1)

# Bingo18 thật
COLLECTOR_ADAPTER=bingo18 pnpm collector:start
```

Env: xem `.env.example`.

## Bingo18 + Dashboard Lite

```bash
COLLECTOR_ADAPTER=bingo18 pnpm collector:start
```

HTTP read API (Dashboard Lite):

| Endpoint | Mô tả |
|----------|--------|
| `GET /dashboard` | **Game Monitor** — health + latest + today (1 request) |
| `GET /health` | Collector health (debug) |
| `GET /draws/latest` | Kỳ quay mới nhất (debug) |
| `GET /stats/today` | Phân bố tổng + hoa hôm nay (debug) |

Mặc định: `http://localhost:8788`

Web app: `VITE_COLLECTOR_API_URL=http://localhost:8788` → sidebar **Game Monitor**.

## Bingo18 source

Reverse-engineered từ `bingo18.top/script.js` → `GET /data/data.json`:

```json
{ "gbingoDraws": [{ "drawAt": "...", "winningResult": "236" }] }
```

`COLLECTOR_BINGO18_API_URL` override URL nếu cần.

Lần chạy đầu: chỉ lưu kỳ mới nhất. Sau restart: catch-up các kỳ mới hơn `lastDraw`.

## Cấu trúc

```text
src/
  adapter/     mock + bingo18 (fetch JSON API)
  parser/      ParseResult — không throw
  sink/        append-only SQLite DrawStore
  strategy/    AdaptivePollStrategy
  health/      CollectorHealth read model
  doctor/      CLI health
  state/       collector_state types
  logger/      [Collector] logs
```

## Monorepo

```text
apps/
  web/          (repo root)
  collector/    ← đây
  api/          (sau Internal RC)
```

## Dữ liệu

`data/draws.db` — append-only `draw_results` + single-row `collector_state`.

Restart → resume từ `lastDrawKey`; dedupe theo `draw_key` (unique).

**B1.1:** DB schema đổi — xóa `data/draws.db` cũ nếu upgrade từ B1.

## Tests

```bash
pnpm collector:test
```
