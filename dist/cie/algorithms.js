"use strict";
// lib/cie/algorithms.ts — Verified DSA implementations for CIE
//
// Bloom Filter:     O(1) context deduplication
// MinHash:          O(n) near-duplicate detection  
// TF-IDF:           Relevance scoring for context retrieval
// BFS Blast Radius:  Dependency impact analysis
// Priority Queue:   Top-K capped context selection
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextPriorityQueue = exports.TfidfIndex = exports.BloomFilter = void 0;
exports.minhashSignature = minhashSignature;
exports.jaccardEstimate = jaccardEstimate;
exports.blastRadius = blastRadius;
exports.extractKeywords = extractKeywords;
exports.extractFilePaths = extractFilePaths;
// ─── Bloom Filter ────────────────────────────────────────────────────────────
class BloomFilter {
    constructor(size = 1024, hashCount = 3) {
        this.size = size;
        this.hashCount = hashCount;
        this.bits = new Array(size).fill(false);
    }
    hash(item, seed) {
        let h = seed;
        for (let i = 0; i < item.length; i++) {
            h = ((h << 5) - h + item.charCodeAt(i)) | 0;
        }
        return Math.abs(h) % this.size;
    }
    add(item) {
        for (let i = 0; i < this.hashCount; i++) {
            this.bits[this.hash(item, i)] = true;
        }
    }
    contains(item) {
        for (let i = 0; i < this.hashCount; i++) {
            if (!this.bits[this.hash(item, i)])
                return false;
        }
        return true;
    }
}
exports.BloomFilter = BloomFilter;
// ─── MinHash ─────────────────────────────────────────────────────────────────
function minhashSignature(text, numHashes = 64) {
    const words = new Set(text.toLowerCase().split(/\s+/));
    const sig = new Array(numHashes).fill(Infinity);
    for (const word of words) {
        for (let i = 0; i < numHashes; i++) {
            let h = i;
            for (let j = 0; j < word.length; j++) {
                h = ((h << 5) - h + word.charCodeAt(j)) | 0;
            }
            h = Math.abs(h) % (2 ** 31);
            sig[i] = Math.min(sig[i], h);
        }
    }
    return sig;
}
function jaccardEstimate(sig1, sig2) {
    let matches = 0;
    for (let i = 0; i < sig1.length; i++) {
        if (sig1[i] === sig2[i])
            matches++;
    }
    return matches / sig1.length;
}
class TfidfIndex {
    constructor() {
        this.documents = new Map();
        this.df = new Map();
        this.N = 0;
    }
    add(docId, content) {
        const words = content.toLowerCase().split(/\s+/);
        this.documents.set(docId, {
            id: docId,
            content,
            wordCount: words.length,
        });
        this.N++;
        const seen = new Set();
        for (const w of words) {
            if (!seen.has(w)) {
                this.df.set(w, (this.df.get(w) ?? 0) + 1);
                seen.add(w);
            }
        }
    }
    idf(word) {
        const df = this.df.get(word) ?? 0;
        return Math.log((this.N + 1) / (df + 1)) + 1;
    }
    tf(word, doc) {
        if (doc.wordCount === 0)
            return 0;
        const count = doc.content.toLowerCase().split(/\s+/).filter(w => w === word).length;
        return count / doc.wordCount;
    }
    search(query, topK = 5) {
        const queryWords = new Set(query.toLowerCase().split(/\s+/));
        const scores = [];
        for (const [docId, doc] of this.documents) {
            let score = 0;
            for (const w of queryWords) {
                score += this.tf(w, doc) * this.idf(w);
            }
            if (score > 0) {
                scores.push({ docId, score });
            }
        }
        scores.sort((a, b) => b.score - a.score);
        return scores.slice(0, topK);
    }
}
exports.TfidfIndex = TfidfIndex;
// ─── Weighted BFS Blast Radius ───────────────────────────────────────────────
function blastRadius(graph, startNode, maxDepth = 3) {
    const visited = new Map();
    const queue = [[startNode, 0]];
    visited.set(startNode, 0);
    while (queue.length > 0) {
        const [current, depth] = queue.shift();
        if (depth >= maxDepth)
            continue;
        for (const neighbor of (graph[current] ?? [])) {
            if (!visited.has(neighbor)) {
                visited.set(neighbor, depth + 1);
                queue.push([neighbor, depth + 1]);
            }
        }
    }
    return visited;
}
class ContextPriorityQueue {
    constructor(charBudget = 2500) {
        this.heap = [];
        this.budget = charBudget;
        this.bloom = new BloomFilter();
    }
    offer(content, priority, source) {
        const key = `${source}:${content.slice(0, 50)}`;
        if (this.bloom.contains(key))
            return false;
        const chars = content.length;
        this.heap.push({ content, priority, source, chars, key });
        this.heap.sort((a, b) => b.priority - a.priority); // max-heap by priority
        return true;
    }
    select() {
        const selected = [];
        let charsUsed = 0;
        const remaining = [];
        for (const item of this.heap) {
            if (charsUsed + item.chars > this.budget) {
                remaining.push(item);
                continue;
            }
            selected.push({ content: item.content, priority: item.priority, source: item.source });
            charsUsed += item.chars;
            this.bloom.add(item.key);
        }
        this.heap = remaining;
        return selected;
    }
    get remaining() {
        return this.heap.length;
    }
}
exports.ContextPriorityQueue = ContextPriorityQueue;
// ─── Utility: Keyword extraction ─────────────────────────────────────────────
function extractKeywords(text, maxKeywords = 10) {
    const stopWords = new Set([
        'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
        'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
        'should', 'may', 'might', 'can', 'shall', 'to', 'of', 'in', 'for',
        'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
        'before', 'after', 'above', 'below', 'between', 'and', 'but', 'or',
        'nor', 'not', 'so', 'yet', 'both', 'either', 'neither', 'each', 'every',
        'all', 'any', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
        'only', 'own', 'same', 'than', 'too', 'very', 'just', 'because',
        'about', 'now', 'then', 'here', 'there', 'when', 'where', 'why', 'how',
        'this', 'that', 'these', 'those', 'it', 'its', 'i', 'we', 'you', 'they',
        'he', 'she', 'his', 'her', 'their', 'our', 'my', 'your', 'me', 'him',
    ]);
    const words = text.toLowerCase().replace(/[^a-z0-9_./\s-]/g, '').split(/\s+/);
    const freq = {};
    for (const w of words) {
        if (w.length < 2 || stopWords.has(w))
            continue;
        freq[w] = (freq[w] ?? 0) + 1;
    }
    return Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, maxKeywords)
        .map(([word]) => word);
}
// ─── Utility: file path extraction from text ─────────────────────────────────
function extractFilePaths(text) {
    const pattern = /(?:lib|app|components|hooks|scripts|docs)\/[\w./-]+\.(?:ts|tsx|js|jsx|md|sql|css)/g;
    const matches = text.match(pattern) ?? [];
    return [...new Set(matches)];
}
//# sourceMappingURL=algorithms.js.map