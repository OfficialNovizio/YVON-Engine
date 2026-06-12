export interface TrainedCodebook {
    version: 2;
    trained: string;
    corpusWords: number;
    uniqueWords: number;
    codes: number;
    encodeMap: Record<string, string>;
    decodeMap: Record<string, string>;
}
export declare function trainCodebook(projectRoot: string, maxCodes?: number): TrainedCodebook;
export declare function saveCodebook(codebook: TrainedCodebook, path: string): void;
export declare function loadCodebook(path: string): TrainedCodebook | null;
export declare function encodeText(text: string, codebook: TrainedCodebook): string;
export declare function decodeText(text: string, codebook: TrainedCodebook): string;
//# sourceMappingURL=codec.d.ts.map