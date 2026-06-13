"use strict";
// src/toon/index.ts — TOON public API re-exports
Object.defineProperty(exports, "__esModule", { value: true });
exports.expand = exports.storeForExpand = exports.injectDelta = exports.stratify = exports.formatTopN = exports.formatStatHeader = exports.summarize = exports.docStats = exports.getHumanPath = exports.getToonPath = exports.readDocForHuman = exports.readDocsForLLM = exports.readDoc = exports.writeMany = exports.deleteFile = exports.writeFile = exports.resolverStats = exports.clearResolveCache = exports.resolveMany = exports.resolve = exports.bpeDecode = exports.bpeEncode = exports.trainBPE = exports.stem = exports.createEngine = exports.compile = exports.strip = exports.resetAllDeltas = exports.resetDelta = exports.formatDeltaForLLM = exports.computeDelta = exports.getOrCreateState = exports.buildSystemBlock = exports.matchTemplate = exports.compressDecision = exports.dictToLine = exports.buildDictionary = exports.compress = exports.SCHEMAS = exports.toon = void 0;
// ─── Core TOON ───────────────────────────────────────────────────────────────
var toon_1 = require("./toon");
Object.defineProperty(exports, "toon", { enumerable: true, get: function () { return toon_1.toon; } });
Object.defineProperty(exports, "SCHEMAS", { enumerable: true, get: function () { return toon_1.SCHEMAS; } });
// ─── v1 Compressor ───────────────────────────────────────────────────────────
var compressor_1 = require("./compressor");
Object.defineProperty(exports, "compress", { enumerable: true, get: function () { return compressor_1.compress; } });
Object.defineProperty(exports, "buildDictionary", { enumerable: true, get: function () { return compressor_1.buildDictionary; } });
Object.defineProperty(exports, "dictToLine", { enumerable: true, get: function () { return compressor_1.dictToLine; } });
Object.defineProperty(exports, "compressDecision", { enumerable: true, get: function () { return compressor_1.compressDecision; } });
Object.defineProperty(exports, "matchTemplate", { enumerable: true, get: function () { return compressor_1.matchTemplate; } });
Object.defineProperty(exports, "buildSystemBlock", { enumerable: true, get: function () { return compressor_1.buildSystemBlock; } });
// ─── v1 Delta ────────────────────────────────────────────────────────────────
var delta_1 = require("./delta");
Object.defineProperty(exports, "getOrCreateState", { enumerable: true, get: function () { return delta_1.getOrCreateState; } });
Object.defineProperty(exports, "computeDelta", { enumerable: true, get: function () { return delta_1.computeDelta; } });
Object.defineProperty(exports, "formatDeltaForLLM", { enumerable: true, get: function () { return delta_1.formatDeltaForLLM; } });
Object.defineProperty(exports, "resetDelta", { enumerable: true, get: function () { return delta_1.resetDelta; } });
Object.defineProperty(exports, "resetAllDeltas", { enumerable: true, get: function () { return delta_1.resetAllDeltas; } });
// ─── v2 Structure Stripper ───────────────────────────────────────────────────
var stripper_1 = require("./v2/stripper");
Object.defineProperty(exports, "strip", { enumerable: true, get: function () { return stripper_1.strip; } });
// ─── v3 Query-Aware Progressive Engine ───────────────────────────────────────
var compile_1 = require("./v3/compile");
Object.defineProperty(exports, "compile", { enumerable: true, get: function () { return compile_1.compile; } });
var engine_1 = require("./v3/engine");
Object.defineProperty(exports, "createEngine", { enumerable: true, get: function () { return engine_1.createEngine; } });
var stemmer_1 = require("./v3/stemmer");
Object.defineProperty(exports, "stem", { enumerable: true, get: function () { return stemmer_1.stem; } });
var bpe_1 = require("./v3/bpe");
Object.defineProperty(exports, "trainBPE", { enumerable: true, get: function () { return bpe_1.trainBPE; } });
Object.defineProperty(exports, "bpeEncode", { enumerable: true, get: function () { return bpe_1.encode; } });
Object.defineProperty(exports, "bpeDecode", { enumerable: true, get: function () { return bpe_1.decode; } });
// ─── v3 Resolver + Sync ─────────────────────────────────────────────────────
var resolver_1 = require("./v3/resolver");
Object.defineProperty(exports, "resolve", { enumerable: true, get: function () { return resolver_1.resolve; } });
Object.defineProperty(exports, "resolveMany", { enumerable: true, get: function () { return resolver_1.resolveMany; } });
Object.defineProperty(exports, "clearResolveCache", { enumerable: true, get: function () { return resolver_1.clearResolveCache; } });
Object.defineProperty(exports, "resolverStats", { enumerable: true, get: function () { return resolver_1.resolverStats; } });
var sync_writer_1 = require("./v3/sync-writer");
Object.defineProperty(exports, "writeFile", { enumerable: true, get: function () { return sync_writer_1.writeFile; } });
Object.defineProperty(exports, "deleteFile", { enumerable: true, get: function () { return sync_writer_1.deleteFile; } });
Object.defineProperty(exports, "writeMany", { enumerable: true, get: function () { return sync_writer_1.writeMany; } });
var dual_docs_1 = require("./v3/dual-docs");
Object.defineProperty(exports, "readDoc", { enumerable: true, get: function () { return dual_docs_1.readDoc; } });
Object.defineProperty(exports, "readDocsForLLM", { enumerable: true, get: function () { return dual_docs_1.readDocsForLLM; } });
Object.defineProperty(exports, "readDocForHuman", { enumerable: true, get: function () { return dual_docs_1.readDocForHuman; } });
Object.defineProperty(exports, "getToonPath", { enumerable: true, get: function () { return dual_docs_1.getToonPath; } });
Object.defineProperty(exports, "getHumanPath", { enumerable: true, get: function () { return dual_docs_1.getHumanPath; } });
Object.defineProperty(exports, "docStats", { enumerable: true, get: function () { return dual_docs_1.docStats; } });
// ─── v4 Stratified Context Engine ─────────────────────────────────────────
var stratify_1 = require("./v4/stratify");
Object.defineProperty(exports, "summarize", { enumerable: true, get: function () { return stratify_1.summarize; } });
Object.defineProperty(exports, "formatStatHeader", { enumerable: true, get: function () { return stratify_1.formatStatHeader; } });
Object.defineProperty(exports, "formatTopN", { enumerable: true, get: function () { return stratify_1.formatTopN; } });
Object.defineProperty(exports, "stratify", { enumerable: true, get: function () { return stratify_1.stratify; } });
Object.defineProperty(exports, "injectDelta", { enumerable: true, get: function () { return stratify_1.injectDelta; } });
Object.defineProperty(exports, "storeForExpand", { enumerable: true, get: function () { return stratify_1.storeForExpand; } });
Object.defineProperty(exports, "expand", { enumerable: true, get: function () { return stratify_1.expand; } });
//# sourceMappingURL=index.js.map