// src/dashboard/api.ts
// REST API routes for dashboard v3.
// Supabase-first reads for production, SQLite fallback for local dev.

import { Router, Request, Response } from 'express'
import { metrics } from '../metrics/collector'
import { runHealthChecks } from '../metrics/health-checks'
import { initAgentActivities } from '../metrics/agent-tracker'
import { readFileSync, existsSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'
import {
  getSupabaseEngineStats, getSupabaseAgentEfficiency,
  getSupabaseWeeklyEfficiency, getSupabaseProviderCosts,
  getSupabaseRecentQueries, getSupabaseCompileHistory,
  refreshSupabaseViews, getYvonTokenUsage
} from '../metrics/supabase-writer'

const router = Router()

// ── Health ──────────────────────────────────────────────────────────────────

router.get('/health', (_req: Request, res: Response) => {
  const score = metrics.getHealthScore()
  res.json({
    status: score.score >= 90 ? 'healthy' : score.score >= 70 ? 'degraded' : 'critical',
    score: score.score,
    penalties: score.penalties,
    components: score.components,
    metricsEnabled: metrics.isEnabled(),
    uptime: process.uptime(),
    version: '1.5.0',
    timestamp: Date.now(),
  })
})

// ── Live Feed (WebSocket) ───────────────────────────────────────────────────

router.get('/live', (_req: Request, res: Response) => {
  res.json({
    toonCalls: metrics.getToonCalls(20),
    engineQueries: metrics.getEngineQueries(20),
    agentActivities: metrics.getAllAgentActivities(),
    moduleStatuses: metrics.getModuleStatuses(),
  })
})

// ── TOON Stats ──────────────────────────────────────────────────────────────

router.get('/toon/stats', (req: Request, res: Response) => {
  const hours = parseInt(req.query.hours as string) || 24
  const historical = metrics.getHistoricalToonStats(hours)
  const live = metrics.getLiveToonStats()
  res.json({ live, historical })
})

router.get('/toon/history', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 100
  res.json(metrics.getToonCalls(limit))
})

// ── Engine Stats (V3) ───────────────────────────────────────────────────────

router.get('/engine/stats', (req: Request, res: Response) => {
  const hours = parseInt(req.query.hours as string) || 24
  res.json(metrics.getHistoricalEngineStats(hours))
})

router.get('/engine/queries', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 50
  res.json(metrics.getRecentQueries(limit))
})

router.get('/engine/anomalies', (req: Request, res: Response) => {
  const hours = parseInt(req.query.hours as string) || 24
  res.json(metrics.getAnomalies(hours))
})

// ── Agent Efficiency ────────────────────────────────────────────────────────

router.get('/agents/efficiency', (req: Request, res: Response) => {
  const hours = parseInt(req.query.hours as string) || 24
  res.json(metrics.getAgentEfficiency(hours))
})

// ── Weekly Efficiency ───────────────────────────────────────────────────────

router.get('/efficiency/weekly', (req: Request, res: Response) => {
  const days = parseInt(req.query.days as string) || 7
  res.json(metrics.getWeeklyEfficiency(days))
})

// ── Content Type Efficiency ─────────────────────────────────────────────────

router.get('/efficiency/content-types', (_req: Request, res: Response) => {
  res.json(metrics.getContentTypeEfficiency())
})

// ── Provider Costs ──────────────────────────────────────────────────────────

router.get('/cost/providers', (req: Request, res: Response) => {
  const hours = parseInt(req.query.hours as string) || 24
  res.json(metrics.getProviderCosts(hours))
})

// ── Health Score ────────────────────────────────────────────────────────────

router.get('/health/score', (_req: Request, res: Response) => {
  res.json(metrics.getHealthScore())
})

// ── Compile History ─────────────────────────────────────────────────────────

router.get('/compiles', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 20
  res.json(metrics.getCompileHistory(limit))
})

// ── CIE ─────────────────────────────────────────────────────────────────────

router.get('/cie/stats', (_req: Request, res: Response) => {
  const live = metrics.getLiveCieStats()
  res.json(live)
})

router.get('/cie/history', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 100
  res.json(metrics.getCieTicks(limit))
})

// ── Modules ─────────────────────────────────────────────────────────────────

router.post('/modules/recheck', (_req: Request, res: Response) => {
  runHealthChecks()
  res.json({ ok: true })
})

router.get('/modules', (_req: Request, res: Response) => {
  runHealthChecks()
  res.json(metrics.getModuleStatuses())
})

// ── Agents ──────────────────────────────────────────────────────────────────

router.get('/agents', (_req: Request, res: Response) => {
  if (metrics.getAllAgentActivities().length === 0) {
    initAgentActivities()
  }
  res.json(metrics.getAllAgentActivities())
})

// ── Cost ────────────────────────────────────────────────────────────────────

router.get('/cost', (req: Request, res: Response) => {
  const hours = parseInt(req.query.hours as string) || 24
  res.json(metrics.getHistoricalCostSummary(hours))
})

// ── Config (toongine.config.json) ───────────────────────────────────────────────

router.get('/config', (_req: Request, res: Response) => {
  const configPath = join(process.cwd(), 'toongine.config.json')
  if (existsSync(configPath)) {
    res.json(JSON.parse(readFileSync(configPath, 'utf-8')))
  } else {
    res.json({
      dashboard: { showInSettings: true, autoStartOnDev: true, port: 4200, theme: 'dark' }
    })
  }
})

// ── Token Burn ───────────────────────────────────────────────────────────────

interface TokenBurnRow {
  time: string
  agentId: string
  route: string
  model: string
  provider: string
  tokens: number
  cost: number
}

router.get('/token-burn', async (req: Request, res: Response) => {
  try {
    const range = (req.query.range as string) || 'today'
    const sortBy = (req.query.sort as string) || 'tokens'
    const filterAgent = req.query.agent as string | undefined
    const filterProvider = req.query.provider as string | undefined
    const filterModel = req.query.model as string | undefined

    // Determine time windows
    const now = Date.now()
    const rangeMs: Record<string, number> = { today: 24 * 3600 * 1000, week: 7 * 24 * 3600 * 1000, month: 30 * 24 * 3600 * 1000 }
    const windowMs = rangeMs[range] || rangeMs.today
    const since = now - windowMs
    const sinceISO = new Date(since).toISOString()

    // For 'today', get yesterday's same period for delta
    const yesterdaySince = since - 24 * 3600 * 1000
    const yesterdayUntil = now - 24 * 3600 * 1000

    const rows: TokenBurnRow[] = []

    // ── Source 1: YVON Supabase token_usage ──────────────────────────────
    try {
      const yvonRows = await getYvonTokenUsage(sinceISO, filterAgent, filterProvider, filterModel)
      for (const r of yvonRows) {
        rows.push({
          time: r.timestamp || r.created_at || new Date().toISOString(),
          agentId: r.agent_id || 'unknown',
          route: r.route || 'unknown',
          model: r.model || 'unknown',
          provider: r.provider || 'unknown',
          tokens: (r.input_tokens || 0) + (r.output_tokens || 0),
          cost: r.cost_usd || 0,
        })
      }
    } catch { /* YVON Supabase unavailable — skip */ }

    // ── Source 2: Local SQLite toon_calls ────────────────────────────────
    try {
      const toonCalls = metrics.getToonCalls(10000)
      for (const c of toonCalls) {
        if (c.timestamp < since) continue
        if (filterAgent && c.agentId !== filterAgent) continue
        if (filterProvider && c.provider !== filterProvider) continue
        if (filterModel && c.model !== filterModel) continue
        const cost = (c.inputTokens / 1_000_000) * 3 + (c.outputTokens / 1_000_000) * 15
        rows.push({
          time: new Date(c.timestamp).toISOString(),
          agentId: c.agentId || 'unknown',
          route: `toon/${c.format}`,
          model: c.model || 'unknown',
          provider: c.provider || 'unknown',
          tokens: c.inputTokens + c.outputTokens,
          cost: Math.round(cost * 100000) / 100000,
        })
      }
    } catch { /* SQLite unavailable — skip */ }

    // Also add engine queries from in-memory buffer
    const engineQueries = metrics.getEngineQueries(10000)
    for (const q of engineQueries) {
      if (q.timestamp < since) continue
      if (filterAgent && q.agentId !== filterAgent) continue
      if (filterProvider && q.provider !== filterProvider) continue
      if (filterModel && q.model !== filterModel) continue
      const tokens = Math.round(q.originalChars / 4) + Math.round(q.injectedChars / 4)
      rows.push({
        time: new Date(q.timestamp).toISOString(),
        agentId: q.agentId || 'unknown',
        route: 'engine',
        model: q.model || 'unknown',
        provider: q.provider || 'unknown',
        tokens,
        cost: Math.round(((tokens / 1_000_000) * 3) * 100000) / 100000,
      })
    }

    // ── Sort ────────────────────────────────────────────────────────────
    if (sortBy === 'cost') rows.sort((a, b) => b.cost - a.cost)
    else if (sortBy === 'time') rows.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    else rows.sort((a, b) => b.tokens - a.tokens) // default: tokens

    // ── Summary ─────────────────────────────────────────────────────────
    const totalTokens = rows.reduce((s, r) => s + r.tokens, 0)
    const grossCost = rows.reduce((s, r) => s + r.cost, 0)
    const totalCalls = rows.length
    const hoursInRange = windowMs / (3600 * 1000)
    const burnRate = Math.round(totalTokens / Math.max(1, hoursInRange))

    // Estimate TOON savings: assume 94% compression on input side
    const savedByToon = Math.round(grossCost * 0.85 * 100) / 100 // ~85% saved via compression
    const netCost = Math.round((grossCost - savedByToon) * 100) / 100

    // ── By Agent ────────────────────────────────────────────────────────
    const agentMap = new Map<string, { tokens: number; cost: number; calls: number }>()
    for (const r of rows) {
      const a = agentMap.get(r.agentId) || { tokens: 0, cost: 0, calls: 0 }
      a.tokens += r.tokens
      a.cost += r.cost
      a.calls++
      agentMap.set(r.agentId, a)
    }
    const byAgent = [...agentMap.entries()].map(([agentId, data]) => ({
      agentId,
      tokens: Math.round(data.tokens),
      cost: Math.round(data.cost * 100) / 100,
      calls: data.calls,
      percentOfTotal: totalTokens ? Math.round((data.tokens / totalTokens) * 1000) / 10 : 0,
      deltaVsYesterday: 0, // calculated below for 'today'
    }))

    // ── By Provider ─────────────────────────────────────────────────────
    const providerMap = new Map<string, { tokens: number; cost: number; calls: number }>()
    for (const r of rows) {
      const p = providerMap.get(r.provider) || { tokens: 0, cost: 0, calls: 0 }
      p.tokens += r.tokens
      p.cost += r.cost
      p.calls++
      providerMap.set(r.provider, p)
    }
    const byProvider = [...providerMap.entries()].map(([provider, data]) => ({
      provider,
      tokens: Math.round(data.tokens),
      cost: Math.round(data.cost * 100) / 100,
      calls: data.calls,
      percentOfTotal: totalTokens ? Math.round((data.tokens / totalTokens) * 1000) / 10 : 0,
    }))

    // ── By Model ────────────────────────────────────────────────────────
    const modelMap = new Map<string, { tokens: number; cost: number; calls: number; provider: string }>()
    for (const r of rows) {
      const key = `${r.provider}/${r.model}`
      const m = modelMap.get(key) || { tokens: 0, cost: 0, calls: 0, provider: r.provider }
      m.tokens += r.tokens
      m.cost += r.cost
      m.calls++
      modelMap.set(key, m)
    }
    const byModel = [...modelMap.entries()].map(([key, data]) => {
      const [provider, ...modelParts] = key.split('/')
      return {
        model: modelParts.join('/'),
        provider,
        tokens: Math.round(data.tokens),
        cost: Math.round(data.cost * 100) / 100,
        calls: data.calls,
        percentOfTotal: totalTokens ? Math.round((data.tokens / totalTokens) * 1000) / 10 : 0,
      }
    })

    // ── By Hour ─────────────────────────────────────────────────────────
    const hourMap = new Map<number, { tokens: number; cost: number }>()
    for (const r of rows) {
      const hour = new Date(r.time).getHours()
      const h = hourMap.get(hour) || { tokens: 0, cost: 0 }
      h.tokens += r.tokens
      h.cost += r.cost
      hourMap.set(hour, h)
    }
    const byHour = [...hourMap.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([hour, data]) => ({
        hour,
        tokens: Math.round(data.tokens),
        cost: Math.round(data.cost * 100) / 100,
      }))

    // ── Timeline ────────────────────────────────────────────────────────
    const timeline = rows.slice(0, 200).map(r => ({
      time: r.time,
      agentId: r.agentId,
      route: r.route,
      model: r.model,
      provider: r.provider,
      tokens: r.tokens,
      cost: Math.round(r.cost * 100) / 100,
    }))

    // ── Delta vs Yesterday ('today' only) ───────────────────────────────
    let yesterdayTokens = 0
    let yesterdayCost = 0
    let yesterdayCalls = 0
    if (range === 'today') {
      // Get yesterday's local data
      const allToon = metrics.getToonCalls(10000)
      for (const c of allToon) {
        if (c.timestamp >= yesterdaySince && c.timestamp < yesterdayUntil) {
          yesterdayTokens += c.inputTokens + c.outputTokens
          yesterdayCost += (c.inputTokens / 1_000_000) * 3 + (c.outputTokens / 1_000_000) * 15
          yesterdayCalls++
        }
      }
      const allEng = metrics.getEngineQueries(10000)
      for (const q of allEng) {
        if (q.timestamp >= yesterdaySince && q.timestamp < yesterdayUntil) {
          const t = Math.round(q.originalChars / 4) + Math.round(q.injectedChars / 4)
          yesterdayTokens += t
          yesterdayCost += (t / 1_000_000) * 3
          yesterdayCalls++
        }
      }
      // Also try YVON for yesterday
      try {
        const yestYvon = await getYvonTokenUsage(new Date(yesterdaySince).toISOString(), filterAgent, filterProvider, filterModel)
        for (const r of yestYvon) {
          const ts = new Date(r.timestamp || r.created_at).getTime()
          if (ts >= yesterdaySince && ts < yesterdayUntil) {
            yesterdayTokens += (r.input_tokens || 0) + (r.output_tokens || 0)
            yesterdayCost += r.cost_usd || 0
            yesterdayCalls++
          }
        }
      } catch {}
    }
    const burnVsYesterday = yesterdayTokens ? Math.round(((totalTokens - yesterdayTokens) / yesterdayTokens) * 1000) / 10 : 0
    const costVsYesterday = yesterdayCost ? Math.round(((grossCost - yesterdayCost) / yesterdayCost) * 1000) / 10 : 0
    const callsVsYesterday = yesterdayCalls ? Math.round(((totalCalls - yesterdayCalls) / yesterdayCalls) * 1000) / 10 : 0

    // ── Budget ──────────────────────────────────────────────────────────
    const dailyBudget = parseFloat(process.env.TOONGINE_DAILY_BUDGET || '3.50')
    const spent = grossCost
    const remaining = Math.max(0, dailyBudget - spent)
    const budgetPercent = Math.round((spent / dailyBudget) * 1000) / 10
    const projectedTimeLeft = burnRate > 0
      ? Math.round((remaining / (burnRate > 0 ? grossCost / Math.max(1, totalCalls) * (24 / hoursInRange) : 1)) * 100) / 100
      : 24

    // Update byAgent deltaVsYesterday (simplified: total delta distributed proportionally)
    if (range === 'today' && yesterdayTokens > 0) {
      for (const a of byAgent) {
        const yesterdayAgentTokens = yesterdayTokens * (a.tokens / Math.max(1, totalTokens))
        a.deltaVsYesterday = Math.round(((a.tokens - yesterdayAgentTokens) / Math.max(1, yesterdayAgentTokens)) * 1000) / 10
      }
    }

    res.json({
      summary: {
        totalTokens: Math.round(totalTokens),
        grossCost: Math.round(grossCost * 100) / 100,
        savedByToon,
        netCost: Math.max(0, netCost),
        totalCalls,
        burnRate,
      },
      byAgent,
      byProvider,
      byModel,
      byHour,
      timeline,
      budget: {
        daily: dailyBudget,
        spent: Math.round(spent * 100) / 100,
        remaining: Math.round(remaining * 100) / 100,
        percent: budgetPercent,
        projectedTimeLeft,
      },
      delta: {
        burnVsYesterday,
        costVsYesterday,
        callsVsYesterday,
      },
    })
  } catch (err: any) {
    res.status(500).json({ error: 'token-burn query failed', detail: err?.message || String(err) })
  }
})

// ── Project Health ───────────────────────────────────────────────────────────

router.get('/project-health', async (req: Request, res: Response) => {
  try {
    const range = (req.query.range as string) || '24h'
    const rangeHours: Record<string, number> = { '24h': 24, '7d': 168, '30d': 720 }
    const hours = rangeHours[range] || 24

    // ── TOON Quality (content type efficiency) ──────────────────────────
    const contentTypes = metrics.getContentTypeEfficiency()
    const toonQuality = contentTypes.map(ct => ({
      type: ct.type,
      savingsPercent: ct.savingsPercent,
      grade: ct.grade,
      rawBytes: ct.rawBytes,
      toonBytes: ct.toonBytes,
      chunks: ct.chunks,
    }))

    // ── Savings Trend ───────────────────────────────────────────────────
    const weekly = metrics.getWeeklyEfficiency(hours > 168 ? 30 : 7)
    const savingsTrend = weekly.map(w => ({
      day: w.day,
      avgSavings: w.avgSavings,
    }))

    // ── Top-K Match ─────────────────────────────────────────────────────
    const engineStats = metrics.getHistoricalEngineStats(hours)
    const topKMatch = {
      avgChunksMatched: engineStats.avgChunksMatched,
      avgChunksInjected: engineStats.totalInjectedChars > 0
        ? Math.round(engineStats.totalInjectedChars / Math.max(1, engineStats.totalQueries) / 100)
        : 0,
      injectionLevels: {
        L1: 0,   // estimated from recent queries
        L2: 0,
        REF: 0,
      },
    }
    // Count injection levels from recent engine queries
    const recentQueries = metrics.getRecentQueries(500)
    for (const q of recentQueries) {
      if (q.injectionLevel === 'L1') topKMatch.injectionLevels.L1++
      else if (q.injectionLevel === 'L2') topKMatch.injectionLevels.L2++
      else if (q.injectionLevel === 'REF') topKMatch.injectionLevels.REF++
    }

    // ── Codebase ────────────────────────────────────────────────────────
    let lastCompile = 0
    let filesScanned = 0
    let chunksBuilt = 0
    let termsIndexed = 0
    let bpeTokens = 0
    let corpusSize = 0
    let compressedSize = 0
    let deltaFiles = 0
    let deltaChunks = 0
    let tscErrors = 0

    const compileHistory = metrics.getCompileHistory(1)
    if (compileHistory.length > 0) {
      const latest = compileHistory[0]
      lastCompile = latest.timestamp
      filesScanned = latest.filesScanned || 0
      chunksBuilt = latest.chunksBuilt || 0
      termsIndexed = latest.termsIndexed || 0
      bpeTokens = latest.bpeTokens || 0
      corpusSize = latest.corpusSizeBytes || 0
      compressedSize = latest.binSizeBytes || 0
    }

    // Git diff for delta
    try {
      const diffOutput = execSync('git diff --stat HEAD~1', {
        cwd: process.cwd(),
        timeout: 5000,
        encoding: 'utf-8',
      })
      const lines = diffOutput.trim().split('\n')
      deltaFiles = lines.length > 0 ? lines.length - 1 : 0 // last line is summary
      // Rough chunk estimate: ~3 chunks per changed file
      deltaChunks = deltaFiles * 3
    } catch { /* git unavailable or no history */ }

    // tsc errors
    try {
      const tscOutput = execSync('npx tsc --noEmit 2>&1 | wc -l', {
        cwd: process.cwd(),
        timeout: 30000,
        encoding: 'utf-8',
      })
      tscErrors = parseInt(tscOutput.trim(), 10) || 0
    } catch {
      // tsc might fail with nonzero exit — errors are in stderr
      try {
        const tscErr = execSync('npx tsc --noEmit 2>&1', {
          cwd: process.cwd(),
          timeout: 30000,
          encoding: 'utf-8',
        })
        tscErrors = tscErr.trim().split('\n').filter(l => l.includes('error TS')).length
      } catch (e: any) {
        const output = (e.stdout || '') + (e.stderr || '')
        tscErrors = output.trim().split('\n').filter((l: string) => l.includes('error TS')).length
      }
    }

    const codebase = {
      lastCompile,
      filesScanned,
      chunksBuilt,
      termsIndexed,
      bpeTokens,
      corpusSize,
      compressedSize,
      deltaFiles,
      deltaChunks,
      tscErrors,
    }

    // ── API Health ──────────────────────────────────────────────────────
    const failures = metrics.getFailures(1000)
    const recentFailures = failures.filter(f => f.timestamp >= Date.now() - hours * 3600 * 1000)
    const errorBreakdown: Record<string, number> = {}
    const worstEndpoints: Record<string, number> = {}
    for (const f of recentFailures) {
      const key = `${f.module}/${f.operation}`
      errorBreakdown[key] = (errorBreakdown[key] || 0) + 1
      worstEndpoints[f.module] = (worstEndpoints[f.module] || 0) + 1
    }
    const toonCalls = metrics.getToonCalls(10000)
    const recentToonCalls = toonCalls.filter(c => c.timestamp >= Date.now() - hours * 3600 * 1000)
    const totalCalls = recentToonCalls.length + metrics.getEngineQueries(10000).filter(q => q.timestamp >= Date.now() - hours * 3600 * 1000).length
    const totalErrors = Object.values(errorBreakdown).reduce((s, c) => s + c, 0)
    const successRate = totalCalls + totalErrors > 0
      ? Math.round((totalCalls / (totalCalls + totalErrors)) * 1000) / 10
      : 100

    const apiHealth = {
      totalCalls,
      successRate,
      errorBreakdown: Object.entries(errorBreakdown).map(([status, count]) => ({ status, count })),
      worstEndpoints: Object.entries(worstEndpoints)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([path, errors]) => ({ path, errors })),
    }

    // ── Prompt Quality ──────────────────────────────────────────────────
    const agentEff = metrics.getAgentEfficiency(hours)
    let totalContextSize = 0
    let totalInjectedSize = 0
    let cacheHits = 0
    let bestAgent = { id: 'none', savings: 0 }
    let worstAgent = { id: 'none', savings: 100 }
    for (const a of agentEff) {
      totalContextSize += a.totalTokens
      totalInjectedSize += Math.round(a.totalTokens * (a.avgSavings / 100))
      if (a.avgSavings > bestAgent.savings) bestAgent = { id: a.agentId, savings: a.avgSavings }
      if (a.avgSavings < worstAgent.savings && a.queries > 0) worstAgent = { id: a.agentId, savings: a.avgSavings }
    }
    // Estimate cache hits from chunks_matched > 0
    const recentEngQueries = metrics.getEngineQueries(1000)
    cacheHits = recentEngQueries.filter(q => q.chunksMatched > 0).length
    const cacheHitRate = recentEngQueries.length > 0
      ? Math.round((cacheHits / recentEngQueries.length) * 1000) / 10
      : 0
    const reductionPercent = totalContextSize > 0
      ? Math.round((totalInjectedSize / totalContextSize) * 1000) / 10
      : 0

    const promptQuality = {
      avgContextSize: agentEff.length > 0 ? Math.round(totalContextSize / agentEff.length) : 0,
      avgInjectedSize: agentEff.length > 0 ? Math.round(totalInjectedSize / agentEff.length) : 0,
      reductionPercent,
      cacheHitRate,
      bestAgent: bestAgent.id,
      worstAgent: worstAgent.id,
    }

    // ── Issues ──────────────────────────────────────────────────────────
    const anomalies = metrics.getAnomalies(hours)
    const issues = anomalies.map((a: any) => ({
      time: new Date().toISOString(),
      severity: a.severity === 'red' ? 'critical' : a.severity === 'yellow' ? 'warning' : 'info',
      source: a.type || 'unknown',
      message: a.detail || a.action || '',
    }))

    // Add recent failures as issues
    for (const f of recentFailures.slice(0, 20)) {
      issues.push({
        time: new Date(f.timestamp).toISOString(),
        severity: 'error',
        source: f.module,
        message: f.error,
      })
    }

    // ── Doc Coverage ────────────────────────────────────────────────────
    const docCoverage: { path: string; coveragePercent: number; total: number; documented: number }[] = []
    try {
      const projectRoot = process.cwd()
      const topDirs = readdirSync(projectRoot, { withFileTypes: true })
        .filter(d => d.isDirectory() && !d.name.startsWith('.') && d.name !== 'node_modules' && d.name !== 'dist')
      for (const dir of topDirs) {
        const dirPath = join(projectRoot, dir.name)
        try {
          const hasReadme = existsSync(join(dirPath, 'README.md'))
          const hasClaude = existsSync(join(dirPath, 'CLAUDE.md'))
          const hasContributing = existsSync(join(dirPath, 'CONTRIBUTING.md'))
          const documented = (hasReadme ? 1 : 0) + (hasClaude ? 1 : 0) + (hasContributing ? 1 : 0)
          docCoverage.push({
            path: dir.name,
            coveragePercent: Math.round((documented / 3) * 100),
            total: 3,
            documented,
          })
        } catch {
          docCoverage.push({ path: dir.name, coveragePercent: 0, total: 3, documented: 0 })
        }
      }
    } catch { /* can't read dirs */ }

    res.json({
      toonQuality,
      savingsTrend,
      topKMatch,
      codebase,
      apiHealth,
      promptQuality,
      issues,
      docCoverage,
    })
  } catch (err: any) {
    res.status(500).json({ error: 'project-health query failed', detail: err?.message || String(err) })
  }
})

export default router

// ─── Provider Simulator (separate router) ────────────────────────────────────

export function providerSimulatorRoutes(): Router {
  const r = Router()

  interface SimRequest {
    provider: string
    model: string
    agentId?: string
    monthlyQueries?: number
    avgInputTokens?: number
    avgOutputTokens?: number
  }

  // Provider pricing (per 1M tokens)
  const PRICING: Record<string, Record<string, { input: number; output: number; latency: number }>> = {
    deepseek: {
      'deepseek-chat': { input: 0.14, output: 0.28, latency: 1.2 },
      'deepseek-reasoner': { input: 0.55, output: 2.19, latency: 3.8 },
    },
    anthropic: {
      'claude-opus': { input: 15, output: 75, latency: 2.4 },
      'claude-sonnet': { input: 3, output: 15, latency: 1.1 },
      'claude-haiku': { input: 0.80, output: 4, latency: 0.6 },
    },
    openai: {
      'gpt-4o': { input: 2.5, output: 10, latency: 1.6 },
      'gpt-4o-mini': { input: 0.15, output: 0.60, latency: 0.8 },
      'o1': { input: 15, output: 60, latency: 8 },
    },
  }

  // Tokenizer overhead factors (how much each provider inflates TOON text)
  const TOKENIZER: Record<string, number> = {
    deepseek: 1.0,
    anthropic: 1.18,  // 18% more tokens
    openai: 1.09,     // 9% more tokens
  }

  r.post('/simulate', (req: Request, res: Response) => {
    const { provider, model, agentId, monthlyQueries, avgInputTokens, avgOutputTokens } = req.body as SimRequest
    const pricing = PRICING[provider]?.[model]
    if (!pricing) return res.status(400).json({ error: `Unknown provider/model: ${provider}/${model}` })

    // Get current usage from SQLite
    const currentCost = metrics.getHistoricalCostSummary(720) // 30 days
    const engineStats = metrics.getHistoricalEngineStats(720)

    const q = monthlyQueries || engineStats.totalQueries || 500
    const inTok = avgInputTokens || 3000
    const outTok = avgOutputTokens || 800
    const tokFactor = TOKENIZER[provider] || 1.0

    const monthlyCost = ((q * inTok * tokFactor) / 1_000_000) * pricing.input +
                        ((q * outTok * tokFactor) / 1_000_000) * pricing.output

    const currentMonthly = currentCost.totalSpent || 0

    res.json({
      scenario: { provider, model, agentId: agentId || 'all' },
      pricing: { inputPerM: pricing.input, outputPerM: pricing.output, tokenizerFactor: tokFactor },
      projected: {
        monthlyQueries: q,
        avgInputTokens: Math.round(inTok * tokFactor),
        avgOutputTokens: Math.round(outTok * tokFactor),
        monthlyCost: Math.round(monthlyCost * 100) / 100,
        vsCurrent: Math.round(((monthlyCost - currentMonthly) / Math.max(1, currentMonthly)) * 10000) / 100,
        vsCurrentAbsolute: Math.round((monthlyCost - currentMonthly) * 100) / 100,
        latencyMs: pricing.latency * 1000,
        estimatedSavingsPercent: Math.round((94 - (tokFactor - 1) * 50) * 10) / 10, // tokenizer penalty
      },
      currentMonthly,
    })
  })

  r.get('/providers', (_req: Request, res: Response) => {
    const providers: Record<string, string[]> = {}
    for (const [p, models] of Object.entries(PRICING)) {
      providers[p] = Object.keys(models)
    }
    res.json(providers)
  })

  return r
}
