// src/metrics/types.ts
// Type definitions for the metrics collection layer.
// v2.0 — Always-on + provider-aware + engine query tracking.

export interface ProviderInfo {
  provider: string       // 'deepseek' | 'anthropic' | 'openai' | 'openrouter'
  model: string          // 'deepseek-chat' | 'claude-opus' | 'gpt-4o' | etc.
  endpoint?: string      // base URL
}

export interface ToonCall {
  timestamp: number
  provider: string
  model: string
  format: 'dense' | 'claude' | 'api' | 'js'
  inputTokens: number
  outputTokens: number
  bytesBefore: number
  bytesAfter: number
  costSaved: number
  agentId?: string
  ventureId?: string
  taskType?: string       // classified task type: 'code-review' | 'strategy' | etc.
}

export interface EngineQuery {
  timestamp: number
  provider: string
  model: string
  agentId?: string
  ventureId?: string
  taskType?: string
  queryHash: string       // SHA256 first 8 chars of user message
  originalChars: number
  injectedChars: number
  savingsPercent: number
  chunksMatched: number
  chunksInjected: number
  injectionLevel: 'L1' | 'L2' | 'REF' | 'FULL'
  latencyMs: number
  docCount: number
  memoryCount: number
}

export interface CompileRecord {
  timestamp: number
  durationMs: number
  filesScanned: number
  chunksBuilt: number
  termsIndexed: number
  bpeTokens: number
  corpusSizeBytes: number
  binSizeBytes: number
  error?: string
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
  agentId?: string
  provider?: string
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
  department: string
  status: 'online' | 'idle' | 'offline'
  lastActivity: number
  totalCalls: number
  tokensUsed: number
  memorySizeBytes: number
}

// ─── Aggregated stats (read from SQLite) ─────────────────────────────────

export interface ToonStats {
  total: number
  totalInputTokens: number
  totalOutputTokens: number
  totalBytesSaved: number
  totalCostSaved: number
  avgSavingsPercent: number
  byModel: Record<string, { calls: number; costSaved: number }>
}

export interface EngineStats {
  totalQueries: number
  avgSavingsPercent: number
  totalOriginalChars: number
  totalInjectedChars: number
  avgLatencyMs: number
  avgChunksMatched: number
  byAgent: Record<string, { queries: number; avgSavings: number }>
  byTaskType: Record<string, { queries: number; avgSavings: number }>
  savingsTrend: { day: string; avgSavings: number }[]
}

export interface AgentEfficiency {
  agentId: string
  name: string
  department: string
  queries: number
  totalTokens: number
  avgSavings: number
  avgLatencyMs: number
  costEstimate: number
  taskTypes: Record<string, number>
  efficiencyGrade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F'
}

export interface ProviderCost {
  provider: string
  model: string
  calls: number
  inputTokens: number
  outputTokens: number
  cost: number
  avgSavings: number
}

export interface WeeklyEfficiency {
  day: string           // ISO date
  queries: number
  activeAgents: number
  totalTokens: number
  cost: number
  avgSavings: number
  peakHour: number
}

export interface ContentTypeEfficiency {
  type: string          // 'docs' | 'memory' | 'graphs' | 'schemas' | 'code' | 'config' | 'scripts'
  rawBytes: number
  toonBytes: number
  savingsPercent: number
  chunks: number
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F'
}

export interface CieStats {
  totalTicks: number
  totalRetrieved: number
  totalInjected: number
  totalFiltered: number
  avgLatencyMs: number
  skipRate: number
}

export interface CostSummary {
  byModel: Record<string, { calls: number; inputTokens: number; outputTokens: number; cost: number }>
  totalSpent: number
  totalSaved: number
  netCost: number
}

export interface HealthScore {
  score: number           // 0-100
  penalties: { reason: string; points: number }[]
  components: {
    toonIndex: { ok: boolean; stalenessDays: number }
    sync: { ok: boolean; driftCount: number }
    modules: { ok: boolean; downCount: number }
    cost: { ok: boolean; burnRate: number; projectedMonthly: number }
    agents: { ok: boolean; inactiveCount: number }
  }
}

export interface FailureRecord {
  timestamp: number
  module: string           // 'engine' | 'stratify' | 'middleware' | 'cie' | 'compile'
  operation: string        // 'process' | 'stratify' | 'inject' | 'classify'
  error: string            // error message
  stack?: string           // stack trace (truncated)
  context?: string         // JSON of relevant context (sessionId, query hash, etc.)
}
