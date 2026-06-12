"use strict";
// lib/delta.ts — State tracker for YVON OS compressed agent calls
//
// Remembers what was sent to the LLM last time. On subsequent calls,
// only sends CHANGES (new, modified, removed) instead of full dataset.
// 
// When combined with dictionary + templates: 93% savings on repeat calls.
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrCreateState = getOrCreateState;
exports.computeDelta = computeDelta;
exports.formatDeltaForLLM = formatDeltaForLLM;
exports.resetDelta = resetDelta;
exports.resetAllDeltas = resetAllDeltas;
// In-memory store (per agent session)
const states = new Map();
// ─── Hash function ───────────────────────────────────────────────────────────
function hash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
        h = ((h << 5) - h) + str.charCodeAt(i);
        h = h & h;
    }
    return Math.abs(h).toString(36);
}
// ─── Create or load state ────────────────────────────────────────────────────
function getOrCreateState(sessionId, fullSyncEvery = 6) {
    const existing = states.get(sessionId);
    if (existing)
        return existing;
    const state = {
        sessionId,
        lastSentAt: new Date().toISOString(),
        lastHash: '',
        items: new Map(),
        fullSyncEvery,
        callCount: 0,
    };
    states.set(sessionId, state);
    return state;
}
// ─── Compute delta between current data and last sent state ──────────────────
function computeDelta(currentItems, // id → compressed line
sessionId, options) {
    const state = getOrCreateState(sessionId);
    state.callCount++;
    const forceFull = options?.forceFullSync || state.callCount % state.fullSyncEvery === 0;
    if (forceFull || state.items.size === 0) {
        // Full sync: send everything, update state
        const allHash = hash(Array.from(currentItems.entries()).map(([k, v]) => k + v).join(''));
        state.lastSentAt = new Date().toISOString();
        state.lastHash = allHash;
        state.items = new Map(currentItems);
        const lines = Array.from(currentItems.values());
        const fullData = lines.join('\n');
        return {
            isFullSync: true,
            changes: Array.from(currentItems.entries()).map(([id, data]) => ({
                type: '+',
                id,
                data,
            })),
            state,
            summary: `FULL SYNC · ${currentItems.size} items · hash=${allHash}`,
        };
    }
    // Delta: compare current items against last state
    const changes = [];
    const seen = new Set();
    // Find new and changed items
    for (const [id, line] of currentItems) {
        seen.add(id);
        const newHash = hash(line);
        const oldHash = state.items.get(id) ? hash(state.items.get(id)) : null;
        if (!oldHash) {
            // New item
            changes.push({ type: '+', id, data: line, newHash });
        }
        else if (oldHash !== newHash) {
            // Changed item — send only what changed, not full line
            const oldLine = state.items.get(id);
            const changedFields = diffFields(oldLine, line);
            changes.push({
                type: '~',
                id,
                data: changedFields,
                oldHash,
                newHash,
            });
        }
    }
    // Find removed items
    for (const id of state.items.keys()) {
        if (!seen.has(id)) {
            changes.push({ type: '-', id });
        }
    }
    // Update state
    state.lastSentAt = new Date().toISOString();
    state.items = new Map(currentItems);
    // Build summary
    const added = changes.filter(c => c.type === '+').length;
    const modified = changes.filter(c => c.type === '~').length;
    const removed = changes.filter(c => c.type === '-').length;
    const summary = `Δ since ${state.lastSentAt.slice(11, 19)} · +${added} ~${modified} -${removed}`;
    return {
        isFullSync: false,
        changes,
        state,
        summary,
    };
}
// ─── Format delta for LLM consumption ─────────────────────────────────────────
function formatDeltaForLLM(result) {
    if (result.isFullSync) {
        return `[FULL SYNC — ${result.summary}]\n` +
            result.changes.map(c => c.data).join('\n');
    }
    const lines = [`[${result.summary}]`];
    for (const c of result.changes) {
        switch (c.type) {
            case '+':
                lines.push(`+ ${c.data}`);
                break;
            case '~':
                lines.push(`~ ${c.id} ${c.data}`);
                break;
            case '-':
                lines.push(`- ${c.id}`);
                break;
        }
    }
    return lines.join('\n');
}
// ─── Diff two compressed lines field-by-field ──────────────────────────────────
function diffFields(oldLine, newLine) {
    const oldFields = oldLine.split('|');
    const newFields = newLine.split('|');
    const changed = [];
    for (let i = 0; i < Math.max(oldFields.length, newFields.length); i++) {
        const o = oldFields[i] || '';
        const n = newFields[i] || '';
        if (o !== n) {
            changed.push(`[${i}]=${n}`);
        }
    }
    return changed.length > 0 ? changed.join(' ') : 'unchanged';
}
// ─── Clear state (for testing) ────────────────────────────────────────────────
function resetDelta(sessionId) {
    states.delete(sessionId);
}
function resetAllDeltas() {
    states.clear();
}
//# sourceMappingURL=delta.js.map