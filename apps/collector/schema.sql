-- Append-only draw history. No UPDATE/DELETE in application code.
-- B1.1 frozen model — draw_key is the business identity.

CREATE TABLE IF NOT EXISTS draw_results (
  draw_key              TEXT PRIMARY KEY,
  game_id               TEXT NOT NULL,
  market_version        INTEGER NOT NULL DEFAULT 1,
  draw_at               TEXT NOT NULL,
  published_at          TEXT NOT NULL,
  published_estimated   INTEGER NOT NULL DEFAULT 1,
  collected_at          TEXT NOT NULL,
  latency_ms            INTEGER NOT NULL,
  dice_1                INTEGER NOT NULL,
  dice_2                INTEGER NOT NULL,
  dice_3                INTEGER NOT NULL,
  total                 INTEGER NOT NULL,
  flower                TEXT,
  small_large           TEXT NOT NULL,
  source                TEXT NOT NULL,
  raw_payload           TEXT NOT NULL,
  raw_response          TEXT
);

CREATE INDEX IF NOT EXISTS idx_draw_results_draw_at ON draw_results (draw_at);
CREATE INDEX IF NOT EXISTS idx_draw_results_total ON draw_results (total);

-- Single-row collector runtime state (survives restart).
CREATE TABLE IF NOT EXISTS collector_state (
  id                  INTEGER PRIMARY KEY CHECK (id = 1),
  last_draw_key       TEXT,
  last_draw_json      TEXT,
  last_success_at     TEXT,
  last_poll_at        TEXT,
  failure_count       INTEGER NOT NULL DEFAULT 0,
  average_latency_ms  INTEGER NOT NULL DEFAULT 0,
  duplicates_skipped  INTEGER NOT NULL DEFAULT 0,
  resume_state        TEXT NOT NULL DEFAULT 'fresh',
  catch_up_count      INTEGER NOT NULL DEFAULT 0,
  resumed_from_draw_key TEXT,
  status              TEXT NOT NULL DEFAULT 'stopped'
);

INSERT OR IGNORE INTO collector_state (id) VALUES (1);
