"use strict";
// lib/cie/ranker.ts — Rank, deduplicate, and cap context items
//
// Uses Bloom Filter for dedup, MinHash for near-duplicate detection,
// and Priority Queue for top-K selection within character budget.
Object.defineProperty(exports, "__esModule", { value: true });
exports.rankContext = rankContext;
exports.getSourcesUsed = getSourcesUsed;
const algorithms_1 = require("./algorithms");
// ─── Ranking + dedup ─────────────────────────────────────────────────────────
function rankContext(items, options = {}) {
    const charBudget = options.charBudget ?? 2500;
    const dedupSimilarity = options.dedupSimilarity ?? 0.85;
    if (items.length === 0)
        return { selected: [], filtered: [] };
    // Step 1: Bloom Filter — exact dedup
    const bloom = new algorithms_1.BloomFilter(1024, 3);
    const uniqueItems = [];
    for (const item of items) {
        const key = `${item.source}:${item.content.slice(0, 80)}`;
        if (!bloom.contains(key)) {
            bloom.add(key);
            uniqueItems.push(item);
        }
    }
    // Step 2: MinHash — near-duplicate detection
    const signatures = uniqueItems.map(item => ({
        item,
        sig: (0, algorithms_1.minhashSignature)(item.content, 64),
    }));
    const dedupedItems = [];
    const filteredItems = [];
    for (const { item, sig } of signatures) {
        let isDuplicate = false;
        for (const existing of dedupedItems) {
            const existingSig = (0, algorithms_1.minhashSignature)(existing.content, 64);
            if ((0, algorithms_1.jaccardEstimate)(sig, existingSig) > dedupSimilarity) {
                // Keep the one with higher priority
                if (item.priority > existing.priority) {
                    // Replace existing with higher-priority item
                    const idx = dedupedItems.indexOf(existing);
                    if (idx >= 0) {
                        filteredItems.push(dedupedItems[idx]);
                        dedupedItems[idx] = item;
                    }
                }
                else {
                    filteredItems.push(item);
                }
                isDuplicate = true;
                break;
            }
        }
        if (!isDuplicate) {
            dedupedItems.push(item);
        }
    }
    // Step 3: Priority Queue — select top items within budget
    const pq = new algorithms_1.ContextPriorityQueue(charBudget);
    for (const item of dedupedItems) {
        pq.offer(item.content, item.priority, item.source);
    }
    const selected = pq.select();
    const selectedMap = new Map(selected.map(s => [s.content, s]));
    // Map back to full ContextItem objects
    const finalSelected = dedupedItems.filter(i => selectedMap.has(i.content));
    const finalFiltered = [
        ...filteredItems,
        ...dedupedItems.filter(i => !selectedMap.has(i.content)),
    ];
    return { selected: finalSelected, filtered: finalFiltered };
}
// ─── Get sources used ─────────────────────────────────────────────────────────
function getSourcesUsed(items) {
    return [...new Set(items.map(i => i.source))];
}
//# sourceMappingURL=ranker.js.map