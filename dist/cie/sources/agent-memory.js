"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAgentMemoryRules = getAgentMemoryRules;
exports.getCrossAgentRules = getCrossAgentRules;
exports.getAllAgentMemoryStatus = getAllAgentMemoryStatus;
// lib/cie/sources/agent-memory.ts — Agent memory knowledge source
const fs_1 = require("fs");
const path_1 = require("path");
const config_1 = require("../../adapters/config");
const cache = new Map();
const AGENT_MAP = {
    'marcus-ceo': 'CEO/marcus', 'marcus': 'CEO/marcus',
    'diana-coo': 'COO/diana', 'diana': 'COO/diana',
    'dev-lead': 'Technical/dev', 'dev': 'Technical/dev',
    'mia-frontend': 'Technical/mia', 'mia': 'Technical/mia',
    'raj-backend': 'Technical/raj', 'raj': 'Technical/raj',
    'quinn-qa': 'Technical/quinn', 'quinn': 'Technical/quinn',
    'kai-analyst': 'Marketing/kai', 'kai': 'Marketing/kai',
    'lena-brand': 'Marketing/lena', 'lena': 'Marketing/lena',
    'nate-growth': 'Marketing/nate', 'nate': 'Marketing/nate',
    'atlas-art-director': 'Marketing/atlas', 'atlas': 'Marketing/atlas',
    'pixel-production': 'Marketing/pixel', 'pixel': 'Marketing/pixel',
    'felix-finance': 'Finance/felix', 'felix': 'Finance/felix',
    'kahneman': 'Psychology/Daniel_Kahneman',
};
function getMemoryPath(agentId) {
    const config = (0, config_1.getConfig)();
    const agentPath = AGENT_MAP[agentId] ?? `Technical/${agentId}`;
    return (0, path_1.join)(config.agentMemoryDir, agentPath, 'MEMORY.md');
}
function readCached(path) {
    if (!(0, fs_1.existsSync)(path))
        return '';
    const mtime = (0, fs_1.statSync)(path).mtimeMs;
    const cached = cache.get(path);
    if (cached && cached.mtime === mtime)
        return cached.content;
    const content = (0, fs_1.readFileSync)(path, 'utf-8');
    cache.set(path, { content, mtime });
    return content;
}
function getAgentMemoryRules(agentId) {
    const path = getMemoryPath(agentId);
    const content = readCached(path);
    if (!content)
        return { neverAgain: [], architectureLocks: [], rejectedPatterns: [], personality: '' };
    return {
        neverAgain: extractBullets(content, '## Never Again'),
        architectureLocks: extractBullets(content, '## Architecture Decisions'),
        rejectedPatterns: extractBullets(content, '## Rejected Patterns'),
        personality: extractSectionText(content, '## Personality Baseline') || extractSectionText(content, '## Default Behaviors'),
    };
}
function getCrossAgentRules(taskType, currentAgentId) {
    const rules = [];
    const seen = new Set();
    if (taskType === 'strategy') {
        for (const rule of getAgentMemoryRules('marcus-ceo').neverAgain) {
            if (!seen.has(rule)) {
                rules.push(`[marcus] ${rule}`);
                seen.add(rule);
            }
        }
    }
    if (['backend_bug', 'data_query'].includes(taskType)) {
        for (const rule of getAgentMemoryRules('dev-lead').neverAgain) {
            if (!seen.has(rule)) {
                rules.push(`[dev] ${rule}`);
                seen.add(rule);
            }
        }
    }
    // Felix's financial rules apply to all task types
    for (const rule of getAgentMemoryRules('felix-finance').neverAgain) {
        if (!seen.has(rule)) {
            rules.push(`[felix] ${rule}`);
            seen.add(rule);
        }
    }
    return rules;
}
function getAllAgentMemoryStatus() {
    return Object.keys(AGENT_MAP)
        .filter(id => !id.includes('-') || id === 'marcus-ceo' || id === 'dev-lead' || id === 'mia-frontend' || id === 'raj-backend' || id === 'quinn-qa' || id === 'kai-analyst' || id === 'lena-brand' || id === 'nate-growth' || id === 'atlas-art-director' || id === 'pixel-production' || id === 'felix-finance')
        .map(id => ({ agentId: id, rulesCount: getAgentMemoryRules(id).neverAgain.length }));
}
function extractBullets(content, sectionName) {
    const section = extractSectionText(content, sectionName);
    if (!section)
        return [];
    return section.split('\n')
        .filter(line => line.trim().startsWith('-') || line.trim().startsWith('*'))
        .map(line => line.replace(/^[-*]\s*/, '').trim())
        .filter(Boolean);
}
function extractSectionText(content, heading) {
    const lines = content.split('\n');
    let inSection = false;
    const sectionLines = [];
    for (const line of lines) {
        if (line.trim().startsWith('## ') && line.includes(heading.replace('## ', ''))) {
            inSection = true;
            continue;
        }
        if (inSection && line.trim().startsWith('## '))
            break;
        if (inSection)
            sectionLines.push(line);
    }
    return sectionLines.join('\n').trim();
}
//# sourceMappingURL=agent-memory.js.map