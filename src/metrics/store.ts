// src/metrics/store.ts
// SQLite persistence for historical metrics.
// Falls back to no-op if better-sqlite3 unavailable.

import type { ToonCall, CiePipelineTick } from './types'

let db: any = null

function getDb() {
  if (db) return db
  try {
    const Database = require('better-sqlite3')
    const path = require('path')
    const dbPath = path.join(process.cwd(), '.yvon-metrics.db')
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
    db.exec(`
      CREATE TABLE IF NOT EXISTS toon_calls (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        model TEXT NOT NULL,
        format TEXT NOT NULL,
        input_tokens INTEGER NOT NULL,
        output_tokens INTEGER NOT NULL,
        bytes_before INTEGER NOT NULL,
        bytes_after INTEGER NOT NULL,
        cost_saved REAL NOT NULL,
        agent_id TEXT
      );
      CREATE TABLE IF NOT EXISTS cie_ticks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        task_type TEXT NOT NULL,
        task_length INTEGER NOT NULL,
        classified INTEGER NOT NULL,
        retrieved INTEGER NOT NULL,
        injected INTEGER NOT NULL,
        filtered INTEGER NOT NULL,
        latency_ms INTEGER NOT NULL,
        skipped INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_toon_ts ON toon_calls(timestamp);
      CREATE INDEX IF NOT EXISTS idx_cie_ts ON cie_ticks(timestamp);
    `)
    return db
  } catch {
    return null
  }
}

export function persistToonCall(call: ToonCall): void {
  const d = getDb()
  if (!d) return
  try {
    d.prepare(`INSERT INTO toon_calls (timestamp, model, format, input_tokens, output_tokens, bytes_before, bytes_after, cost_saved, agent_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      call.timestamp, call.model, call.format, call.inputTokens, call.outputTokens,
      call.bytesBefore, call.bytesAfter, call.costSaved, call.agentId || null
    )
  } catch {}
}

export function persistCieTick(tick: CiePipelineTick): void {
  const d = getDb()
  if (!d) return
  try {
    d.prepare(`INSERT INTO cie_ticks (timestamp, task_type, task_length, classified, retrieved, injected, filtered, latency_ms, skipped)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      tick.timestamp, tick.taskType, tick.taskLength, tick.classified,
      tick.retrieved, tick.injected, tick.filtered, tick.latencyMs, tick.skipped ? 1 : 0
    )
  } catch {}
}

export function getHistoricalToonCalls(hours = 24): ToonCall[] {
  const d = getDb()
  if (!d) return []
  try {
    const cutoff = Date.now() - hours * 3600 * 1000
    return d.prepare(`SELECT * FROM toon_calls WHERE timestamp > ? ORDER BY timestamp DESC LIMIT 1000`).all(cutoff)
  } catch { return [] }
}

export function getHistoricalCieTicks(hours = 24): CiePipelineTick[] {
  const d = getDb()
  if (!d) return []
  try {
    const cutoff = Date.now() - hours * 3600 * 1000
    const rows = d.prepare(`SELECT * FROM cie_ticks WHERE timestamp > ? ORDER BY timestamp DESC LIMIT 1000`).all(cutoff)
    return rows.map((r: any) => ({ ...r, skipped: r.skipped === 1 }))
  } catch { return [] }
}
