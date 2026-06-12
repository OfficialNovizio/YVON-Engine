// src/dashboard/index.ts
// Dashboard v2 — Express server with REST API, WebSocket, and React SPA.
// Replaces the old inlined HTML dashboard (v1).

import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { join } from 'path'
import { existsSync } from 'fs'
import { metrics } from '../metrics/collector'
import { runHealthChecks } from '../metrics/health-checks'
import { initAgentActivities } from '../metrics/agent-tracker'
import apiRoutes, { providerSimulatorRoutes } from './api'
import { attachWebSocket, stopWebSocket } from './ws'

const DEFAULT_PORT = 4200

export function startDashboard(port: number = DEFAULT_PORT): void {
  metrics.enable()
  initAgentActivities()
  runHealthChecks()

  const app = express()
  app.use(cors())
  app.use(express.json())

  // API routes
  app.use('/api', apiRoutes)
  app.use('/api/simulator', providerSimulatorRoutes())

  // Serve React SPA if built, otherwise fallback to basic HTML
  // In dev (ts-node): __dirname = src/dashboard, ui at ui/dist
  // In prod (compiled): __dirname = dist/dashboard, ui at ../../src/dashboard/ui/dist
  const uiDistCandidates = [
    join(__dirname, 'ui', 'dist'),
    join(__dirname, '..', '..', 'src', 'dashboard', 'ui', 'dist'),
  ]
  let uiDist = ''
  for (const cand of uiDistCandidates) {
    if (existsSync(join(cand, 'index.html'))) { uiDist = cand; break }
  }
  if (existsSync(join(uiDist, 'index.html'))) {
    // Serve static files from React build
    app.use(express.static(uiDist))
    // SPA fallback: non-API, non-file requests → index.html
    app.use((_req: any, _res: any, next: any) => {
      if (_req.url && _req.url.startsWith('/api')) return next()
      if (_req.url && _req.url.includes('.')) return next()
      _res.sendFile(join(uiDist, 'index.html'))
    })
  } else {
    app.get('/', (_req, res) => {
      res.send(`<!DOCTYPE html><html><head><title>YVON Dashboard v2</title><meta charset="UTF-8"><style>body{background:#0a0e17;color:#e4e8f0;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}div{text-align:center}h1{font-size:2rem;margin-bottom:.5rem}p{color:#5a6478}a{color:#00d4ff}</style></head><body><div><h1>⚡ YVON Dashboard v2</h1><p>API running on port ${port}</p><p>React UI not built yet — run <code>npm run build:dashboard</code></p><p><a href="/api/health">API Health →</a> · <a href="/api/modules">Modules →</a> · <a href="/api/toon/stats">TOON →</a></p></div></body></html>`)
    })
  }

  const server = createServer(app)
  attachWebSocket(server)

  server.listen(port, () => {
    console.log(`\n  ⚡ YVON Dashboard v2 — http://localhost:${port}`)
    console.log(`  📊 API: http://localhost:${port}/api/health`)
    console.log(`  🔌 Live: ws://localhost:${port}/api/live\n`)
  })
}

export function stopDashboard(): void {
  stopWebSocket()
  metrics.disable()
}
