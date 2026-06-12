export interface MCPClient {
    /** Whether code-review-graph is installed and the server started */
    available: boolean;
    /** Send a query to code-review-graph and return the result */
    query: (q: string) => Promise<string>;
    /** Close the MCP server process */
    close: () => void;
}
export declare function createMCPClient(): MCPClient;
//# sourceMappingURL=mcp-client.d.ts.map