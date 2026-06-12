// YVON Engine — AI Agent OS Kernel
// 
// One npm install. Full agent team. Automatic TOON-ification.
// 
// yvon-engine provides:
//   - TOON Auto-Conversion: Scans project, auto-wires TOON everywhere (prompts, docs, memory, API)
//   - CIE: Context Intelligence Engine (classify → retrieve → rank → inject)
//   - TOON: Token-Optimized Object Notation (84.5% token savings)
//   - Agents: 13 AI agent personalities
//   - Algorithms: Bloom, MinHash, TF-IDF, BFS, PriorityQueue
//   - Adapters: Config resolver, provider interface, DB interface
//   - Hermes Bridge: TOON-compress Hermes memory, sessions, skills
//
// Usage:
//   import { toonifyAll } from 'yvon-engine/toon/auto'
//   const result = toonifyAll('/path/to/project')

// ─── Main engine ──────────────────────────────────────────────────────────────

export { buildCieContext, classifyTask } from './cie'
export type { CieContext, CieParams, TaskProfile, TaskType } from './cie'

// ─── TOON compression ─────────────────────────────────────────────────────────

export { toon } from './toon/toon'
export { compress, buildDictionary, dictToLine } from './toon/compressor'
export { getOrCreateState, computeDelta } from './toon/delta'

// ─── Algorithms ───────────────────────────────────────────────────────────────

export { BloomFilter, TfidfIndex, ContextPriorityQueue, blastRadius, minhashSignature, jaccardEstimate } from './cie/algorithms'

// ─── Config ───────────────────────────────────────────────────────────────────

export { getConfig, invalidateConfig } from './adapters/config'
export type { EngineConfig } from './adapters/config'

// ─── MCP ──────────────────────────────────────────────────────────────────────

export { createMCPClient } from './adapters/mcp-client'
export type { MCPClient } from './adapters/mcp-client'

// ─── Dashboard ─────────────────────────────────────────────────────────────────

export { startDashboard, stopDashboard } from './dashboard'
export { injectDashboard } from './dashboard/inject'
export type { InjectResult } from './dashboard/inject'

// ─── Metrics ───────────────────────────────────────────────────────────────────

export { metrics } from './metrics/collector'
export { runHealthChecks } from './metrics/health-checks'

// ─── TOON Auto-Conversion ──────────────────────────────────────────────────────
// One call: toonifyAll(projectRoot) — scans, injects, compresses everything.

export { scanProject, injectToon, toonifyAll } from './toon/auto'
export { autoToonMiddleware } from './toon/auto/middleware'
export { compressHermesMemory, computeHermesSessionDelta, compressHermesSkill, toonifyHermes } from './toon/auto/hermes-bridge'
export type { ToonContext, ToonMiddlewareOptions } from './toon/auto/middleware'
export type { ProjectScan, InjectionPoint } from './toon/auto/scanner'
export type { InjectionResult } from './toon/auto/injector'

// ─── Hermes ────────────────────────────────────────────────────────────────────

export { syncWithHermes, pushToHermes } from './adapters/hermes-sync'

// ─── Engine creator ───────────────────────────────────────────────────────────

export interface EngineOptions {
  projectRoot?: string
  configPath?: string
  agents?: string[]
  provider?: string
}

export function createEngine(options: EngineOptions = {}) {
  const config = require('./adapters/config').getConfig()
  
  return {
    config,
    cie: {
      buildContext: (params: { agentId: string; task: string; venture?: string }) =>
        require('./cie').buildCieContext(params),
    },
    toon: {
      dense: require('./toon/toon').toon.dense,
      compress: require('./toon/compressor').compress,
      delta: require('./toon/delta').createDeltaTracker,
    },
    agents: {
      getPersonality: (agentId: string) =>
        require('./agents/personalities').getPersonalityExtension(agentId),
    },
    version: '1.0.0',
  }
}
