export type ReadMode = 'llm' | 'human' | 'auto';
export interface ResolveResult {
    content: string;
    source: 'toon' | 'archive' | 'original' | 'not-found';
    path: string;
    compressedSize: number;
    originalSize: number;
}
export declare function resolve(relativePath: string, mode?: ReadMode, projectRoot?: string): ResolveResult;
export declare function resolveMany(paths: string[], mode?: ReadMode, projectRoot?: string): ResolveResult[];
export declare function clearResolveCache(): void;
export declare function resolverStats(): {
    cacheSize: number;
    savings: {
        totalOriginal: number;
        totalCompressed: number;
        percent: number;
    };
};
//# sourceMappingURL=resolver.d.ts.map