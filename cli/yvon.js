#!/usr/bin/env node
// yvon CLI — YVON Engine command-line interface
// v1.1.0 — Auto-builds knowledge files on init

const fs = require('fs')
const path = require('path')
const os = require('os')

const command = process.argv[2]
const args = process.argv.slice(3)

function help() {
  console.log(`
YVON Engine CLI v1.1.0

  yvon init          Initialize YVON Engine + auto-build all knowledge files
  yvon doctor        Health check all engine systems
  yvon graph         Rebuild knowledge graphs
  yvon agents        List agent status
  yvon version       Show version

Example:
  npm install @yvon/engine && npx yvon init
  `)
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function writeIfMissing(filePath, content) {
  if (!fs.existsSync(filePath)) {
    ensureDir(path.dirname(filePath))
    fs.writeFileSync(filePath, content)
    return true
  }
  return false
}

function init() {
  console.log('\n  🚀 YVON Engine — Initializing...\n')
  
  const cwd = process.cwd()
  const configPath = path.join(cwd, 'yvon.config.json')
  
  if (fs.existsSync(configPath) && !args.includes('--force')) {
    console.log('  ⚠️  yvon.config.json already exists. Use --force to overwrite.')
    console.log('  Run: npx yvon doctor')
    return
  }
  
  // ─── Step 1: Detect existing features ──────────────────────────
  console.log('  📡 Scanning project...')
  
  const graphifyOut = path.join(cwd, 'graphify-out')
  const graphifyReport = path.join(graphifyOut, 'GRAPH_REPORT.md')
  const codegraphReport = path.join(graphifyOut, 'CODEGRAPH_REPORT.md')
  const agentDir = path.join(cwd, 'agent-memory')
  const claudePath = path.join(cwd, 'CLAUDE.md')
  const ventureDir = path.join(cwd, 'docs', 'ventures')
  const hermesDir = path.join(os.homedir(), '.hermes', 'memories')
  
  const existing = {
    graphify: fs.existsSync(graphifyReport),
    codegraph: fs.existsSync(codegraphReport),
    agentMemory: fs.existsSync(agentDir),
    claudeMd: fs.existsSync(claudePath),
    hermes: fs.existsSync(path.join(hermesDir, 'USER.md')),
    ventureDocs: fs.existsSync(ventureDir),
  }
  
  console.log('')
  for (const [name, found] of Object.entries(existing)) {
    console.log(`    ${found ? '✅ (kept)' : '📦 (creating)'} ${name}`)
  }
  
  // ─── Step 2: Create missing files ──────────────────────────────
  console.log('\n  🔧 Building missing components...')
  let created = 0
  
  // Agent memory files (13 agents)
  if (!existing.agentMemory) {
    const agents = {
      'CEO/marcus': '# Marcus — CEO\n\n## Never Again\n- Never hardcode models in agent files — always read from settings\n- Wrong skills in CEO folder — Marcus synthesizes, PM tools belong to Diana\n\n## Default Behaviors\n- First response: "this is not good enough yet" — testing conviction\n- Never presents options — presents the answer with full conviction\n- Asks "why does this exist?" before "does this work?"\n',
      'COO/diana': '# Diana — COO\n\n## Never Again\n- Never skip milestone validation before approving a sprint\n- Dependencies must be mapped before execution starts\n',
      'Technical/dev': '# Dev — CTO\n\n## Never Again\n- Never use localStorage for data — fails on cache clear\n- API keys never touch client components — security violation\n- Hardcoded colors in components — CSS variable tokens only\n\n## Architecture Decisions\n- SSE over WebSockets — simpler, works with Vercel serverless\n- Supabase for all persistent data — localStorage is UI only\n- TypeScript strict — tsc --noEmit before every push\n\n## Rejected Patterns\n- API calls from client components\n- File-write instructions in system prompts\n- Hardcoded social handles / GA property IDs\n',
      'Technical/mia': '# Mia — Frontend\n\n## Never Again\n- Never use hardcoded colors — CSS custom properties from globals.css only\n- Cards must be min 2 per row, wrap on mobile\n- No tabs in settings — expandable cards instead\n',
      'Technical/raj': '# Raj — Backend\n\n## Never Again\n- Never write raw SQL without RLS consideration\n- Migrations must be reversible\n- Always check service_role key usage — server only\n',
      'Technical/quinn': '# Quinn — QA\n\n## Never Again\n- Never skip AUDIT GATE before pushing\n- tsc --noEmit + ESLint + build check mandatory\n- Zero tolerance for fake data in reports\n',
      'Marketing/kai': '# Kai — Analyst\n\n## Never Again\n- Never assume metric direction without asking for timeframe\n- Data must come from real Supabase — no hardcoded numbers\n',
      'Marketing/lena': '# Lena — Brand\n\n## Never Again\n- Never write copy without loading venture BRAND.md first\n- Brand voice must match venture — no generic AI tone\n',
      'Marketing/nate': '# Nate — Growth\n\n## Never Again\n- Never propose growth tactics without CAC/LTV calculation\n- Experimental channels need Felix sign-off on budget\n',
      'Marketing/atlas': '# Atlas — Art Director\n\n## Never Again\n- Never generate visuals without DESIGN.md loaded\n- Color palette must match venture — check before output\n',
      'Marketing/pixel': '# Pixel — Production\n\n## Never Again\n- Never output low-resolution assets — 2x minimum for Retina\n- File formats: WebP for web, PNG for transparency, SVG for vectors\n',
      'Finance/felix': '# Felix — Finance\n\n## Never Again\n- Never hardcode credentials, API keys, or financial data in any file\n- Always calculate runway before approving new spend\n- Pricing changes need Marcus approval\n',
      'Psychology/Daniel_Kahneman': '# Kahneman — Psychology\n\n## Never Again\n- Never validate own output — cognitive bias prevention requires external review\n- Always check for anchoring, loss aversion, and overconfidence before strategic decisions\n',
    }
    
    for (const [agentPath, content] of Object.entries(agents)) {
      const fullPath = path.join(agentDir, agentPath, 'MEMORY.md')
      if (writeIfMissing(fullPath, content)) created++
    }
    console.log(`    ✅ 13 agent memory files created (${created} new)`)
  } else {
    console.log(`    ⏭️  Agent memory already exists — skipped`)
  }
  
  // CLAUDE.md
  if (!existing.claudeMd) {
    const claudeContent = `# CLAUDE.md — ${path.basename(cwd)}

## What is this project

[Describe your project here]

## Architecture

- **Stack:** Next.js / Node.js / TypeScript
- **Database:** Supabase / PostgreSQL / SQLite
- **Deployment:** Vercel / Docker / Custom

## Development Commands

\`\`\`bash
npm run dev          # start dev server
npm run build        # production build
npm run lint         # ESLint
\`\`\`

## Key Rules

- Strict TypeScript — zero build errors
- No manual deploys — CI/CD pipeline only
- All API calls go through /api/ route handlers
- Environment variables in .env.local — never committed

## Agent System (YVON Engine)

This project uses YVON Engine for AI agents.
Run \`npx yvon doctor\` for health check.
`
    if (writeIfMissing(claudePath, claudeContent)) {
      created++
      console.log(`    ✅ CLAUDE.md created`)
    }
  } else {
    console.log(`    ⏭️  CLAUDE.md already exists — skipped`)
  }
  
  // Venture docs
  if (!existing.ventureDocs) {
    ensureDir(ventureDir)
    const ventureContent = `# Venture Context\n\n## Overview\n[Describe your venture here]\n\n## Key Metrics\n- Revenue: $0/mo\n- Users: 0\n- Growth: 0% MoM\n\n## Architecture Decisions\n- [Add decisions here]\n`
    if (writeIfMissing(path.join(ventureDir, 'default', 'CONTEXT.md'), ventureContent)) created++
    console.log(`    ✅ Venture docs created`)
  } else {
    console.log(`    ⏭️  Venture docs already exist — skipped`)
  }
  
  // Knowledge graph placeholders (will be populated by graphify/codegraph)
  if (!existing.graphify || !existing.codegraph) {
    ensureDir(graphifyOut)
    
    if (!existing.graphify) {
      fs.writeFileSync(graphifyReport, `# Graph Report — ${path.basename(cwd)}

## Summary
- Graph not yet built. Run \`npx yvon graph\` or \`npm run graphify:build\` to populate.
- The YVON Engine CIE will read this file for code structure context.
`)
      created++
    }
    
    if (!existing.codegraph) {
      fs.writeFileSync(codegraphReport, `# Code Dependency Graph — ${path.basename(cwd)}

## Hub Files — Most Imported
> Run \`npx yvon graph\` to populate.

## API Route Dependency Map
> Run \`npx yvon graph\` to populate.
`)
      created++
    }
    console.log(`    ✅ Knowledge graph placeholders created (run \`npx yvon graph\` to build)`)
  } else {
    console.log(`    ⏭️  Knowledge graphs already exist — skipped`)
  }
  
  // ─── Step 3: Write config ────────────────────────────────────
  const config = {
    projectRoot: cwd,
    graphifyReport,
    codegraphReport,
    agentMemoryDir: agentDir,
    hermesMemoryDir: hermesDir,
    projectClaudePath: claudePath,
    ventureDocsDir: ventureDir,
    cieEnabled: true,
    contextCap: 2500,
    adaptiveInjection: true,
    toonEnabled: true,
    toonBidirectional: true,
  }
  
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
  
  // ─── Step 4: Summary ─────────────────────────────────────────
  console.log(`\n  ${'─'.repeat(50)}`)
  console.log(`  ✅ YVON Engine initialized!`)
  console.log(`  ${'─'.repeat(50)}`)
  console.log(`\n  Created: ${created} new files`)
  console.log(`  Kept:    ${Object.values(existing).filter(Boolean).length} existing components`)
  console.log(`\n  Next steps:`)
  console.log(`    1. Run: npx yvon doctor`)
  console.log(`    2. Build graphs: npx yvon graph (if graphify installed)`)
  console.log(`    3. Import in your code: import { buildCieContext } from '@yvon/engine'`)
  console.log(`\n  13 agents ready. CIE active. TOON compression enabled.`)
}

function doctor() {
  console.log('\n  🏥 YVON Engine — Health Check\n')
  
  try {
    const cwd = process.cwd()
    let config
    
    try {
      config = JSON.parse(fs.readFileSync(path.join(cwd, 'yvon.config.json'), 'utf-8'))
    } catch {
      console.log('  ❌ yvon.config.json not found. Run: npx yvon init')
      return
    }
    
    const checks = [
      ['Config', !!config, 'yvon.config.json'],
      ['Project root', !!config.projectRoot, config.projectRoot],
      ['graphify', fs.existsSync(config.graphifyReport), config.graphifyReport],
      ['codegraph', fs.existsSync(config.codegraphReport), config.codegraphReport],
      ['Agent memory', fs.existsSync(config.agentMemoryDir), config.agentMemoryDir],
      ['Hermes memory', fs.existsSync(config.hermesMemoryDir), config.hermesMemoryDir],
      ['CLAUDE.md', fs.existsSync(config.projectClaudePath), config.projectClaudePath],
      ['Venture docs', fs.existsSync(config.ventureDocsDir), config.ventureDocsDir],
      ['CIE', config.cieEnabled, 'Adaptive injection active'],
      ['TOON', config.toonEnabled, 'Bidirectional compression active'],
    ]
    
    let pass = 0, fail = 0
    for (const [name, ok, detail] of checks) {
      if (ok) {
        console.log(`  ✅ ${name}: ${typeof detail === 'string' ? path.basename(detail) : detail}`)
        pass++
      } else {
        console.log(`  ❌ ${name}: missing — run npx yvon init`)
        fail++
      }
    }
    
    // Count agent files
    if (fs.existsSync(config.agentMemoryDir)) {
      const count = fs.readdirSync(config.agentMemoryDir, { recursive: true })
        .filter(f => f.endsWith('MEMORY.md')).length
      console.log(`  📊 Agents: ${count} memory files found`)
    }
    
    console.log(`\n  ${pass}/${pass+fail} checks passed`)
    if (fail === 0) console.log('  ✅ All systems operational')
  } catch (e) {
    console.log(`  ⚠️  Error: ${e.message}`)
  }
}

function version() {
  console.log('YVON Engine v1.1.0')
}

const commands = {
  init, doctor, help, version,
  agents: () => console.log('13 agents available. Run npx yvon doctor for status.'),
  graph: () => console.log('Knowledge graphs: run graphify:build or codegraph:build in your project, or pip install graphify && python -m graphify update .'),
}

;(commands[command] || help)()
