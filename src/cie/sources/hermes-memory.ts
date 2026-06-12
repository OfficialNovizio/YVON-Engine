// lib/cie/sources/hermes-memory.ts — Hermes cross-session memory source
import { readFileSync, existsSync, statSync } from 'fs'
import { join } from 'path'
import { getConfig } from '../../adapters/config'
import type { TaskType } from '../types'

let userCache: string | null = null
let memoryCache: string | null = null
let userMtime: number = 0
let memoryMtime: number = 0

function getUserPath(): string { return join(getConfig().hermesMemoryDir, 'USER.md') }
function getMemoryPath(): string { return join(getConfig().hermesMemoryDir, 'MEMORY.md') }

function readCachedFile(path: string, cacheVal: string | null, cacheMtime: number): { content: string; mtime: number } {
  if (!existsSync(path)) return { content: '', mtime: 0 }
  const mtime = statSync(path).mtimeMs
  if (cacheVal !== null && cacheMtime === mtime) return { content: cacheVal, mtime }
  return { content: readFileSync(path, 'utf-8'), mtime }
}

export function getHermesUserContext(): string {
  const { content, mtime } = readCachedFile(getUserPath(), userCache, userMtime)
  userCache = content; userMtime = mtime
  return content.slice(0, 300)
}

export function getHermesMemoryContext(keywords: string[]): string {
  const { content, mtime } = readCachedFile(getMemoryPath(), memoryCache, memoryMtime)
  memoryCache = content; memoryMtime = mtime
  if (!content) return ''
  
  const entries = content.split('§').filter(Boolean)
  const matches = entries.filter(entry => keywords.some(k => entry.toLowerCase().includes(k.toLowerCase())))
  return matches.join('\n\n').slice(0, 400)
}

export function getHermesStandards(): string[] {
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
