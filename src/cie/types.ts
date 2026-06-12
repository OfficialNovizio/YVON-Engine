// lib/cie/types.ts — Core types for Context Intelligence Engine
//
// CIE is the meta-memory layer that selects, ranks, and injects
// context from multiple knowledge sources before every agent LLM call.

export type TaskType =
  | 'backend_bug'
  | 'strategy'
  | 'frontend_ui'
  | 'data_query'
  | 'marketing'
  | 'ops_risk'
  | 'general'

export type KnowledgeSource =
  | 'graphify'
  | 'codegraph'
  | 'agent_memory'
  | 'hermes_memory'
  | 'project_docs'
  | 'venture_context'
  | 'session_state'

export interface TaskProfile {
  type: TaskType
  agentId: string
  venture: string
  confidence: number         // 0-1 classification confidence
  keywords: string[]
}

export interface ContextItem {
  content: string
  priority: number           // 1-10 (1 = architecture lock, 10 = noise)
  source: KnowledgeSource
  relevance: number          // 0-1 TF-IDF relevance score
  chars: number
  id: string                 // unique for dedup
}

export interface CieContext {
  systemExtension: string    // Prose rules for system prompt
  dataBlock: string          // TOON-formatted structural data
  sourcesUsed: KnowledgeSource[]
  totalChars: number
  itemsInjected: number
  itemsFiltered: number
  timeMs: number
}

export interface CieWeights {
  agentId: string
  taskType: TaskType
  sourceWeights: Record<KnowledgeSource, number>
  contextCap: number
  lastUpdated: string
}

export interface CieOutcome {
  agentId: string
  taskType: TaskType
  sourcesUsed: KnowledgeSource[]
  totalContextChars: number
  tokenSavingsPct: number
  success: boolean
  qualityScore?: number
  errorType?: string
  algorithmHits: Record<string, number>
  createdAt: string
}

export interface SourceMap {
  primary: KnowledgeSource[]
  secondary: KnowledgeSource[]
  exclude: KnowledgeSource[]
}

export interface GraphifyCommunity {
  name: string
  cohesion: number
  nodes: string[]
}

export interface CodegraphHub {
  file: string
  importers: number
  risk: 'critical' | 'high' | 'medium' | 'low'
}

export interface AgentMemoryRules {
  neverAgain: string[]
  architectureLocks: string[]
  rejectedPatterns: string[]
  personality: string
}

export interface CieConfig {
  enabled: boolean
  contextCap: number          // max chars for system extension
  dataBlockCap: number        // max chars for TOON data block
  sources: KnowledgeSource[]
  weightsEnabled: boolean
  algorithmTimeoutMs: number
}
