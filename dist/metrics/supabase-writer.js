"use strict";
// src/metrics/supabase-writer.ts
// Fire-and-forget Supabase writes for engine metrics.
// Never blocks the agent call — writes happen async after recording.
// Falls back silently if Supabase is unavailable.
//
// Usage:
//   writeToonToSupabase(call).catch(() => {})
//   writeEngineQueryToSupabase(query).catch(() => {})
//   writeCompileToSupabase(compile).catch(() => {})
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeToonToSupabase = writeToonToSupabase;
exports.writeEngineQueryToSupabase = writeEngineQueryToSupabase;
exports.writeCompileToSupabase = writeCompileToSupabase;
exports.getSupabaseToonStats = getSupabaseToonStats;
exports.getSupabaseEngineStats = getSupabaseEngineStats;
exports.getSupabaseAgentEfficiency = getSupabaseAgentEfficiency;
exports.getSupabaseWeeklyEfficiency = getSupabaseWeeklyEfficiency;
exports.getSupabaseProviderCosts = getSupabaseProviderCosts;
exports.getSupabaseRecentQueries = getSupabaseRecentQueries;
exports.getSupabaseCompileHistory = getSupabaseCompileHistory;
exports.refreshSupabaseViews = refreshSupabaseViews;
exports.writeTokenUsage = writeTokenUsage;
exports.getYvonTokenUsage = getYvonTokenUsage;
let _supabaseUrl = null;
let _supabaseKey = null;
let _checked = false;
function getCredentials() {
    if (_checked)
        return { url: _supabaseUrl, key: _supabaseKey };
    _checked = true;
    _supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || null;
    _supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || null;
    return { url: _supabaseUrl, key: _supabaseKey };
}
async function supabasePost(table, body) {
    const { url, key } = getCredentials();
    if (!url || !key)
        return;
    try {
        // Use fetch with timeout — never block the agent call
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
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
        });
        clearTimeout(timeout);
    }
    catch {
        // Silent fail — data still lives in local SQLite
    }
}
async function writeToonToSupabase(call) {
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
    });
}
async function writeEngineQueryToSupabase(query) {
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
    });
}
async function writeCompileToSupabase(record) {
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
    });
}
// ─── Supabase read helpers (for dashboard API) ───────────────────────────────
async function supabaseGet(path) {
    const { url, key } = getCredentials();
    if (!url || !key)
        throw new Error('Supabase not configured');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
        const res = await fetch(`${url}/rest/v1/${path}`, {
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`,
            },
            signal: controller.signal,
        });
        clearTimeout(timeout);
        if (!res.ok)
            throw new Error(`Supabase ${res.status}`);
        return res.json();
    }
    catch (e) {
        clearTimeout(timeout);
        throw e;
    }
}
async function getSupabaseToonStats(since) {
    return supabaseGet(`metrics.toon_calls?select=count,sum(input_tokens),sum(output_tokens),sum(bytes_before-bytes_after),avg(cost_saved)&timestamp=gte.${since}`);
}
async function getSupabaseEngineStats(since) {
    return supabaseGet(`metrics.daily_summary?day=gte.${since}&order=day.desc`);
}
async function getSupabaseAgentEfficiency(since) {
    return supabaseGet(`metrics.engine_queries?select=agent_id,count,savings_percent.avg(),latency_ms.avg()&timestamp=gte.${since}&group=agent_id&order=count.desc`);
}
async function getSupabaseWeeklyEfficiency() {
    return supabaseGet(`metrics.agent_weekly?order=week_start.desc&limit=12`);
}
async function getSupabaseProviderCosts(since) {
    return supabaseGet(`metrics.toon_calls?select=provider,model,count,input_tokens.sum(),output_tokens.sum()&timestamp=gte.${since}&group=provider,model&order=count.desc`);
}
async function getSupabaseRecentQueries(limit = 50) {
    return supabaseGet(`metrics.engine_queries?select=*&order=timestamp.desc&limit=${limit}`);
}
async function getSupabaseCompileHistory(limit = 20) {
    return supabaseGet(`metrics.compiles?select=*&order=timestamp.desc&limit=${limit}`);
}
async function refreshSupabaseViews() {
    const { url, key } = getCredentials();
    if (!url || !key)
        return;
    try {
        await fetch(`${url}/rest/v1/rpc/metrics.refresh_views`, {
            method: 'POST',
            headers: { 'apikey': key, 'Authorization': `Bearer ${key}` },
        });
    }
    catch { }
}
let _yvonCredentials = null;
function getYvonCredentials() {
    if (_yvonCredentials)
        return _yvonCredentials;
    _yvonCredentials = {
        url: process.env.YVON_SUPABASE_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || null,
        key: process.env.YVON_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || null,
    };
    return _yvonCredentials;
}
async function writeTokenUsage(payload) {
    const { url, key } = getYvonCredentials();
    if (!url || !key)
        return;
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
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
        });
        clearTimeout(timeout);
    }
    catch {
        // Silent fail — data still lives in local SQLite
    }
}
// ─── YVON Supabase read helpers (for token-burn dashboard API) ────────────────
async function yvonSupabaseGet(path) {
    const { url, key } = getYvonCredentials();
    if (!url || !key)
        throw new Error('YVON Supabase not configured');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
        const res = await fetch(`${url}/rest/v1/${path}`, {
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`,
            },
            signal: controller.signal,
        });
        clearTimeout(timeout);
        if (!res.ok)
            throw new Error(`YVON Supabase ${res.status}`);
        return res.json();
    }
    catch (e) {
        clearTimeout(timeout);
        throw e;
    }
}
async function getYvonTokenUsage(since, agentId, provider, model) {
    let query = `token_usage?select=*&timestamp=gte.${since}&order=timestamp.desc&limit=5000`;
    if (agentId)
        query += `&agent_id=eq.${encodeURIComponent(agentId)}`;
    if (provider)
        query += `&provider=eq.${encodeURIComponent(provider)}`;
    if (model)
        query += `&model=eq.${encodeURIComponent(model)}`;
    try {
        return await yvonSupabaseGet(query);
    }
    catch {
        return [];
    }
}
//# sourceMappingURL=supabase-writer.js.map