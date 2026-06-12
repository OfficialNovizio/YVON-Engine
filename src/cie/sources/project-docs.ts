// lib/cie/sources/project-docs.ts — Project documentation knowledge source
import { readFileSync, existsSync, statSync } from 'fs'
import { getConfig } from '../../adapters/config'
import type { TaskType } from '../types'

let claudeCache: string | null = null
let claudeMtime: number = 0
const ventureCache = new Map<string, { content: string; mtime: number }>()

export function getProjectArchitecture(): string {
  const config = getConfig()
  const path = config.projectClaudePath
  if (!existsSync(path)) return ''
  
  const mtime = statSync(path).mtimeMs
  if (claudeCache && claudeMtime === mtime) return claudeCache
  
  const content = readFileSync(path, 'utf-8')
  const archSection = extractSection(content, '## App Architecture')
  claudeCache = archSection.slice(0, 400)
  claudeMtime = mtime
  return claudeCache
}

export function getProjectRules(): string[] {
  return [
    'Strict TypeScript — zero build errors, no any without justification',
    'No manual Vercel deploys — CI/CD pipeline only',
    'Audit gate — run tsc+build+lint before every push',
    'Venture context from cookie — yvon_active_venture',
  ]
}

export function getVentureContext(venture: string): string {
  if (!venture || venture === 'yvon-dashboard') return ''
  const config = getConfig()
  const path = `${config.ventureDocsDir}/${venture}/CONTEXT.md`
  if (!existsSync(path)) return ''
  
  const mtime = statSync(path).mtimeMs
  const cached = ventureCache.get(venture)
  if (cached && cached.mtime === mtime) return cached.content
  
  const content = readFileSync(path, 'utf-8').slice(0, 500)
  ventureCache.set(venture, { content, mtime })
  return content
}

export function getProjectContextForTask(taskType: TaskType, venture: string): string {
  const parts: string[] = []
  if (['backend_bug','frontend_ui','data_query','ops_risk'].includes(taskType)) {
    const arch = getProjectArchitecture()
    if (arch) parts.push(arch)
  }
  if (['strategy','marketing'].includes(taskType)) {
    const ctx = getVentureContext(venture)
    if (ctx) parts.push(ctx)
  }
  return parts.join('\n')
}

function extractSection(content: string, heading: string): string {
  const startIdx = content.indexOf(heading)
  if (startIdx === -1) return ''
  const after = content.slice(startIdx)
  const nextHeading = after.slice(heading.length).match(/\n## /)
  const endIdx = nextHeading ? startIdx + heading.length + (nextHeading.index ?? 0) : content.length
  return content.slice(startIdx, endIdx).trim()
}

export function invalidateProjectDocsCache(): void {
  claudeCache = null
  ventureCache.clear()
}
