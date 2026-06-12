# YVON Engine

**AI Agent OS Kernel — One npm install. Full agent team.**

```bash
npm install @yvon/engine
npx yvon init
```

## What You Get

| Feature | Description |
|---------|-------------|
| **CIE** | Context Intelligence Engine — auto-injects relevant context into every LLM call |
| **13 Agents** | Marcus (CEO), Dev (CTO), Mia (Frontend), Raj (Backend), Quinn (QA), Lena (Brand), Kai (Analyst), Nate (Growth), Atlas (Art), Pixel (Production), Felix (Finance), Diana (COO), Kahneman (Psychology) |
| **TOON** | Token-Optimized Object Notation — 84.5% token savings on data tasks |
| **Knowledge Graphs** | graphify (code structure) + codegraph (dependencies) |
| **Hermes Sync** | Bidirectional CRDT memory sync with Hermes agent |
| **Self-Healing** | Circuit breakers, auto-rebuild, health monitoring |
| **Adaptive** | Detects existing features, fills gaps only |

## Quick Start

```bash
# Install
npm install @yvon/engine

# Initialize (auto-detects existing features)
npx yvon init

# Health check
npx yvon doctor

# Wire into your API route
```

```typescript
import { buildCieContext } from '@yvon/engine'

// In your Claude/DeepSeek API route:
const cie = buildCieContext({
  agentId: 'dev-lead',
  task: userMessage,
  venture: 'my-project',
})

// cie.systemExtension → prose rules for system prompt
// cie.dataBlock → TOON-formatted structural data
```

## Architecture

```
┌─────────────────────────────────────┐
│         YVON ENGINE                  │
│                                      │
│  CIE (classify → retrieve → rank)    │
│       ↓                              │
│  Knowledge Sources                   │
│    graphify | codegraph              │
│    agent memory | hermes             │
│    project docs | venture            │
│       ↓                              │
│  TOON Compression                    │
│    dense | api | js | claude         │
│       ↓                              │
│  LLM Call (Anthropic/OpenAI/any)     │
│       ↓                              │
│  Outcome → Self-Improvement          │
└─────────────────────────────────────┘
```

## Algorithms

| Algorithm | Purpose | Complexity |
|-----------|---------|:----------:|
| Bloom Filter | Context dedup | O(1) |
| MinHash | Near-duplicate detection | O(n) |
| TF-IDF | Relevance scoring | O(n·m) |
| Priority Queue | Top-K capped selection | O(n log k) |
| BFS | Blast radius analysis | O(V+E) |
| Circuit Breaker | Failure isolation | O(1) |

## Provider Support

Works with any OpenAI-compatible API:
- Anthropic (Claude)
- OpenAI (GPT-4)
- DeepSeek
- xAI (Grok)
- Google (Gemini)
- Custom endpoints

## Database Support

Pluggable adapters:
- Supabase
- PostgreSQL
- SQLite
- In-memory

## CLI Commands

```bash
yvon init          # Initialize engine
yvon doctor        # Health check
yvon graph         # Rebuild knowledge graphs
yvon agents        # Agent status
yvon compress      # Compression stats
yvon dashboard     # TOON visual dashboard
```

## License

MIT — YVON OS
