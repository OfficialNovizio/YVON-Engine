"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProjectArchitecture = getProjectArchitecture;
exports.getProjectRules = getProjectRules;
exports.getVentureContext = getVentureContext;
exports.getProjectContextForTask = getProjectContextForTask;
exports.invalidateProjectDocsCache = invalidateProjectDocsCache;
// lib/cie/sources/project-docs.ts — Project documentation knowledge source
const fs_1 = require("fs");
const config_1 = require("../../adapters/config");
let claudeCache = null;
let claudeMtime = 0;
const ventureCache = new Map();
function getProjectArchitecture() {
    const config = (0, config_1.getConfig)();
    const path = config.projectClaudePath;
    if (!(0, fs_1.existsSync)(path))
        return '';
    const mtime = (0, fs_1.statSync)(path).mtimeMs;
    if (claudeCache && claudeMtime === mtime)
        return claudeCache;
    const content = (0, fs_1.readFileSync)(path, 'utf-8');
    const archSection = extractSection(content, '## App Architecture');
    claudeCache = archSection.slice(0, 400);
    claudeMtime = mtime;
    return claudeCache;
}
function getProjectRules() {
    return [
        'Strict TypeScript — zero build errors, no any without justification',
        'No manual Vercel deploys — CI/CD pipeline only',
        'Audit gate — run tsc+build+lint before every push',
        'Venture context from cookie — yvon_active_venture',
    ];
}
function getVentureContext(venture) {
    if (!venture || venture === 'yvon-dashboard')
        return '';
    const config = (0, config_1.getConfig)();
    const path = `${config.ventureDocsDir}/${venture}/CONTEXT.md`;
    if (!(0, fs_1.existsSync)(path))
        return '';
    const mtime = (0, fs_1.statSync)(path).mtimeMs;
    const cached = ventureCache.get(venture);
    if (cached && cached.mtime === mtime)
        return cached.content;
    const content = (0, fs_1.readFileSync)(path, 'utf-8').slice(0, 500);
    ventureCache.set(venture, { content, mtime });
    return content;
}
function getProjectContextForTask(taskType, venture) {
    const parts = [];
    if (['backend_bug', 'frontend_ui', 'data_query', 'ops_risk'].includes(taskType)) {
        const arch = getProjectArchitecture();
        if (arch)
            parts.push(arch);
    }
    if (['strategy', 'marketing'].includes(taskType)) {
        const ctx = getVentureContext(venture);
        if (ctx)
            parts.push(ctx);
    }
    return parts.join('\n');
}
function extractSection(content, heading) {
    const startIdx = content.indexOf(heading);
    if (startIdx === -1)
        return '';
    const after = content.slice(startIdx);
    const nextHeading = after.slice(heading.length).match(/\n## /);
    const endIdx = nextHeading ? startIdx + heading.length + (nextHeading.index ?? 0) : content.length;
    return content.slice(startIdx, endIdx).trim();
}
function invalidateProjectDocsCache() {
    claudeCache = null;
    ventureCache.clear();
}
//# sourceMappingURL=project-docs.js.map