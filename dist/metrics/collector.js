"use strict";
// src/metrics/collector.ts
// Singleton metrics collector — ALWAYS ON (v2.0).
// Dropped the isEnabled() guard. Every toon call, engine query, and compile
// is recorded and persisted to SQLite automatically.
// Dashboard reads historical data from SQLite, not in-memory.
Object.defineProperty(exports, "__esModule", { value: true });
exports.metrics = void 0;
const store_1 = require("./store");
const supabase_writer_1 = require("./supabase-writer");
// ─── Token cost estimation (per 1M tokens, blended) ────────────────────
function estimateCost(provider, model, inputTokens, outputTokens) {
    // Rough blended pricing per provider
    const rates = {
        openai: { input: 2.5, output: 10 },
        anthropic: { input: 3, output: 15 },
        deepseek: { input: 0.14, output: 0.28 },
        openrouter: { input: 2, output: 8 },
    };
    const r = rates[provider] || { input: 1, output: 5 };
    return Math.round(((inputTokens / 1000000) * r.input + (outputTokens / 1000000) * r.output) * 100000) / 100000;
}
class MetricsCollector {
    constructor() {
        // Always enabled — no guard
        this.enabled = true;
        // In-memory buffers for live dashboard (last N items for speed)
        // Historical data lives in SQLite
        this.toonCalls = [];
        this.engineQueries = [];
        this.cieTicks = [];
        this.compileRecords = [];
        this.failures = [];
        this.moduleStatuses = new Map();
        this.agentActivities = new Map();
    }
    enable() { this.enabled = true; }
    disable() { this.enabled = false; }
    isEnabled() { return this.enabled; }
    // ─── Recording (always persists to SQLite) ───────────────────────────
    recordToonCall(call) {
        if (!this.enabled)
            return;
        this.toonCalls.push(call);
        if (this.toonCalls.length > 10000)
            this.toonCalls.shift();
        // Persist to SQLite (fire-and-forget, non-blocking)
        (0, store_1.persistToonCall)(call);
        // Dual-write to Supabase (production persistence)
        (0, supabase_writer_1.writeToonToSupabase)(call).catch(() => { });
        // Bridge to YVON OS token_usage
        (0, supabase_writer_1.writeTokenUsage)({
            agent_id: call.agentId || 'unknown',
            route: `toongine-toon/${call.format}`,
            model: call.model,
            provider: call.provider,
            input_tokens: call.inputTokens,
            output_tokens: call.outputTokens,
            cost_usd: estimateCost(call.provider, call.model, call.inputTokens, call.outputTokens),
        }).catch(() => { });
    }
    recordEngineQuery(query) {
        if (!this.enabled)
            return;
        this.engineQueries.push(query);
        if (this.engineQueries.length > 10000)
            this.engineQueries.shift();
        (0, store_1.persistEngineQuery)(query);
        (0, supabase_writer_1.writeEngineQueryToSupabase)(query).catch(() => { });
        // Bridge to YVON OS token_usage
        (0, supabase_writer_1.writeTokenUsage)({
            agent_id: query.agentId || 'unknown',
            route: 'toongine-engine',
            model: query.model,
            provider: query.provider,
            input_tokens: Math.round(query.originalChars / 4),
            output_tokens: Math.round(query.injectedChars / 4),
            cost_usd: estimateCost(query.provider, query.model, Math.round(query.originalChars / 4), Math.round(query.injectedChars / 4)),
        }).catch(() => { });
    }
    recordCompile(record) {
        if (!this.enabled)
            return;
        this.compileRecords.push(record);
        if (this.compileRecords.length > 500)
            this.compileRecords.shift();
        (0, store_1.persistCompileRecord)(record);
        (0, supabase_writer_1.writeCompileToSupabase)(record).catch(() => { });
    }
    recordCieTick(tick) {
        if (!this.enabled)
            return;
        this.cieTicks.push(tick);
        if (this.cieTicks.length > 10000)
            this.cieTicks.shift();
    }
    setModuleStatus(status) {
        this.moduleStatuses.set(status.name, status);
    }
    recordFailure(failure) {
        this.failures.push(failure);
        if (this.failures.length > 1000)
            this.failures.shift();
    }
    getFailures(limit = 50) {
        return this.failures.slice(-limit);
    }
    getFailureCount(since = 0) {
        return this.failures.filter(f => f.timestamp >= since).length;
    }
    setAgentActivity(activity) {
        this.agentActivities.set(activity.agentId, activity);
    }
    // ─── Live reads (in-memory for current session) ──────────────────────
    getModuleStatuses() { return [...this.moduleStatuses.values()]; }
    getAllAgentActivities() { return [...this.agentActivities.values()]; }
    getToonCalls(limit = 100) { return this.toonCalls.slice(-limit); }
    getCieTicks(limit = 100) { return this.cieTicks.slice(-limit); }
    getEngineQueries(limit = 100) { return this.engineQueries.slice(-limit); }
    // ─── Live stats (in-memory quick aggregations) ───────────────────────
    getLiveToonStats() {
        const calls = this.toonCalls;
        if (calls.length === 0)
            return { total: 0, totalInputTokens: 0, totalOutputTokens: 0, totalBytesSaved: 0, totalCostSaved: 0, avgSavingsPercent: 0, byModel: {} };
        const byModel = {};
        let totalInput = 0, totalOutput = 0, totalBytes = 0, totalCost = 0;
        for (const c of calls) {
            totalInput += c.inputTokens;
            totalOutput += c.outputTokens;
            totalBytes += (c.bytesBefore - c.bytesAfter);
            totalCost += c.costSaved;
            const key = `${c.provider}/${c.model}`;
            if (!byModel[key])
                byModel[key] = { calls: 0, costSaved: 0 };
            byModel[key].calls++;
            byModel[key].costSaved += c.costSaved;
        }
        const avgSavings = calls.reduce((s, c) => s + ((c.bytesBefore - c.bytesAfter) / Math.max(1, c.bytesBefore)), 0) / calls.length * 100;
        return { total: calls.length, totalInputTokens: totalInput, totalOutputTokens: totalOutput, totalBytesSaved: totalBytes, totalCostSaved: Math.round(totalCost * 10000) / 10000, avgSavingsPercent: Math.round(avgSavings * 10) / 10, byModel };
    }
    getLiveCieStats() {
        const ticks = this.cieTicks;
        if (ticks.length === 0)
            return { totalTicks: 0, totalRetrieved: 0, totalInjected: 0, totalFiltered: 0, avgLatencyMs: 0, skipRate: 0 };
        const skipped = ticks.filter(t => t.skipped).length;
        return { totalTicks: ticks.length, totalRetrieved: ticks.reduce((s, t) => s + t.retrieved, 0), totalInjected: ticks.reduce((s, t) => s + t.injected, 0), totalFiltered: ticks.reduce((s, t) => s + t.filtered, 0), avgLatencyMs: Math.round(ticks.reduce((s, t) => s + t.latencyMs, 0) / ticks.length), skipRate: Math.round((skipped / ticks.length) * 100) };
    }
    getLiveCostSummary() {
        const byModel = {};
        let totalSaved = 0;
        for (const c of this.toonCalls) {
            const key = `${c.provider}/${c.model}`;
            if (!byModel[key])
                byModel[key] = { calls: 0, inputTokens: 0, outputTokens: 0, cost: 0 };
            byModel[key].calls++;
            byModel[key].inputTokens += c.inputTokens;
            byModel[key].outputTokens += c.outputTokens;
            const estimatedCost = (c.inputTokens / 1000000) * 3 + (c.outputTokens / 1000000) * 15;
            byModel[key].cost += estimatedCost;
            totalSaved += c.costSaved;
        }
        const totalSpent = Object.values(byModel).reduce((s, m) => s + m.cost, 0);
        return { byModel, totalSpent: Math.round(totalSpent * 10000) / 10000, totalSaved: Math.round(totalSaved * 10000) / 10000, netCost: Math.round((totalSpent - totalSaved) * 10000) / 10000 };
    }
    // ─── Historical reads (SQLite — always up to date) ──────────────────
    getHistoricalToonStats(sinceHours = 24) {
        return (0, store_1.getToonStats)(sinceHours);
    }
    getHistoricalEngineStats(sinceHours = 24) {
        return (0, store_1.getEngineStats)(sinceHours);
    }
    getHistoricalCostSummary(sinceHours = 24) {
        return (0, store_1.getCostSummary)(sinceHours);
    }
    getAgentEfficiency(sinceHours = 24) {
        return (0, store_1.getAgentEfficiency)(sinceHours);
    }
    getWeeklyEfficiency(days = 7) {
        return (0, store_1.getWeeklyEfficiency)(days);
    }
    getContentTypeEfficiency() {
        return (0, store_1.getContentTypeEfficiency)();
    }
    getProviderCosts(sinceHours = 24) {
        return (0, store_1.getProviderCosts)(sinceHours);
    }
    getHealthScore() {
        return (0, store_1.getHealthScore)();
    }
    getRecentQueries(limit = 50) {
        return (0, store_1.getRecentQueries)(limit);
    }
    getCompileHistory(limit = 20) {
        return (0, store_1.getCompileHistory)(limit);
    }
    getAnomalies(sinceHours = 24) {
        return (0, store_1.getAnomalies)(sinceHours);
    }
    clear() {
        this.toonCalls = [];
        this.engineQueries = [];
        this.cieTicks = [];
        this.compileRecords = [];
        this.moduleStatuses.clear();
        this.agentActivities.clear();
    }
}
exports.metrics = new MetricsCollector();
//# sourceMappingURL=collector.js.map