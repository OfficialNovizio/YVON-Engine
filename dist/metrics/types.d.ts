export interface ProviderInfo {
    provider: string;
    model: string;
    endpoint?: string;
}
export interface ToonCall {
    timestamp: number;
    provider: string;
    model: string;
    format: 'dense' | 'claude' | 'api' | 'js';
    inputTokens: number;
    outputTokens: number;
    bytesBefore: number;
    bytesAfter: number;
    costSaved: number;
    agentId?: string;
    ventureId?: string;
    taskType?: string;
}
export interface EngineQuery {
    timestamp: number;
    provider: string;
    model: string;
    agentId?: string;
    ventureId?: string;
    taskType?: string;
    queryHash: string;
    originalChars: number;
    injectedChars: number;
    savingsPercent: number;
    chunksMatched: number;
    chunksInjected: number;
    injectionLevel: 'L1' | 'L2' | 'REF' | 'FULL';
    latencyMs: number;
    docCount: number;
    memoryCount: number;
}
export interface CompileRecord {
    timestamp: number;
    durationMs: number;
    filesScanned: number;
    chunksBuilt: number;
    termsIndexed: number;
    bpeTokens: number;
    corpusSizeBytes: number;
    binSizeBytes: number;
    error?: string;
}
export interface CiePipelineTick {
    timestamp: number;
    taskType: string;
    taskLength: number;
    classified: number;
    retrieved: number;
    injected: number;
    filtered: number;
    latencyMs: number;
    skipped: boolean;
    agentId?: string;
    provider?: string;
}
export interface ModuleStatus {
    name: string;
    connected: boolean;
    lastCheck: number;
    details: string;
    latencyMs?: number;
}
export interface AgentActivity {
    agentId: string;
    name: string;
    department: string;
    status: 'online' | 'idle' | 'offline';
    lastActivity: number;
    totalCalls: number;
    tokensUsed: number;
    memorySizeBytes: number;
}
export interface ToonStats {
    total: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalBytesSaved: number;
    totalCostSaved: number;
    avgSavingsPercent: number;
    byModel: Record<string, {
        calls: number;
        costSaved: number;
    }>;
}
export interface EngineStats {
    totalQueries: number;
    avgSavingsPercent: number;
    totalOriginalChars: number;
    totalInjectedChars: number;
    avgLatencyMs: number;
    avgChunksMatched: number;
    byAgent: Record<string, {
        queries: number;
        avgSavings: number;
    }>;
    byTaskType: Record<string, {
        queries: number;
        avgSavings: number;
    }>;
    savingsTrend: {
        day: string;
        avgSavings: number;
    }[];
}
export interface AgentEfficiency {
    agentId: string;
    name: string;
    department: string;
    queries: number;
    totalTokens: number;
    avgSavings: number;
    avgLatencyMs: number;
    costEstimate: number;
    taskTypes: Record<string, number>;
    efficiencyGrade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
}
export interface ProviderCost {
    provider: string;
    model: string;
    calls: number;
    inputTokens: number;
    outputTokens: number;
    cost: number;
    avgSavings: number;
}
export interface WeeklyEfficiency {
    day: string;
    queries: number;
    activeAgents: number;
    totalTokens: number;
    cost: number;
    avgSavings: number;
    peakHour: number;
}
export interface ContentTypeEfficiency {
    type: string;
    rawBytes: number;
    toonBytes: number;
    savingsPercent: number;
    chunks: number;
    grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
}
export interface CieStats {
    totalTicks: number;
    totalRetrieved: number;
    totalInjected: number;
    totalFiltered: number;
    avgLatencyMs: number;
    skipRate: number;
}
export interface CostSummary {
    byModel: Record<string, {
        calls: number;
        inputTokens: number;
        outputTokens: number;
        cost: number;
    }>;
    totalSpent: number;
    totalSaved: number;
    netCost: number;
}
export interface HealthScore {
    score: number;
    penalties: {
        reason: string;
        points: number;
    }[];
    components: {
        toonIndex: {
            ok: boolean;
            stalenessDays: number;
        };
        sync: {
            ok: boolean;
            driftCount: number;
        };
        modules: {
            ok: boolean;
            downCount: number;
        };
        cost: {
            ok: boolean;
            burnRate: number;
            projectedMonthly: number;
        };
        agents: {
            ok: boolean;
            inactiveCount: number;
        };
    };
}
export interface FailureRecord {
    timestamp: number;
    module: string;
    operation: string;
    error: string;
    stack?: string;
    context?: string;
}
//# sourceMappingURL=types.d.ts.map