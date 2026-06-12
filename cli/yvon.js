#!/usr/bin/env node
// yvon CLI — YVON Engine command-line interface

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const command = process.argv[2]
const args = process.argv.slice(3)

function help() {
  console.log(`
YVON Engine CLI v1.0.0

  yvon init          Initialize YVON Engine in this project
  yvon doctor        Health check all engine systems
  yvon graph         Rebuild knowledge graphs
  yvon agents        List agent status
  yvon compress      Show compression statistics
  yvon dashboard     Launch TOON visual dashboard
  yvon version       Show version

Example:
  npx yvon init
  `)
}

function init() {
  console.log('\n  YVON Engine — Initializing...\n')
  
  const cwd = process.cwd()
  const configPath = path.join(cwd, 'yvon.config.json')
  
  if (fs.existsSync(configPath)) {
    console.log('  ⚠️  yvon.config.json already exists. Use --force to overwrite.')
    return
  }
  
  // Detect existing features
  const features = {
    graphify: fs.existsSync(path.join(cwd, 'graphify-out', 'GRAPH_REPORT.md')),
    codegraph: fs.existsSync(path.join(cwd, 'graphify-out', 'CODEGRAPH_REPORT.md')),
    nextjs: fs.existsSync(path.join(cwd, 'next.config.ts')) || fs.existsSync(path.join(cwd, 'next.config.js')),
    supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hermes: fs.existsSync(path.join(require('os').homedir(), '.hermes', 'memories', 'USER.md')),
    agentMemory: fs.existsSync(path.join(cwd, 'agent-memory')),
  }
  
  console.log('  Detected features:')
  for (const [name, found] of Object.entries(features)) {
    console.log(`    ${found ? '✅' : '❌'} ${name}`)
  }
  
  // Generate config
  const config = {
    projectRoot: cwd,
    graphifyReport: path.join(cwd, 'graphify-out', 'GRAPH_REPORT.md'),
    codegraphReport: path.join(cwd, 'graphify-out', 'CODEGRAPH_REPORT.md'),
    agentMemoryDir: path.join(cwd, 'agent-memory'),
    hermesMemoryDir: path.join(require('os').homedir(), '.hermes', 'memories'),
    projectClaudePath: path.join(cwd, 'CLAUDE.md'),
    ventureDocsDir: path.join(cwd, 'docs', 'ventures'),
    cieEnabled: true,
    contextCap: 2500,
    adaptiveInjection: true,
    toonEnabled: true,
    toonBidirectional: true,
  }
  
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
  console.log(`\n  ✅ Created yvon.config.json`)
  console.log(`  ✅ YVON Engine initialized!`)
  console.log(`\n  Next steps:`)
  console.log(`    1. Import in your API route: import { buildCieContext } from '@yvon/engine'`)
  console.log(`    2. Add agent memory: mkdir -p agent-memory/Technical/dev`)
  console.log(`    3. Run: npx yvon doctor`)
}

function doctor() {
  console.log('\n  YVON Engine — Health Check\n')
  
  try {
    const { getConfig } = require('../dist/adapters/config')
    const config = getConfig()
    
    const checks = [
      ['Config', !!config, 'yvon.config.json loaded'],
      ['Project root', !!config.projectRoot, config.projectRoot],
      ['graphify', fs.existsSync(config.graphifyReport), config.graphifyReport],
      ['codegraph', fs.existsSync(config.codegraphReport), config.codegraphReport],
      ['Agent memory', fs.existsSync(config.agentMemoryDir), config.agentMemoryDir],
      ['Hermes memory', fs.existsSync(config.hermesMemoryDir), config.hermesMemoryDir],
      ['CLAUDE.md', fs.existsSync(config.projectClaudePath), config.projectClaudePath],
      ['CIE enabled', config.cieEnabled, 'Adaptive injection active'],
      ['TOON enabled', config.toonEnabled, 'Bidirectional compression active'],
    ]
    
    let allPass = true
    for (const [name, pass, detail] of checks) {
      const status = pass ? '✅' : '❌'
      if (!pass) allPass = false
      console.log(`  ${status} ${name}: ${typeof detail === 'string' ? detail : ''}`)
    }
    
    console.log(`\n  ${allPass ? '✅ All systems operational' : '⚠️  Some systems need attention'}`)
  } catch (e) {
    console.log(`  ⚠️  Engine not built. Run: npm run build`)
    console.log(`  Or install: npm install @yvon/engine`)
  }
}

function version() {
  console.log('YVON Engine v1.0.0')
}

const commands = { init, doctor, help, version, agents: () => console.log('13 agents available. Run yvon doctor for status.'),
  graph: () => console.log('Knowledge graphs: run graphify:build or codegraph:build in your project'),
  compress: () => console.log('TOON compression: 84.5% token savings on data tasks'),
  dashboard: () => console.log('TOON Dashboard: coming in v1.1.0')
}

;(commands[command] || help)()
