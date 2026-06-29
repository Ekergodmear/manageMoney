-- Append-only draw history. No UPDATE/DELETE in application code.
-- Parser errors: insert Correction row or reimport — never mutate existing rows.

CREATE TABLE IF NOT EXISTS draw_results (
  id              TEXT PRIMARY KEY,
  game_id         TEXT NOT NULL,
  market_version  INTEGER NOT NULL DEFAULT 1,
  draw_number     TEXT NOT NULL UNIQUE,
  draw_time       TEXT NOT NULL,
  published_at    TEXT,
  collected_at    TEXT NOT NULL,
  latency_ms      INTEGER NOT NULL,
  dice_1          INTEGER NOT NULL,
  dice_2          INTEGER NOT NULL,
  dice_3          INTEGER NOT NULL,
  total           INTEGER NOT NULL,
  flower          TEXT,
  small_large     TEXT NOT NULL,
  raw_payload     TEXT NOT NULL,
  source          TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_draw_results_draw_time ON draw_results (draw_time);
CREATE INDEX IF NOT EXISTS idx_draw_results_total ON draw_results (total);

-- Single-row collector runtime state (survives restart).
CREATE TABLE IF NOT EXISTS collector_state (
  id                  INTEGER PRIMARY KEY CHECK (id = 1),
  last_draw_json      TEXT,
  last_success_at     TEXT,
  last_poll_at        TEXT,
  failure_count       INTEGER NOT NULL DEFAULT 0,
  average_latency_ms  INTEGER NOT NULL DEFAULT 0,
  status              TEXT NOT NULL DEFAULT 'stopped'
);

INSERT OR IGNORE INTO collector_state (id) VALUES (1);
