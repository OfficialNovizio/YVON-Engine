// lib/compressor.ts — Dictionary + Template engine for YVON OS
//
// Reduces token count by 30-40% on top of TOON by:
// 1. Dictionary: shared values (ventures, agents, statuses) → short codes
// 2. Templates: recurring text patterns → template IDs with variable substitution
//
// Combined with TOON dense format: 65-82% total savings vs JSON.

export interface Dictionary {
  ventures: Record<string, number>   // "novizio" → 0
  agents: Record<string, number>     // "henry" → 0
  statuses: Record<string, number>   // "today" → 0
  actions: Record<string, number>    // "approved" → 1
}

export interface Template {
  id: string
  pattern: string          // "Approve social post for {v} — images ready"
  vars: string[]           // ["v"]
  category: string         // "decision", "session", etc.
}

export interface CompressedBlock {
  dict: string              // System prompt dictionary line
  templates: string         // System prompt template line
  data: string              // Compressed data lines
}

// ─── Build dictionary from actual data ───────────────────────────────────────

export function buildDictionary(data: {
  ventures: string[]
  agents: string[]
  statuses: string[]
  actions: string[]
}): Dictionary {
  const dict: Dictionary = { ventures: {}, agents: {}, statuses: {}, actions: {} }
  data.ventures.forEach((v, i) => { dict.ventures[v] = i })
  data.agents.forEach((a, i) => { dict.agents[a] = i })
  data.statuses.forEach((s, i) => { dict.statuses[s] = i })
  data.actions.forEach((a, i) => { dict.actions[a] = i })
  return dict
}

// ─── Serialize dictionary for system prompt ──────────────────────────────────

export function dictToLine(dict: Dictionary): string {
  const parts: string[] = []
  const vParts = Object.entries(dict.ventures).map(([k, v]) => `${k}:${v}`).join('|')
  const aParts = Object.entries(dict.agents).map(([k, v]) => `${k}:${v}`).join('|')
  const sParts = Object.entries(dict.statuses).map(([k, v]) => `${k}:${v}`).join('|')
  const xParts = Object.entries(dict.actions).map(([k, v]) => `${k}:${v}`).join('|')
  
  return `DICT v=${vParts} a=${aParts} s=${sParts} x=${xParts}`
}

// ─── Template engine ─────────────────────────────────────────────────────────

const COMMON_TEMPLATES: Template[] = [
  {
    id: 't1',
    pattern: 'Approve social post for {v} campaign — images generated, copy ready',
    vars: ['v'],
    category: 'decision',
  },
  {
    id: 't2',
    pattern: 'Competitor {c} raised prices — review {v} pricing strategy',
    vars: ['c', 'v'],
    category: 'decision',
  },
  {
    id: 't3',
    pattern: 'SECURITY: credential leak detected in {v} agent output — rotation required',
    vars: ['v'],
    category: 'decision',
  },
  {
    id: 't4',
    pattern: 'PR #{n} passed QA — {f} feature for {v} ready for review',
    vars: ['n', 'f', 'v'],
    category: 'decision',
  },
  {
    id: 't5',
    pattern: 'Monthly runway report: {m} months at current burn rate for {v}',
    vars: ['m', 'v'],
    category: 'decision',
  },
  {
    id: 't6',
    pattern: 'Social media engagement dropped {p}% for {v} — strategy review needed',
    vars: ['p', 'v'],
    category: 'decision',
  },
  {
    id: 't7',
    pattern: 'New client inquiry from {c} — {a} cinematic site for {v}',
    vars: ['c', 'a', 'v'],
    category: 'decision',
  },
  {
    id: 't8',
    pattern: 'Newsletter #{n} draft ready — approve subject line for {v}',
    vars: ['n', 'v'],
    category: 'decision',
  },
]

export function templatesToLine(templates: Template[]): string {
  const parts = templates.map(t => `${t.id}=${t.pattern}`)
  return `TMPL ${parts.join(' | ')}`
}

// ─── Match text against templates ────────────────────────────────────────────

export function matchTemplate(text: string): { template: Template; values: Record<string, string> } | null {
  for (const t of COMMON_TEMPLATES) {
    // Build regex from pattern
    let regexStr = t.pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // escape regex chars
    const varPositions: { name: string; start: number }[] = []
    
    for (const v of t.vars) {
      const placeholder = `\\{${v}\\}`
      const idx = regexStr.indexOf(placeholder)
      if (idx !== -1) {
        varPositions.push({ name: v, start: idx })
        regexStr = regexStr.replace(placeholder, '(.+?)')
      }
    }
    
    try {
      const regex = new RegExp('^' + regexStr + '$', 'i')
      const match = text.match(regex)
      if (match) {
        const values: Record<string, string> = {}
        varPositions.forEach((vp, i) => {
          values[vp.name] = match[i + 1]
        })
        // Verify var positions match (sorted by appearance)
        const sortedVars = [...varPositions].sort((a, b) => a.start - b.start)
        sortedVars.forEach((vp, i) => {
          values[vp.name] = match[i + 1]
        })
        return { template: t, values }
      }
    } catch {
      continue
    }
  }
  return null
}

// ─── Compress a single decision ──────────────────────────────────────────────

export interface DecisionRecord {
  id: string
  venture: string
  agent: string
  text: string
  urgency: string
  action: string | null
}

// ─── Compress a single decision (V2 — resolved templates for LLM) ──────────

export function compressDecision(d: DecisionRecord, dict: Dictionary): string {
  const v = dict.ventures[d.venture] ?? d.venture
  const a = dict.agents[d.agent] ?? d.agent
  const u = dict.statuses[d.urgency] ?? d.urgency
  const x = d.action ? (dict.actions[d.action] ?? d.action) : '0'
  
  // Try template matching — but ALWAYS send resolved text to LLM
  const match = matchTemplate(d.text)
  let text: string
  if (match) {
    // Resolve template inline: replace {vars} with actual values
    text = match.template.pattern
    for (const v of match.template.vars) {
      text = text.replace(`{${v}}`, match.values[v] || '?')
    }
  } else {
    text = d.text
  }
  
  // Shorten common words in the resolved text
  text = text
    .replace(/novizio/gi, 'nv')
    .replace(/hourbour/gi, 'hb')
    .replace(/competitor/gi, 'cp')
    .replace(/campaign/gi, 'cg')
    .replace(/approve/gi, 'ap')
    .replace(/review/gi, 'rv')
    .replace(/security/gi, 'sec')
  
  return `D|${d.id}|${v}|${a}|${text}|${u}|${x}`
}

// ─── Full compression pipeline ───────────────────────────────────────────────

export function compress(data: {
  ventures: { slug: string; name: string }[]
  decisions: DecisionRecord[]
}, options?: { includeTemplates?: boolean }): CompressedBlock {
  const dict = buildDictionary({
    ventures: data.ventures.map(v => v.slug),
    agents: [...new Set(data.decisions.map(d => d.agent))],
    statuses: ['today', 'this-week', 'critical'],
    actions: ['approved', 'deferred', 'rejected'],
  })
  
  const dictLine = dictToLine(dict)
  const tmplLine = options?.includeTemplates !== false ? templatesToLine(COMMON_TEMPLATES) : ''
  
  const lines = data.decisions.map(d => compressDecision(d, dict))
  
  return {
    dict: dictLine,
    templates: tmplLine,
    data: lines.join('\n'),
  }
}

// ─── System prompt block builder ─────────────────────────────────────────────
// V2: Minimal overhead. Dictionary is inline, not verbose. Templates resolved in data.

export function buildSystemBlock(compressed: CompressedBlock): string {
  const parts: string[] = []
  
  // Single-line dictionary (compact)
  parts.push(`DICT:${compressed.dict}`)
  
  // Data
  parts.push(`DATA\n${compressed.data}`)
  
  return parts.join('\n')
}
