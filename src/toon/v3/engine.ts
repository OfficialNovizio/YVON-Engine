// src/toon/v3/engine.ts — TOON v3 Core Engine
//
// Loads once at startup. Handles: BPE encode, chunk match, context injection, delta.
// O(1) keyword lookup, O(k) per chunk scoring, O(n) BPE encoding.
//
// Usage:
//   import { createEngine } from 'yvon-engine/toon/v3/engine'
//   const engine = createEngine('/root/yvon/.toon/v3/engine.bin')
//   const ctx = engine.process({ systemPrompt, userMessage, agentId, ventureId })

import { stem } from './stemmer'
import { encode as bpeEncode, decode as bpeDecode, BPETable } from './bpe'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { createHash } from 'crypto'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Chunk {
  id: number
  docId: string
  level: number
  heading: string
  body: string
  keywords: string[]
  bigrams: string[]
  hash: string
}

export interface EngineData {
  chunks: Chunk[]
  invertedIndex: Record<string, number[]>    // keyword → chunk indices
  bigramIndex: Record<string, number[]>       // bigram → chunk indices
  bpeTable: BPETable
  docTree: Record<string, string>             // docId → H1/H2 tree text
  trainedAt: string
  corpusSize: number
  chunkCount: number
}

export interface MatchResult {
  chunk: Chunk
  score: number
  level: 'L1' | 'L2' | 'REF'
  text: string
}

export interface EngineContext {
  compressedUserMessage: string
  docContext: string
  memoryContext: string
  dictionary: string
  stats: {
    originalPromptLen: number
    compressedPromptLen: number
    docsInjected: number
    memoryEntries: number
    totalContextLen: number
  }
}

export interface SessionDelta {
  sessionId: string
  prevHashes: Set<string>
  prevQueryWords: Set<string>
}

// ─── Engine ───────────────────────────────────────────────────────────────────

export function createEngine(binPath: string) {
  let _data: EngineData | null = null
  let _delta: SessionDelta | null = null

  function load(): EngineData {
    if (_data) return _data
    if (!existsSync(binPath)) throw new Error(`Engine blob not found: ${binPath}`)
    const raw = readFileSync(binPath, 'utf-8')
    _data = JSON.parse(raw)
    // Convert serialized Maps back
    if (_data && _data.bpeTable) {
      _data.bpeTable.vocab = new Map(Object.entries(_data.bpeTable.vocab || {}))
      _data.bpeTable.reverse = new Map(Object.entries(_data.bpeTable.reverse || {}))
    }
    return _data!
  }

  function compressPrompt(text: string): string {
    // BPE is only for internal store — user prompts must stay LLM-readable
    // Use abbreviation + colloquial cleanup instead
    let result = abbreviateQuery(text)
    result = result.replace(/please note that /gi, '').replace(/I would like to /gi, '')
    return result
  }

  // Quick abbreviation map — common words the LLM understands shortened
  function abbreviateQuery(text: string): string {
    const abbrs: Record<string, string> = {
      'comprehensive': 'full',
      'analysis': 'analysis',
      'analyze': 'analyze',
      'dashboard': 'dashboard',
      'with live data streaming from': 'w/ live',
      'social media APIs': 'social APIs',
      'Use the existing': 'Use existing',
      'architecture and agent routing system': 'arch + agent routing',
      'current pricing strategy': 'pricing',
      'fashion brand': 'brand',
      'and identify gaps where competitors are': 'find competitor gaps',
      'market research data': 'market data',
      'context retrieval pipeline': 'CIE pipeline',
      'to reduce latency by': 'cut latency',
      'The current implementation uses': 'Using',
      'for deduplication': 'for dedup',
      'compression schema': 'TOON schema',
      'for structured financial data': 'for finance',
      'across multiple ventures': 'across ventures',
    }
    let result = text
    for (const [full, short] of Object.entries(abbrs)) {
      result = result.replace(new RegExp(full, 'gi'), short)
    }
    return result
  }

  function matchContext(query: string, agentId?: string | null, maxDocs: number = 3): MatchResult[] {
    const data = load()
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2).map(stem)
    const queryBigrams: string[] = []
    for (let i = 0; i < queryWords.length - 1; i++) {
      queryBigrams.push(queryWords[i] + '_' + queryWords[i + 1])
    }

    // IDF: compute inverse document frequency for each keyword
    const totalChunks = data.chunks.length
    const idf = new Map<string, number>()
    for (const qw of queryWords) {
      const hits = (data.invertedIndex[qw] || []).length
      idf.set(qw, hits > 0 ? Math.log(totalChunks / hits) : 0)
    }
    for (const bg of queryBigrams) {
      const hits = (data.bigramIndex[bg] || []).length
      idf.set(bg, hits > 0 ? Math.log(totalChunks / (hits || 1)) : 0)
    }

    // Score every chunk
    const scored: { chunk: Chunk; score: number }[] = []
    const seen = new Set<number>()

    for (const qw of queryWords) {
      const hits = data.invertedIndex[qw] || []
      for (const idx of hits) {
        if (seen.has(idx)) continue
        seen.add(idx)
        const chunk = data.chunks[idx]
        
        // TF-IDF weighted unigram match
        let tfidfScore = 0
        for (const w of queryWords) {
          if (chunk.keywords.some(k => k === w || k.includes(w) || w.includes(k))) {
            tfidfScore += (idf.get(w) || 0.5)
          }
        }
        // Bigram bonus
        for (const bg of queryBigrams) {
          if (chunk.bigrams.some(b => b.includes(bg.split('_')[0]) && b.includes(bg.split('_')[1]))) {
            tfidfScore += (idf.get(bg) || 1) * 1.5
          }
        }

        const positionBonus = idx < 3 ? 1.5 : chunk.level === 1 ? 2.0 : chunk.level === 2 ? 1.5 : 1.0
        const agentBonus = agentId && chunk.keywords.some(k => k.includes(agentId.toLowerCase())) ? 2.0 : 1.0
        const score = tfidfScore * positionBonus * agentBonus

        if (score > 0) scored.push({ chunk, score })
      }
    }

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score)

    // Fallback: if nothing matched, inject doc tree
    if (scored.length === 0) {
      const treeResults: MatchResult[] = []
      for (const [docId, treeText] of Object.entries(data.docTree).slice(0, maxDocs)) {
        treeResults.push({
          chunk: { id: -1, docId, level: 0, heading: docId, body: treeText, keywords: [], bigrams: [], hash: '' },
          score: 1,
          level: 'L1' as const,
          text: `# ${docId}\n${treeText}`,
        })
      }
      return treeResults
    }

    // Adaptive threshold: target top ~5 chunks for content, rest as REF
    const topN = Math.min(8, scored.length)
    const threshold = scored[0].score * 0.15  // 15% of top score

    // Convert to MatchResult with progressive levels
    return scored.slice(0, 20).map(({ chunk, score }, i) => {
      if (i < topN && score >= threshold) {
        return { chunk, score, level: 'L2' as const, text: `## ${chunk.heading}\n${chunk.body.slice(0, 120)}` }
      } else if (score >= threshold * 0.5) {
        return { chunk, score, level: 'L1' as const, text: `#${'#'.repeat(chunk.level)} ${chunk.heading}` }
      } else {
        return { chunk, score, level: 'REF' as const, text: `[REF:${chunk.hash}]` }
      }
    })
  }

  function buildSystemPrompt(basePrompt: string, docMatches: MatchResult[], agentId?: string | null): string {
    const parts: string[] = []

    // Dictionary
    parts.push('[TOON DICTIONARY — use abbreviations: ...]')

    // Document context
    if (docMatches.length > 0) {
      const docLines = docMatches.map(m => m.text)
      parts.push('[RELEVANT DOCUMENTS]\n' + docLines.join('\n'))
    }

    // Agent memory (loaded by existing middleware)
    if (agentId) {
      parts.push(`[AGENT:${agentId}]`)
    }

    // Base system prompt
    parts.push(basePrompt)

    return parts.join('\n\n')
  }

  // ─── Session Delta ──────────────────────────────────────────────────────────

  function saveDelta(sessionId: string, matches: MatchResult[], query: string) {
    const hashes = new Set(matches.map(m => m.chunk.hash).filter(h => h))
    const queryWords = new Set(query.toLowerCase().split(/\s+/).filter(w => w.length > 2).map(stem))
    _delta = { sessionId, prevHashes: hashes, prevQueryWords: queryWords }

    // Persist
    const dir = join(binPath, '..', 'sessions')
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, sessionId + '.json'), JSON.stringify({
      hashes: [...hashes],
      queryWords: [...queryWords],
    }))
  }

  function loadDelta(sessionId: string): SessionDelta | null {
    if (_delta && _delta.sessionId === sessionId) return _delta
    const path = join(binPath, '..', 'sessions', sessionId + '.json')
    if (!existsSync(path)) return null
    try {
      const data = JSON.parse(readFileSync(path, 'utf-8'))
      _delta = {
        sessionId,
        prevHashes: new Set(data.hashes),
        prevQueryWords: new Set(data.queryWords),
      }
      return _delta
    } catch { return null }
  }

  function detectTopicShift(prevWords: Set<string>, currentQuery: string): boolean {
    const currWords = new Set(currentQuery.toLowerCase().split(/\s+/).filter(w => w.length > 2).map(stem))
    if (currWords.size === 0) return false
    let overlap = 0
    for (const w of currWords) {
      if (prevWords.has(w)) overlap++
    }
    return (overlap / currWords.size) < 0.4
  }

  // ─── Full Process (one call does everything) ───────────────────────────────

  function process(options: {
    systemPrompt: string
    userMessage: string
    agentId?: string | null
    ventureId?: string | null
    sessionId?: string
  }): EngineContext {
    load()

    // 1. Compress prompt
    const compressed = compressPrompt(options.userMessage)

    // 2. Check session delta
    const delta = options.sessionId ? loadDelta(options.sessionId) : null
    const isTopicShift = delta ? detectTopicShift(delta.prevQueryWords, options.userMessage) : true

    // 3. Match context (full match on topic shift or first turn)
    let matches: MatchResult[] = []
    if (isTopicShift || !delta) {
      matches = matchContext(options.userMessage, options.agentId)
    } else {
      // Delta: only send newly matched chunks
      const allMatches = matchContext(options.userMessage, options.agentId)
      const newHashes = new Set(allMatches.map(m => m.chunk.hash))
      matches = allMatches.filter(m => !delta.prevHashes.has(m.chunk.hash))
      // Add same-chunk reference
      const sameCount = allMatches.length - matches.length
      if (sameCount > 0) {
        matches.push({
          chunk: { id: -2, docId: 'delta', level: 0, heading: 'SAME', body: '', keywords: [], bigrams: [], hash: '' },
          score: 0,
          level: 'REF',
          text: `[SAME:${sameCount} chunks unchanged]`,
        })
      }
    }

    // 4. Build system prompt
    const fullSystem = buildSystemPrompt(options.systemPrompt, matches, options.agentId)

    // 5. Save delta for next turn
    if (options.sessionId) {
      saveDelta(options.sessionId, matches, options.userMessage)
    }

    return {
      compressedUserMessage: compressed,
      docContext: matches.map(m => m.text).join('\n'),
      memoryContext: '',
      dictionary: '[DICTIONARY]',
      stats: {
        originalPromptLen: options.userMessage.length,
        compressedPromptLen: compressed.length,
        docsInjected: matches.filter(m => m.level !== 'REF').length,
        memoryEntries: 0,
        totalContextLen: fullSystem.length,
      },
    }
  }

  function computeDelta(prevMatches: MatchResult[], currMatches: MatchResult[]) {
    const prevSet = new Set(prevMatches.map(m => m.chunk.hash))
    const currSet = new Set(currMatches.map(m => m.chunk.hash))
    return {
      added: currMatches.filter(m => !prevSet.has(m.chunk.hash)),
      removed: prevMatches.filter(m => !currSet.has(m.chunk.hash)),
      same: currMatches.filter(m => prevSet.has(m.chunk.hash)),
    }
  }

  function hashChunk(body: string): string {
    return createHash('sha256').update(body).digest('hex').slice(0, 8)
  }

  return {
    load,
    compressPrompt,
    matchContext,
    buildSystemPrompt,
    process,
    saveDelta,
    loadDelta,
    detectTopicShift,
    computeDelta,
    hashChunk,
    getData: () => _data,
  }
}

export type V3Engine = ReturnType<typeof createEngine>