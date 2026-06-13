import { AgentManifest, ManifestValidation } from './manifest-schema';
export { AgentManifest } from './manifest-schema';
export interface RegistryState {
    agents: AgentManifest[];
    validations: ManifestValidation[];
    total: number;
    valid: number;
    errors: number;
}
export declare function loadRegistry(projectRoot: string): RegistryState;
export declare function getAgent(registry: RegistryState, id: string): AgentManifest | undefined;
export declare function getAgentsByDept(registry: RegistryState, dept: string): AgentManifest[];
export declare function getAgentsByLevel(registry: RegistryState, level: number): AgentManifest[];
export declare function getCouncilMembers(registry: RegistryState): AgentManifest[];
export declare function autoGenerateManifest(agentDir: string): AgentManifest;
//# sourceMappingURL=registry.d.ts.map