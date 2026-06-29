# @stake/collector

Draw acquisition service — chạy song song Internal RC.

Executable app trong `apps/collector` — không phải shared package.

```text
DrawSourceAdapter → Collector → DrawSink → SQLite
```

## Chạy

```bash
# từ repo root
pnpm collector:start

# hoặc
cd apps/collector && pnpm start
```

Mock adapter (mặc định): pipeline synthetic. Bingo18: stub — cần spike nguồn.

## Monorepo

```text
apps/
  web/          (hiện tại: repo root)
  collector/    ← đây
  api/          (sau Internal RC)

packages/
  contracts/
  sdk/
  constraint-engine/
```

## Roadmap collector

```text
v0.1 Mock + SQLite + persisted state  ← hiện tại
v0.2 Bingo18 adapter (API / Playwright)
v0.3 Adaptive poll production tuning
v0.4 Health export
v1.0 Production 24/7
```

## Dữ liệu

`apps/collector/data/draws.db` — append-only `draw_results` + `collector_state`.

Restart → resume từ `collector_state` (biết đã lấy tới kỳ nào).
