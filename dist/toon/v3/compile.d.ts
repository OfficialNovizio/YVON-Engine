export interface CompileOptions {
    projectRoot: string;
    outPath?: string;
    maxMergeIterations?: number;
}
export interface CompileResult {
    path: string;
    docCount: number;
    chunkCount: number;
    corpusSize: number;
    bpeTokens: number;
    indexSize: number;
}
export declare function compile(options: CompileOptions): CompileResult;
//# sourceMappingURL=compile.d.ts.map