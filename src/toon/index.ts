// src/toon/index.ts — TOON public API re-exports
export { toon, SCHEMAS } from './toon'
export type { ToonSchema, ToonField } from './toon'
export { compress, buildDictionary, dictToLine, compressDecision, matchTemplate, buildSystemBlock } from './compressor'
export type { Dictionary, Template, CompressedBlock, DecisionRecord } from './compressor'
export { getOrCreateState, computeDelta, formatDeltaForLLM, resetDelta, resetAllDeltas } from './delta'
export type { DeltaState, DeltaChange, DeltaResult } from './delta'
