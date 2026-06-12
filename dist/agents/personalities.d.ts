export interface AgentPersonality {
    /** Short ID used in API routes (e.g. "marcus", "diana") */
    shortId: string;
    /** Full AgentId used in types (e.g. "marcus-ceo") */
    agentId: string;
    /** Human-readable name */
    name: string;
    /** The personality baseline system prompt extension */
    personality: string;
    /** Default model for this agent */
    model: string;
}
export declare const AGENT_PERSONALITIES: AgentPersonality[];
/** Lookup a personality by short ID ("marcus") or full AgentId ("marcus-ceo"). */
export declare function getAgentPersonality(id: string): AgentPersonality | undefined;
/**
 * Given an agent identifier (short or full), return the personality extension
 * string to append to the system prompt. Returns empty string if not found.
 */
export declare function getPersonalityExtension(id: string): string;
//# sourceMappingURL=personalities.d.ts.map