"use strict";
// ToonGine — Core Smoke Tests
// Validates: module resolution, createEngine, CIE pipeline, TOON compression, metrics
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const index_1 = require("./index");
const classifier_1 = require("./cie/classifier");
const algorithms_1 = require("./cie/algorithms");
// ─── Module Resolution ──────────────────────────────────────────────────────
(0, vitest_1.describe)('Module Resolution', () => {
    (0, vitest_1.it)('resolves toongine main entry', () => {
        (0, vitest_1.expect)(index_1.createEngine).toBeDefined();
        (0, vitest_1.expect)(index_1.buildCieContext).toBeDefined();
        (0, vitest_1.expect)(index_1.toon).toBeDefined();
        (0, vitest_1.expect)(index_1.autoToonMiddleware).toBeDefined();
    });
    (0, vitest_1.it)('toon has all format methods', () => {
        (0, vitest_1.expect)(index_1.toon.dense).toBeDefined();
        (0, vitest_1.expect)(index_1.toon.claude).toBeDefined();
        (0, vitest_1.expect)(index_1.toon.api).toBeDefined();
        (0, vitest_1.expect)(index_1.toon.js).toBeDefined();
        (0, vitest_1.expect)(index_1.toon.parse).toBeDefined();
    });
});
// ─── createEngine ───────────────────────────────────────────────────────────
(0, vitest_1.describe)('createEngine', () => {
    (0, vitest_1.it)('creates engine with version from package.json', () => {
        const engine = (0, index_1.createEngine)();
        (0, vitest_1.expect)(engine.version).toBeDefined();
        (0, vitest_1.expect)(engine.version).not.toBe('1.0.0');
        (0, vitest_1.expect)(engine.config).toBeDefined();
    });
    (0, vitest_1.it)('provides CIE context builder', () => {
        const engine = (0, index_1.createEngine)();
        (0, vitest_1.expect)(engine.cie.buildContext).toBeDefined();
        (0, vitest_1.expect)(typeof engine.cie.buildContext).toBe('function');
    });
    (0, vitest_1.it)('provides TOON compression', () => {
        const engine = (0, index_1.createEngine)();
        (0, vitest_1.expect)(engine.toon.dense).toBeDefined();
        (0, vitest_1.expect)(engine.toon.compress).toBeDefined();
    });
    (0, vitest_1.it)('provides agent personality lookup', () => {
        const engine = (0, index_1.createEngine)();
        (0, vitest_1.expect)(engine.agents.getPersonality).toBeDefined();
    });
});
// ─── TOON Formats ───────────────────────────────────────────────────────────
(0, vitest_1.describe)('TOON Formatting', () => {
    const sampleItems = [
        { id: 'd1', venture: 'novizio', agent: 'marcus', text: 'Approve post', urgency: 'today' },
        { id: 'd2', venture: 'hourbour', agent: 'diana', text: 'Review budget', urgency: 'this week' },
    ];
    (0, vitest_1.it)('toon.dense produces pipe-delimited format', () => {
        const result = index_1.toon.dense(sampleItems, 'decision');
        (0, vitest_1.expect)(result).toBeDefined();
        (0, vitest_1.expect)(result).toContain('|');
        (0, vitest_1.expect)(result.split('\n').length).toBe(2);
    });
    (0, vitest_1.it)('toon.claude produces natural language format', () => {
        const result = index_1.toon.claude(sampleItems, 'decision');
        (0, vitest_1.expect)(result).toBeDefined();
        (0, vitest_1.expect)(result).toContain('·');
        (0, vitest_1.expect)(result).toContain('venture=');
    });
    (0, vitest_1.it)('toon.api produces self-describing format', () => {
        const result = index_1.toon.api(sampleItems, 'decision');
        (0, vitest_1.expect)(result).toBeDefined();
        (0, vitest_1.expect)(result.startsWith('#')).toBe(true);
    });
    (0, vitest_1.it)('toon.js produces JSON-parseable format', () => {
        const result = index_1.toon.js(sampleItems, 'decision');
        const parsed = JSON.parse(result);
        (0, vitest_1.expect)(parsed.h).toBeDefined();
        (0, vitest_1.expect)(parsed.d).toBeDefined();
        (0, vitest_1.expect)(parsed.d.length).toBe(2);
    });
    (0, vitest_1.it)('toon.parse round-trips all formats', () => {
        const formats = ['dense', 'claude', 'api', 'js'];
        for (const fmt of formats) {
            const encoded = index_1.toon[fmt](sampleItems, 'decision');
            const decoded = index_1.toon.parse(encoded, 'decision');
            (0, vitest_1.expect)(decoded.length).toBe(2);
        }
    });
});
// ─── CIE Pipeline ───────────────────────────────────────────────────────────
(0, vitest_1.describe)('CIE Pipeline', () => {
    (0, vitest_1.it)('classifyTask returns valid task type', () => {
        // CIE classifier takes agentId, task, venture
        const result = (0, classifier_1.classifyTask)('marcus-ceo', 'fix the bug in the login page', 'novizio');
        (0, vitest_1.expect)(result).toBeDefined();
        (0, vitest_1.expect)(result.type).toBeDefined();
        const r2 = (0, classifier_1.classifyTask)('kai-analyst', 'analyze competitor pricing strategy', 'novizio');
        (0, vitest_1.expect)(r2.type).toBeDefined();
    });
    (0, vitest_1.it)('buildCieContext returns structured context', () => {
        const result = (0, index_1.buildCieContext)({
            agentId: 'marcus-ceo',
            task: 'What are the top priorities for Novizio this week?',
            venture: 'novizio',
        });
        (0, vitest_1.expect)(result).toBeDefined();
        (0, vitest_1.expect)(result.systemExtension).toBeDefined();
        (0, vitest_1.expect)(result.dataBlock).toBeDefined();
        (0, vitest_1.expect)(result.timeMs).toBeGreaterThanOrEqual(0);
        (0, vitest_1.expect)(result.itemsInjected).toBeGreaterThanOrEqual(0);
    });
});
// ─── Algorithms ─────────────────────────────────────────────────────────────
(0, vitest_1.describe)('Algorithms', () => {
    (0, vitest_1.it)('BloomFilter basic operations', () => {
        const bf = new algorithms_1.BloomFilter(1024, 3);
        bf.add('test-item');
        (0, vitest_1.expect)(bf.contains('test-item')).toBe(true);
        (0, vitest_1.expect)(bf.contains('missing-item')).toBe(false);
    });
    (0, vitest_1.it)('ContextPriorityQueue maintains order', () => {
        const pq = new algorithms_1.ContextPriorityQueue(500); // 500 char budget
        pq.offer('item-a', 10, 'source-1');
        pq.offer('item-b', 50, 'source-2');
        pq.offer('item-c', 30, 'source-3');
        const items = pq.select();
        (0, vitest_1.expect)(items.length).toBeGreaterThan(0);
        // Highest priority should be first
        (0, vitest_1.expect)(items[0].priority).toBeGreaterThanOrEqual(items[items.length - 1].priority);
    });
});
// ─── Metrics ────────────────────────────────────────────────────────────────
(0, vitest_1.describe)('Metrics Collector', () => {
    (0, vitest_1.it)('metrics is a singleton with enable/disable', () => {
        (0, vitest_1.expect)(index_1.metrics).toBeDefined();
        (0, vitest_1.expect)(typeof index_1.metrics.isEnabled).toBe('function');
        index_1.metrics.enable();
        (0, vitest_1.expect)(index_1.metrics.isEnabled()).toBe(true);
        index_1.metrics.disable();
        (0, vitest_1.expect)(index_1.metrics.isEnabled()).toBe(false);
    });
});
// ─── Edge Cases ─────────────────────────────────────────────────────────────
(0, vitest_1.describe)('Edge Cases', () => {
    (0, vitest_1.it)('handles empty items array', () => {
        const result = index_1.toon.dense([], 'decision');
        (0, vitest_1.expect)(result).toBe('');
    });
    (0, vitest_1.it)('handles null/undefined field values', () => {
        const result = index_1.toon.dense([{ id: null, venture: undefined, text: 'test' }], 'decision');
        (0, vitest_1.expect)(result).toContain('-');
    });
    (0, vitest_1.it)('handles pipe characters in values', () => {
        const items = [{ id: 'x', text: 'value|with|pipes' }];
        // TOON escapes pipe chars with backslash
        const encoded = index_1.toon.dense(items, 'decision');
        (0, vitest_1.expect)(encoded).toBeDefined();
        (0, vitest_1.expect)(encoded).toContain('\\|');
        // Round-trip via TOON-JS preserves pipes natively
        const js = index_1.toon.js(items, 'decision');
        const parsed = JSON.parse(js);
        const textIdx = parsed.h.indexOf('text');
        (0, vitest_1.expect)(textIdx).toBeGreaterThanOrEqual(0);
        (0, vitest_1.expect)(parsed.d[0][textIdx]).toBe('value|with|pipes');
    });
});
//# sourceMappingURL=toongine.test.js.map