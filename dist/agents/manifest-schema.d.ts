export interface AgentManifest {
    agent: {
        id: string;
        name: string;
        title: string;
        department: string;
        level: 1 | 2 | 3;
        hermes_profile: string;
        hermes_skill?: string;
    };
    purpose: string[];
    skills: string[];
    tools: string[];
    dependencies: string[];
    council_role?: {
        seat: string;
        vote_weight: number;
        debate_persona: string;
    };
}
export interface ManifestValidation {
    valid: boolean;
    agent_id: string;
    errors: string[];
    warnings: string[];
}
export declare function validateManifest(manifest: any): ManifestValidation;
//# sourceMappingURL=manifest-schema.d.ts.map