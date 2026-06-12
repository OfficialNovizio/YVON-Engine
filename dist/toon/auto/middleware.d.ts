export interface ToonContext {
    compressedUserMessage: string;
    dictionary: string;
    relevantDocs: string;
    relevantMemory: string;
    outputInstruction: string;
    stats: {
        originalLength: number;
        compressedLength: number;
        savingsPercent: number;
        docsInjected: number;
        memoryEntries: number;
    };
}
export interface ToonMiddlewareOptions {
    systemPrompt: string;
    userMessage: string;
    agentId?: string | null;
    ventureId?: string | null;
    projectRoot?: string;
}
export declare function autoToonMiddleware(options: ToonMiddlewareOptions): ToonContext;
//# sourceMappingURL=middleware.d.ts.map