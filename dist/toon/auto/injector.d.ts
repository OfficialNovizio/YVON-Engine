import type { ProjectScan } from './scanner';
export interface InjectionResult {
    injected: string[];
    created: string[];
    skipped: string[];
    errors: string[];
    summary: {
        schemasGenerated: number;
        injectionPointsHit: number;
        documentsTooned: number;
        memoriesTooned: number;
        estimatedSavings: number;
        v3Compiled: boolean;
    };
}
export declare function injectToon(scan: ProjectScan): InjectionResult;
//# sourceMappingURL=injector.d.ts.map