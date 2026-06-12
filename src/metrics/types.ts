// src/metrics/types.ts
// Type definitions for the metrics collection layer.

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
  department: string
  status: 'online' | 'idle' | 'offline'
  lastActivity: number
  totalCalls: number
  tokensUsed: number
  memorySizeBytes: number
}

export interface ToonStats {
  total: number
  totalInputTokens: number
  totalOutputTokens: number
  totalBytesSaved: number
  totalCostSaved: number
  avgSavingsPercent: number
  byModel: Record<string, { calls: number; costSaved: number }>
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
