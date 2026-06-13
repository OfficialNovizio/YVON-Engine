export interface PluginManifest {
    name: string;
    version: string;
    description: string;
    agents?: any[];
    tools?: string[];
    routes?: string[];
    dependencies?: Record<string, string>;
}
export interface PluginState {
    name: string;
    version: string;
    loaded: boolean;
    error?: string;
}
export declare function scanPlugins(projectRoot: string): PluginManifest[];
export declare function loadPlugins(projectRoot: string): PluginState[];
//# sourceMappingURL=loader.d.ts.map