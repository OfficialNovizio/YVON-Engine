// lib/cie/builder.ts — Format context into injection blocks
//
// Splits context into two channels:
//  - systemExtension: prose rules for system prompt (priorities 1-5)
//  - dataBlock: TOON-formatted structural data (priorities 6-10)

import type { ContextItem, CieContext } from './types'

// ─── Build system prompt extension (prose) ───────────────────────────────────

function buildSystemExtension(items: ContextItem[]): string {
  if (items.length === 0) return ''
  
  const proseItems = items.filter(i => i.priority >= 6)
  if (proseItems.length === 0) return ''
  
  const lines: string[] = [
    '[CIE CONTEXT — Context Intelligence Engine v1]',
    '',
  ]
  
  // Group by source
  const bySource = new Map<string, ContextItem[]>()
  for (const item of proseItems) {
    const existing = bySource.get(item.source) ?? []
    existing.push(item)
    bySource.set(item.source, existing)
  }
  
  for (const [source, sourceItems] of bySource) {
    const label = sourceLabel(source)
    lines.push(`${label}:`)
    for (const item of sourceItems) {
      lines.push(`- ${item.content}`)
    }
    lines.push('')
  }
  
  lines.push('[End CIE context]')
  return lines.join('\n')
}

// ─── Build dataBlock (TOON dense) ────────────────────────────────────────────

function buildDataBlock(items: ContextItem[]): string {
  const dataItems = items.filter(i => i.priority < 6)
  if (dataItems.length === 0) return ''
  
  // These should already be in TOON format from the source retrievers
  return dataItems.map(i => i.content).join('\n')
}

// ─── Source labels ───────────────────────────────────────────────────────────

function sourceLabel(source: string): string {
  const labels: Record<string, string> = {
    agent_memory:    'AGENT MEMORY',
    hermes_memory:   'HERMES STANDARDS',
    project_docs:    'PROJECT RULES',
    codegraph:       'CODE DEPENDENCIES',
    venture_context: 'VENTURE CONTEXT',
    graphify:        'CODE STRUCTURE',
    session_state:   'SESSION STATE',
  }
  return labels[source] ?? source.toUpperCase()
}

// ─── Main builder ────────────────────────────────────────────────────────────

export function buildInjection(
  selected: ContextItem[],
  filtered: ContextItem[],
  timeMs: number,
): CieContext {
  const systemExtension = buildSystemExtension(selected)
  const dataBlock = buildDataBlock(selected)
  const sourcesUsed = [...new Set(selected.map(i => i.source))]
  const totalChars = selected.reduce((sum, i) => sum + i.chars, 0)
  
  return {
    systemExtension,
    dataBlock,
    sourcesUsed,
    totalChars,
    itemsInjected: selected.length,
    itemsFiltered: filtered.length,
    timeMs,
  }
}
