export interface HermesSyncContext {
    /** Raw content of USER.md (user identity, preferences, bio) */
    userProfile: string;
    /** Raw content of MEMORY.md (persistent agent memory) */
    agentMemory: string;
    /** Whether the sync was successful */
    success: boolean;
    /** Paths read */
    filesRead: string[];
    /** Any errors encountered */
    errors: string[];
    /** Combined token-efficient context string for injection */
    contextString: string;
}
export interface HermesPushResult {
    success: boolean;
    memoriesWritten: number;
    bytesWritten: number;
    errors: string[];
}
/**
 * Synchronize context from Hermes memory files.
 *
 * Reads USER.md (user identity/preferences) and MEMORY.md (persistent
 * agent memory) from ~/.hermes/memories/. Returns a structured context
 * object suitable for injecting into agent system prompts.
 *
 * The `contextString` field is pre-formatted for LLM injection with
 * minimal token overhead.
 */
export declare function syncWithHermes(): HermesSyncContext;
/**
 * Push memories back to the Hermes memory system.
 *
 * Each string in `memories` is appended to MEMORY.md as a dated entry.
 * Creates the ~/.hermes/memories/ directory if it doesn't exist.
 *
 * Returns a result with count of memories written and total bytes.
 */
export declare function pushToHermes(memories: string[]): HermesPushResult;
/**
 * Clear all Hermes memory (resets MEMORY.md).
 * USE WITH CAUTION — this is irreversible.
 */
export declare function clearHermesMemory(): {
    success: boolean;
    error: string | null;
};
//# sourceMappingURL=hermes-sync.d.ts.map