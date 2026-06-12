"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCodegraphReport = getCodegraphReport;
exports.queryCodegraph = queryCodegraph;
exports.queryBlastRadius = queryBlastRadius;
exports.invalidateCodegraphCache = invalidateCodegraphCache;
// lib/cie/sources/codegraph.ts — Dependency graph knowledge source
// Reads CODEGRAPH_REPORT.md and provides hub files, fan-out files, and blast radius.
const fs_1 = require("fs");
const config_1 = require("../../adapters/config");
let cachedReport = null;
let cachedMtime = 0;
function getCodegraphReport() {
    const config = (0, config_1.getConfig)();
    const path = config.codegraphReport;
    if (!(0, fs_1.existsSync)(path))
        return { hubFiles: [], fanOutFiles: [], apiDeps: {} };
    const mtime = (0, fs_1.statSync)(path).mtimeMs;
    if (cachedReport && cachedMtime === mtime)
        return cachedReport;
    const content = (0, fs_1.readFileSync)(path, 'utf-8');
    const hubFiles = parseHubFiles(content);
    const fanOutFiles = parseFanOut(content);
    const apiDeps = parseApiDeps(content);
    cachedReport = { hubFiles, fanOutFiles, apiDeps };
    cachedMtime = mtime;
    return cachedReport;
}
function parseHubFiles(content) {
    const hubs = [];
    const section = content.match(/## Hub Files[\s\S]*?(?=##|$)/);
    if (!section)
        return hubs;
    const lines = section[0].split('\n');
    for (const line of lines) {
        const m = line.match(/\|\s*\d+\s*\|\s*`([^`]+)`\s*\|\s*\*?\*?(\d+)\*?\*?\s*\|/);
        if (m) {
            const importers = parseInt(m[2]);
            hubs.push({
                file: m[1], importers,
                risk: importers >= 50 ? 'critical' : importers >= 20 ? 'high' : importers >= 10 ? 'medium' : 'low'
            });
        }
    }
    return hubs;
}
function parseFanOut(content) {
    const files = [];
    const section = content.match(/## High Fan-Out Files[\s\S]*?(?=##|$)/);
    if (!section)
        return files;
    const lines = section[0].split('\n');
    for (const line of lines) {
        const m = line.match(/\|\s*`([^`]+)`\s*\|/);
        if (m)
            files.push(m[1]);
    }
    return files;
}
function parseApiDeps(content) {
    const deps = {};
    const section = content.match(/## API Route Dependency Map[\s\S]*?(?=## Potentially Orphaned|$)/);
    if (!section)
        return deps;
    const blocks = section[0].split(/\*\*`([^`]+)`\*\*/);
    for (let i = 1; i < blocks.length; i += 2) {
        const route = blocks[i];
        const body = blocks[i + 1] || '';
        const imports = [...body.matchAll(/→\s*`([^`]+)`/g)].map(m => m[1]);
        if (imports.length > 0)
            deps[route] = imports;
    }
    return deps;
}
function queryCodegraph(filePaths) {
    const report = getCodegraphReport();
    const scored = report.hubFiles.map(h => {
        let score = 0;
        for (const fp of filePaths) {
            if (h.file === fp)
                score = 100;
            else if (h.file.includes(fp))
                score = Math.max(score, 50);
            else if (fp.includes(h.file.split('/').pop() || ''))
                score = Math.max(score, 30);
        }
        return { ...h, score };
    }).filter(h => h.score > 0).sort((a, b) => b.score - a.score);
    return scored.slice(0, 5).map(h => `D|hub|${h.file}|${h.importers}|${h.risk}`).join('\n');
}
function queryBlastRadius(file) {
    const report = getCodegraphReport();
    const graph = {};
    for (const [route, deps] of Object.entries(report.apiDeps)) {
        for (const dep of deps) {
            if (!graph[dep])
                graph[dep] = [];
            graph[dep].push(route);
        }
    }
    const visited = new Set();
    const queue = [file];
    while (queue.length > 0) {
        const current = queue.shift();
        for (const dep of graph[current] || []) {
            if (!visited.has(dep)) {
                visited.add(dep);
                queue.push(dep);
            }
        }
    }
    return [...visited];
}
function invalidateCodegraphCache() { cachedReport = null; }
//# sourceMappingURL=codegraph.js.map