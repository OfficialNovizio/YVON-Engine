export { scanProject } from './scanner';
export { injectToon } from './injector';
export { autoToonMiddleware } from './middleware';
export { encodeDocument, encodeMemory, encodePrompt, generateDictionaryString, ABBREV_MAP } from './encoder';
export { decodeToonResponse, parseDictionaryBlock, expandWithDictionary } from './decoder';
export { compressHermesMemory, computeHermesSessionDelta, compressHermesSkill, toonifyHermes, } from './hermes-bridge';
export type { ProjectScan, InjectionPoint, ProjectDictionary, DiscoveredSchema } from './scanner';
export type { InjectionResult } from './injector';
export type { ToonContext, ToonMiddlewareOptions } from './middleware';
export type { ToonEncodeResult } from './encoder';
export type { DecodedResult } from './decoder';
export type { CompressedHermesMemory, SessionDeltaState, CompressedSkill, HermesToonResult, } from './hermes-bridge';
import { scanProject } from './scanner';
import { injectToon } from './injector';
import { toonifyHermes } from './hermes-bridge';
export interface ToonifyResult {
    scan: ReturnType<typeof scanProject>;
    injection: ReturnType<typeof injectToon>;
    hermes?: ReturnType<typeof toonifyHermes>;
    summary: string;
}
/**
 * TOON-ify an entire project in one call.
 * Detects project type, scans all data shapes, injects TOON everywhere,
 * compresses documents and memories, and bridges Hermes if present.
 */
export declare function toonifyAll(projectRoot: string): ToonifyResult;
//# sourceMappingURL=index.d.ts.map