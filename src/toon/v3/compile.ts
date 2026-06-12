// src/toon/v3/compile.ts — Build engine.bin on yvon integrate
//
// Scans project docs + memories, strips, chunks, indexes, trains BPE,
// and compiles everything into a single JSON blob at .toon/v3/engine.bin.
// Loaded once at first Claude call, cached in memory forever.

import { strip } from '../v2/stripper'
import { stem } from './stemmer'
import { trainBPE, BPETable } from './bpe'
import { Chunk, EngineData } from './engine'
import { createHash } from 'crypto'
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs'
import { join, extname, relative } from 'path'

export interface CompileOptions {
  projectRoot: string
  outPath?: string
  maxMergeIterations?: number
}

export interface CompileResult {
  path: string
  docCount: number
  chunkCount: number
  corpusSize: number
  bpeTokens: number
  indexSize: number
}

export function compile(options: CompileOptions): CompileResult {
  const root = options.projectRoot
  const outPath = options.outPath || join(root, '.toon', 'v3', 'engine.bin')

  // 1. Collect all documents and memories
  const docs = collectFiles(join(root, 'docs'), '.md')
  const mems = [
    ...collectFiles(join(root, 'agent-department'), '.md').filter(f => f.includes('MEMORY') || f.includes('AGENT')),
    ...collectFiles(join(root, 'agent-memory'), '.md').filter(f => f.includes('MEMORY') || f.includes('AGENT')),
  ]

  // 2. Strip + chunk all files
  const allChunks: Chunk[] = []
  const docTrees: Record<string, string> = {}
  const allText: string[] = []
  let chunkId = 0

  for (const file of [...docs, ...mems]) {
    if (!existsSync(file)) continue
    const content = readFileSync(file, 'utf-8')
    const stripped = strip(content)
    const docId = relative(root, file).replace(/\.[^.]+$/, '')
    allText.push(stripped.output)

    // Build doc tree (H1/H2 headings only)
    const treeLines: string[] = []
    const chunks = chunkDocument(stripped.output, docId, chunkId)
    for (const c of chunks) {
      if (c.level <= 2) treeLines.push(`${'#'.repeat(c.level)} ${c.heading}`)
      c.hash = hashChunk(c.body)
      c.keywords = extractKeywords(c.body + ' ' + c.heading)
      c.bigrams = extractBigrams(c.keywords)
      allChunks.push(c)
      chunkId++
    }
    docTrees[docId] = treeLines.join('\n')
  }

  // 3. Build inverted index with IDF filtering
  // First pass: count document frequency per keyword
  const docFreq = new Map<string, number>()
  for (const chunk of allChunks) {
    for (const kw of chunk.keywords) {
      docFreq.set(kw, (docFreq.get(kw) || 0) + 1)
    }
  }
  // Filter: only keep keywords that appear in <15% of chunks (distinctive)
  for (const chunk of allChunks) {
    chunk.keywords = chunk.keywords.filter(kw => (docFreq.get(kw) || 0) < allChunks.length * 0.15)
  }

  const invertedIndex: Record<string, number[]> = {}
  const bigramIndex: Record<string, number[]> = {}

  for (const chunk of allChunks) {
    for (const kw of chunk.keywords) {
      if (!invertedIndex[kw]) invertedIndex[kw] = []
      invertedIndex[kw].push(chunk.id)
    }
    for (const bg of chunk.bigrams) {
      if (!bigramIndex[bg]) bigramIndex[bg] = []
      bigramIndex[bg].push(chunk.id)
    }
  }

  // 4. Train BPE on all stripped text
  const corpus = allText.join(' ')
  const bpeTable = trainBPE(corpus, options.maxMergeIterations || 256)

  // 5. Compile to blob
  const engineData: EngineData = {
    chunks: allChunks.map(c => ({ ...c, body: c.body.slice(0, 500) })), // cap body size
    invertedIndex,
    bigramIndex,
    bpeTable: {
      merges: bpeTable.merges,
      vocab: Object.fromEntries((bpeTable.vocab as Map<string,string>).entries()),
      reverse: Object.fromEntries((bpeTable.reverse as Map<string,string>).entries()),
    },
    docTree: docTrees,
    trainedAt: new Date().toISOString(),
    corpusSize: corpus.length,
    chunkCount: allChunks.length,
  }

  mkdirSync(join(outPath, '..'), { recursive: true })
  writeFileSync(outPath, JSON.stringify(engineData))

  return {
    path: outPath,
    docCount: docs.length + mems.length,
    chunkCount: allChunks.length,
    corpusSize: corpus.length,
    bpeTokens: Number((bpeTable.vocab as Map<string,string>).size) || 0,
    indexSize: Object.keys(invertedIndex).length,
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function collectFiles(dir: string, ext: string): string[] {
  const files: string[] = []
  if (!existsSync(dir)) return files
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      files.push(...collectFiles(full, ext))
    } else if (entry.name.endsWith(ext)) {
      files.push(full)
    }
  }
  return files
}

function chunkDocument(text: string, docId: string, startId: number): Chunk[] {
  const chunks: Chunk[] = []
  const lines = text.split('\n')
  let current: Chunk | null = null
  let id = startId

  for (const line of lines) {
    const m = line.match(/^(#{1,4})\s+(.+)/)
    if (m) {
      if (current) chunks.push(current)
      current = {
        id: id++,
        docId,
        level: m[1].length,
        heading: m[2],
        body: '',
        keywords: [],
        bigrams: [],
        hash: '',
      }
    } else if (current && line.trim()) {
      current.body += line + '\n'
    }
  }
  if (current) chunks.push(current)
  return chunks
}

function extractKeywords(text: string): string[] {
  const words = text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2)
    .filter(w => !/^(the|and|for|with|that|this|from|have|been|were|they|them|their|about|which|when|would|could|should|what|are|not|but|its|all|can|has|had|was|you|your|our|its|his|her|who|how|did|does|will|may|get|got|put|set|let|see|use|make|made|just|also|into|over|than|then|only|other|some|such|each|more|very|much|many|well|back|down|even|most|new|now|one|two|out|way|say|like|know|take|come|think|look|want|give|find|tell|ask|try|leave|keep|let|seem|feel|need|mean|become|show|call|work|still|last|between|same|part|place|year|thing|name|type|form|case|point|group|number|world|hand|side|kind|home|line|word|end|life|day|man|men|woman|women|child|people|person|state|country|school|house|family|problem|fact|idea|question|story|night|lot|right|left|top|bottom|front|back|high|low|small|large|long|short|little|big|early|late|young|old|good|bad|great|different|important|public|private|whole|certain|possible|hard|easy|able|open|close|full|free|real|true|false|ready|sure|clear|common|special|strong|simple|human|local|social|national|political|economic|military|cultural|religious|natural)$/.test(w))
    .map(stem)
  return [...new Set(words)].slice(0, 15)
}

function extractBigrams(keywords: string[]): string[] {
  const bigrams: string[] = []
  for (let i = 0; i < keywords.length - 1; i++) {
    bigrams.push(keywords[i] + '_' + keywords[i + 1])
  }
  return bigrams
}

function hashChunk(body: string): string {
  return createHash('sha256').update(body).digest('hex').slice(0, 8)
}
