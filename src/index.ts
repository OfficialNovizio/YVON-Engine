// YVON Engine — AI Agent OS Kernel
// 
// One npm install. Full agent team.
// 
// @yvon/engine provides:
//   - CIE: Context Intelligence Engine (classify → retrieve → rank → inject)
//   - TOON: Token-Optimized Object Notation (84.5% token savings)
//   - Agents: 13 AI agent personalities
//   - Algorithms: Bloom, MinHash, TF-IDF, BFS, PriorityQueue
//   - Adapters: Config resolver, provider interface, DB interface
//
// Usage:
//   import { createEngine, buildCieContext } from '@yvon/engine'
//   const cie = buildCieContext({ agentId: 'dev-lead', task: 'fix build error', venture: 'myproject' })

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
