import type { TaskType } from '../types';
export interface AgentMemoryRules {
    neverAgain: string[];
    architectureLocks: string[];
    rejectedPatterns: string[];
    personality: string;
}
export declare function getAgentMemoryRules(agentId: string): AgentMemoryRules;
export declare function getCrossAgentRules(taskType: TaskType, currentAgentId: string): string[];
export declare function getAllAgentMemoryStatus(): {
    agentId: string;
    rulesCount: number;
}[];
//# sourceMappingURL=agent-memory.d.ts.map