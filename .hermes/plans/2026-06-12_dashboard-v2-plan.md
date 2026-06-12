# YVON Engine Dashboard v2 — Detailed Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Replace the basic inlined-HTML dashboard with a full-featured monitoring panel showing real-time TOON metrics, cost tracking, module connection status, and rich visualization — all backed by live engine data.

**Architecture:** Three-tier — (1) data collection hooks in existing engine modules (TOON, CIE, adapters), (2) Express API server with SQLite persistence, (3) React frontend with Recharts/D3. Dashboard runs standalone on port 4200, reads from engine internals and local YVON config.

**Tech Stack:** Express.js, SQLite (better-sqlite3), React 19, Recharts, D3.js (force graph), Tailwind CSS, WebSocket (socket.io for live updates)

---

## Current State Audit

| What exists | What's missing |
|---|---|
| Static HTML dashboard (732 lines, inline) | No live data — everything hardcoded |
| D3 force graph with sample data | No real codebase graph integration |
| 13 agent cards from `personalities.ts` | No agent status (online/idle/last activity) |
| Token gauge (static 84%) | No actual TOON metrics tracking |
| CIE pipeline stats (static numbers) | No historical trends |
| `startDashboard()` starts http server | No API endpoints, no data layer |

---

## Phase 1: Data Collection Layer (Metrics Engine)

**Objective:** Every engine module tracks its own metrics. Zero overhead when dashboard is off.

### Task 1.1: Create metrics collector module

**Files:**
- Create: `src/metrics/collector.ts`
- Create: `src/metrics/types.ts`

**Code:**

```typescript
// src/metrics/types.ts
export interface ToonCall {
  timestamp: number
  model: string
  format: 'dense' | 'claude' | 'api' | 'js'
  inputTokens: number
  outputTokens: number
  bytesBefore: number
  bytesAfter: number
  costSaved: number
  agentId?: string
}

export interface CiePipelineTick {
  timestamp: number
  taskType: string
  taskLength: number
  classified: number
  retrieved: number
  injected: number
  filtered: number
  latencyMs: number
  skipped: boolean
}

export interface ModuleStatus {
  name: string
  connected: boolean
  lastCheck: number
  details: string
  latencyMs?: number
}

export interface AgentActivity {
  agentId: string
  name: string
  status: 'online' | 'idle' | 'offline'
  lastActivity: number
  totalCalls: number
  tokensUsed: number
  memorySizeBytes: number
}

// Collector singleton — zero overhead when dashboard is off
class MetricsCollector {
  private enabled = false
  private toonCalls: ToonCall[] = []
  private cieTicks: CiePipelineTick[] = []
  private moduleStatuses: Map<string, ModuleStatus> = new Map()
  private agentActivities: Map<string, AgentActivity> = new Map()

  enable() { this.enabled = true }
  disable() { this.enabled = false; this.clear() }

  recordToonCall(call: ToonCall) {
    if (!this.enabled) return
    this.toonCalls.push(call)
    if (this.toonCalls.length > 10000) this.toonCalls.shift()
  }

  recordCieTick(tick: CiePipelineTick) {
    if (!this.enabled) return
    this.cieTicks.push(tick)
    if (this.cieTicks.length > 10000) this.cieTicks.shift()
  }

  setModuleStatus(status: ModuleStatus) {
    this.moduleStatuses.set(status.name, status)
  }

  setAgentActivity(activity: AgentActivity) {
    this.agentActivities.set(activity.agentId, activity)
  }

  getToonStats(): { total: number; totalInputTokens: number; totalOutputTokens: number; totalBytesSaved: number; totalCostSaved: number; avgSavingsPercent: number; byModel: Record<string, { calls: number; costSaved: number }> } {
    const calls = this.toonCalls
    if (calls.length === 0) return { total: 0, totalInputTokens: 0, totalOutputTokens: 0, totalBytesSaved: 0, totalCostSaved: 0, avgSavingsPercent: 0, byModel: {} }
    const byModel: Record<string, { calls: number; costSaved: number }> = {}
    let totalInput = 0, totalOutput = 0, totalBytes = 0, totalCost = 0
    for (const c of calls) {
      totalInput += c.inputTokens
      totalOutput += c.outputTokens
      totalBytes += (c.bytesBefore - c.bytesAfter)
      totalCost += c.costSaved
      if (!byModel[c.model]) byModel[c.model] = { calls: 0, costSaved: 0 }
      byModel[c.model].calls++
      byModel[c.model].costSaved += c.costSaved
    }
    const avgSavings = calls.length > 0
      ? calls.reduce((s, c) => s + ((c.bytesBefore - c.bytesAfter) / Math.max(1, c.bytesBefore)), 0) / calls.length * 100
      : 0
    return {
      total: calls.length,
      totalInputTokens: totalInput,
      totalOutputTokens: totalOutput,
      totalBytesSaved: totalBytes,
      totalCostSaved: totalCost,
      avgSavingsPercent: Math.round(avgSavings * 10) / 10,
      byModel,
    }
  }

  getCieStats(): { totalTicks: number; totalRetrieved: number; totalInjected: number; totalFiltered: number; avgLatencyMs: number } {
    const ticks = this.cieTicks
    if (ticks.length === 0) return { totalTicks: 0, totalRetrieved: 0, totalInjected: 0, totalFiltered: 0, avgLatencyMs: 0 }
    return {
      totalTicks: ticks.length,
      totalRetrieved: ticks.reduce((s, t) => s + t.retrieved, 0),
      totalInjected: ticks.reduce((s, t) => s + t.injected, 0),
      totalFiltered: ticks.reduce((s, t) => s + t.filtered, 0),
      avgLatencyMs: Math.round(ticks.reduce((s, t) => s + t.latencyMs, 0) / ticks.length),
    }
  }

  getModuleStatuses(): ModuleStatus[] { return [...this.moduleStatuses.values()] }

  getAllAgentActivities(): AgentActivity[] { return [...this.agentActivities.values()] }

  getToonCalls(limit = 100): ToonCall[] { return this.toonCalls.slice(-limit) }
  getCieTicks(limit = 100): CiePipelineTick[] { return this.cieTicks.slice(-limit) }

  clear() {
    this.toonCalls = []
    this.cieTicks = []
    this.moduleStatuses.clear()
    this.agentActivities.clear()
  }
}

export const metrics = new MetricsCollector()
```

### Task 1.2: Hook TOON calls to record metrics

**Files:**
- Modify: `src/toon/toon.ts` — wrap exports to record `ToonCall` on each compression

```typescript
// At bottom of toon.ts, after existing exports
import { metrics } from '../metrics/collector'

const _originalToon = { ...toon }
export const toon = {
  dense: (data: any[], schema?: string) => {
    const raw = JSON.stringify(data)
    const t0 = Date.now()
    const result = _originalToon.dense(data, schema)
    metrics.recordToonCall({
      timestamp: Date.now(),
      model: 'default',
      format: 'dense',
      inputTokens: Math.ceil(raw.length / 4),
      outputTokens: Math.ceil(result.length / 4),
      bytesBefore: raw.length,
      bytesAfter: result.length,
      costSaved: (raw.length - result.length) * 0.0000001, // rough estimate
    })
    return result
  },
  // Repeat for claude(), api(), js()
  claude: (data: any[], schema?: string) => { /* same pattern */ },
  api: (data: any[], schema?: string) => { /* same pattern */ },
  js: (data: any[], schema?: string) => { /* same pattern */ },
}
```

### Task 1.3: Hook CIE pipeline to record ticks

**Files:**
- Modify: `src/cie/index.ts` — record `CiePipelineTick` in `buildCieContext()`

### Task 1.4: Wire module connection status checks

**Files:**
- Create: `src/metrics/health-checks.ts`

```typescript
// src/metrics/health-checks.ts
import { metrics } from './collector'
import { getConfig } from '../adapters/config'
import { existsSync } from 'fs'
import { join } from 'path'

export async function runHealthChecks(): Promise<void> {
  const config = getConfig()

  // Claude — check API key
  metrics.setModuleStatus({
    name: 'Claude (Anthropic)',
    connected: !!process.env.ANTHROPIC_API_KEY || !!config.claudeApiKey,
    lastCheck: Date.now(),
    details: process.env.ANTHROPIC_API_KEY ? 'API key configured' : 'No API key found',
  })

  // Hermes — check memories dir
  const hermesDir = config.hermesMemoryDir
  metrics.setModuleStatus({
    name: 'Hermes Sync',
    connected: existsSync(join(hermesDir, 'USER.md')),
    lastCheck: Date.now(),
    details: existsSync(join(hermesDir, 'USER.md')) ? 'Memory files found' : 'Hermes not initialized',
  })

  // Graphify — check output dir
  metrics.setModuleStatus({
    name: 'Graphify',
    connected: existsSync(config.graphifyDir || join(process.cwd(), 'graphify-out', 'GRAPH_REPORT.md')),
    lastCheck: Date.now(),
    details: 'Graph report found',
  })

  // CodeGraph
  metrics.setModuleStatus({
    name: 'CodeGraph',
    connected: existsSync(config.codegraphDir || join(process.cwd(), 'graphify-out', 'CODEGRAPH_REPORT.md')),
    lastCheck: Date.now(),
    details: 'Codegraph report found',
  })

  // Code-Review-Graph (MCP)
  try {
    const { execSync } = require('child_process')
    const result = execSync('which code-review-graph 2>/dev/null || echo ""', { encoding: 'utf-8', timeout: 5000 })
    metrics.setModuleStatus({
      name: 'Code-Review-Graph (MCP)',
      connected: !!result.trim(),
      lastCheck: Date.now(),
      details: result.trim() ? `Installed at ${result.trim()}` : 'Not installed (built-in fallback active)',
    })
  } catch {
    metrics.setModuleStatus({
      name: 'Code-Review-Graph (MCP)',
      connected: false,
      lastCheck: Date.now(),
      details: 'Not installed (built-in fallback active)',
    })
  }

  // Supabase — check env vars
  metrics.setModuleStatus({
    name: 'Supabase',
    connected: !!(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL),
    lastCheck: Date.now(),
    details: process.env.SUPABASE_URL ? 'Connected' : 'Not configured',
  })

  // MCP Client
  metrics.setModuleStatus({
    name: 'MCP Client',
    connected: true,
    lastCheck: Date.now(),
    details: 'Available (local adapter)',
  })
}
```

---

## Phase 2: Dashboard API Server

**Objective:** Replace raw http server with Express, add REST + WebSocket endpoints.

### Task 2.1: Set up Express server with API routes

**Files:**
- Modify: `src/dashboard/index.ts` — replace http with Express
- Create: `src/dashboard/api.ts` — REST API routes
- Create: `src/dashboard/ws.ts` — WebSocket for live updates

**API Endpoints:**

```
GET  /api/health           → { status: 'ok', uptime, version }
GET  /api/toon/stats       → ToonStats
GET  /api/toon/history     → ToonCall[] (last 100)
GET  /api/cie/stats        → CieStats
GET  /api/cie/history      → CiePipelineTick[] (last 100)
GET  /api/modules          → ModuleStatus[]
GET  /api/agents           → AgentActivity[]
GET  /api/cost             → { byModel, totalSaved, totalSpent }
GET  /api/graph            → GraphData (nodes + edges)
WS   /api/live             → real-time push of all stats
```

### Task 2.2: Add SQLite persistence for historical data

**Files:**
- Create: `src/metrics/store.ts`

```typescript
// SQLite schema:
// toon_calls (id, timestamp, model, format, input_tokens, output_tokens, bytes_before, bytes_after, cost_saved, agent_id)
// cie_ticks (id, timestamp, task_type, task_length, classified, retrieved, injected, filtered, latency_ms, skipped)
// agent_sessions (id, agent_id, timestamp, tokens_used, model)
```

---

## Phase 3: Dashboard Frontend (React)

**Objective:** Full React SPA with 5 panels, real charts, live data.

### Task 3.1: Set up Vite + React + Tailwind for dashboard

**Files:**
- Create: `src/dashboard/ui/` — React app
- Create: `src/dashboard/ui/index.html`
- Create: `src/dashboard/ui/main.tsx`
- Create: `src/dashboard/ui/App.tsx`

### Task 3.2: Build Connection Grid panel

Shows all module connections as cards with:
- Green/orange/red status dot (connected, degraded, offline)
- Module name, last check time, details
- Click to re-check

Grid: 3 columns × 3 rows = 9 modules (Claude, Hermes, Graphify, CodeGraph, CR-Graph, Supabase, MCP, TOON, CIE)

### Task 3.3: Build TOON Metrics panel

- Large animated gauge showing overall compression %
- Time-series chart (Recharts AreaChart) showing token savings over last 24h
- Per-model breakdown table: model name, calls, tokens saved, cost saved
- "TOON calls today" counter with sparkline

### Task 3.4: Build Cost Tracking panel

- Pie chart: cost by model (DeepSeek, Claude, etc.)
- Bar chart: cumulative cost savings from TOON
- Total saved: $X.XX (USD)
- Model selector to filter cost data

### Task 3.5: Build CIE Pipeline panel

- Sankey diagram or flow chart: Classified → Retrieved → Ranked → Injected → Filtered
- Numbers in each node
- Latency gauge (avg ms per pipeline run)
- Skip rate (% of tasks where CIE was skipped — short tasks)

### Task 3.6: Build Agent Activity panel

- 13 agent cards in a 4-column grid
- Each card: avatar/name, status dot (green=active <5min, orange=idle <1h, gray=offline)
- Last activity timestamp, total calls, tokens used
- Click to expand: recent sessions, memory stats

### Task 3.7: Build Knowledge Graph panel (enhanced)

- D3 force-directed graph using real codegraph data
- Node size = hub importance (import count)
- Edge thickness = dependency strength
- Zoom, pan, click to highlight
- Search bar to find specific files/modules

### Task 3.8: Add WebSocket live updates

- Server pushes stats every 5 seconds
- Frontend updates all panels without refresh
- Live pulse indicator in top bar

### Task 3.9: Add dark/glass theme + polish

- Glass-morphism cards with backdrop blur
- Gradient accent colors per panel
- Smooth transitions between data updates
- Responsive for 1920×1080 and 2560×1440

---

## Phase 4: Integration with YVON 2.0

**Objective:** Make the dashboard read from the actual YVON 2.0 project when running inside it.

### Task 4.1: Auto-discover YVON project

- When `yvon dashboard` runs inside a YVON 2.0 project, detect `app/api/claude/route.ts` and `lib/cie/`
- Read actual agent configs from `agent-department/`
- Pull venture data from Supabase (if configured)

### Task 4.2: Add `yvon dashboard --json` for programmatic access

```bash
yvon dashboard --json  # output stats as JSON, no server
yvon dashboard --port 4200  # custom port
```

---

## File Map

```
src/
  metrics/
    types.ts              ← Task 1.1
    collector.ts          ← Task 1.1 (MetricsCollector singleton)
    health-checks.ts      ← Task 1.4 (module connection checks)
    store.ts              ← Task 2.2 (SQLite persistence)
  dashboard/
    index.ts              ← Task 2.1 (Express server, replaces http)
    api.ts                ← Task 2.1 (REST routes)
    ws.ts                 ← Task 2.1 (WebSocket)
    ui/
      index.html          ← Task 3.1
      main.tsx            ← Task 3.1
      App.tsx             ← Task 3.1 (layout with 5 panels)
      panels/
        ConnectionGrid.tsx    ← Task 3.2
        ToonMetrics.tsx       ← Task 3.3
        CostTracking.tsx      ← Task 3.4
        CiePipeline.tsx       ← Task 3.5
        AgentActivity.tsx     ← Task 3.6
        KnowledgeGraph.tsx    ← Task 3.7
      components/
        StatusDot.tsx
        SavingsGauge.tsx
        ModelBadge.tsx
  toon/
    toon.ts               ← Task 1.2 (add metrics hooks)
  cie/
    index.ts              ← Task 1.3 (add metrics hooks)
```

---

## Verification

After each phase:
- `tsc --noEmit` — 0 errors
- `npm run build` — engine builds clean
- `npx yvon dashboard` — starts on port 4200
- Browser: all panels render with live data
- `curl http://localhost:4200/api/health` → `{"status":"ok"}`
- `curl http://localhost:4200/api/toon/stats` → real numbers, not zeros

---

## Risks & Notes

- **TOON hook overhead:** Wrap in `metrics.enabled` check. When dashboard is off, metrics tracking has zero cost (one boolean check per call).
- **SQLite dependency:** `better-sqlite3` needs native compilation. If it fails, fall back to JSON file storage.
- **React build size:** Dashboard React app is separate from engine core. Built via Vite into `dist/dashboard/ui/`. Served as static files by Express.
- **Memory:** In-memory collector caps at 10,000 entries per array. Older data flushes to SQLite.
- **No WebSocket in YVON 2.0 production:** Dashboard is development-only. WebSocket only runs on port 4200, never in the Next.js production build.
