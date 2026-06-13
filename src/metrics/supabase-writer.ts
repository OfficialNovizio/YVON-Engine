// src/metrics/supabase-writer.ts
// Fire-and-forget Supabase writes for engine metrics.
// Never blocks the agent call — writes happen async after recording.
// Falls back silently if Supabase is unavailable.
//
// Usage:
//   writeToonToSupabase(call).catch(() => {})
//   writeEngineQueryToSupabase(query).catch(() => {})
//   writeCompileToSupabase(compile).catch(() => {})

import type { ToonCall, EngineQuery, CompileRecord } from './types'

let _supabaseUrl: string | null = null
let _supabaseKey: string | null = null
let _checked = false

function getCredentials() {
  if (_checked) return { url: _supabaseUrl, key: _supabaseKey }
  _checked = true
  _supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || null
  _supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || null
  return { url: _supabaseUrl, key: _supabaseKey }
}

async function supabasePost(table: string, body: Record<string, unknown>): Promise<void> {
  const { url, key } = getCredentials()
  if (!url || !key) return

  try {
    // Use fetch with timeout — never block the agent call
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)

    await fetch(`${url}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    clearTimeout(timeout)
  } catch {
    // Silent fail — data still lives in local SQLite
  }
}

export async function writeToonToSupabase(call: ToonCall): Promise<void> {
  await supabasePost('metrics.toon_calls', {
    timestamp: new Date(call.timestamp).toISOString(),
    provider: call.provider || 'unknown',
    model: call.model || 'unknown',
    format: call.format,
    input_tokens: call.inputTokens,
    output_tokens: call.outputTokens,
    bytes_before: call.bytesBefore,
    bytes_after: call.bytesAfter,
    cost_saved: call.costSaved,
    agent_id: call.agentId || null,
    venture_id: call.ventureId || null,
    task_type: call.taskType || null,
  })
}

export async function writeEngineQueryToSupabase(query: EngineQuery): Promise<void> {
  await supabasePost('metrics.engine_queries', {
    timestamp: new Date(query.timestamp).toISOString(),
    provider: query.provider || 'unknown',
    model: query.model || 'unknown',
    agent_id: query.agentId || null,
    venture_id: query.ventureId || null,
    task_type: query.taskType || null,
    query_hash: query.queryHash,
    original_chars: query.originalChars,
    injected_chars: query.injectedChars,
    savings_percent: query.savingsPercent,
    chunks_matched: query.chunksMatched,
    chunks_injected: query.chunksInjected,
    injection_level: query.injectionLevel,
    latency_ms: query.latencyMs,
    doc_count: query.docCount,
    memory_count: query.memoryCount,
  })
}

export async function writeCompileToSupabase(record: CompileRecord): Promise<void> {
  await supabasePost('metrics.compiles', {
    timestamp: new Date(record.timestamp).toISOString(),
    duration_ms: record.durationMs,
    files_scanned: record.filesScanned,
    chunks_built: record.chunksBuilt,
    terms_indexed: record.termsIndexed,
    bpe_tokens: record.bpeTokens,
    corpus_size_bytes: record.corpusSizeBytes,
    bin_size_bytes: record.binSizeBytes,
    error: record.error || null,
  })
}

// ─── Supabase read helpers (for dashboard API) ───────────────────────────────

async function supabaseGet(path: string): Promise<any> {
  const { url, key } = getCredentials()
  if (!url || !key) throw new Error('Supabase not configured')

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)

  try {
    const res = await fetch(`${url}/rest/v1/${path}`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
      },
      signal: controller.signal,
    })
    clearTimeout(timeout)
    if (!res.ok) throw new Error(`Supabase ${res.status}`)
    return res.json()
  } catch (e) {
    clearTimeout(timeout)
    throw e
  }
}

export async function getSupabaseToonStats(since: string): Promise<any> {
  return supabaseGet(`metrics.toon_calls?select=count,sum(input_tokens),sum(output_tokens),sum(bytes_before-bytes_after),avg(cost_saved)&timestamp=gte.${since}`)
}

export async function getSupabaseEngineStats(since: string): Promise<any> {
  return supabaseGet(`metrics.daily_summary?day=gte.${since}&order=day.desc`)
}

export async function getSupabaseAgentEfficiency(since: string): Promise<any> {
  return supabaseGet(`metrics.engine_queries?select=agent_id,count,savings_percent.avg(),latency_ms.avg()&timestamp=gte.${since}&group=agent_id&order=count.desc`)
}

export async function getSupabaseWeeklyEfficiency(): Promise<any> {
  return supabaseGet(`metrics.agent_weekly?order=week_start.desc&limit=12`)
}

export async function getSupabaseProviderCosts(since: string): Promise<any> {
  return supabaseGet(`metrics.toon_calls?select=provider,model,count,input_tokens.sum(),output_tokens.sum()&timestamp=gte.${since}&group=provider,model&order=count.desc`)
}

export async function getSupabaseRecentQueries(limit: number = 50): Promise<any> {
  return supabaseGet(`metrics.engine_queries?select=*&order=timestamp.desc&limit=${limit}`)
}

export async function getSupabaseCompileHistory(limit: number = 20): Promise<any> {
  return supabaseGet(`metrics.compiles?select=*&order=timestamp.desc&limit=${limit}`)
}

export async function refreshSupabaseViews(): Promise<void> {
  const { url, key } = getCredentials()
  if (!url || !key) return
  try {
    await fetch(`${url}/rest/v1/rpc/metrics.refresh_views`, {
      method: 'POST',
      headers: { 'apikey': key, 'Authorization': `Bearer ${key}` },
    })
  } catch {}
}

// ─── YVON OS Token Usage Bridge ───────────────────────────────────────────────
//
// Posts ToonGine engine metrics to YVON OS's Supabase token_usage table.
// This is a DIFFERENT Supabase instance from ToonGine's internal metrics.* tables.
// Uses YVON_SUPABASE_URL / YVON_SUPABASE_SERVICE_ROLE_KEY env vars,
// falling back to regular SUPABASE vars if YVON-specific ones aren't set.

export interface TokenUsagePayload {
  agent_id: string
  route: string
  model: string
  provider: string
  input_tokens: number
  output_tokens: number
  cost_usd: number
  session_id?: string
}

let _yvonCredentials: { url: string | null; key: string | null } | null = null

function getYvonCredentials() {
  if (_yvonCredentials) return _yvonCredentials
  _yvonCredentials = {
    url: process.env.YVON_SUPABASE_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || null,
    key: process.env.YVON_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || null,
  }
  return _yvonCredentials
}

export async function writeTokenUsage(payload: TokenUsagePayload): Promise<void> {
  const { url, key } = getYvonCredentials()
  if (!url || !key) return

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)

    await fetch(`${url}/rest/v1/token_usage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        agent_id: payload.agent_id,
        route: payload.route,
        model: payload.model,
        provider: payload.provider,
        input_tokens: payload.input_tokens,
        output_tokens: payload.output_tokens,
        cost_usd: payload.cost_usd,
        session_id: payload.session_id || null,
        timestamp: new Date().toISOString(),
      }),
      signal: controller.signal,
    })
    clearTimeout(timeout)
  } catch {
    // Silent fail — data still lives in local SQLite
  }
}

// ─── YVON Supabase read helpers (for token-burn dashboard API) ────────────────

async function yvonSupabaseGet(path: string): Promise<any> {
  const { url, key } = getYvonCredentials()
  if (!url || !key) throw new Error('YVON Supabase not configured')

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)

  try {
    const res = await fetch(`${url}/rest/v1/${path}`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
      },
      signal: controller.signal,
    })
    clearTimeout(timeout)
    if (!res.ok) throw new Error(`YVON Supabase ${res.status}`)
    return res.json()
  } catch (e) {
    clearTimeout(timeout)
    throw e
  }
}

export async function getYvonTokenUsage(since: string, agentId?: string, provider?: string, model?: string): Promise<any[]> {
  let query = `token_usage?select=*&timestamp=gte.${since}&order=timestamp.desc&limit=5000`
  if (agentId) query += `&agent_id=eq.${encodeURIComponent(agentId)}`
  if (provider) query += `&provider=eq.${encodeURIComponent(provider)}`
  if (model) query += `&model=eq.${encodeURIComponent(model)}`
  try {
    return await yvonSupabaseGet(query)
  } catch {
    return []
  }
}
