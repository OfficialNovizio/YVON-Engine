export interface DeltaState {
    sessionId: string;
    lastSentAt: string;
    lastHash: string;
    items: Map<string, string>;
    fullSyncEvery: number;
    callCount: number;
}
export interface DeltaChange {
    type: '+' | '~' | '-';
    id: string;
    data?: string;
    oldHash?: string;
    newHash?: string;
}
export interface DeltaResult {
    isFullSync: boolean;
    changes: DeltaChange[];
    state: DeltaState;
    summary: string;
}
export declare function getOrCreateState(sessionId: string, fullSyncEvery?: number): DeltaState;
export declare function computeDelta(currentItems: Map<string, string>, // id → compressed line
sessionId: string, options?: {
    forceFullSync?: boolean;
}): DeltaResult;
export declare function formatDeltaForLLM(result: DeltaResult): string;
export declare function resetDelta(sessionId: string): void;
export declare function resetAllDeltas(): void;
//# sourceMappingURL=delta.d.ts.map