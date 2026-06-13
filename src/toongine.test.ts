// ToonGine — Core Smoke Tests
// Validates: module resolution, createEngine, CIE pipeline, TOON compression, metrics

import { describe, it, expect } from 'vitest'
import { createEngine, buildCieContext, toon, autoToonMiddleware, metrics } from './index'
import { classifyTask } from './cie/classifier'
import { BloomFilter, ContextPriorityQueue } from './cie/algorithms'

// ─── Module Resolution ──────────────────────────────────────────────────────

describe('Module Resolution', () => {
  it('resolves toongine main entry', () => {
    expect(createEngine).toBeDefined()
    expect(buildCieContext).toBeDefined()
    expect(toon).toBeDefined()
    expect(autoToonMiddleware).toBeDefined()
  })

  it('toon has all format methods', () => {
    expect(toon.dense).toBeDefined()
    expect(toon.claude).toBeDefined()
    expect(toon.api).toBeDefined()
    expect(toon.js).toBeDefined()
    expect(toon.parse).toBeDefined()
  })
})

// ─── createEngine ───────────────────────────────────────────────────────────

describe('createEngine', () => {
  it('creates engine with version from package.json', () => {
    const engine = createEngine()
    expect(engine.version).toBeDefined()
    expect(engine.version).not.toBe('1.0.0')
    expect(engine.config).toBeDefined()
  })

  it('provides CIE context builder', () => {
    const engine = createEngine()
    expect(engine.cie.buildContext).toBeDefined()
    expect(typeof engine.cie.buildContext).toBe('function')
  })

  it('provides TOON compression', () => {
    const engine = createEngine()
    expect(engine.toon.dense).toBeDefined()
    expect(engine.toon.compress).toBeDefined()
  })

  it('provides agent personality lookup', () => {
    const engine = createEngine()
    expect(engine.agents.getPersonality).toBeDefined()
  })
})

// ─── TOON Formats ───────────────────────────────────────────────────────────

describe('TOON Formatting', () => {
  const sampleItems = [
    { id: 'd1', venture: 'novizio', agent: 'marcus', text: 'Approve post', urgency: 'today' },
    { id: 'd2', venture: 'hourbour', agent: 'diana', text: 'Review budget', urgency: 'this week' },
  ]

  it('toon.dense produces pipe-delimited format', () => {
    const result = toon.dense(sampleItems, 'decision')
    expect(result).toBeDefined()
    expect(result).toContain('|')
    expect(result.split('\n').length).toBe(2)
  })

  it('toon.claude produces natural language format', () => {
    const result = toon.claude(sampleItems, 'decision')
    expect(result).toBeDefined()
    expect(result).toContain('·')
    expect(result).toContain('venture=')
  })

  it('toon.api produces self-describing format', () => {
    const result = toon.api(sampleItems, 'decision')
    expect(result).toBeDefined()
    expect(result.startsWith('#')).toBe(true)
  })

  it('toon.js produces JSON-parseable format', () => {
    const result = toon.js(sampleItems, 'decision')
    const parsed = JSON.parse(result)
    expect(parsed.h).toBeDefined()
    expect(parsed.d).toBeDefined()
    expect(parsed.d.length).toBe(2)
  })

  it('toon.parse round-trips all formats', () => {
    const formats = ['dense', 'claude', 'api', 'js'] as const
    for (const fmt of formats) {
      const encoded = toon[fmt](sampleItems, 'decision')
      const decoded = toon.parse(encoded, 'decision')
      expect(decoded.length).toBe(2)
    }
  })
})

// ─── CIE Pipeline ───────────────────────────────────────────────────────────

describe('CIE Pipeline', () => {
  it('classifyTask returns valid task type', () => {
    // CIE classifier takes agentId, task, venture
    const result = classifyTask('marcus-ceo', 'fix the bug in the login page', 'novizio')
    expect(result).toBeDefined()
    expect(result.type).toBeDefined()
    
    const r2 = classifyTask('kai-analyst', 'analyze competitor pricing strategy', 'novizio')
    expect(r2.type).toBeDefined()
  })

  it('buildCieContext returns structured context', () => {
    const result = buildCieContext({
      agentId: 'marcus-ceo',
      task: 'What are the top priorities for Novizio this week?',
      venture: 'novizio',
    })
    expect(result).toBeDefined()
    expect(result.systemExtension).toBeDefined()
    expect(result.dataBlock).toBeDefined()
    expect(result.timeMs).toBeGreaterThanOrEqual(0)
    expect(result.itemsInjected).toBeGreaterThanOrEqual(0)
  })
})

// ─── Algorithms ─────────────────────────────────────────────────────────────

describe('Algorithms', () => {
  it('BloomFilter basic operations', () => {
    const bf = new BloomFilter(1024, 3)
    bf.add('test-item')
    expect(bf.contains('test-item')).toBe(true)
    expect(bf.contains('missing-item')).toBe(false)
  })

  it('ContextPriorityQueue maintains order', () => {
    const pq = new ContextPriorityQueue(500) // 500 char budget
    pq.offer('item-a', 10, 'source-1')
    pq.offer('item-b', 50, 'source-2')
    pq.offer('item-c', 30, 'source-3')
    const items = pq.select()
    expect(items.length).toBeGreaterThan(0)
    // Highest priority should be first
    expect(items[0].priority).toBeGreaterThanOrEqual(items[items.length - 1].priority)
  })
})

// ─── Metrics ────────────────────────────────────────────────────────────────

describe('Metrics Collector', () => {
  it('metrics is a singleton with enable/disable', () => {
    expect(metrics).toBeDefined()
    expect(typeof metrics.isEnabled).toBe('function')
    metrics.enable()
    expect(metrics.isEnabled()).toBe(true)
    metrics.disable()
    expect(metrics.isEnabled()).toBe(false)
  })
})

// ─── Edge Cases ─────────────────────────────────────────────────────────────

describe('Edge Cases', () => {
  it('handles empty items array', () => {
    const result = toon.dense([], 'decision')
    expect(result).toBe('')
  })

  it('handles null/undefined field values', () => {
    const result = toon.dense([{ id: null, venture: undefined, text: 'test' }], 'decision')
    expect(result).toContain('-')
  })

  it('handles pipe characters in values', () => {
    const items = [{ id: 'x', text: 'value|with|pipes' }]
    // TOON escapes pipe chars with backslash
    const encoded = toon.dense(items, 'decision')
    expect(encoded).toBeDefined()
    expect(encoded).toContain('\\|')
    // Round-trip via TOON-JS preserves pipes natively
    const js = toon.js(items, 'decision')
    const parsed = JSON.parse(js)
    const textIdx = parsed.h.indexOf('text')
    expect(textIdx).toBeGreaterThanOrEqual(0)
    expect(parsed.d[0][textIdx]).toBe('value|with|pipes')
  })
})
