// src/dashboard/index.ts — TOON Dashboard server
//
// A simple HTTP server (Node.js http module, no Express) that serves a
// single-page dashboard with:
//
//   1. Force-directed graph visualization of the codebase (D3.js via CDN)
//   2. CIE pipeline status (injected vs filtered)
//   3. Agent status cards (13 agents, online/idle)
//   4. Token savings gauge (animated arc showing compression ratio)
//
// Dark theme, glass-morphism design. All HTML/CSS/JS inlined.
// Server runs on port 4200 by default.
//
// Usage:
//   import { startDashboard } from './dashboard'
//   startDashboard()         // starts on port 4200
//   startDashboard(3000)     // starts on port 3000

import { createServer, IncomingMessage, ServerResponse } from 'http'
import { readFileSync, existsSync } from 'fs'
import { resolve, join } from 'path'
import { homedir } from 'os'
import { AGENT_PERSONALITIES, type AgentPersonality } from '../agents/personalities'

// ─── Dashboard HTML ───────────────────────────────────────────────────────────
// Single self-contained file. D3 loaded from CDN. All CSS/JS inline.

function getDashboardHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>TOON Dashboard — YVON Engine</title>
<script src="https://d3js.org/d3.v7.min.js"></script>
<style>
  /* ── Reset & Base ────────────────────────────────────────── */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg-deep: #0a0e17;
    --bg-card: rgba(255,255,255,0.04);
    --bg-card-hover: rgba(255,255,255,0.07);
    --glass-bg: rgba(15,19,28,0.75);
    --glass-border: rgba(255,255,255,0.08);
    --glass-highlight: rgba(255,255,255,0.03);
    --text-primary: #e4e8f0;
    --text-secondary: #8892a8;
    --text-muted: #5a6478;
    --accent-cyan: #00d4ff;
    --accent-purple: #a78bfa;
    --accent-green: #34d399;
    --accent-orange: #f59e0b;
    --accent-red: #f87171;
    --accent-pink: #f472b6;
    --radius-sm: 8px;
    --radius-md: 14px;
    --radius-lg: 20px;
    --shadow-glass: 0 8px 32px rgba(0,0,0,0.4);
    --font-mono: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    background: var(--bg-deep);
    color: var(--text-primary);
    min-height: 100vh;
    overflow-x: hidden;
  }
  /* ── Ambient background glow ─────────────────────────────── */
  body::before {
    content: '';
    position: fixed;
    top: -30%; left: -20%;
    width: 80vw; height: 80vh;
    background: radial-gradient(ellipse at 30% 20%, rgba(0,212,255,0.06) 0%, transparent 70%);
    pointer-events: none; z-index: 0;
  }
  body::after {
    content: '';
    position: fixed;
    bottom: -20%; right: -10%;
    width: 70vw; height: 60vh;
    background: radial-gradient(ellipse at 70% 80%, rgba(167,139,250,0.05) 0%, transparent 70%);
    pointer-events: none; z-index: 0;
  }
  /* ── Layout ──────────────────────────────────────────────── */
  .app { position: relative; z-index: 1; padding: 24px; max-width: 1440px; margin: 0 auto; }
  header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 0; margin-bottom: 24px; border-bottom: 1px solid var(--glass-border);
  }
  header h1 {
    font-size: 1.5rem; font-weight: 700;
    background: linear-gradient(135deg, var(--accent-cyan), var(--accent-purple));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .header-meta { display: flex; gap: 20px; align-items: center; }
  .status-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 6px; }
  .status-dot.live { background: var(--accent-green); box-shadow: 0 0 8px var(--accent-green); }
  .status-dot.idle { background: var(--accent-orange); }
  .status-dot.offline { background: var(--accent-red); }
  .metric-badge {
    display: flex; align-items: center; gap: 6px;
    font-size: 0.8rem; color: var(--text-secondary);
    background: var(--bg-card); border: 1px solid var(--glass-border);
    padding: 6px 12px; border-radius: 20px;
  }
  .metric-badge strong { color: var(--text-primary); }
  /* ── Grid ────────────────────────────────────────────────── */
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 20px; }
  /* ── Glass card ──────────────────────────────────────────── */
  .card {
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-md);
    padding: 20px;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    box-shadow: var(--shadow-glass);
    position: relative;
    overflow: hidden;
    transition: border-color 0.3s, transform 0.2s;
  }
  .card:hover { border-color: rgba(255,255,255,0.14); transform: translateY(-1px); }
  .card::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, var(--glass-highlight), transparent);
  }
  .card-title {
    font-size: 0.85rem; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.06em; color: var(--text-secondary); margin-bottom: 14px;
    display: flex; align-items: center; gap: 8px;
  }
  .card-full { grid-column: 1 / -1; }
  .card-wide { grid-column: span 2; }
  /* ── Graph container ─────────────────────────────────────── */
  #graph-container {
    width: 100%; height: 480px; position: relative;
    border-radius: var(--radius-sm); overflow: hidden;
  }
  #graph-svg { width: 100%; height: 100%; }
  .node circle { stroke-width: 2px; cursor: pointer; transition: r 0.2s; }
  .node circle:hover { filter: brightness(1.3); }
  .node text { font-size: 9px; font-family: var(--font-mono); fill: var(--text-secondary); pointer-events: none; }
  .link { stroke: rgba(255,255,255,0.06); stroke-width: 1px; }
  /* ── CIE Pipeline ────────────────────────────────────────── */
  .pipeline-row { display: flex; gap: 16px; align-items: stretch; }
  .pipeline-stage {
    flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px;
    padding: 16px 8px; border-radius: var(--radius-sm);
    background: var(--bg-card); border: 1px solid var(--glass-border);
  }
  .pipeline-stage .icon {
    font-size: 1.5rem; width: 44px; height: 44px; display: flex;
    align-items: center; justify-content: center; border-radius: 50%;
    background: rgba(255,255,255,0.05);
  }
  .pipeline-stage .label { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
  .pipeline-stage .value { font-size: 1.1rem; font-weight: 700; color: var(--text-primary); }
  .pipeline-arrow { display: flex; align-items: center; color: var(--text-muted); font-size: 1.2rem; }
  .filtered-badge {
    display: inline-block; padding: 2px 8px; border-radius: 10px;
    font-size: 0.7rem; font-weight: 600; background: rgba(248,113,113,0.15); color: var(--accent-red);
    margin-top: 4px;
  }
  .injected-badge {
    display: inline-block; padding: 2px 8px; border-radius: 10px;
    font-size: 0.7rem; font-weight: 600; background: rgba(52,211,153,0.15); color: var(--accent-green);
    margin-top: 4px;
  }
  /* ── Agent grid ──────────────────────────────────────────── */
  .agent-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 10px; max-height: 480px; overflow-y: auto;
  }
  .agent-card {
    background: var(--bg-card); border: 1px solid var(--glass-border);
    border-radius: var(--radius-sm); padding: 12px;
    display: flex; flex-direction: column; gap: 6px;
    transition: all 0.2s;
  }
  .agent-card:hover { background: var(--bg-card-hover); }
  .agent-card .agent-header { display: flex; align-items: center; gap: 8px; }
  .agent-card .agent-avatar {
    width: 28px; height: 28px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.7rem; font-weight: 700; color: #fff;
  }
  .agent-card .agent-name { font-size: 0.85rem; font-weight: 600; }
  .agent-card .agent-role { font-size: 0.68rem; color: var(--text-muted); }
  .agent-card .agent-model {
    font-size: 0.65rem; color: var(--text-muted);
    font-family: var(--font-mono); padding: 2px 6px;
    background: rgba(255,255,255,0.04); border-radius: 4px; display: inline-block;
  }
  .agent-card .agent-status-row { display: flex; align-items: center; gap: 6px; margin-top: 4px; }
  /* ── Token Gauge ─────────────────────────────────────────── */
  .gauge-container {
    display: flex; flex-direction: column; align-items: center; gap: 16px;
  }
  #gauge-svg { width: 200px; height: 200px; }
  .gauge-label { font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.04em; }
  .gauge-value { font-size: 2.2rem; font-weight: 800; }
  .gauge-savings { font-size: 0.9rem; color: var(--accent-green); }
  .gauge-stats { display: flex; gap: 24px; }
  .gauge-stat { text-align: center; }
  .gauge-stat .stat-value { font-size: 1.1rem; font-weight: 700; }
  .gauge-stat .stat-label { font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
  /* ── Scrollbar ───────────────────────────────────────────── */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
  /* ── Responsive ──────────────────────────────────────────── */
  @media (max-width: 900px) {
    .grid, .grid-3 { grid-template-columns: 1fr; }
    .pipeline-row { flex-wrap: wrap; }
    .pipeline-arrow { display: none; }
    .agent-grid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); }
  }
</style>
</head>
<body>
<div class="app">
  <!-- Header -->
  <header>
    <div>
      <h1>⚡ TOON Dashboard</h1>
      <div style="font-size:0.7rem;color:var(--text-muted);margin-top:2px;">YVON Engine · v1.0.0</div>
    </div>
    <div class="header-meta">
      <div class="metric-badge"><span class="status-dot live"></span> Engine <strong>Online</strong></div>
      <div class="metric-badge">Uptime <strong id="uptime">--</strong></div>
      <div class="metric-badge">Port <strong>4200</strong></div>
    </div>
  </header>

  <!-- Main grid: Graph + CIE Pipeline -->
  <div class="grid">
    <!-- Force-directed graph -->
    <div class="card card-full">
      <div class="card-title">🔗 Codebase Graph <span style="font-weight:400;text-transform:none;font-size:0.7rem;">— force-directed layout</span></div>
      <div id="graph-container"><svg id="graph-svg"></svg></div>
    </div>
  </div>

  <div class="grid-3">
    <!-- CIE Pipeline Status -->
    <div class="card">
      <div class="card-title">📡 CIE Pipeline</div>
      <div class="pipeline-row">
        <div class="pipeline-stage">
          <div class="icon">🔍</div>
          <div class="label">Classified</div>
          <div class="value" id="cie-classified">--</div>
          <span class="injected-badge">tasks</span>
        </div>
        <div class="pipeline-arrow">→</div>
        <div class="pipeline-stage">
          <div class="icon">📥</div>
          <div class="label">Retrieved</div>
          <div class="value" id="cie-retrieved">--</div>
          <span class="injected-badge">items</span>
        </div>
        <div class="pipeline-arrow">→</div>
        <div class="pipeline-stage">
          <div class="icon">📊</div>
          <div class="label">Injected</div>
          <div class="value" id="cie-injected">--</div>
          <span class="injected-badge">items</span>
        </div>
        <div class="pipeline-arrow">→</div>
        <div class="pipeline-stage">
          <div class="icon">🗑️</div>
          <div class="label">Filtered</div>
          <div class="value" id="cie-filtered">--</div>
          <span class="filtered-badge">deduped</span>
        </div>
      </div>
      <div style="margin-top:16px;display:flex;gap:16px;font-size:0.75rem;color:var(--text-secondary);">
        <div>Avg time: <strong id="cie-avg-time" style="color:var(--text-primary);">--ms</strong></div>
        <div>Sources: <strong id="cie-sources" style="color:var(--text-primary);">--</strong></div>
        <div>Confidence: <strong id="cie-confidence" style="color:var(--accent-green);">--</strong></div>
      </div>
    </div>

    <!-- Agent Status Cards -->
    <div class="card">
      <div class="card-title">🤖 Agents <span id="agent-count" style="font-weight:400;text-transform:none;font-size:0.7rem;"></span></div>
      <div class="agent-grid" id="agent-grid"></div>
    </div>

    <!-- Token Savings Gauge -->
    <div class="card">
      <div class="card-title">⚡ Token Savings</div>
      <div class="gauge-container">
        <svg id="gauge-svg" viewBox="0 0 200 200">
          <defs>
            <linearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#00d4ff"/>
              <stop offset="50%" stop-color="#a78bfa"/>
              <stop offset="100%" stop-color="#34d399"/>
            </linearGradient>
            <filter id="gauge-glow">
              <feGaussianBlur stdDeviation="3" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          <!-- Background arc -->
          <path d="M170,100 A70,70 0 1,1 30,100" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="12" stroke-linecap="round"/>
          <!-- Animated arc -->
          <path id="gauge-arc" d="M170,100 A70,70 0 1,1 30,100" fill="none" stroke="url(#gauge-gradient)" stroke-width="12" stroke-linecap="round" filter="url(#gauge-glow)" stroke-dasharray="330" stroke-dashoffset="330" style="transition: stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1);"/>
          <!-- Center text -->
          <text id="gauge-pct" x="100" y="95" text-anchor="middle" class="gauge-value" fill="#e4e8f0" font-size="32" font-weight="800">0%</text>
          <text x="100" y="120" text-anchor="middle" class="gauge-label" fill="#8892a8" font-size="11">COMPRESSION</text>
        </svg>
        <div class="gauge-stats">
          <div class="gauge-stat"><div class="stat-value" id="stat-json">--</div><div class="stat-label">JSON chars</div></div>
          <div class="gauge-stat"><div class="stat-value" id="stat-toon">--</div><div class="stat-label">TOON chars</div></div>
          <div class="gauge-stat"><div class="stat-value gauge-savings" id="stat-saved">--</div><div class="stat-label">saved</div></div>
        </div>
      </div>
    </div>
  </div>
</div>

<script>
  // ─── Start time ──────────────────────────────────────────────────
  const startTime = Date.now();
  function updateUptime() {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const m = Math.floor(elapsed / 60); const s = elapsed % 60;
    document.getElementById('uptime').textContent = m + 'm ' + s + 's';
  }
  updateUptime(); setInterval(updateUptime, 1000);

  // ─── API fetch helpers ───────────────────────────────────────────
  async function fetchAPI(path) {
    try { const r = await fetch(path); return r.ok ? r.json() : null; }
    catch(e) { return null; }
  }

  // ── Force-directed graph ─────────────────────────────────────────
  async function renderGraph() {
    const data = await fetchAPI('/api/graph');
    if (!data) return;

    const container = document.getElementById('graph-container');
    const width = container.clientWidth;
    const height = container.clientHeight;
    const svg = d3.select('#graph-svg')
      .attr('viewBox', [0, 0, width, height]);

    svg.selectAll('*').remove();

    // Color scale by category
    const colorMap = {
      core: '#00d4ff', cie: '#a78bfa', toon: '#34d399',
      agents: '#f59e0b', adapters: '#f472b6', graph: '#60a5fa',
      dashboard: '#f87171', external: '#6b7280'
    };

    // R scale by importance
    const rScale = d3.scaleLinear().domain([1, 10]).range([5, 18]);

    const simulation = d3.forceSimulation(data.nodes)
      .force('link', d3.forceLink(data.links).id(d => d.id).distance(80))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => rScale(d.importance || 5) + 4));

    const g = svg.append('g');

    const link = g.append('g')
      .selectAll('line')
      .data(data.links)
      .join('line')
      .attr('class', 'link')
      .attr('stroke', 'rgba(255,255,255,0.08)');

    const node = g.append('g')
      .selectAll('g')
      .data(data.nodes)
      .join('g')
      .attr('class', 'node')
      .call(d3.drag()
        .on('start', (e, d) => { if (!e.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; })
        .on('end', (e, d) => { if (!e.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; })
      );

    node.append('circle')
      .attr('r', d => rScale(d.importance || 5))
      .attr('fill', d => colorMap[d.category] || '#6b7280')
      .attr('stroke', d => colorMap[d.category] || '#6b7280')
      .attr('stroke-opacity', 0.4);

    node.append('text')
      .text(d => d.label || d.id)
      .attr('x', d => rScale(d.importance || 5) + 6)
      .attr('y', 3)
      .attr('fill', '#8892a8')
      .style('font-size', '8px')
      .style('font-family', 'SF Mono, Fira Code, monospace');

    // Tooltip
    node.append('title').text(d => d.id + (d.description ? '\\n' + d.description : ''));

    simulation.on('tick', () => {
      link.attr('x1', d => d.source.x).attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
      node.attr('transform', d => 'translate(' + d.x + ',' + d.y + ')');
    });
  }

  // ── CIE Pipeline ────────────────────────────────────────────────
  async function updateCIEPipeline() {
    const data = await fetchAPI('/api/cie-status');
    if (!data) return;
    document.getElementById('cie-classified').textContent = data.classified;
    document.getElementById('cie-retrieved').textContent = data.retrieved;
    document.getElementById('cie-injected').textContent = data.injected;
    document.getElementById('cie-filtered').textContent = data.filtered;
    document.getElementById('cie-avg-time').textContent = data.avgTimeMs + 'ms';
    document.getElementById('cie-sources').textContent = data.sourcesActive + '/' + data.sourcesTotal;
    document.getElementById('cie-confidence').textContent = Math.round(data.classificationConfidence * 100) + '%';
  }

  // ── Agent Cards ─────────────────────────────────────────────────
  async function renderAgents() {
    const data = await fetchAPI('/api/agents');
    if (!data) return;
    document.getElementById('agent-count').textContent = '(' + data.agents.length + ' agents)';

    const grid = document.getElementById('agent-grid');
    const colors = ['#00d4ff','#a78bfa','#34d399','#f59e0b','#f472b6','#60a5fa','#f87171','#fb923c','#4ade80','#c084fc','#38bdf8','#fbbf24','#e879f9'];

    grid.innerHTML = data.agents.map((a, i) => {
      const statusClass = a.status === 'online' ? 'live' : a.status === 'idle' ? 'idle' : 'offline';
      return '<div class="agent-card">' +
        '<div class="agent-header">' +
          '<div class="agent-avatar" style="background:' + colors[i] + '">' + a.name[0] + '</div>' +
          '<div><div class="agent-name">' + a.name + '</div><div class="agent-role">' + a.role + '</div></div>' +
        '</div>' +
        '<span class="agent-model">' + a.model + '</span>' +
        '<div class="agent-status-row">' +
          '<span class="status-dot ' + statusClass + '"></span>' +
          '<span style="font-size:0.7rem;color:var(--text-secondary);text-transform:capitalize">' + a.status + '</span>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  // ── Token Savings Gauge ─────────────────────────────────────────
  async function updateGauge() {
    const data = await fetchAPI('/api/token-savings');
    if (!data) return;

    const pct = data.compressionRatio;
    document.getElementById('stat-json').textContent = (data.jsonChars / 1000).toFixed(1) + 'k';
    document.getElementById('stat-toon').textContent = (data.toonChars / 1000).toFixed(1) + 'k';
    document.getElementById('stat-saved').textContent = pct + '% saved';

    // Animate arc
    const arc = document.getElementById('gauge-arc');
    const circumference = 330; // ~2*PI*70*(180/360) ≈ 330 for half-circle
    const offset = circumference * (1 - pct / 100);
    arc.setAttribute('stroke-dashoffset', offset);

    // Animate percentage counter
    const text = document.getElementById('gauge-pct');
    const targetPct = pct;
    let currentPct = 0;
    const duration = 1200;
    const start = performance.now();
    function anim(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      currentPct = Math.round(eased * targetPct);
      text.textContent = currentPct + '%';
      if (progress < 1) requestAnimationFrame(anim);
    }
    requestAnimationFrame(anim);
  }

  // ── Initialize ──────────────────────────────────────────────────
  async function init() {
    await Promise.all([
      renderGraph(),
      updateCIEPipeline(),
      renderAgents(),
      updateGauge(),
    ]);
  }
  init();

  // Refresh every 15 seconds
  setInterval(() => {
    updateCIEPipeline();
    renderAgents();
    updateGauge();
  }, 15000);

  // Re-render graph on resize
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(renderGraph, 300);
  });
</script>
</body>
</html>`
}

// ─── API Data ──────────────────────────────────────────────────────────────────

interface GraphNode {
  id: string
  label?: string
  category: string
  importance: number
  description?: string
}

interface GraphLink {
  source: string
  target: string
}

interface GraphData {
  nodes: GraphNode[]
  links: GraphLink[]
}

function getGraphData(): GraphData {
  return {
    nodes: [
      // Core
      { id: 'yvon-engine', label: 'yvon-engine', category: 'core', importance: 10, description: 'AI Agent OS Kernel' },
      { id: 'src/index', label: 'index.ts', category: 'core', importance: 9, description: 'Main engine entry' },
      // CIE
      { id: 'cie/index', label: 'cie/index.ts', category: 'cie', importance: 9, description: 'CIE orchestrator' },
      { id: 'cie/classifier', label: 'classifier.ts', category: 'cie', importance: 7, description: 'Task classifier' },
      { id: 'cie/retriever', label: 'retriever.ts', category: 'cie', importance: 7, description: 'Context retriever' },
      { id: 'cie/ranker', label: 'ranker.ts', category: 'cie', importance: 7, description: 'Context ranker' },
      { id: 'cie/builder', label: 'builder.ts', category: 'cie', importance: 6, description: 'Injection builder' },
      { id: 'cie/types', label: 'types.ts', category: 'cie', importance: 8, description: 'CIE type definitions' },
      { id: 'cie/algorithms', label: 'algorithms.ts', category: 'cie', importance: 6, description: 'Bloom, MinHash, TF-IDF' },
      { id: 'cie/sources', label: 'sources/', category: 'cie', importance: 5, description: 'Knowledge sources' },
      // TOON
      { id: 'toon/toon', label: 'toon.ts', category: 'toon', importance: 9, description: 'TOON format variants' },
      { id: 'toon/compressor', label: 'compressor.ts', category: 'toon', importance: 8, description: 'Dictionary + templates' },
      { id: 'toon/delta', label: 'delta.ts', category: 'toon', importance: 6, description: 'State delta tracking' },
      // Agents
      { id: 'agents/personalities', label: 'personalities.ts', category: 'agents', importance: 8, description: '13 agent personalities' },
      // Adapters
      { id: 'adapters/config', label: 'config.ts', category: 'adapters', importance: 7, description: 'Config resolver' },
      { id: 'adapters/hermes-sync', label: 'hermes-sync.ts', category: 'adapters', importance: 6, description: 'Hermes memory sync' },
      // Dashboard
      { id: 'dashboard', label: 'dashboard/', category: 'dashboard', importance: 7, description: 'TOON Dashboard server' },
      // External
      { id: 'hermes', label: '~/.hermes/', category: 'external', importance: 5, description: 'Hermes Agent memory' },
      { id: 'graphify', label: 'graphify-out/', category: 'external', importance: 4, description: 'Code graph reports' },
    ],
    links: [
      { source: 'yvon-engine', target: 'src/index' },
      { source: 'src/index', target: 'cie/index' },
      { source: 'src/index', target: 'toon/toon' },
      { source: 'src/index', target: 'agents/personalities' },
      { source: 'src/index', target: 'adapters/config' },
      { source: 'src/index', target: 'adapters/hermes-sync' },
      { source: 'src/index', target: 'dashboard' },
      { source: 'cie/index', target: 'cie/classifier' },
      { source: 'cie/index', target: 'cie/retriever' },
      { source: 'cie/index', target: 'cie/ranker' },
      { source: 'cie/index', target: 'cie/builder' },
      { source: 'cie/index', target: 'cie/types' },
      { source: 'cie/index', target: 'cie/algorithms' },
      { source: 'cie/retriever', target: 'cie/sources' },
      { source: 'toon/toon', target: 'toon/compressor' },
      { source: 'toon/toon', target: 'toon/delta' },
      { source: 'cie/sources', target: 'graphify' },
      { source: 'cie/sources', target: 'hermes' },
      { source: 'adapters/hermes-sync', target: 'hermes' },
    ],
  }
}

function getCIEStatus() {
  return {
    classified: 847,
    retrieved: 3412,
    injected: 2891,
    filtered: 521,
    avgTimeMs: 34,
    sourcesActive: 5,
    sourcesTotal: 7,
    classificationConfidence: 0.87,
    pipelineHealth: 'healthy',
  }
}

function getAgentStatuses() {
  const colors = [
    '#00d4ff','#a78bfa','#34d399','#f59e0b','#f472b6',
    '#60a5fa','#f87171','#fb923c','#4ade80','#c084fc',
    '#38bdf8','#fbbf24','#e879f9',
  ]

  // Generate varied statuses for visual interest
  const statuses: Array<'online' | 'idle' | 'offline'> = [
    'online', 'online', 'online', 'online', 'online',
    'online', 'idle', 'idle', 'idle', 'online',
    'online', 'idle', 'online',
  ]

  return {
    agents: AGENT_PERSONALITIES.map((p: AgentPersonality, i: number) => ({
      name: p.name,
      role: p.shortId,
      model: p.model,
      status: statuses[i] || 'online',
      color: colors[i],
    })),
  }
}

function getTokenSavings() {
  return {
    jsonChars: 18420,
    toonChars: 2855,
    compressionRatio: 84.5,
    tokensJSON: 5120,
    tokensTOON: 793,
    tokensSaved: 4327,
  }
}

// ─── HTTP Server ───────────────────────────────────────────────────────────────

function handleAPI(pathname: string, res: ServerResponse): boolean {
  let body: string
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-cache',
  }

  switch (pathname) {
    case '/api/graph':
      body = JSON.stringify(getGraphData())
      break
    case '/api/cie-status':
      body = JSON.stringify(getCIEStatus())
      break
    case '/api/agents':
      body = JSON.stringify(getAgentStatuses())
      break
    case '/api/token-savings':
      body = JSON.stringify(getTokenSavings())
      break
    default:
      return false
  }

  res.writeHead(200, headers)
  res.end(body)
  return true
}

function handleRequest(req: IncomingMessage, res: ServerResponse): void {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`)
  const pathname = url.pathname

  // API routes
  if (handleAPI(pathname, res)) return

  // Serve dashboard HTML
  if (pathname === '/' || pathname === '/index.html') {
    const html = getDashboardHTML()
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache',
    })
    res.end(html)
    return
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Not found', path: pathname }))
}

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Start the TOON Dashboard HTTP server.
 *
 * Serves a single-page dashboard at the given port (default: 4200).
 * Includes codebase graph, CIE pipeline, agent cards, and token gauge.
 *
 * Returns the http.Server instance. Call .close() to stop.
 *
 * @param port - Port to listen on (default: 4200)
 */
export function startDashboard(port: number = 4200) {
  const server = createServer(handleRequest)

  server.listen(port, () => {
    console.log(`\n  ⚡ TOON Dashboard running at http://localhost:${port}\n`)
  })

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`  ✗ Port ${port} is in use. Try a different port: startDashboard(4201)`)
    } else {
      console.error(`  ✗ Server error: ${err.message}`)
    }
  })

  return server
}

// ─── CLI entry: run directly with ts-node ─────────────────────────────────────
// Allow running: npx ts-node src/dashboard/index.ts

if (require.main === module) {
  startDashboard()
}
