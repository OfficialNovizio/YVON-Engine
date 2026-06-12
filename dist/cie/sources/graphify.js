"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGraphifyReport = getGraphifyReport;
exports.queryGraphify = queryGraphify;
exports.invalidateGraphifyCache = invalidateGraphifyCache;
// lib/cie/sources/graphify.ts — Code structure knowledge graph source
const fs_1 = require("fs");
const config_1 = require("../../adapters/config");
let cachedCommunities = null;
let cachedMtime = 0;
function getGraphifyReport() {
    const config = (0, config_1.getConfig)();
    const path = config.graphifyReport;
    if (!(0, fs_1.existsSync)(path))
        return { communities: [] };
    const mtime = (0, fs_1.statSync)(path).mtimeMs;
    if (cachedCommunities && cachedMtime === mtime)
        return { communities: cachedCommunities };
    const content = (0, fs_1.readFileSync)(path, 'utf-8');
    const communities = parseCommunities(content);
    cachedCommunities = communities;
    cachedMtime = mtime;
    return { communities };
}
function parseCommunities(content) {
    const communities = [];
    const sections = content.split(/### Community \d+ - /);
    for (const section of sections.slice(1)) {
        const nameMatch = section.match(/^"([^"]+)"/);
        const cohesionMatch = section.match(/Cohesion:\s*([\d.]+)/);
        const nodesMatch = section.match(/Nodes\s*\((\d+)\):\s*(.+)/);
        if (nameMatch && cohesionMatch && nodesMatch) {
            const nodes = nodesMatch[2].split(',').map(n => n.trim().replace(/\(.*\)/, ''));
            communities.push({ name: nameMatch[1], cohesion: parseFloat(cohesionMatch[1]), nodes });
        }
    }
    return communities;
}
function queryGraphify(keywords) {
    const { communities } = getGraphifyReport();
    const scored = communities
        .filter(c => c.cohesion > 0.05 && c.nodes.length > 0)
        .map(c => {
        const hits = c.nodes.filter(n => keywords.some(k => n.toLowerCase().includes(k.toLowerCase())));
        return { ...c, score: hits.length };
    })
        .filter(c => c.score > 0)
        .sort((a, b) => b.score - a.score);
    return scored.slice(0, 3).map(c => `G|${c.name}|${c.cohesion}|${c.nodes.slice(0, 5).join(',')}`).join('\n');
}
function invalidateGraphifyCache() { cachedCommunities = null; }
//# sourceMappingURL=graphify.js.map