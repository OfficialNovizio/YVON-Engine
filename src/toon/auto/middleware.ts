// src/toon/auto/middleware.ts — TOON Auto-Compression Middleware
//
// Runtime middleware. Every Claude/LLM call passes through this automatically
// after `yvon integrate` wires it in. No manual code changes needed.
//
// What it does on EVERY call:
// 1. Compress user prompt (dictionary substitution + template matching)
// 2. Inject project dictionary into system prompt
// 3. Load and inject relevant TOON-compressed documents
// 4. Load and inject TOON-compressed agent memory
// 5. Add TOON output format instruction for data tasks
//
// Zero overhead when TOON is disabled (single boolean check).

import { existsSync, readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { encodePrompt, ABBREV_MAP, abbreviateText } from './encoder'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ToonContext {
  compressedUserMessage: string
  dictionary: string
  relevantDocs: string
  relevantMemory: string
  outputInstruction: string
  stats: {
    originalLength: number
    compressedLength: number
    savingsPercent: number
    docsInjected: number
    memoryEntries: number
  }
}

export interface ToonMiddlewareOptions {
  systemPrompt: string
  userMessage: string
  agentId?: string | null
  ventureId?: string | null
  projectRoot?: string
}

// ─── Caches ───────────────────────────────────────────────────────────────────

let _dictionaryCache: string | null = null
let _dictionaryCacheTime = 0
const DICT_CACHE_TTL = 300000 // 5 minutes

let _termMapCache: Record<string, string> | null = null

// ─── Main Middleware ──────────────────────────────────────────────────────────

export function autoToonMiddleware(options: ToonMiddlewareOptions): ToonContext {
  const root = options.projectRoot || process.cwd()
  const dict = loadDictionary(root)
  const termMap = loadTermMap(root)

  // 1. Compress user message
  const compressed = compressText(options.userMessage, termMap)

  // 2. Load relevant TOON documents
  const docs = findRelevantToonDocs(root, options.userMessage, options.agentId)

  // 3. Load agent memory in TOON format
  const memory = loadAgentMemory(root, options.agentId)

  // 4. Output format instruction for data-heavy tasks
  const outputInst = shouldUseToonOutput(options.userMessage)
    ? '\n[TOON OUTPUT FORMAT: Respond using pipe-delimited fields. One record per line. No markdown, no prose. Fields: type|id|value1|value2|...]'
    : ''

  return {
    compressedUserMessage: compressed,
    dictionary: dict,
    relevantDocs: docs,
    relevantMemory: memory,
    outputInstruction: outputInst,
    stats: {
      originalLength: options.userMessage.length,
      compressedLength: compressed.length,
      savingsPercent: Math.round((1 - compressed.length / Math.max(1, options.userMessage.length)) * 100),
      docsInjected: docs ? docs.split('\n').filter(l => l.startsWith('S|')).length : 0,
      memoryEntries: memory ? memory.split('\n').filter(l => l.startsWith('M|')).length : 0,
    },
  }
}

// ─── Dictionary Loader ────────────────────────────────────────────────────────

function loadDictionary(root: string): string {
  const now = Date.now()
  if (_dictionaryCache && (now - _dictionaryCacheTime) < DICT_CACHE_TTL) {
    return _dictionaryCache
  }

  const dictPath = join(root, '.toon', 'dictionary.toon')
  if (!existsSync(dictPath)) {
    return generateInlineDictionary()
  }

  try {
    const content = readFileSync(dictPath, 'utf-8')
    const lines = content.split('\n').filter(l => l.startsWith('DICT '))
    _dictionaryCache = lines.join('\n')
    _dictionaryCacheTime = now
    return _dictionaryCache
  } catch {
    return generateInlineDictionary()
  }
}

function loadTermMap(root: string): Record<string, string> {
  if (_termMapCache) return _termMapCache

  // Try loading from .toon/dictionary.toon
  const dictPath = join(root, '.toon', 'dictionary.toon')
  if (existsSync(dictPath)) {
    try {
      const content = readFileSync(dictPath, 'utf-8')
      const dictTerms: Record<string, string> = {}
      for (const line of content.split('\n')) {
        if (line.startsWith('DICT t=')) {
          const terms = line.replace('DICT t=', '')
          for (const pair of terms.split('|')) {
            const [term, abbr] = pair.split(':')
            if (term && abbr) dictTerms[term] = abbr
          }
        }
      }
      if (Object.keys(dictTerms).length > 0) {
        _termMapCache = dictTerms
        return _termMapCache
      }
    } catch {}
  }

  // Use comprehensive ABBREV_MAP from encoder
  _termMapCache = ABBREV_MAP
  return _termMapCache
}

// getBuiltinTermMap removed — replaced by ABBREV_MAP from encoder

function generateInlineDictionary(): string {
  return `DICT v=novizio:0|hourbour:1|yvon-dashboard:2
DICT a=marcus:0|diana:1|dev:2|raj:3|mia:4|quinn:5|kai:6|lena:7|rio:8|nate:9|atlas:10|pixel:11|felix:12
DICT s=today:0|this-week:1|critical:2|low:3
DICT x=approved:0|deferred:1|rejected:2|pending:3`
}

// ─── Text Compressor ──────────────────────────────────────────────────────────

function compressText(text: string, _termMap: Record<string, string>): string {
  // Use the real encoder for structured prompt compression
  const result = encodePrompt(text)

  // If encoder found structure, return TOON records
  if (result.records.length > 1) {
    return result.compressed
  }

  // Fallback: comprehensive abbreviation substitution
  return abbreviateText(text)
    .replace(/\s+/g, ' ').trim()
    // Remove filler phrases
    .replace(/please note that /gi, '')
    .replace(/I would like to /gi, '')
    .replace(/can you please /gi, '')
    .replace(/could you /gi, '')
    .replace(/I need you to /gi, '')
    .replace(/I want you to /gi, '')
    .replace(/would you be able to /gi, '')
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// ─── Document Loader ──────────────────────────────────────────────────────────

function findRelevantToonDocs(root: string, userMessage: string, agentId?: string | null): string {
  const toonDocDir = join(root, '.toon', 'docs')
  if (!existsSync(toonDocDir)) return ''

  try {
    // Extract keywords from user message
    const words = userMessage.toLowerCase().split(/\s+/)
    const keywords = new Set(words.filter(w => w.length > 3))

    // Find relevant TOON docs
    const relevant: string[] = []
    const docFiles = scanToonFiles(toonDocDir)

    for (const docFile of docFiles.slice(0, 5)) { // Max 5 docs per call
      try {
        const content = readFileSync(docFile, 'utf-8')

        // Simple relevance check: keyword overlap
        const docWords = content.toLowerCase().split(/\s+/)
        const overlap = docWords.filter(w => keywords.has(w)).length

        if (overlap >= 2 || docFile.includes(agentId || '')) {
          relevant.push(content)
        }
      } catch {}
    }

    return relevant.join('\n')
  } catch {
    return ''
  }
}

function scanToonFiles(dir: string): string[] {
  const files: string[] = []
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) {
        files.push(...scanToonFiles(full))
      } else if (entry.name.endsWith('.toon')) {
        files.push(full)
      }
    }
  } catch {}
  return files
}

// ─── Agent Memory Loader ──────────────────────────────────────────────────────

function loadAgentMemory(root: string, agentId?: string | null): string {
  if (!agentId) return ''

  const toonMemDir = join(root, '.toon', 'memory')
  if (!existsSync(toonMemDir)) return ''

  // Find memory file for this agent
  const files = scanToonFiles(toonMemDir)
  const agentFile = files.find(f => f.includes(agentId))

  if (!agentFile) return ''

  try {
    const content = readFileSync(agentFile, 'utf-8')
    // Return only the most recent entries (last 20 lines)
    const lines = content.split('\n').filter(l => l.startsWith('M|'))
    return lines.slice(-20).join('\n')
  } catch {
    return ''
  }
}

// ─── Output Format Detection ──────────────────────────────────────────────────

function shouldUseToonOutput(userMessage: string): boolean {
  const dataKeywords = [
    'list', 'show', 'get', 'fetch', 'query', 'find', 'search',
    'all', 'every', 'each', 'count', 'how many',
    'filter', 'sort', 'group', 'aggregate',
    'table', 'columns', 'rows', 'data',
    'decisions', 'tasks', 'agents', 'competitors', 'ventures',
    'report', 'summary', 'overview',
  ]

  const lower = userMessage.toLowerCase()
  const matches = dataKeywords.filter(kw => lower.includes(kw))
  return matches.length >= 2 && userMessage.length > 100
}
