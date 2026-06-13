"use strict";
// src/agents/manifest-schema.ts — Agent Manifest types + validation
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateManifest = validateManifest;
const VALID_TOOLS = [
    'web_search', 'terminal', 'file', 'browser',
    'delegate_task', 'cronjob', 'memory', 'send_message',
    'session_search', 'read_file', 'write_file', 'search_files',
    'patch', 'todo', 'clarify', 'skill_view', 'skills_list',
    'browser_navigate', 'browser_click', 'browser_snapshot',
];
const LEVEL_TOOLS = {
    1: ['web_search', 'terminal', 'file', 'browser', 'delegate_task', 'cronjob', 'memory', 'send_message', 'session_search'],
    2: ['web_search', 'terminal', 'file', 'browser', 'session_search'],
    3: ['web_search', 'terminal', 'file', 'browser', 'session_search'],
};
const VALID_DEPARTMENTS = ['Command', 'Sense', 'Research', 'Psychology', 'Legal', 'Technical', 'Marketing', 'Finance'];
function validateManifest(manifest) {
    const errors = [];
    const warnings = [];
    const id = manifest?.agent?.id || 'unknown';
    if (!manifest?.agent?.id)
        errors.push('Missing agent.id');
    if (!manifest?.agent?.name)
        errors.push('Missing agent.name');
    if (!manifest?.agent?.department)
        errors.push('Missing agent.department');
    else if (!VALID_DEPARTMENTS.includes(manifest.agent.department)) {
        warnings.push(`Unknown department: ${manifest.agent.department}`);
    }
    if (!manifest?.agent?.level || ![1, 2, 3].includes(manifest.agent.level)) {
        errors.push('agent.level must be 1, 2, or 3');
    }
    if (!Array.isArray(manifest?.tools)) {
        errors.push('tools must be an array');
    }
    else {
        const level = manifest.agent.level || 3;
        const allowed = LEVEL_TOOLS[level] || LEVEL_TOOLS[3];
        for (const tool of manifest.tools) {
            if (!VALID_TOOLS.includes(tool)) {
                errors.push(`Unknown tool: ${tool}`);
            }
            if (!allowed.includes(tool)) {
                errors.push(`Tool "${tool}" not allowed for level ${level} agents`);
            }
        }
    }
    if (!Array.isArray(manifest?.skills)) {
        warnings.push('No skills declared');
    }
    if (!Array.isArray(manifest?.purpose) || manifest?.purpose?.length === 0) {
        warnings.push('No purpose declared');
    }
    return { valid: errors.length === 0, agent_id: id, errors, warnings };
}
//# sourceMappingURL=manifest-schema.js.map