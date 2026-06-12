"use strict";
// src/metrics/agent-tracker.ts
// Initializes agent activities from personality definitions.
Object.defineProperty(exports, "__esModule", { value: true });
exports.initAgentActivities = initAgentActivities;
const collector_1 = require("./collector");
const personalities_1 = require("../agents/personalities");
const DEPARTMENT_MAP = {
    'marcus-ceo': 'CEO',
    'diana-coo': 'COO',
    'dev-lead': 'Technical',
    'raj-backend': 'Technical',
    'mia-frontend': 'Technical',
    'quinn-qa': 'Technical',
    'kai-analyst': 'Marketing',
    'lena-brand': 'Marketing',
    'rio-ads': 'Marketing',
    'nate-growth': 'Marketing',
    'atlas-art-director': 'Marketing',
    'pixel-production': 'Marketing',
    'felix-finance': 'Finance',
};
function initAgentActivities() {
    for (const p of personalities_1.AGENT_PERSONALITIES) {
        const activity = {
            agentId: p.agentId,
            name: p.name,
            department: DEPARTMENT_MAP[p.agentId] || 'Unknown',
            status: 'idle',
            lastActivity: Date.now(),
            totalCalls: 0,
            tokensUsed: 0,
            memorySizeBytes: 0,
        };
        collector_1.metrics.setAgentActivity(activity);
    }
}
//# sourceMappingURL=agent-tracker.js.map