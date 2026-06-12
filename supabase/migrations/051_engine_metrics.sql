-- 051_engine_metrics.sql
-- Engine metrics persistence for YVON dashboard.
-- Stores toon_calls, engine_queries, and compiles for historical analysis.
-- Materialized views provide fast dashboard reads.

-- ─── Tables ──────────────────────────────────────────────────────────────────

CREATE SCHEMA IF NOT EXISTS metrics;

CREATE TABLE IF NOT EXISTS metrics.toon_calls (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  provider TEXT NOT NULL DEFAULT 'unknown',
  model TEXT NOT NULL DEFAULT 'unknown',
  format TEXT NOT NULL,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  bytes_before INTEGER NOT NULL,
  bytes_after INTEGER NOT NULL,
  cost_saved REAL NOT NULL DEFAULT 0,
  agent_id TEXT,
  venture_id TEXT,
  task_type TEXT
);

CREATE TABLE IF NOT EXISTS metrics.engine_queries (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  provider TEXT NOT NULL DEFAULT 'unknown',
  model TEXT NOT NULL DEFAULT 'unknown',
  agent_id TEXT,
  venture_id TEXT,
  task_type TEXT,
  query_hash TEXT,
  original_chars INTEGER NOT NULL,
  injected_chars INTEGER NOT NULL,
  savings_percent REAL NOT NULL,
  chunks_matched INTEGER DEFAULT 0,
  chunks_injected INTEGER DEFAULT 0,
  injection_level TEXT DEFAULT 'L2',
  latency_ms INTEGER DEFAULT 0,
  doc_count INTEGER DEFAULT 0,
  memory_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS metrics.compiles (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_ms INTEGER NOT NULL,
  files_scanned INTEGER DEFAULT 0,
  chunks_built INTEGER DEFAULT 0,
  terms_indexed INTEGER DEFAULT 0,
  bpe_tokens INTEGER DEFAULT 0,
  corpus_size_bytes INTEGER DEFAULT 0,
  bin_size_bytes INTEGER DEFAULT 0,
  error TEXT
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_metrics_toon_ts ON metrics.toon_calls(timestamp);
CREATE INDEX IF NOT EXISTS idx_metrics_toon_agent ON metrics.toon_calls(agent_id);
CREATE INDEX IF NOT EXISTS idx_metrics_toon_provider ON metrics.toon_calls(provider, model);
CREATE INDEX IF NOT EXISTS idx_metrics_engine_ts ON metrics.engine_queries(timestamp);
CREATE INDEX IF NOT EXISTS idx_metrics_engine_agent ON metrics.engine_queries(agent_id);
CREATE INDEX IF NOT EXISTS idx_metrics_engine_task ON metrics.engine_queries(task_type);
CREATE INDEX IF NOT EXISTS idx_metrics_compile_ts ON metrics.compiles(timestamp);

-- ─── Materialized Views (for fast dashboard reads) ───────────────────────────

-- Daily summary: one row per day with aggregated stats
DROP MATERIALIZED VIEW IF EXISTS metrics.daily_summary;
CREATE MATERIALIZED VIEW metrics.daily_summary AS
SELECT 
  date(timestamp) as day,
  COUNT(*) as queries,
  COUNT(DISTINCT agent_id) as active_agents,
  SUM(original_chars) as total_orig_chars,
  SUM(injected_chars) as total_inj_chars,
  AVG(savings_percent)::NUMERIC(5,1) as avg_savings,
  ROUND((SUM(original_chars::float)/1000000)*3 + (SUM(injected_chars::float)/1000000)*15, 4) as est_cost
FROM metrics.engine_queries
GROUP BY date(timestamp)
ORDER BY day;

-- Agent weekly: per-agent per-week efficiency
DROP MATERIALIZED VIEW IF EXISTS metrics.agent_weekly;
CREATE MATERIALIZED VIEW metrics.agent_weekly AS
SELECT 
  COALESCE(agent_id, 'unknown') as agent_id,
  date_trunc('week', timestamp)::date as week_start,
  COUNT(*) as queries,
  ROUND(AVG(savings_percent)::numeric, 1) as avg_savings,
  ROUND(AVG(latency_ms)::numeric, 0) as avg_latency_ms,
  COUNT(DISTINCT task_type) as task_types_used,
  ROUND((SUM(original_chars::float)/1000000)*3::numeric, 4) as est_cost
FROM metrics.engine_queries
WHERE timestamp > now() - interval '90 days'
GROUP BY agent_id, date_trunc('week', timestamp)::date
ORDER BY week_start DESC, queries DESC;

-- Refresh function (called by cron or dashboard on-demand)
CREATE OR REPLACE FUNCTION metrics.refresh_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW metrics.daily_summary;
  REFRESH MATERIALIZED VIEW metrics.agent_weekly;
END;
$$ LANGUAGE plpgsql;

-- Auto-refresh daily summary every hour
-- (Supabase doesn't support pg_cron by default; use dashboard API trigger instead)
