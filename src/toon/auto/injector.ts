// src/toon/auto/injector.ts — Auto-TOON Injection Engine
//
// Phase 2 of auto-TOONification. Takes the ProjectScan and wires TOON into
// every injection point: Claude routes, API routes, document store, memory store.
//
// After this runs, the project is fully TOON-native — every prompt, document,
// context block, and API response flows through TOON compression automatically.

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname, relative } from 'path'
import type { ProjectScan, InjectionPoint, ProjectDictionary, DiscoveredSchema } from './scanner'
import { encodeDocument, encodeMemory, generateDictionaryString, ABBREV_MAP } from './encoder'

export interface InjectionResult {
  injected: string[]     // Files modified
  created: string[]      // Files/dirs created
  skipped: string[]      // Already done
  errors: string[]       // Failures
  summary: {
    schemasGenerated: number
    injectionPointsHit: number
    documentsTooned: number
    memoriesTooned: number
    estimatedSavings: number
  }
}

// ─── Main Injector ────────────────────────────────────────────────────────────

export function injectToon(scan: ProjectScan): InjectionResult {
  const result: InjectionResult = {
    injected: [],
    created: [],
    skipped: [],
    errors: [],
    summary: {
      schemasGenerated: 0,
      injectionPointsHit: 0,
      documentsTooned: 0,
      memoriesTooned: 0,
      estimatedSavings: scan.estimatedTokenSavings,
    },
  }

  // 1. Create .toon/ directory structure
  createToonStore(scan, result)

  // 2. Generate schemas file
  generateSchemasFile(scan, result)

  // 3. Generate dictionary file
  generateDictionaryFile(scan, result)

  // 4. Wire each injection point
  for (const point of scan.injectionPoints) {
    wireInjectionPoint(scan, point, result)
  }

  // 5. TOON-compress documents
  compressDocuments(scan, result)

  // 6. TOON-compress agent memories
  compressMemories(scan, result)

  // 7. Update project config
  updateProjectConfig(scan, result)

  return result
}

// ─── .toon/ Store ─────────────────────────────────────────────────────────────

function createToonStore(scan: ProjectScan, result: InjectionResult): void {
  const toonDir = join(scan.projectRoot, '.toon')
  const subdirs = ['docs', 'memory', 'schemas']
  
  for (const dir of [toonDir, ...subdirs.map(d => join(toonDir, d))]) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
      result.created.push(relative(scan.projectRoot, dir))
    }
  }
}

// ─── Schema Generation ────────────────────────────────────────────────────────

function generateSchemasFile(scan: ProjectScan, result: InjectionResult): void {
  const schemasPath = join(scan.projectRoot, '.toon', 'schemas.toon')
  
  // TOON-API format: self-describing schemas the LLM can parse directly
  const lines: string[] = [
    '# SCHEMAS — Auto-generated TOON schemas for this project',
    `# Generated: ${new Date().toISOString()}`,
    `# Project: ${scan.projectType}`,
    `# Shapes discovered: ${scan.schemas.length}`,
    '',
  ]

  for (const schema of scan.schemas) {
    lines.push(`## ${schema.type}`)
    lines.push(`#source=${schema.source}`)
    lines.push(`#fields=${schema.fields.map(f => `${f.name}:${f.abbr}:${f.type}`).join('|')}`)
    lines.push('')
  }

  writeFileSync(schemasPath, lines.join('\n'))
  result.created.push(relative(scan.projectRoot, schemasPath))
  result.summary.schemasGenerated = scan.schemas.length
}

// ─── Dictionary Generation ────────────────────────────────────────────────────

function generateDictionaryFile(scan: ProjectScan, result: InjectionResult): void {
  const dictPath = join(scan.projectRoot, '.toon', 'dictionary.toon')

  // Use the comprehensive ABBREV_MAP from encoder + project-specific terms
  const dict = scan.dictionary
  const lines: string[] = [
    '# DICTIONARY — Comprehensive abbreviation map for TOON compression',
    '# Project-specific terms first, then global abbreviations',
    '',
    `DICT v=${Object.entries(dict.ventures).map(([k, v]) => `${k}:${v}`).join('|')}`,
    `DICT a=${Object.entries(dict.agents).map(([k, v]) => `${k}:${v}`).join('|')}`,
    `DICT s=${Object.entries(dict.statuses).map(([k, v]) => `${k}:${v}`).join('|')}`,
    `DICT x=${Object.entries(dict.actions).map(([k, v]) => `${k}:${v}`).join('|')}`,
  ]

  // Add encoder's comprehensive abbreviation map
  for (const [full, abbr] of Object.entries(ABBREV_MAP).sort((a, b) => b[0].length - a[0].length)) {
    lines.push(`DICT t=${full}:${abbr}`)
  }

  writeFileSync(dictPath, lines.join('\n'))
  result.created.push(relative(scan.projectRoot, dictPath))
}

// ─── Injection Point Wiring ───────────────────────────────────────────────────

function wireInjectionPoint(scan: ProjectScan, point: InjectionPoint, result: InjectionResult): void {
  try {
    switch (point.type) {
      case 'claude-route':
        injectClaudeRoute(scan, point, result)
        break
      case 'api-route':
        injectApiRoute(scan, point, result)
        break
      case 'document-store':
      case 'memory-store':
        // Handled by compressDocuments / compressMemories
        result.summary.injectionPointsHit++
        break
      case 'config':
        // Handled by updateProjectConfig
        result.summary.injectionPointsHit++
        break
    }
  } catch (e: any) {
    result.errors.push(`${point.path}: ${e.message}`)
  }
}

// ─── Claude Route Injection ───────────────────────────────────────────────────

function injectClaudeRoute(scan: ProjectScan, point: InjectionPoint, result: InjectionResult): void {
  if (!existsSync(point.path)) {
    result.skipped.push(`${relative(scan.projectRoot, point.path)} (not found)`)
    return
  }

  let content = readFileSync(point.path, 'utf-8')
  let modified = false

  // Check if already injected
  if (content.includes('yvon-engine/toon/auto') || content.includes('autoToonMiddleware')) {
    result.skipped.push(`${relative(scan.projectRoot, point.path)} (already TOON-injected)`)
    return
  }

  // 1. Add TOON auto import after existing imports
  const importInsert = `import { autoToonMiddleware } from 'yvon-engine/toon/auto/middleware'\n`
  const lastImportRe = /(import\s+.+from\s+['"].+['"]\s*\n)(?!\s*import)/g
  const matches = [...content.matchAll(lastImportRe)]
  if (matches.length > 0) {
    const lastMatch = matches[matches.length - 1]
    const insertPos = lastMatch.index! + lastMatch[0].length
    content = content.slice(0, insertPos) + importInsert + content.slice(insertPos)
    modified = true
  } else {
    // Fallback: insert after 'use server' or first line
    content = content.replace(
      /(['"]use server['"]\s*;?\s*\n)/,
      '$1' + importInsert
    )
    modified = true
  }

  // 2. Wrap the system prompt + user message with TOON compression
  // Find: system: effectiveSystemPrompt ... messages: [{ role: 'user', content: userMessageFinal }]
  // Replace with TOON-compressed versions
  const systemRe = /(system:\s*effectiveSystemPrompt)/g
  if (systemRe.test(content)) {
    content = content.replace(
      /(system:\s*effectiveSystemPrompt)/g,
      '// ─── TOON AUTO-COMPRESSION: system prompt ─────────────────────\n' +
      '    const toonCtx = autoToonMiddleware({ systemPrompt: effectiveSystemPrompt, userMessage: userMessageFinal, agentId, ventureId })\n' +
      '    // ─── Original system prompt assignment ─────────────────────\n' +
      '    $1'
    )
    modified = true
  }

  // 3. Add TOON dictionary injection to system prompt
  const systemAssignRe = /(effectiveSystemPrompt\s*=\s*\(effectiveSystemPrompt\s*\?\?\s*''\)\s*\+\s*)(ext|cie\.systemExtension)/g
  if (systemAssignRe.test(content)) {
    content = content.replace(
      systemAssignRe,
      '$1(toonCtx.dictionary ? toonCtx.dictionary + \'\\n\' : \'\') + $2'
    )
    modified = true
  }

  // 4. Replace user message with compressed version
  const userMsgRe = /(messages:\s*\[\s*\{\s*role:\s*['"]user['"].*?content:\s*)(userMessageFinal)(\s*\}\s*\])/s
  if (userMsgRe.test(content)) {
    content = content.replace(
      userMsgRe,
      '$1(toonCtx.compressedUserMessage || userMessageFinal)$3'
    )
    modified = true
  }

  if (modified) {
    writeFileSync(point.path, content)
    result.injected.push(relative(scan.projectRoot, point.path))
    result.summary.injectionPointsHit++
  } else {
    result.skipped.push(`${relative(scan.projectRoot, point.path)} (no matching patterns)`)
  }
}

// ─── API Route Injection ──────────────────────────────────────────────────────

function injectApiRoute(scan: ProjectScan, point: InjectionPoint, result: InjectionResult): void {
  if (!existsSync(point.path)) {
    result.skipped.push(`${relative(scan.projectRoot, point.path)} (not found)`)
    return
  }

  let content = readFileSync(point.path, 'utf-8')

  // Check if already injected
  if (content.includes('toon.api') || content.includes('TOON response')) {
    result.skipped.push(`${relative(scan.projectRoot, point.path)} (already TOON-injected)`)
    return
  }

  // SAFETY: Skip routes with dangerous patterns that injection would break
  if (content.includes('if (error)') || content.includes('if (err)')) {
    result.skipped.push(`${relative(scan.projectRoot, point.path)} (unsafe — error handling without braces)`)
    return
  }

  // Add TOON response format support via Accept header
  // Find: return Response.json( or return NextResponse.json(
  const jsonRe = /(return\s+(?:Response|NextResponse)\.json\()/g
  if (jsonRe.test(content)) {
    // Add TOON import
    const toonImport = `import { toon } from 'yvon-engine/toon'\n`
    if (!content.includes('yvon-engine/toon')) {
      const firstImport = content.match(/^import\s+.+$/m)
      if (firstImport) {
        const pos = firstImport.index! + firstImport[0].length
        content = content.slice(0, pos) + '\n' + toonImport + content.slice(pos + 1)
      } else {
        content = toonImport + content
      }
    }

    // Add Accept header check for TOON format — only before braced return blocks
    const acceptCheck = `
  // TOON response format — auto-injected by yvon-engine
  const acceptHeader = request.headers.get('accept') || ''
  if (acceptHeader.includes('application/toon') || acceptHeader.includes('text/toon')) {
    const toonResult = toon.api(data, '${point.path.split('/').pop()?.replace('route.', '') || 'generic'}')
    return new Response(toonResult, { headers: { 'Content-Type': 'application/toon' } })
  }
`
    // Insert before the return Response.json
    content = content.replace(
      /(\s*)(return\s+(?:Response|NextResponse)\.json\()/,
      acceptCheck + '\n$1$2'
    )

    writeFileSync(point.path, content)
    result.injected.push(relative(scan.projectRoot, point.path))
    result.summary.injectionPointsHit++
  } else {
    result.skipped.push(`${relative(scan.projectRoot, point.path)} (no JSON responses found)`)
  }
}

// ─── Document Compression ─────────────────────────────────────────────────────

function compressDocuments(scan: ProjectScan, result: InjectionResult): void {
  const toonDocDir = join(scan.projectRoot, '.toon', 'docs')

  for (const docPath of scan.documentPaths) {
    try {
      const content = readFileSync(docPath, 'utf-8')
      const compressed = compressDocumentToToon(content, docPath, scan.dictionary)

      const relPath = relative(scan.projectRoot, docPath)
      const toonPath = join(toonDocDir, relPath.replace(/\.(md|mdx|txt)$/, '.toon'))
      mkdirSync(dirname(toonPath), { recursive: true })
      writeFileSync(toonPath, compressed)

      result.created.push(relative(scan.projectRoot, toonPath))
      result.summary.documentsTooned++
    } catch (e: any) {
      result.errors.push(`${docPath}: ${e.message}`)
    }
  }
}

function compressDocumentToToon(content: string, path: string, _dict: ProjectDictionary): string {
  const result = encodeDocument(content, path)
  // Return TOON-encoded section records
  return [
    `#DOC source=${path} savings=${result.savingsPercent}% compressed=${new Date().toISOString()}`,
    ...result.records,
  ].join('\n')
}

// ─── Memory Compression ───────────────────────────────────────────────────────

function compressMemories(scan: ProjectScan, result: InjectionResult): void {
  const toonMemDir = join(scan.projectRoot, '.toon', 'memory')

  for (const memPath of scan.memoryPaths) {
    try {
      const content = readFileSync(memPath, 'utf-8')
      const compressed = compressMemoryToToon(content, memPath, scan.dictionary)

      const relPath = relative(scan.projectRoot, memPath)
      const toonPath = join(toonMemDir, relPath.replace(/\.md$/, '.toon'))
      mkdirSync(dirname(toonPath), { recursive: true })
      writeFileSync(toonPath, compressed)

      result.created.push(relative(scan.projectRoot, toonPath))
      result.summary.memoriesTooned++
    } catch (e: any) {
      result.errors.push(`${memPath}: ${e.message}`)
    }
  }
}

function compressMemoryToToon(content: string, path: string, _dict: ProjectDictionary): string {
  // Extract agent name from path (e.g., agent-department/CEO/marcus/MEMORY.md → marcus)
  const pathParts = path.split('/')
  const agentName = pathParts[pathParts.length - 2] || 'unknown'

  const result = encodeMemory(content, agentName)
  return [
    `#MEM id=${agentName} source=${path} savings=${result.savingsPercent}%`,
    ...result.records,
  ].join('\n')
}

// ─── Config Updater ───────────────────────────────────────────────────────────

function updateProjectConfig(scan: ProjectScan, result: InjectionResult): void {
  const configPath = join(scan.projectRoot, 'yvon.config.json')
  let config: any = {}

  if (existsSync(configPath)) {
    try {
      config = JSON.parse(readFileSync(configPath, 'utf-8'))
    } catch {}
  }

  // Add/update TOON configuration
  config.toon = {
    enabled: true,
    autoCompress: true,
    bidirectional: true,
    schemas: scan.schemas.map(s => s.type),
    dictionarySize: Object.keys(scan.dictionary.commonTerms).length,
    documentStore: '.toon/docs/',
    memoryStore: '.toon/memory/',
    injectionPoints: scan.injectionPoints.length,
    estimatedSavings: `${scan.estimatedTokenSavings}%`,
    compressedAt: new Date().toISOString(),
  }

  writeFileSync(configPath, JSON.stringify(config, null, 2))
  result.injected.push(relative(scan.projectRoot, configPath))
  result.summary.injectionPointsHit++
}
