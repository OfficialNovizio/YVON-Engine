"use strict";
// src/toon/auto/encoder.ts — Real TOON Encoding Engine
//
// Three encoding modes:
//   - DOCUMENT: section-based encoding (markdown docs → TOON records)
//   - MEMORY: key-value encoding (agent MEMORY.md → TOON records)
//   - PROMPT: structure-detection encoding (user prompts → TOON records)
//
// The dictionary provides abbreviation lookups. Every encoding mode produces
// pipe-delimited TOON records with measurable compression ratios.
//
// Memory files were previously raw markdown renamed to .toon — this fixes that.
Object.defineProperty(exports, "__esModule", { value: true });
exports.ABBREV_MAP = void 0;
exports.encodeDocument = encodeDocument;
exports.encodeMemory = encodeMemory;
exports.encodePrompt = encodePrompt;
exports.abbreviate = abbreviate;
exports.abbreviateText = abbreviateText;
exports.escapeRegex = escapeRegex;
exports.generateDictionaryString = generateDictionaryString;
// ─── Public API ────────────────────────────────────────────────────────────────
/**
 * Encode a markdown document into TOON format.
 * Preserves structural hierarchy as typed TOON records.
 */
function encodeDocument(content, title = '') {
    const sections = parseSections(content);
    const records = [];
    for (const section of sections) {
        const prefix = sectionTypeToChar(section.type);
        const headerAbbr = abbreviate(section.header);
        if (section.records.length === 1 && section.records[0].length < 200) {
            records.push(`${prefix}|${headerAbbr}|${abbreviateText(section.records[0])}`);
        }
        else {
            let i = 0;
            for (const rec of section.records) {
                records.push(`${prefix}|${headerAbbr}|${i}|${abbreviateText(rec)}`);
                i++;
            }
        }
    }
    const compressed = records.join('\n');
    return {
        raw: content,
        compressed,
        records,
        savingsPercent: Math.round((1 - compressed.length / Math.max(1, content.length)) * 100),
    };
}
/**
 * Encode agent MEMORY.md into TOON format.
 * Sections become keys, content becomes abbreviated values.
 */
function encodeMemory(content, agentId) {
    const sections = parseSections(content);
    const records = [];
    for (const section of sections) {
        const sectionKey = abbreviate(section.header);
        for (const rec of section.records) {
            const line = rec.trim();
            if (!line)
                continue;
            // Key: value pairs
            if (line.includes(':')) {
                const colonIdx = line.indexOf(':');
                const key = abbreviate(line.slice(0, colonIdx).trim());
                const val = abbreviateText(line.slice(colonIdx + 1).trim());
                records.push(`M|${sectionKey}|${key}|${val}`);
                continue;
            }
            // Bullet items
            if (line.match(/^[\-\*\•]\s/)) {
                records.push(`M|${sectionKey}|it|${abbreviateText(line.replace(/^[\-\*\•]\s*/, ''))}`);
                continue;
            }
            // Regular text
            records.push(`M|${sectionKey}|tx|${abbreviateText(line)}`);
        }
    }
    const compressed = records.join('\n');
    return {
        raw: content,
        compressed,
        records,
        savingsPercent: Math.round((1 - compressed.length / Math.max(1, content.length)) * 100),
    };
}
/**
 * Encode a user prompt — detect structured patterns and TOON-encode them.
 * Falls back to abbreviation-only for freeform text.
 */
function encodePrompt(prompt) {
    const records = [];
    // Detect numbered lists (1. item, 2. item)
    const numberedMatch = prompt.match(/(?:^|\n)((?:\d+[\.\)]\s+.+(?:\n|$))+)/m);
    if (numberedMatch) {
        const items = numberedMatch[1].split('\n').filter(l => l.match(/^\d+[\.\)]/));
        for (const item of items) {
            records.push(`L|${abbreviateText(item.replace(/^\d+[\.\)]\s*/, ''))}`);
        }
    }
    // Detect bullet lists
    const bulletMatch = prompt.match(/(?:^|\n)((?:[\-\*\•]\s+.+(?:\n|$))+)/m);
    if (bulletMatch) {
        const items = bulletMatch[1].split('\n').filter(l => l.match(/^[\-\*\•]/));
        for (const item of items) {
            records.push(`L|${abbreviateText(item.replace(/^[\-\*\•]\s*/, ''))}`);
        }
    }
    // Detect key-value blocks (field: value)
    const kvPairs = prompt.match(/(\w[\w\s]*?):\s*(.+?)(?:\n|$)/g);
    if (kvPairs && kvPairs.length >= 3) {
        for (const pair of kvPairs) {
            const colonIdx = pair.indexOf(':');
            const key = abbreviate(pair.slice(0, colonIdx).trim());
            const val = abbreviateText(pair.slice(colonIdx + 1).trim());
            records.push(`K|${key}|${val}`);
        }
    }
    // Detect table-like patterns (comma or tab separated rows with headers)
    const tableMatch = prompt.match(/((?:^.+(?:[,\t|]).+\n){2,})/m);
    if (tableMatch) {
        const rows = tableMatch[1].trim().split('\n');
        for (const row of rows) {
            const cells = row.split(/[,\t|]/).map(c => abbreviateText(c.trim()));
            records.push(`T|${cells.join('|')}`);
        }
    }
    // If we detected structure, return TOON + abbreviated rest
    if (records.length > 0) {
        const structured = prompt
            .replace(/(?:^|\n)((?:\d+[\.\)]\s+.+(?:\n|$))+)/gm, '')
            .replace(/(?:^|\n)((?:[\-\*\•]\s+.+(?:\n|$))+)/gm, '')
            .replace(/\w[\w\s]*?:\s*.+?(?:\n|$)/g, '')
            .replace(/(?:^.+(?:[,\t|]).+\n){2,}/gm, '')
            .trim();
        if (structured) {
            records.push(`F|${abbreviateText(structured)}`);
        }
        const compressed = records.join('\n');
        return {
            raw: prompt,
            compressed,
            records,
            savingsPercent: Math.round((1 - compressed.length / Math.max(1, prompt.length)) * 100),
        };
    }
    // No structure detected — abbreviation-only compression
    const abbreviated = abbreviateText(prompt);
    return {
        raw: prompt,
        compressed: abbreviated,
        records: [`F|${abbreviated}`],
        savingsPercent: Math.round((1 - abbreviated.length / Math.max(1, prompt.length)) * 100),
    };
}
function parseSections(content) {
    const sections = [];
    const lines = content.split('\n');
    let currentType = 'text';
    let currentHeader = '';
    let currentRecords = [];
    function flush() {
        if (currentRecords.length > 0) {
            sections.push({ type: currentType, header: currentHeader, records: [...currentRecords] });
            currentRecords = [];
            currentHeader = '';
        }
    }
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
            if (currentRecords.length > 0)
                currentRecords.push('');
            continue;
        }
        // Headers become section boundaries
        const headerMatch = trimmed.match(/^(#{1,4})\s+(.+)/);
        if (headerMatch) {
            flush();
            currentType = classifyHeader(trimmed);
            currentHeader = headerMatch[2];
            continue;
        }
        currentRecords.push(trimmed);
    }
    flush();
    return sections;
}
function classifyHeader(header) {
    const h = header.toLowerCase();
    if (h.includes('decision') || h.includes('choice'))
        return 'decision';
    if (h.includes('task') || h.includes('todo') || h.includes('action'))
        return 'task';
    if (h.includes('config') || h.includes('setup') || h.includes('setting'))
        return 'config';
    if (h.includes('goal') || h.includes('objective') || h.includes('target'))
        return 'goal';
    if (h.includes('context') || h.includes('background') || h.includes('overview'))
        return 'context';
    if (h.includes('memory') || h.includes('notes') || h.includes('log'))
        return 'memory';
    if (h.includes('plan') || h.includes('strategy') || h.includes('roadmap'))
        return 'plan';
    if (h.includes('result') || h.includes('output') || h.includes('response'))
        return 'result';
    if (h.includes('error') || h.includes('issue') || h.includes('bug'))
        return 'error';
    if (h.includes('summary') || h.includes('recap'))
        return 'summary';
    return 'text';
}
function sectionTypeToChar(type) {
    const map = {
        decision: 'D', task: 'K', config: 'C', goal: 'G', context: 'X',
        memory: 'M', plan: 'P', result: 'R', error: 'E', summary: 'S',
        text: 'T',
    };
    return map[type] || 'T';
}
// ─── Abbreviation Engine ─────────────────────────────────────────────────────
exports.ABBREV_MAP = {
    // Core YVON concepts
    'venture': 'vt', 'ventures': 'vt', 'agent': 'ag', 'agents': 'ag',
    'system': 'sy', 'prompt': 'pm', 'prompts': 'pm',
    'response': 'rp', 'responses': 'rp', 'user': 'us', 'users': 'us',
    'session': 'sn', 'sessions': 'sn', 'token': 'tk', 'tokens': 'tk',
    'model': 'md', 'models': 'md', 'provider': 'pr', 'providers': 'pr',
    'api': 'ap', 'database': 'db', 'schema': 'sc',
    // Ventures
    'novizio': 'nz', 'hourbour': 'hb', 'yvon': 'yv', 'yvon-dashboard': 'yd',
    // Agents
    'marcus': 'mc', 'diana': 'dn', 'dev': 'dv', 'raj': 'rj',
    'mia': 'mi', 'quinn': 'qn', 'kai': 'ka', 'lena': 'ln',
    'rio': 'ro', 'nate': 'nt', 'atlas': 'at', 'pixel': 'px',
    'felix': 'fx', 'kahneman': 'kh', 'henry': 'hy',
    // Departments
    'ceo': 'ce', 'coo': 'co', 'technical': 'tc', 'marketing': 'mk',
    'finance': 'fi', 'psychology': 'ps',
    // Tech stack
    'supabase': 'sb', 'nextjs': 'nx', 'next': 'nx', 'typescript': 'ts',
    'vercel': 'vc', 'react': 'rc', 'tailwind': 'tw',
    'component': 'cp', 'components': 'cp', 'route': 'rt', 'routes': 'rt',
    'middleware': 'mw', 'function': 'fn', 'interface': 'if', 'type': 'tp',
    'types': 'tp', 'module': 'md', 'package': 'pk',
    // Business
    'competitor': 'cr', 'competitors': 'cr', 'market': 'mk',
    'campaign': 'cg', 'campaigns': 'cg', 'revenue': 'rv',
    'customer': 'cs', 'customers': 'cs', 'product': 'pd', 'products': 'pd',
    'strategy': 'st', 'strategic': 'st', 'brand': 'br',
    'analytics': 'an', 'report': 'rp', 'insight': 'in', 'insights': 'in',
    'trend': 'tn', 'trends': 'tn', 'forecast': 'fc',
    // Content/Marketing
    'content': 'cn', 'social': 'sl', 'email': 'em', 'ads': 'ad',
    'newsletter': 'nl', 'video': 'vd', 'image': 'im', 'design': 'ds',
    'copy': 'cp', 'headline': 'hl', 'caption': 'ct',
    // Actions/Status
    'analysis': 'al', 'analyze': 'al', 'generate': 'gn', 'create': 'cr',
    'update': 'up', 'delete': 'dl', 'review': 'rv', 'approve': 'ap',
    'deploy': 'dp', 'build': 'bd', 'test': 'tst', 'fix': 'fix',
    'implement': 'im', 'integrate': 'ig', 'migrate': 'mg',
    'optimize': 'op', 'optimization': 'op', 'refactor': 'rf',
    // States/Qualities
    'error': 'er', 'errors': 'er', 'warning': 'wn', 'success': 'sc',
    'failure': 'fl', 'critical': 'ct', 'high': 'hi', 'medium': 'md',
    'low': 'lo', 'urgent': 'ur',
    // Common phrases
    'should': 'shd', 'would': 'wld', 'could': 'cld',
    'because': 'bc', 'about': 'abt', 'between': 'btw',
    'without': 'w/o', 'with': 'w/', 'including': 'inc',
    'especially': 'esp', 'approximately': '~', 'significant': 'sig',
    'performance': 'perf', 'security': 'sec', 'quality': 'qual',
    'experience': 'exp', 'development': 'dev', 'deployment': 'dpl',
    'configuration': 'cfg', 'documentation': 'doc', 'docs': 'doc',
    // Status
    'pending': 'pnd', 'completed': 'done', 'in_progress': 'wip',
    'cancelled': 'can', 'blocked': 'blk',
};
function abbreviate(text) {
    const key = text.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    return exports.ABBREV_MAP[key] || text.slice(0, 4);
}
function abbreviateText(text) {
    let result = text.replace(/\|/g, '\\|').replace(/\n/g, '\\n');
    // Sort by length descending to replace longer phrases first
    const entries = Object.entries(exports.ABBREV_MAP).sort((a, b) => b[0].length - a[0].length);
    for (const [full, abbr] of entries) {
        const regex = new RegExp(`\\b${escapeRegex(full)}\\b`, 'gi');
        // Only replace if abbreviation is shorter
        if (abbr.length < full.length) {
            result = result.replace(regex, abbr);
        }
    }
    return result;
}
function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
/**
 * Generate the full dictionary string for injection into system prompts.
 */
function generateDictionaryString() {
    const lines = ['[TOON DICTIONARY — use these abbreviations in your response to save tokens]'];
    const entries = Object.entries(exports.ABBREV_MAP).sort((a, b) => b[0].length - a[0].length);
    let currentLine = '';
    for (const [full, abbr] of entries) {
        const chunk = `${full}=${abbr}`;
        if ((currentLine + ' ' + chunk).length > 120) {
            lines.push(currentLine.trim());
            currentLine = chunk;
        }
        else {
            currentLine = currentLine ? currentLine + ' ' + chunk : chunk;
        }
    }
    if (currentLine)
        lines.push(currentLine.trim());
    lines.push('[/TOON DICTIONARY]');
    return lines.join('\n');
}
//# sourceMappingURL=encoder.js.map