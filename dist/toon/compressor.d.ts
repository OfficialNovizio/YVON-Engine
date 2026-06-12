export interface Dictionary {
    ventures: Record<string, number>;
    agents: Record<string, number>;
    statuses: Record<string, number>;
    actions: Record<string, number>;
}
export interface Template {
    id: string;
    pattern: string;
    vars: string[];
    category: string;
}
export interface CompressedBlock {
    dict: string;
    templates: string;
    data: string;
}
export declare function buildDictionary(data: {
    ventures: string[];
    agents: string[];
    statuses: string[];
    actions: string[];
}): Dictionary;
export declare function dictToLine(dict: Dictionary): string;
export declare function templatesToLine(templates: Template[]): string;
export declare function matchTemplate(text: string): {
    template: Template;
    values: Record<string, string>;
} | null;
export interface DecisionRecord {
    id: string;
    venture: string;
    agent: string;
    text: string;
    urgency: string;
    action: string | null;
}
export declare function compressDecision(d: DecisionRecord, dict: Dictionary): string;
export declare function compress(data: {
    ventures: {
        slug: string;
        name: string;
    }[];
    decisions: DecisionRecord[];
}, options?: {
    includeTemplates?: boolean;
}): CompressedBlock;
export declare function buildSystemBlock(compressed: CompressedBlock): string;
//# sourceMappingURL=compressor.d.ts.map