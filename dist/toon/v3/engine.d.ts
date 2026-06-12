import { BPETable } from './bpe';
export interface Chunk {
    id: number;
    docId: string;
    level: number;
    heading: string;
    body: string;
    keywords: string[];
    bigrams: string[];
    hash: string;
}
export interface EngineData {
    chunks: Chunk[];
    invertedIndex: Record<string, number[]>;
    bigramIndex: Record<string, number[]>;
    bpeTable: BPETable;
    docTree: Record<string, string>;
    trainedAt: string;
    corpusSize: number;
    chunkCount: number;
}
export interface MatchResult {
    chunk: Chunk;
    score: number;
    level: 'L1' | 'L2' | 'REF';
    text: string;
}
export interface EngineContext {
    compressedUserMessage: string;
    docContext: string;
    memoryContext: string;
    dictionary: string;
    stats: {
        originalPromptLen: number;
        compressedPromptLen: number;
        docsInjected: number;
        memoryEntries: number;
        totalContextLen: number;
    };
}
export interface SessionDelta {
    sessionId: string;
    prevHashes: Set<string>;
    prevQueryWords: Set<string>;
}
export declare function createEngine(binPath: string): {
    load: () => EngineData;
    compressPrompt: (text: string) => string;
    matchContext: (query: string, agentId?: string | null, maxDocs?: number) => MatchResult[];
    buildSystemPrompt: (basePrompt: string, docMatches: MatchResult[], agentId?: string | null) => string;
    process: (options: {
        systemPrompt: string;
        userMessage: string;
        agentId?: string | null;
        ventureId?: string | null;
        sessionId?: string;
    }) => EngineContext;
    saveDelta: (sessionId: string, matches: MatchResult[], query: string) => void;
    loadDelta: (sessionId: string) => SessionDelta | null;
    detectTopicShift: (prevWords: Set<string>, currentQuery: string) => boolean;
    computeDelta: (prevMatches: MatchResult[], currMatches: MatchResult[]) => {
        added: MatchResult[];
        removed: MatchResult[];
        same: MatchResult[];
    };
    hashChunk: (body: string) => string;
    getData: () => EngineData | null;
};
export type V3Engine = ReturnType<typeof createEngine>;
//# sourceMappingURL=engine.d.ts.map