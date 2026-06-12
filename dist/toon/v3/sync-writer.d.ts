export type WriteTarget = 'originals' | 'toon' | 'both';
export interface WriteResult {
    written: {
        original: string | null;
        toon: string | null;
    };
    reindexed: boolean;
    error?: string;
}
export declare function writeFile(relativePath: string, content: string, target?: WriteTarget, projectRoot?: string): WriteResult;
export declare function deleteFile(relativePath: string, projectRoot?: string): WriteResult;
export declare function writeMany(files: {
    path: string;
    content: string;
}[], target?: WriteTarget, projectRoot?: string): WriteResult[];
//# sourceMappingURL=sync-writer.d.ts.map