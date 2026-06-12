export interface GraphNode {
    name: string;
    type: string;
    deps: string[];
    community: number;
}
export interface GraphReport {
    nodes: GraphNode[];
    edges: [number, number][];
    communities: {
        name: string;
        cohesion: number;
        nodes: string[];
    }[];
}
export interface HubFile {
    file: string;
    importers: number;
    risk: 'critical' | 'high' | 'medium' | 'low';
}
export interface CodegraphReport {
    hubFiles: HubFile[];
    fanOutFiles: string[];
    apiDeps: Record<string, string[]>;
}
export interface GraphStats {
    nodes: number;
    edges: number;
    communities: number;
    hubs: number;
}
export declare function buildAllGraphs(rootDir: string): {
    graphify: string;
    codegraph: string;
};
export declare function getGraphStats(rootDir: string): GraphStats;
//# sourceMappingURL=builder.d.ts.map