// lib/cie/sources/hermes-memory.ts — Hermes cross-session memory source
// 
// Vercel-ready: engine.bin is now git-tracked and shipped to production.
// Falls back to local ~/.hermes/ files on VPS for freshness.
// On Vercel: reads USER.md + MEMORY.md data from engine.bin chunks.
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import { getConfig } from '../../adapters/config'
import type { TaskType } from '../types'

let _engineData: any = null
let _engineLoaded = false

function loadEngineData(): any {
  if (_engineLoaded) return _engineData
  _engineLoaded = true
  
  // Try engine.bin first (works on both VPS and Vercel since it's git-tracked)
  const paths = [
    join(process.cwd(), '.toon', 'v3', 'engine.bin'),
    join(process.cwd(), '..', '.toon', 'v3', 'engine.bin'),
  ]
  for (const p of paths) {
    if (existsSync(p)) {
      try {
        _engineData = JSON.parse(readFileSync(p, 'utf-8'))
        return _engineData
      } catch { /* corrupt, fall through */ }
    }
  }
  return null
}

export function getHermesUserContext(): string {
  // 1. Try engine.bin (shipped to Vercel)
  const engine = loadEngineData()
  if (engine?.chunks) {
    const userChunk = engine.chunks.find((c: any) => c.docId === 'hermes/memories/USER')
    if (userChunk) return userChunk.body.slice(0, 300)
  }
  
  // 2. Fallback: local ~/.hermes/ (VPS only)
  const localPath = join(getConfig().hermesMemoryDir || join(homedir(), '.hermes', 'memories'), 'USER.md')
  if (existsSync(localPath)) {
    try {
      return readFileSync(localPath, 'utf-8').slice(0, 300)
    } catch { /* ignore */ }
  }
  
  return ''
}

export function getHermesMemoryContext(keywords: string[]): string {
  // 1. Try engine.bin
  const engine = loadEngineData()
  if (engine?.chunks) {
    const memChunks = engine.chunks.filter((c: any) => c.docId === 'hermes/memories/MEMORY')
    if (memChunks.length > 0) {
      const body = memChunks[0].body
      const entries = body.split('§').filter(Boolean)
      const matches = entries.filter((entry: string) => 
        keywords.some(k => entry.toLowerCase().includes(k.toLowerCase()))
      )
      return matches.join('\n\n').slice(0, 400)
    }
  }
  
  // 2. Fallback: local ~/.hermes/ (VPS only)
  const localPath = join(getConfig().hermesMemoryDir || join(homedir(), '.hermes', 'memories'), 'MEMORY.md')
  if (existsSync(localPath)) {
    try {
      const content = readFileSync(localPath, 'utf-8')
      const entries = content.split('§').filter(Boolean)
      const matches = entries.filter((entry: string) => 
        keywords.some(k => entry.toLowerCase().includes(k.toLowerCase()))
      )
      return matches.join('\n\n').slice(0, 400)
    } catch { /* ignore */ }
  }
  
  return ''
}

export function getHermesStandards(): string[] {
  // Pull standards from engine.bin if available
  const engine = loadEngineData()
  if (engine?.chunks) {
    const standardsChunks = engine.chunks.filter((c: any) => 
      c.docId.startsWith('hermes/') && c.body.includes('AUDIT GATE')
    )
    if (standardsChunks.length > 0) {
      // Extract bullet points from the first matching chunk
      const lines = standardsChunks[0].body.split('\n').filter((l: string) => 
        l.trim().startsWith('-') || l.trim().startsWith('AUDIT') || l.trim().startsWith('NO ') || 
        l.trim().startsWith('TOON') || l.trim().startsWith('PLAN') || l.trim().startsWith('ADDITIVE')
      )
      if (lines.length > 0) return lines.map((l: string) => l.replace(/^-\s*/, '').trim())
    }
  }
  
  // Hardcoded fallback (survives any deployment)
  return [
    'AUDIT GATE — run tsc+build+lint before every push',
    'NO FAKE DATA — real Supabase data or honest empty states only',
    'TOON FORMAT STANDARD — all agent data injection uses toon.dense()',
    'PLAN FIRST — present structured plan before writing code',
    'ADDITIVE ONLY — merge features into existing codebase, never delete',
  ]
}

export function getHermesContextForTask(taskType: TaskType): string {
  const user = getHermesUserContext()
  const standards = getHermesStandards()
  const kw = TASK_KEYWORDS[taskType] ?? []
  const mem = getHermesMemoryContext(kw)
  
  return [
    user ? `[User Preferences]\n${user}` : '',
    standards.length ? `[Standards]\n${standards.map(s => `- ${s}`).join('\n')}` : '',
    mem ? `[Task Memory]\n${mem}` : '',
  ].filter(Boolean).join('\n\n')
}

const TASK_KEYWORDS: Record<string, string[]> = {
  backend_bug: ['build', 'error', 'type', 'typescript', 'tsc', 'lint', 'import'],
  strategy: ['decision', 'direction', 'price', 'revenue', 'investor', 'valuation'],
  frontend_ui: ['component', 'layout', 'css', 'responsive', 'tailwind', 'design'],
  data_query: ['query', 'database', 'supabase', 'schema', 'migration', 'index'],
  marketing: ['campaign', 'brand', 'copy', 'social', 'content', 'ad'],
  ops_risk: ['security', 'deploy', 'cost', 'sla', 'downtime', 'auth', 'token'],
  general: ['project', 'codebase', 'architecture', 'workflow'],
}
