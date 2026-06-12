import type { TaskProfile, CieContext, TaskType } from './types';
export interface CieParams {
    agentId: string;
    task: string;
    venture?: string;
    charBudget?: number;
}
/**
 * Build CIE context for an agent call. Adaptive — scales with task complexity.
 */
export declare function buildCieContext(params: CieParams): CieContext;
export type { TaskProfile, CieContext, TaskType };
export { classifyTask } from './classifier';
export { retrieveContext } from './retriever';
export { rankContext, getSourcesUsed } from './ranker';
export { buildInjection } from './builder';
//# sourceMappingURL=index.d.ts.map