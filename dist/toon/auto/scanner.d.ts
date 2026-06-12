export interface DiscoveredSchema {
    type: string;
    source: string;
    fields: {
        name: string;
        abbr: string;
        type: string;
    }[];
    sampleCount: number;
    occurrences: number;
}
export interface ProjectDictionary {
    ventures: Record<string, number>;
    agents: Record<string, number>;
    statuses: Record<string, number>;
    actions: Record<string, number>;
    commonTerms: Record<string, string>;
}
export interface InjectionPoint {
    type: 'claude-route' | 'api-route' | 'document-store' | 'memory-store' | 'config';
    path: string;
    action: 'wrap' | 'replace' | 'add-middleware' | 'create-schema';
    details: string;
}
export interface ProjectScan {
    projectRoot: string;
    projectType: 'nextjs-app' | 'nextjs-pages' | 'vite' | 'express' | 'unknown';
    schemas: DiscoveredSchema[];
    dictionary: ProjectDictionary;
    injectionPoints: InjectionPoint[];
    documentPaths: string[];
    memoryPaths: string[];
    totalDataShapes: number;
    estimatedTokenSavings: number;
}
export declare function scanProject(projectRoot: string): ProjectScan;
//# sourceMappingURL=scanner.d.ts.map