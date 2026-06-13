import type { ToonCall, EngineQuery, CompileRecord } from './types';
export declare function writeToonToSupabase(call: ToonCall): Promise<void>;
export declare function writeEngineQueryToSupabase(query: EngineQuery): Promise<void>;
export declare function writeCompileToSupabase(record: CompileRecord): Promise<void>;
export declare function getSupabaseToonStats(since: string): Promise<any>;
export declare function getSupabaseEngineStats(since: string): Promise<any>;
export declare function getSupabaseAgentEfficiency(since: string): Promise<any>;
export declare function getSupabaseWeeklyEfficiency(): Promise<any>;
export declare function getSupabaseProviderCosts(since: string): Promise<any>;
export declare function getSupabaseRecentQueries(limit?: number): Promise<any>;
export declare function getSupabaseCompileHistory(limit?: number): Promise<any>;
export declare function refreshSupabaseViews(): Promise<void>;
export interface TokenUsagePayload {
    agent_id: string;
    route: string;
    model: string;
    provider: string;
    input_tokens: number;
    output_tokens: number;
    cost_usd: number;
    session_id?: string;
}
export declare function writeTokenUsage(payload: TokenUsagePayload): Promise<void>;
export declare function getYvonTokenUsage(since: string, agentId?: string, provider?: string, model?: string): Promise<any[]>;
//# sourceMappingURL=supabase-writer.d.ts.map