import { ToonSchema } from '../toon';
export interface NumericStats {
    min: number;
    max: number;
    avg: number;
    median: number;
    p95: number;
    stddev: number;
    total?: number;
}
export interface StringStats {
    cardinality: number;
    topValues: string[];
    nullCount: number;
    avgLength: number;
    minLength: number;
    maxLength: number;
}
export interface StatProfile {
    rowCount: number;
    colCount: number;
    numericFields: Record<string, NumericStats>;
    stringFields: Record<string, StringStats>;
    booleanFields: Record<string, {
        trueRatio: number;
    }>;
    nullRatio: number;
    outliers: string[];
    trends: string[];
}
export interface StratifiedPayload {
    header: string;
    top: string;
    rest: string;
    refs: Record<string, string>;
    totalTokens: number;
}
export declare function summarize(rows: Record<string, any>[]): StatProfile;
export declare function formatStatHeader(profile: StatProfile): string;
export declare function formatTopN(rows: Record<string, any>[], schema: ToonSchema, topN?: number): string;
export declare function stratify(rows: Record<string, any>[], schema: ToonSchema, topN?: number): StratifiedPayload;
export declare function injectDelta(sessionId: string, payload: StratifiedPayload): StratifiedPayload & {
    isDelta: boolean;
    sameTokenCount: number;
};
export declare function storeForExpand(refs: Record<string, string>): void;
export declare function expand(refHash: string): string | null;
export declare function autoSchema(name: string, sample: Record<string, any>): ToonSchema;
//# sourceMappingURL=stratify.d.ts.map