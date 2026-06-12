import type { ToonCall, EngineQuery, CompileRecord, ToonStats, EngineStats, CostSummary, AgentEfficiency, WeeklyEfficiency, ContentTypeEfficiency, HealthScore, ProviderCost } from './types';
export declare function persistToonCall(call: ToonCall): void;
export declare function persistEngineQuery(query: EngineQuery): void;
export declare function persistCompileRecord(record: CompileRecord): void;
export declare function getToonStats(sinceHours?: number): ToonStats;
export declare function getEngineStats(sinceHours?: number): EngineStats;
export declare function getCostSummary(sinceHours?: number): CostSummary;
export declare function getAgentEfficiency(sinceHours?: number): AgentEfficiency[];
export declare function getWeeklyEfficiency(days?: number): WeeklyEfficiency[];
export declare function getContentTypeEfficiency(): ContentTypeEfficiency[];
export declare function getProviderCosts(sinceHours?: number): ProviderCost[];
export declare function getHealthScore(): HealthScore;
export declare function getRecentQueries(limit?: number): EngineQuery[];
export declare function getCompileHistory(limit?: number): CompileRecord[];
export declare function getAnomalies(sinceHours?: number): any[];
export declare function getHistoricalToonCalls(sinceHours: number): any;
export declare function getHistoricalCieTicks(sinceHours: number): any;
//# sourceMappingURL=store.d.ts.map