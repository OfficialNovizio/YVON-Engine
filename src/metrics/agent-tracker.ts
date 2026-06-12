// src/metrics/agent-tracker.ts
// Initializes agent activities from personality definitions.

import { metrics } from './collector'
import { AGENT_PERSONALITIES } from '../agents/personalities'
import type { AgentActivity } from './types'

const DEPARTMENT_MAP: Record<string, string> = {
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
}

export function initAgentActivities(): void {
  for (const p of AGENT_PERSONALITIES) {
    const activity: AgentActivity = {
      agentId: p.agentId,
      name: p.name,
      department: DEPARTMENT_MAP[p.agentId] || 'Unknown',
      status: 'idle',
      lastActivity: Date.now(),
      totalCalls: 0,
      tokensUsed: 0,
      memorySizeBytes: 0,
    }
    metrics.setAgentActivity(activity)
  }
}
