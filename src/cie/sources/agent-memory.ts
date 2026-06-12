// lib/cie/sources/agent-memory.ts — Agent memory knowledge source
import { readFileSync, existsSync, statSync } from 'fs'
import { join } from 'path'
import { getConfig } from '../../adapters/config'
import type { TaskType } from '../types'

export interface AgentMemoryRules {
  neverAgain: string[]
  architectureLocks: string[]
  rejectedPatterns: string[]
  personality: string
}

const cache = new Map<string, { content: string; mtime: number }>()

const AGENT_MAP: Record<string, string> = {
  'marcus-ceo':'CEO/marcus','marcus':'CEO/marcus',
  'diana-coo':'COO/diana','diana':'COO/diana',
  'dev-lead':'Technical/dev','dev':'Technical/dev',
  'mia-frontend':'Technical/mia','mia':'Technical/mia',
  'raj-backend':'Technical/raj','raj':'Technical/raj',
  'quinn-qa':'Technical/quinn','quinn':'Technical/quinn',
  'kai-analyst':'Marketing/kai','kai':'Marketing/kai',
  'lena-brand':'Marketing/lena','lena':'Marketing/lena',
  'nate-growth':'Marketing/nate','nate':'Marketing/nate',
  'atlas-art-director':'Marketing/atlas','atlas':'Marketing/atlas',
  'pixel-production':'Marketing/pixel','pixel':'Marketing/pixel',
  'felix-finance':'Finance/felix','felix':'Finance/felix',
  'kahneman':'Psychology/Daniel_Kahneman',
}

function getMemoryPath(agentId: string): string {
  const config = getConfig()
  const agentPath = AGENT_MAP[agentId] ?? `Technical/${agentId}`
  return join(config.agentMemoryDir, agentPath, 'MEMORY.md')
}

function readCached(path: string): string {
  if (!existsSync(path)) return ''
  const mtime = statSync(path).mtimeMs
  const cached = cache.get(path)
  if (cached && cached.mtime === mtime) return cached.content
  const content = readFileSync(path, 'utf-8')
  cache.set(path, { content, mtime })
  return content
}

export function getAgentMemoryRules(agentId: string): AgentMemoryRules {
  const path = getMemoryPath(agentId)
  const content = readCached(path)
  if (!content) return { neverAgain: [], architectureLocks: [], rejectedPatterns: [], personality: '' }
  
  return {
    neverAgain: extractBullets(content, '## Never Again'),
    architectureLocks: extractBullets(content, '## Architecture Decisions'),
    rejectedPatterns: extractBullets(content, '## Rejected Patterns'),
    personality: extractSectionText(content, '## Personality Baseline') || extractSectionText(content, '## Default Behaviors'),
  }
}

export function getCrossAgentRules(taskType: TaskType, currentAgentId: string): string[] {
  const rules: string[] = []
  const seen = new Set<string>()
  
  if (taskType === 'strategy') {
    for (const rule of getAgentMemoryRules('marcus-ceo').neverAgain) {
      if (!seen.has(rule)) { rules.push(`[marcus] ${rule}`); seen.add(rule) }
    }
  }
  if (['backend_bug','data_query'].includes(taskType)) {
    for (const rule of getAgentMemoryRules('dev-lead').neverAgain) {
      if (!seen.has(rule)) { rules.push(`[dev] ${rule}`); seen.add(rule) }
    }
  }
  // Felix's financial rules apply to all task types
  for (const rule of getAgentMemoryRules('felix-finance').neverAgain) {
    if (!seen.has(rule)) { rules.push(`[felix] ${rule}`); seen.add(rule) }
  }
  return rules
}

export function getAllAgentMemoryStatus(): { agentId: string; rulesCount: number }[] {
  return Object.keys(AGENT_MAP)
    .filter(id => !id.includes('-') || id === 'marcus-ceo' || id === 'dev-lead' || id === 'mia-frontend' || id === 'raj-backend' || id === 'quinn-qa' || id === 'kai-analyst' || id === 'lena-brand' || id === 'nate-growth' || id === 'atlas-art-director' || id === 'pixel-production' || id === 'felix-finance')
    .map(id => ({ agentId: id, rulesCount: getAgentMemoryRules(id).neverAgain.length }))
}

function extractBullets(content: string, sectionName: string): string[] {
  const section = extractSectionText(content, sectionName)
  if (!section) return []
  return section.split('\n')
    .filter(line => line.trim().startsWith('-') || line.trim().startsWith('*'))
    .map(line => line.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean)
}

function extractSectionText(content: string, heading: string): string {
  const lines = content.split('\n')
  let inSection = false
  const sectionLines: string[] = []
  for (const line of lines) {
    if (line.trim().startsWith('## ') && line.includes(heading.replace('## ', ''))) {
      inSection = true
      continue
    }
    if (inSection && line.trim().startsWith('## ')) break
    if (inSection) sectionLines.push(line)
  }
  return sectionLines.join('\n').trim()
}
