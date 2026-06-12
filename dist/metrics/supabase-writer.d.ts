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
//# sourceMappingURL=supabase-writer.d.ts.map