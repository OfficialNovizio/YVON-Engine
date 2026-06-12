import type { ContextItem, KnowledgeSource } from './types';
export declare function rankContext(items: ContextItem[], options?: {
    charBudget?: number;
    dedupSimilarity?: number;
}): {
    selected: ContextItem[];
    filtered: ContextItem[];
};
export declare function getSourcesUsed(items: ContextItem[]): KnowledgeSource[];
//# sourceMappingURL=ranker.d.ts.map