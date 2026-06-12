export interface GraphifyCommunity {
    name: string;
    cohesion: number;
    nodes: string[];
}
export declare function getGraphifyReport(): {
    communities: GraphifyCommunity[];
};
export declare function queryGraphify(keywords: string[]): string;
export declare function invalidateGraphifyCache(): void;
//# sourceMappingURL=graphify.d.ts.map