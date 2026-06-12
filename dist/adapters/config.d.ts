export interface EngineConfig {
    projectRoot: string;
    graphifyReport: string;
    codegraphReport: string;
    agentMemoryDir: string;
    hermesMemoryDir: string;
    projectClaudePath: string;
    ventureDocsDir: string;
    cieEnabled: boolean;
    contextCap: number;
    adaptiveInjection: boolean;
    toonEnabled: boolean;
    toonBidirectional: boolean;
}
export declare function getConfig(): EngineConfig;
export declare function invalidateConfig(): void;
//# sourceMappingURL=config.d.ts.map