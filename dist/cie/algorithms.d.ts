export declare class BloomFilter {
    private size;
    private hashCount;
    private bits;
    constructor(size?: number, hashCount?: number);
    private hash;
    add(item: string): void;
    contains(item: string): boolean;
}
export declare function minhashSignature(text: string, numHashes?: number): number[];
export declare function jaccardEstimate(sig1: number[], sig2: number[]): number;
export declare class TfidfIndex {
    private documents;
    private df;
    private N;
    add(docId: string, content: string): void;
    private idf;
    private tf;
    search(query: string, topK?: number): {
        docId: string;
        score: number;
    }[];
}
export declare function blastRadius(graph: Record<string, string[]>, startNode: string, maxDepth?: number): Map<string, number>;
export declare class ContextPriorityQueue {
    private heap;
    private bloom;
    private budget;
    constructor(charBudget?: number);
    offer(content: string, priority: number, source: string): boolean;
    select(): {
        content: string;
        priority: number;
        source: string;
    }[];
    get remaining(): number;
}
export declare function extractKeywords(text: string, maxKeywords?: number): string[];
export declare function extractFilePaths(text: string): string[];
//# sourceMappingURL=algorithms.d.ts.map