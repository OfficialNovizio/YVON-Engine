export interface StripResult {
    output: string;
    rawLength: number;
    strippedLength: number;
    savingsPercent: number;
    stats: {
        codeBlocks: number;
        tables: number;
        headings: number;
        lists: number;
        frontmatterRemoved: boolean;
        commentsRemoved: number;
        linksStripped: number;
        imagesStripped: number;
    };
}
export declare function strip(markdown: string): StripResult;
//# sourceMappingURL=stripper.d.ts.map