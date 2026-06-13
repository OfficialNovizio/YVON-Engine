"use strict";
// src/toon/v4/stratify.ts — TOON v4 Stratified Context Engine
//
// Replaces flat DENSE injection with intelligent 3-layer delivery:
//   Layer 1: STAT HEADER  (~30 tokens, always)  — situational awareness
//   Layer 2: TOP-N ROWS   (~50 tokens, matched)  — concrete examples
//   Layer 3: DELTA REFS   (~10 tokens, on-demand) — rest as hash refs
//
// Total: ~90 tokens vs 15,000+ for raw JSON → 99.4% savings
// LLM gets full situational awareness + ability to expand on demand.
Object.defineProperty(exports, "__esModule", { value: true });
exports.summarize = summarize;
exports.formatStatHeader = formatStatHeader;
exports.formatTopN = formatTopN;
exports.stratify = stratify;
exports.injectDelta = injectDelta;
exports.storeForExpand = storeForExpand;
exports.expand = expand;
exports.autoSchema = autoSchema;
const toon_1 = require("../toon");
const crypto_1 = require("crypto");
// ─── Summarize: One-pass statistical profile ─────────────────────────────
function summarize(rows) {
    const n = rows.length;
    if (n === 0)
        return emptyProfile();
    const keys = Object.keys(rows[0] || {});
    const profile = {
        rowCount: n,
        colCount: keys.length,
        numericFields: {},
        stringFields: {},
        booleanFields: {},
        nullRatio: 0,
        outliers: [],
        trends: [],
    };
    // Statistics accumulators
    const numBufs = {};
    const strAcc = {};
    let nullCount = 0;
    let trueCounts = {};
    let boolCounts = {};
    for (const key of keys) {
        numBufs[key] = [];
        trueCounts[key] = 0;
        boolCounts[key] = 0;
        strAcc[key] = { values: [], lengths: [], counts: {} };
    }
    // Single pass
    for (const row of rows) {
        for (const key of keys) {
            const val = row[key];
            if (val === null || val === undefined) {
                nullCount++;
                continue;
            }
            if (typeof val === 'number' && isFinite(val)) {
                numBufs[key].push(val);
            }
            else if (typeof val === 'boolean') {
                boolCounts[key]++;
                if (val)
                    trueCounts[key]++;
            }
            else {
                const s = String(val);
                strAcc[key].values.push(s);
                strAcc[key].lengths.push(s.length);
                strAcc[key].counts[s] = (strAcc[key].counts[s] || 0) + 1;
            }
        }
    }
    profile.nullRatio = nullCount / (n * keys.length);
    // Numeric stats
    for (const key of keys) {
        const nums = numBufs[key];
        if (nums.length > 0) {
            nums.sort((a, b) => a - b);
            const sum = nums.reduce((a, b) => a + b, 0);
            const avg = sum / nums.length;
            const variance = nums.reduce((s, v) => s + (v - avg) ** 2, 0) / nums.length;
            const stddev = Math.sqrt(variance);
            profile.numericFields[key] = {
                min: nums[0],
                max: nums[nums.length - 1],
                avg: Math.round(avg * 100) / 100,
                median: nums[Math.floor(nums.length / 2)],
                p95: nums[Math.floor(nums.length * 0.95)],
                stddev: Math.round(stddev * 100) / 100,
                total: sum,
            };
            // Outlier detection: z > 2
            if (stddev > 0) {
                for (let i = 0; i < Math.min(n, 1000); i++) {
                    const z = Math.abs((nums[i] - avg) / stddev);
                    if (z > 2) {
                        profile.outliers.push(`${key}:${i} val=${nums[i]} z=${z.toFixed(1)}`);
                    }
                }
                // Also check high end
                for (let i = Math.max(0, n - 100); i < n; i++) {
                    const z = Math.abs((nums[i] - avg) / stddev);
                    if (z > 2) {
                        profile.outliers.push(`${key}:${i} val=${nums[i]} z=${z.toFixed(1)}`);
                    }
                }
            }
        }
    }
    // String stats
    for (const key of keys) {
        const acc = strAcc[key];
        if (acc.values.length > 0) {
            const sorted = Object.entries(acc.counts).sort((a, b) => b[1] - a[1]);
            profile.stringFields[key] = {
                cardinality: sorted.length,
                topValues: sorted.slice(0, 3).map(([v]) => truncate(v, 30)),
                nullCount: n - acc.values.length,
                avgLength: Math.round(acc.lengths.reduce((a, b) => a + b, 0) / acc.lengths.length),
                minLength: Math.min(...acc.lengths),
                maxLength: Math.max(...acc.lengths),
            };
        }
    }
    // Boolean stats
    for (const key of keys) {
        if (boolCounts[key] > 0) {
            profile.booleanFields[key] = {
                trueRatio: Math.round((trueCounts[key] / boolCounts[key]) * 100) / 100,
            };
        }
    }
    return profile;
}
// ─── Format Stat Profile as Compact Header ───────────────────────────────
function formatStatHeader(profile) {
    const parts = [];
    // Row/col summary
    parts.push(`[DATA:${profile.rowCount}r×${profile.colCount}c`);
    // Show null ratio if significant
    if (profile.nullRatio > 0.1) {
        parts[0] += ` null:${Math.round(profile.nullRatio * 100)}%`;
    }
    parts[0] += ']';
    // Numeric highlights (most important fields first)
    const numEntries = Object.entries(profile.numericFields);
    for (const [key, s] of numEntries.slice(0, 4)) {
        if (s.total !== undefined && s.total > 0) {
            parts.push(`${key}:∑${fmtNum(s.total)} μ${fmtNum(s.avg)} [${fmtNum(s.min)}–${fmtNum(s.max)}] σ${s.stddev}`);
        }
        else {
            parts.push(`${key}:μ${fmtNum(s.avg)} [${fmtNum(s.min)}–${fmtNum(s.max)}] σ${s.stddev}`);
        }
    }
    // String cardinality — extract keywords for long-text fields
    const strEntries = Object.entries(profile.stringFields);
    for (const [key, s] of strEntries.slice(0, 3)) {
        // Skip fields with near-zero non-null rate (sparse data)
        if (s.nullCount > 0 && s.nullCount / Math.max(1, profile.rowCount) > 0.9)
            continue;
        if (s.avgLength > 60) {
            // Text-heavy: extract frequent words as topics
            const words = s.topValues.join(' ').toLowerCase().split(/\s+/).filter(w => w.length > 3);
            const wordCounts = {};
            for (const w of words)
                wordCounts[w] = (wordCounts[w] || 0) + 1;
            const topWords = Object.entries(wordCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([w]) => w);
            parts.push(`${key}:${s.cardinality}uniq topics:${topWords.join(',')}`);
        }
        else if (s.cardinality <= 5) {
            parts.push(`${key}:${s.topValues.join('/')}`);
        }
        else {
            parts.push(`${key}:${s.cardinality}uniq top:${s.topValues.slice(0, 2).join(',')}`);
        }
    }
    // Boolean highlights
    const boolEntries = Object.entries(profile.booleanFields);
    for (const [key, b] of boolEntries.slice(0, 2)) {
        parts.push(`${key}:${Math.round(b.trueRatio * 100)}%T`);
    }
    // Outliers (max 2)
    if (profile.outliers.length > 0) {
        parts.push(`OUT:${profile.outliers.slice(0, 2).map(o => o.split(' ').slice(0, 2).join(' ')).join(',')}`);
    }
    return parts.join(' | ');
}
// ─── Top-N: Sort and format top rows ─────────────────────────────────────
function formatTopN(rows, schema, topN = 5) {
    if (rows.length === 0)
        return '';
    // Pick a numeric sort key if available
    let sortKey = 'id';
    for (const f of schema.fields) {
        if (f.type === 'number' && typeof rows[0][f.name] === 'number') {
            const fieldName = f.name.toLowerCase();
            if (fieldName.includes('revenue') || fieldName.includes('amount') || fieldName.includes('value') || fieldName.includes('score')) {
                sortKey = f.name;
                break;
            }
        }
    }
    const sorted = [...rows].sort((a, b) => {
        const va = typeof a[sortKey] === 'number' ? a[sortKey] : 0;
        const vb = typeof b[sortKey] === 'number' ? b[sortKey] : 0;
        return vb - va; // descending
    });
    // Truncate long string values for compact display
    const truncated = sorted.slice(0, Math.min(topN, rows.length)).map(row => {
        const t = {};
        for (const key of Object.keys(row)) {
            const val = row[key];
            if (typeof val === 'string' && val.length > 40) {
                t[key] = val.slice(0, 37) + '...';
            }
            else if (Array.isArray(val)) {
                t[key] = val.length > 3 ? val.slice(0, 3).concat(['...']) : val;
            }
            else {
                t[key] = val;
            }
        }
        return t;
    });
    return toon_1.toon.dense(truncated, schema);
}
// ─── Stratify: Full pipeline ─────────────────────────────────────────────
function stratify(rows, schema, topN = 5) {
    const n = rows.length;
    // Adaptive: DENSE for small data (overhead not worth it)
    if (n < 20) {
        const dense = toon_1.toon.dense(rows, schema);
        return {
            header: '',
            top: dense,
            rest: '',
            refs: {},
            totalTokens: Math.round(dense.length / 3.5),
        };
    }
    // Adaptive topN: fewer rows when values are long
    const firstRow = rows[0] || {};
    const avgStrLen = Object.values(firstRow)
        .filter(v => typeof v === 'string')
        .reduce((sum, v) => sum + String(v).length, 0) / Math.max(1, Object.values(firstRow).filter(v => typeof v === 'string').length);
    const adaptiveTopN = avgStrLen > 60 ? 2 : avgStrLen > 30 ? 3 : topN;
    const profile = summarize(rows);
    const header = formatStatHeader(profile);
    // Super-sparse: skip rows if >70% of all field values are null
    const maxFieldNull = Math.max(0, ...Object.entries(profile.stringFields)
        .map(([, s]) => s.nullCount / Math.max(1, profile.rowCount)));
    const hasSparseFields = profile.rowCount > 0 &&
        (profile.nullRatio > 0.7 || maxFieldNull > 0.9);
    let top = '';
    let effectiveTopN = adaptiveTopN;
    if (hasSparseFields) {
        effectiveTopN = 0;
        top = '';
    }
    else {
        top = formatTopN(rows, schema, adaptiveTopN);
    }
    // Rest as hash references
    const refs = {};
    const refLines = [];
    // Only hash if we have more rows than effectiveTopN
    if (rows.length > effectiveTopN) {
        const remaining = rows.length - Math.min(effectiveTopN, rows.length);
        const batchHash = (0, crypto_1.createHash)('sha256')
            .update(JSON.stringify(rows.slice(effectiveTopN)))
            .digest('hex')
            .slice(0, 8);
        refLines.push(`[REF:${batchHash}] (${remaining} rows available on expand)`);
        refs[batchHash] = JSON.stringify(rows.slice(effectiveTopN));
    }
    const rest = refLines.join('\n');
    // Token estimate
    const headerTokens = Math.round(header.length / 3.5);
    const topTokens = top ? Math.round(top.length / 3.5) : 0;
    const restTokens = Math.round(rest.length / 3.5);
    const totalTokens = headerTokens + topTokens + restTokens;
    return { header, top, rest, refs, totalTokens };
}
// ─── Session Delta Layer ─────────────────────────────────────────────────
let _deltaCache = new Map();
function injectDelta(sessionId, payload) {
    const allHashes = new Set();
    if (payload.top) {
        allHashes.add((0, crypto_1.createHash)('sha256').update(payload.top).digest('hex').slice(0, 8));
    }
    if (payload.rest) {
        const restHash = (0, crypto_1.createHash)('sha256').update(payload.rest).digest('hex').slice(0, 8);
        allHashes.add(restHash);
    }
    const prevHashes = _deltaCache.get(sessionId);
    _deltaCache.set(sessionId, allHashes);
    if (!prevHashes || prevHashes.size === 0) {
        return { ...payload, isDelta: false, sameTokenCount: 0 };
    }
    // Check if data is same as last turn
    const overlap = Array.from(allHashes).filter(h => prevHashes.has(h));
    const isSame = overlap.length === allHashes.size;
    if (isSame) {
        return {
            header: payload.header,
            top: '',
            rest: `[SAME: data unchanged from previous turn — ${payload.totalTokens} tokens saved]`,
            refs: payload.refs,
            totalTokens: Math.round(payload.header.length / 3.5) + 5,
            isDelta: true,
            sameTokenCount: payload.totalTokens,
        };
    }
    // Partial delta: header is always fresh, rest may be same
    const newPayload = {
        header: payload.header,
        top: payload.top,
        rest: payload.rest,
        refs: payload.refs,
        totalTokens: payload.totalTokens,
        isDelta: true,
        sameTokenCount: 0,
    };
    if (overlap.length > 0) {
        newPayload.rest = payload.rest + `\n[Δ:${overlap.length} chunks cached from previous turn]`;
        newPayload.sameTokenCount = Math.round(payload.rest.length / 3.5) * 0.5;
    }
    return newPayload;
}
// ─── Expand: On-demand detail retrieval ──────────────────────────────────
const _expandStore = new Map();
function storeForExpand(refs) {
    for (const [hash, data] of Object.entries(refs)) {
        _expandStore.set(hash, data);
    }
}
function expand(refHash) {
    return _expandStore.get(refHash) || null;
}
// ─── Helpers ─────────────────────────────────────────────────────────────
function emptyProfile() {
    return {
        rowCount: 0, colCount: 0,
        numericFields: {}, stringFields: {}, booleanFields: {},
        nullRatio: 0, outliers: [], trends: [],
    };
}
function fmtNum(n) {
    if (Math.abs(n) >= 1e9)
        return (n / 1e9).toFixed(1) + 'B';
    if (Math.abs(n) >= 1e6)
        return (n / 1e6).toFixed(1) + 'M';
    if (Math.abs(n) >= 1e3)
        return (n / 1e3).toFixed(1) + 'K';
    if (Number.isInteger(n))
        return String(Math.round(n));
    return n.toFixed(2).replace(/\.?0+$/, '');
}
function truncate(s, maxLen) {
    if (s.length <= maxLen)
        return s;
    return s.slice(0, maxLen - 3) + '...';
}
// ─── Auto-Schema Builder ─────────────────────────────────────────────────
function autoSchema(name, sample) {
    const fields = Object.keys(sample).map((key, i) => {
        const val = sample[key];
        let type = 'string';
        if (val === null || val === undefined)
            type = 'null';
        else if (typeof val === 'number')
            type = 'number';
        else if (typeof val === 'boolean')
            type = 'boolean';
        else if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val))
            type = 'date';
        return { name: key, abbr: `f${i}`, type };
    });
    return { type: name, fields };
}
//# sourceMappingURL=stratify.js.map