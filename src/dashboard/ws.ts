// src/dashboard/ws.ts
// WebSocket server for live dashboard updates.

import { Server as WebSocketServer, WebSocket } from 'ws'
import type { Server } from 'http'
import { metrics } from '../metrics/collector'
import { runHealthChecks } from '../metrics/health-checks'

let wss: WebSocketServer | null = null
let interval: NodeJS.Timeout | null = null

export function attachWebSocket(server: Server): void {
  wss = new WebSocketServer({ server, path: '/api/live' })

  wss.on('connection', (ws: WebSocket) => {
    sendStats(ws)
    ws.on('error', () => {})
  })

  interval = setInterval(() => {
    if (!wss) return
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) sendStats(client)
    })
  }, 5000)
}

function sendStats(ws: WebSocket): void {
  runHealthChecks()
  const payload = JSON.stringify({
    type: 'stats',
    timestamp: Date.now(),
    toon: metrics.getLiveToonStats(),
    cie: metrics.getLiveCieStats(),
    cost: metrics.getLiveCostSummary(),
    modules: metrics.getModuleStatuses(),
    agents: metrics.getAllAgentActivities(),
  })
  ws.send(payload)
}

export function stopWebSocket(): void {
  if (interval) clearInterval(interval)
  if (wss) wss.close()
}
