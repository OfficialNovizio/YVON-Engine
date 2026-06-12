// src/dashboard/api.ts
// REST API routes for dashboard v2.

import { Router, Request, Response } from 'express'
import { metrics } from '../metrics/collector'
import { runHealthChecks } from '../metrics/health-checks'
import { initAgentActivities } from '../metrics/agent-tracker'
import { getHistoricalToonCalls, getHistoricalCieTicks } from '../metrics/store'
import { readFileSync, existsSync, writeFileSync } from 'fs'
import { join } from 'path'

const router = Router()

// ── Health ──────────────────────────────────────────────────────────────────

router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    metricsEnabled: metrics.isEnabled(),
    uptime: process.uptime(),
    version: '1.3.0',
    timestamp: Date.now(),
  })
})

// ── TOON ────────────────────────────────────────────────────────────────────

router.get('/toon/stats', (_req: Request, res: Response) => {
  const stats = metrics.getToonStats()
  const historical = getHistoricalToonCalls(24)
  res.json({ ...stats, history24h: historical.slice(0, 100) })
})

router.get('/toon/history', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 100
  res.json(metrics.getToonCalls(limit))
})

// ── CIE ─────────────────────────────────────────────────────────────────────

router.get('/cie/stats', (_req: Request, res: Response) => {
  const stats = metrics.getCieStats()
  const historical = getHistoricalCieTicks(24)
  res.json({ ...stats, history24h: historical.slice(0, 100) })
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

router.get('/cost', (_req: Request, res: Response) => {
  res.json(metrics.getCostSummary())
})

// ── Config (yvon.config.json) ───────────────────────────────────────────────

router.get('/config', (_req: Request, res: Response) => {
  const configPath = join(process.cwd(), 'yvon.config.json')
  if (existsSync(configPath)) {
    res.json(JSON.parse(readFileSync(configPath, 'utf-8')))
  } else {
    res.json({ dashboard: { showInSettings: true, autoStartOnDev: true, port: 4200, theme: 'dark' } })
  }
})

router.patch('/config', (req: Request, res: Response) => {
  const { key, value } = req.body
  const configPath = join(process.cwd(), 'yvon.config.json')
  let config: any = { dashboard: { showInSettings: true, autoStartOnDev: true, port: 4200, theme: 'dark' } }
  if (existsSync(configPath)) {
    config = JSON.parse(readFileSync(configPath, 'utf-8'))
  }
  const keys = key.split('.')
  let obj = config
  for (let i = 0; i < keys.length - 1; i++) {
    if (!obj[keys[i]]) obj[keys[i]] = {}
    obj = obj[keys[i]]
  }
  obj[keys[keys.length - 1]] = value
  writeFileSync(configPath, JSON.stringify(config, null, 2))
  res.json({ ok: true })
})

// ── Graph ───────────────────────────────────────────────────────────────────

router.get('/graph', (_req: Request, res: Response) => {
  const graphPath = join(process.cwd(), 'graphify-out', 'CODEGRAPH_REPORT.md')
  const nodes: { id: string; label: string }[] = []
  const edges: { source: string; target: string; weight: number }[] = []
  const nodeSet = new Set<string>()

  if (existsSync(graphPath)) {
    try {
      const content = readFileSync(graphPath, 'utf-8')
      // Parse markdown table rows for imports
      const lines = content.split('\n')
      for (const line of lines) {
        const match = line.match(/^\|\s*`([^`]+)`\s*\|/)
        if (match) {
          const source = match[1]
          if (!nodeSet.has(source)) { nodeSet.add(source); nodes.push({ id: source, label: source.split('/').pop() || source }) }
          // Look for linked files in the same row
          const deps = [...line.matchAll(/`([^`]+)`/g)].slice(1)
          for (const d of deps) {
            const dep = d[1]
            if (!nodeSet.has(dep)) { nodeSet.add(dep); nodes.push({ id: dep, label: dep.split('/').pop() || dep }) }
            edges.push({ source, target: dep, weight: 1 })
          }
        }
      }
    } catch {}
  }

  res.json({ nodes, edges })
})

export default router
