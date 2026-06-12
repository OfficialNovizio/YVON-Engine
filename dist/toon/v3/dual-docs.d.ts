import { ResolveResult, ReadMode } from './resolver';
/**
 * Read a document in the requested mode.
 * - 'human': full markdown from originals or .archive/
 * - 'llm':   compressed TOON from .toon/
 * - 'auto':  .toon/ first, fallback to originals
 */
export declare function readDoc(path: string, mode?: ReadMode, projectRoot?: string): ResolveResult;
/**
 * Read multiple docs at once (for batch injection).
 * Always returns LLM-optimized versions.
 */
export declare function readDocsForLLM(paths: string[], projectRoot?: string): {
    path: string;
    content: string;
    savings: number;
}[];
/**
 * Read a doc for human viewing.
 */
export declare function readDocForHuman(path: string, projectRoot?: string): ResolveResult;
/**
 * Get the .toon/ path for a given original path.
 */
export declare function getToonPath(originalPath: string): string;
/**
 * Get the original path for a .toon/ path.
 */
export declare function getHumanPath(toonPath: string): string;
export interface DualDocStats {
    totalDocs: number;
    totalHumanSize: number;
    totalToonSize: number;
    savingsPercent: number;
    breakdown: {
        agentMemory: {
            count: number;
            humanSize: number;
            toonSize: number;
        };
        docs: {
            count: number;
            humanSize: number;
            toonSize: number;
        };
        graphs: {
            count: number;
            humanSize: number;
            toonSize: number;
        };
        project: {
            count: number;
            humanSize: number;
            toonSize: number;
        };
    };
}
export declare function docStats(projectRoot?: string): DualDocStats;
//# sourceMappingURL=dual-docs.d.ts.map