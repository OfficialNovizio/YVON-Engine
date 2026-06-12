// lib/cie/retriever.ts — Parallel context retrieval from all knowledge sources
//
// All knowledge sources are synchronous (read from cached files).
// Fetches context from graphify, codegraph, agent memory, Hermes memory,
// and project docs. Applies source mapping based on task type.

import type { TaskProfile, KnowledgeSource, SourceMap, ContextItem } from './types'
import { extractKeywords, extractFilePaths } from './algorithms'
import { queryGraphify } from './sources/graphify'
import { queryCodegraph } from './sources/codegraph'
import { getAgentMemoryRules, getCrossAgentRules } from './sources/agent-memory'
import { getHermesUserContext, getHermesMemoryContext, getHermesStandards } from './sources/hermes-memory'
import { getProjectArchitecture, getProjectRules, getVentureContext } from './sources/project-docs'

// ─── Source Map ──────────────────────────────────────────────────────────────

const SOURCE_MAP: Record<string, SourceMap> = {
  backend_bug:  { primary: ['codegraph','agent_memory','hermes_memory'], secondary: ['graphify','project_docs'], exclude: ['venture_context'] },
  strategy:     { primary: ['agent_memory','hermes_memory','venture_context'], secondary: ['project_docs'], exclude: ['graphify','codegraph'] },
  frontend_ui:  { primary: ['agent_memory','project_docs','venture_context'], secondary: ['codegraph'], exclude: ['graphify'] },
  data_query:   { primary: ['codegraph','agent_memory','project_docs'], secondary: ['graphify','hermes_memory'], exclude: ['venture_context'] },
  marketing:    { primary: ['agent_memory','venture_context','hermes_memory'], secondary: ['project_docs'], exclude: ['graphify','codegraph'] },
  ops_risk:     { primary: ['agent_memory','hermes_memory','project_docs'], secondary: ['codegraph'], exclude: ['graphify','venture_context'] },
  general:      { primary: ['agent_memory','hermes_memory','project_docs'], secondary: ['graphify','codegraph','venture_context'], exclude: [] },
}

const SOURCE_PRIORITY: Record<KnowledgeSource, number> = {
  agent_memory: 10, hermes_memory: 9, project_docs: 8,
  codegraph: 7, venture_context: 6, graphify: 5, session_state: 3,
}

// ─── Fetch one source ────────────────────────────────────────────────────────

function fetchSource(source: KnowledgeSource, profile: TaskProfile, keywords: string[]): ContextItem[] {
  const items: ContextItem[] = []
  const add = (content: string, offset: number = 0) => {
    if (!content || content.trim().length === 0) return
    items.push({
      content, source,
      priority: SOURCE_PRIORITY[source] - offset * 0.5,
      relevance: 1.0, chars: content.length,
      id: `${source}:${content.slice(0, 40)}`,
    })
  }

  switch (source) {
    case 'codegraph': {
      const paths = extractFilePaths(profile.venture + ' ' + keywords.join(' '))
      add(queryCodegraph(paths.length > 0 ? paths : ['lib/types.ts']))
      break
    }
    case 'graphify':
      add(queryGraphify(keywords))
      break
    case 'agent_memory': {
      const rules = getAgentMemoryRules(profile.agentId)
      const cross = getCrossAgentRules(profile.type, profile.agentId)
      rules.architectureLocks.forEach((r, i) => add(`[ARCH LOCK] ${r}`, i))
      rules.neverAgain.forEach((r, i) => add(`[NEVER AGAIN] ${r}`, i))
      cross.forEach((r, i) => add(`[CROSS-AGENT] ${r}`, i))
      break
    }
    case 'hermes_memory': {
      const user = getHermesUserContext()
      const standards = getHermesStandards()
      const mem = getHermesMemoryContext(keywords)
      add(user, 0)
      standards.forEach((s, i) => add(`[STANDARD] ${s}`, i + 0.5))
      if (mem) add(mem, 3)
      break
    }
    case 'project_docs': {
      const arch = getProjectArchitecture()
      const rules = getProjectRules()
      add(arch, 0)
      rules.forEach((r, i) => add(`[RULE] ${r}`, i + 0.5))
      break
    }
    case 'venture_context':
      add(getVentureContext(profile.venture))
      break
  }
  return items
}

// ─── Main retrieval ──────────────────────────────────────────────────────────

export function retrieveContext(profile: TaskProfile): ContextItem[] {
  const sources = SOURCE_MAP[profile.type]
  const keywords = profile.keywords.length > 0 ? profile.keywords : extractKeywords(profile.venture + ' task', 5)
  
  // Primary sources
  let items = sources.primary
    .filter(s => !sources.exclude.includes(s))
    .flatMap(s => fetchSource(s, profile, keywords))
  
  // Secondary sources if primary returned few items
  if (items.length < 3) {
    const alreadyFetched = new Set(items.map(i => i.source))
    const secondaryItems = sources.secondary
      .filter(s => !alreadyFetched.has(s) && !sources.exclude.includes(s))
      .flatMap(s => fetchSource(s, profile, keywords))
      .map(i => ({ ...i, relevance: 0.5 }))
    items = [...items, ...secondaryItems]
  }
  
  return items
}
