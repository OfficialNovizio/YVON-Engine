"use strict";
// src/toon/auto/decoder.ts — TOON → Human Parser
//
// Converts TOON pipe-delimited records back to human-readable text.
// Used in the Claude SSE response path to expand TOON output before
// the user sees it. Supports all record types from encoder.
//
// Record types:
//   D| — Decision records
//   K| — Task/key-value records
//   C| — Config records
//   G| — Goal records
//   X| — Context records
//   M| — Memory records
//   P| — Plan records
//   R| — Result records
//   E| — Error records
//   S| — Summary records
//   T| — Text/section records
//   L| — List items
//   F| — Freeform text
//   MEM| — System memory instructions (with Dict: prefix)
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeToonResponse = decodeToonResponse;
exports.parseDictionaryBlock = parseDictionaryBlock;
exports.expandWithDictionary = expandWithDictionary;
/**
 * Parse a TOON string back to human-readable text.
 * Auto-detects TOON format. Safe to call on non-TOON text (returns as-is).
 */
function decodeToonResponse(text) {
    if (!text || text.length < 3) {
        return { human: text, wasToon: false, recordCount: 0 };
    }
    // Detect TOON format: lines with pipe-delimited fields starting with type char
    const lines = text.split('\n');
    let toonLines = 0;
    const nonToonLines = [];
    const decodedSections = [];
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
            decodedSections.push('');
            nonToonLines.push('');
            continue;
        }
        // Check if this is a TOON record (starts with single char + pipe)
        if (/^[A-Z]\|/.test(trimmed) && trimmed.split('|').length >= 2) {
            toonLines++;
            const decoded = decodeRecord(trimmed);
            if (decoded)
                decodedSections.push(decoded);
        }
        else if (/^[A-Z]{2,3}\|/.test(trimmed)) {
            // Multi-char prefix like MEM| or DICT|
            toonLines++;
            const decoded = decodeRecord(trimmed);
            if (decoded)
                decodedSections.push(decoded);
        }
        else {
            nonToonLines.push(trimmed);
            decodedSections.push(trimmed);
        }
    }
    // If less than 30% of lines are TOON, it's probably not TOON format
    if (toonLines === 0 || (toonLines / Math.max(1, lines.length)) < 0.3) {
        return { human: text, wasToon: false, recordCount: 0 };
    }
    // Group records by type
    const human = formatDecoded(decodedSections);
    return {
        human,
        wasToon: true,
        recordCount: toonLines,
    };
}
/**
 * Parse a [TOON DICTIONARY ...] block into a lookup table.
 */
function parseDictionaryBlock(text) {
    const map = new Map();
    const match = text.match(/\[TOON DICTIONARY[^\]]*\]([\s\S]*?)\[\/TOON DICTIONARY\]/);
    if (!match)
        return map;
    const body = match[1];
    const pairs = body.match(/(\w+)=(\w+)/g);
    if (!pairs)
        return map;
    for (const pair of pairs) {
        const [full, abbr] = pair.split('=');
        map.set(abbr, full);
    }
    return map;
}
// ─── Record Decoders ─────────────────────────────────────────────────────────
function decodeRecord(line) {
    const parts = line.split('|');
    if (parts.length < 2)
        return null;
    const type = parts[0];
    const rest = parts.slice(1);
    switch (type) {
        case 'D': return `**Decision** — ${rest.join(' | ')}`;
        case 'K': return `**${unescape(rest[0])}:** ${rest.slice(1).map(unescape).join(' | ')}`;
        case 'C': return `**Config** — ${unescape(rest[0])}: ${rest.slice(1).map(unescape).join(' | ')}`;
        case 'G': return `**Goal:** ${rest.map(unescape).join(' — ')}`;
        case 'X': return rest.map(unescape).join(' — ');
        case 'M': return `- ${rest.map(unescape).join(': ')}`;
        case 'P': return `### ${unescape(rest[0])}\n${rest.slice(1).map(unescape).join('\n')}`;
        case 'R': return `> ${rest.map(unescape).join(' | ')}`;
        case 'E': return `⚠️ **Error:** ${rest.map(unescape).join(' — ')}`;
        case 'S': return `**${unescape(rest[0])}:** ${rest.slice(1).map(unescape).join(' — ')}`;
        case 'T': return rest.map(unescape).join(' | ');
        case 'L': return `• ${rest.map(unescape).join(' — ')}`;
        case 'F': return rest.map(unescape).join(' ');
        case 'MEM': return decodeMemoryRecord(rest);
        case 'DICT': return ''; // Skip dictionary lines in output
        default: return line;
    }
}
function decodeMemoryRecord(parts) {
    // MEM|section|key|value or MEM|section|index|value
    if (parts.length >= 3) {
        const section = unescape(parts[0]);
        const key = unescape(parts[1]);
        const value = parts.slice(2).map(unescape).join(': ');
        return `**${section}** > *${key}*: ${value}`;
    }
    return parts.map(unescape).join(' | ');
}
function unescape(s) {
    return s
        .replace(/\\n/g, '\n')
        .replace(/\\\|/g, '|');
}
// ─── Output Formatter ────────────────────────────────────────────────────────
function formatDecoded(lines) {
    const result = [];
    let currentSection = '';
    for (const line of lines) {
        // Section headers (###)
        if (line.startsWith('###')) {
            if (currentSection)
                result.push('');
            currentSection = line;
            result.push(line);
            continue;
        }
        // Bold headers (decisions, goals, etc)
        if (line.startsWith('**') && line.includes('**')) {
            if (currentSection)
                result.push('');
            currentSection = line;
            result.push(line);
            continue;
        }
        result.push(line);
    }
    return result.join('\n').trim();
}
/**
 * Expand a TOON-compressed string back using the dictionary.
 * Simple word-level expansion for text that was abbreviated.
 */
function expandWithDictionary(text, dictMap) {
    let result = text;
    // Sort by abbreviation length (longest first) to avoid partial matches
    const sorted = [...dictMap.entries()].sort((a, b) => b[0].length - a[0].length);
    for (const [abbr, full] of sorted) {
        if (abbr.length < 2)
            continue;
        const regex = new RegExp(`\\b${escapeRegex(abbr)}\\b`, 'gi');
        result = result.replace(regex, full);
    }
    return result;
}
function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
//# sourceMappingURL=decoder.js.map