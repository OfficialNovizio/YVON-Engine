// lib/cie/algorithms.ts — Verified DSA implementations for CIE
//
// Bloom Filter:     O(1) context deduplication
// MinHash:          O(n) near-duplicate detection  
// TF-IDF:           Relevance scoring for context retrieval
// BFS Blast Radius:  Dependency impact analysis
// Priority Queue:   Top-K capped context selection

// ─── Bloom Filter ────────────────────────────────────────────────────────────

export class BloomFilter {
  private size: number
  private hashCount: number
  private bits: boolean[]

  constructor(size: number = 1024, hashCount: number = 3) {
    this.size = size
    this.hashCount = hashCount
    this.bits = new Array(size).fill(false)
  }

  private hash(item: string, seed: number): number {
    let h = seed
    for (let i = 0; i < item.length; i++) {
      h = ((h << 5) - h + item.charCodeAt(i)) | 0
    }
    return Math.abs(h) % this.size
  }

  add(item: string): void {
    for (let i = 0; i < this.hashCount; i++) {
      this.bits[this.hash(item, i)] = true
    }
  }

  contains(item: string): boolean {
    for (let i = 0; i < this.hashCount; i++) {
      if (!this.bits[this.hash(item, i)]) return false
    }
    return true
  }
}

// ─── MinHash ─────────────────────────────────────────────────────────────────

export function minhashSignature(text: string, numHashes: number = 64): number[] {
  const words = new Set(text.toLowerCase().split(/\s+/))
  const sig: number[] = new Array(numHashes).fill(Infinity)
  
  for (const word of words) {
    for (let i = 0; i < numHashes; i++) {
      let h = i
      for (let j = 0; j < word.length; j++) {
        h = ((h << 5) - h + word.charCodeAt(j)) | 0
      }
      h = Math.abs(h) % (2 ** 31)
      sig[i] = Math.min(sig[i], h)
    }
  }
  
  return sig
}

export function jaccardEstimate(sig1: number[], sig2: number[]): number {
  let matches = 0
  for (let i = 0; i < sig1.length; i++) {
    if (sig1[i] === sig2[i]) matches++
  }
  return matches / sig1.length
}

// ─── TF-IDF ──────────────────────────────────────────────────────────────────

interface TfidfDocument {
  id: string
  content: string
  wordCount: number
}

export class TfidfIndex {
  private documents: Map<string, TfidfDocument> = new Map()
  private df: Map<string, number> = new Map()
  private N: number = 0

  add(docId: string, content: string): void {
    const words = content.toLowerCase().split(/\s+/)
    this.documents.set(docId, {
      id: docId,
      content,
      wordCount: words.length,
    })
    this.N++
    
    const seen = new Set<string>()
    for (const w of words) {
      if (!seen.has(w)) {
        this.df.set(w, (this.df.get(w) ?? 0) + 1)
        seen.add(w)
      }
    }
  }

  private idf(word: string): number {
    const df = this.df.get(word) ?? 0
    return Math.log((this.N + 1) / (df + 1)) + 1
  }

  private tf(word: string, doc: TfidfDocument): number {
    if (doc.wordCount === 0) return 0
    const count = doc.content.toLowerCase().split(/\s+/).filter(w => w === word).length
    return count / doc.wordCount
  }

  search(query: string, topK: number = 5): { docId: string; score: number }[] {
    const queryWords = new Set(query.toLowerCase().split(/\s+/))
    const scores: { docId: string; score: number }[] = []
    
    for (const [docId, doc] of this.documents) {
      let score = 0
      for (const w of queryWords) {
        score += this.tf(w, doc) * this.idf(w)
      }
      if (score > 0) {
        scores.push({ docId, score })
      }
    }
    
    scores.sort((a, b) => b.score - a.score)
    return scores.slice(0, topK)
  }
}

// ─── Weighted BFS Blast Radius ───────────────────────────────────────────────

export function blastRadius(
  graph: Record<string, string[]>,
  startNode: string,
  maxDepth: number = 3,
): Map<string, number> {
  const visited = new Map<string, number>()
  const queue: [string, number][] = [[startNode, 0]]
  visited.set(startNode, 0)
  
  while (queue.length > 0) {
    const [current, depth] = queue.shift()!
    if (depth >= maxDepth) continue
    
    for (const neighbor of (graph[current] ?? [])) {
      if (!visited.has(neighbor)) {
        visited.set(neighbor, depth + 1)
        queue.push([neighbor, depth + 1])
      }
    }
  }
  
  return visited
}

// ─── Priority Queue with Character Budget ────────────────────────────────────

interface QueueItem {
  content: string
  priority: number
  source: string
  chars: number
  key: string
}

export class ContextPriorityQueue {
  private heap: QueueItem[] = []
  private bloom: BloomFilter
  private budget: number

  constructor(charBudget: number = 2500) {
    this.budget = charBudget
    this.bloom = new BloomFilter()
  }

  offer(content: string, priority: number, source: string): boolean {
    const key = `${source}:${content.slice(0, 50)}`
    if (this.bloom.contains(key)) return false
    
    const chars = content.length
    this.heap.push({ content, priority, source, chars, key })
    this.heap.sort((a, b) => b.priority - a.priority) // max-heap by priority
    return true
  }

  select(): { content: string; priority: number; source: string }[] {
    const selected: { content: string; priority: number; source: string }[] = []
    let charsUsed = 0
    const remaining: QueueItem[] = []
    
    for (const item of this.heap) {
      if (charsUsed + item.chars > this.budget) {
        remaining.push(item)
        continue
      }
      selected.push({ content: item.content, priority: item.priority, source: item.source })
      charsUsed += item.chars
      this.bloom.add(item.key)
    }
    
    this.heap = remaining
    return selected
  }

  get remaining(): number {
    return this.heap.length
  }
}

// ─── Utility: Keyword extraction ─────────────────────────────────────────────

export function extractKeywords(text: string, maxKeywords: number = 10): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'can', 'shall', 'to', 'of', 'in', 'for',
    'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
    'before', 'after', 'above', 'below', 'between', 'and', 'but', 'or',
    'nor', 'not', 'so', 'yet', 'both', 'either', 'neither', 'each', 'every',
    'all', 'any', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
    'only', 'own', 'same', 'than', 'too', 'very', 'just', 'because',
    'about', 'now', 'then', 'here', 'there', 'when', 'where', 'why', 'how',
    'this', 'that', 'these', 'those', 'it', 'its', 'i', 'we', 'you', 'they',
    'he', 'she', 'his', 'her', 'their', 'our', 'my', 'your', 'me', 'him',
  ])
  
  const words = text.toLowerCase().replace(/[^a-z0-9_./\s-]/g, '').split(/\s+/)
  const freq: Record<string, number> = {}
  
  for (const w of words) {
    if (w.length < 2 || stopWords.has(w)) continue
    freq[w] = (freq[w] ?? 0) + 1
  }
  
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word)
}

// ─── Utility: file path extraction from text ─────────────────────────────────

export function extractFilePaths(text: string): string[] {
  const pattern = /(?:lib|app|components|hooks|scripts|docs)\/[\w./-]+\.(?:ts|tsx|js|jsx|md|sql|css)/g
  const matches = text.match(pattern) ?? []
  return [...new Set(matches)]
}
