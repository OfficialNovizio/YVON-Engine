export interface BPETable {
    merges: [string, string, string][];
    vocab: Map<string, string> | Record<string, string>;
    reverse: Map<string, string> | Record<string, string>;
}
export declare function trainBPE(text: string, numMerges?: number): BPETable;
export declare function encode(text: string, bpe: BPETable): string;
export declare function decode(encoded: string, bpe: BPETable): string;
//# sourceMappingURL=bpe.d.ts.map