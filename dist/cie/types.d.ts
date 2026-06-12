export type TaskType = 'backend_bug' | 'strategy' | 'frontend_ui' | 'data_query' | 'marketing' | 'ops_risk' | 'general';
export type KnowledgeSource = 'graphify' | 'codegraph' | 'agent_memory' | 'hermes_memory' | 'project_docs' | 'venture_context' | 'session_state';
export interface TaskProfile {
    type: TaskType;
    agentId: string;
    venture: string;
    confidence: number;
    keywords: string[];
}
export interface ContextItem {
    content: string;
    priority: number;
    source: KnowledgeSource;
    relevance: number;
    chars: number;
    id: string;
}
export interface CieContext {
    systemExtension: string;
    dataBlock: string;
    sourcesUsed: KnowledgeSource[];
    totalChars: number;
    itemsInjected: number;
    itemsFiltered: number;
    timeMs: number;
}
export interface CieWeights {
    agentId: string;
    taskType: TaskType;
    sourceWeights: Record<KnowledgeSource, number>;
    contextCap: number;
    lastUpdated: string;
}
export interface CieOutcome {
    agentId: string;
    taskType: TaskType;
    sourcesUsed: KnowledgeSource[];
    totalContextChars: number;
    tokenSavingsPct: number;
    success: boolean;
    qualityScore?: number;
    errorType?: string;
    algorithmHits: Record<string, number>;
    createdAt: string;
}
export interface SourceMap {
    primary: KnowledgeSource[];
    secondary: KnowledgeSource[];
    exclude: KnowledgeSource[];
}
export interface GraphifyCommunity {
    name: string;
    cohesion: number;
    nodes: string[];
}
export interface CodegraphHub {
    file: string;
    importers: number;
    risk: 'critical' | 'high' | 'medium' | 'low';
}
export interface AgentMemoryRules {
    neverAgain: string[];
    architectureLocks: string[];
    rejectedPatterns: string[];
    personality: string;
}
export interface CieConfig {
    enabled: boolean;
    contextCap: number;
    dataBlockCap: number;
    sources: KnowledgeSource[];
    weightsEnabled: boolean;
    algorithmTimeoutMs: number;
}
//# sourceMappingURL=types.d.ts.map