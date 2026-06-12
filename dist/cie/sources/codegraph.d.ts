export interface CodegraphHub {
    file: string;
    importers: number;
    risk: 'critical' | 'high' | 'medium' | 'low';
}
export interface CodegraphReport {
    hubFiles: CodegraphHub[];
    fanOutFiles: string[];
    apiDeps: Record<string, string[]>;
}
export declare function getCodegraphReport(): CodegraphReport;
export declare function queryCodegraph(filePaths: string[]): string;
export declare function queryBlastRadius(file: string): string[];
export declare function invalidateCodegraphCache(): void;
//# sourceMappingURL=codegraph.d.ts.map