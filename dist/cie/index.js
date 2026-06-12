"use strict";
// lib/cie/index.ts — Context Intelligence Engine orchestrator
//
// One function: buildCieContext(params) → CieContext
// Everything else is internal. Wire into any API route with one line.
//
// Flow: classify → retrieve → rank → build → inject
//
// ADAPTIVE INJECTION: Context scales with task complexity.
//  - Short tasks (<500 chars):   max 3 items, 300 char cap (avoid overhead)
//  - Medium tasks (500-2000):    standard 2500 char cap
//  - Large tasks (2000+):        full 4000 char cap (complex tasks need context)
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildInjection = exports.getSourcesUsed = exports.rankContext = exports.retrieveContext = exports.classifyTask = void 0;
exports.buildCieContext = buildCieContext;
const classifier_1 = require("./classifier");
const retriever_1 = require("./retriever");
const ranker_1 = require("./ranker");
const builder_1 = require("./builder");
const collector_1 = require("../metrics/collector");
/**
 * Build CIE context for an agent call. Adaptive — scales with task complexity.
 */
function buildCieContext(params) {
    const t0 = Date.now();
    const taskLen = params.task.length;
    // Adaptive budget based on task complexity
    let charBudget;
    let maxItems;
    if (taskLen < 500) {
        // Short tasks: minimal context (overhead would dominate)
        charBudget = 300;
        maxItems = 3;
    }
    else if (taskLen < 2000) {
        // Medium tasks: standard context
        charBudget = params.charBudget ?? 2500;
        maxItems = 10;
    }
    else {
        // Large tasks: full context (complex tasks benefit from knowledge)
        charBudget = params.charBudget ?? 4000;
        maxItems = 20;
    }
    // Step 1: Classify
    const profile = (0, classifier_1.classifyTask)(params.agentId, params.task, params.venture ?? 'yvon-dashboard');
    // Step 2: Retrieve
    const items = (0, retriever_1.retrieveContext)(profile);
    // Limit items before ranking for short tasks
    const cappedItems = items.slice(0, maxItems);
    // Step 3: Rank + dedup + cap
    const { selected, filtered } = (0, ranker_1.rankContext)(cappedItems, {
        charBudget,
        dedupSimilarity: 0.85,
    });
    // Step 4: Build injection blocks
    const timeMs = Date.now() - t0;
    const context = (0, builder_1.buildInjection)(selected, filtered, timeMs);
    // ── Record CIE metrics (zero overhead when dashboard is off) ──────────────
    if (collector_1.metrics.isEnabled()) {
        collector_1.metrics.recordCieTick({
            timestamp: Date.now(),
            taskType: profile.type,
            taskLength: taskLen,
            classified: 0, // zero-token regex classification
            retrieved: items.length,
            injected: selected.length,
            filtered: filtered.length,
            latencyMs: timeMs,
            skipped: taskLen < 500, // short tasks skip full CIE
        });
    }
    return context;
}
var classifier_2 = require("./classifier");
Object.defineProperty(exports, "classifyTask", { enumerable: true, get: function () { return classifier_2.classifyTask; } });
var retriever_2 = require("./retriever");
Object.defineProperty(exports, "retrieveContext", { enumerable: true, get: function () { return retriever_2.retrieveContext; } });
var ranker_2 = require("./ranker");
Object.defineProperty(exports, "rankContext", { enumerable: true, get: function () { return ranker_2.rankContext; } });
Object.defineProperty(exports, "getSourcesUsed", { enumerable: true, get: function () { return ranker_2.getSourcesUsed; } });
var builder_2 = require("./builder");
Object.defineProperty(exports, "buildInjection", { enumerable: true, get: function () { return builder_2.buildInjection; } });
//# sourceMappingURL=index.js.map