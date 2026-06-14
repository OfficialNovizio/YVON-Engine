---
name: emerging-tech-radar
version: 1.0.0
description: Emerging technology radar. Scan VC investments, academic paper velocity, conference presentations, corporate R&D announcements. Technology readiness level (TRL) assessment.
triggers:
  - "emerging tech"
  - "tech radar"
  - "what's new in AI"
  - "technology watch"
  - "new technology"
---

# Emerging Technology Radar

When this skill activates, scan for emerging technologies that could impact YVON's competitive position. Focus on early signals — before they appear in mainstream tech news.

## Technology Readiness Levels (TRL)

| TRL | Phase | Description | Action |
|-----|-------|-------------|--------|
| **1** | Basic research | Paper published, no implementation | Note, revisit in 6 months |
| **2** | Applied research | Proof of concept exists | Monitor paper citations |
| **3** | Experimental | Code released, works in lab | Run reproduction test |
| **4** | Prototype | Works on standard benchmarks | Evaluate for YVON use case |
| **5** | Validated | Tested in relevant environment | Consider integration |
| **6** | Demo | System demo in operational environment | Pilot project |
| **7** | Production | Running in production at another company | Adopt if fits |
| **8** | Complete | Proven in production at scale | Standard practice |
| **9** | Mature | Commodity technology | Already using |

## Scanning Sources

### Academic Signals (TRL 1-3)
- **arXiv (cs.AI, cs.CL, cs.LG, cs.CV):** Paper velocity in subcategories
- **Papers With Code:** Trending papers + implementations
- **Conference proceedings:** NeurIPS, ICML, ICLR, ACL, CVPR
- **Citation velocity:** Papers gaining citations fast (50+ in first month)

### Investment Signals (TRL 2-5)
- **Crunchbase:** Early-stage funding in AI subcategories
- **Y Combinator batches:** What are YC startups building?
- **Corporate venture arms:** Google Ventures, Microsoft M12, Nvidia NVentures investments
- **Acquisition activity:** Who's buying what?

### Open Source Signals (TRL 3-6)
- **GitHub trending:** Weekly trending repositories
- **Papers With Code implementations:** Most-implemented papers
- **Hugging Face models:** Trending models, most-downloaded
- **npm / PyPI:** Package download velocity

### Corporate Signals (TRL 5-8)
- **Big tech blog posts:** Google AI, Meta AI, OpenAI, Anthropic, Microsoft Research
- **Product launches:** Features that incorporate research
- **Job postings:** Roles companies are hiring for (signals commitment)
- **Conference keynotes:** What executives are publicly betting on

## Technology Watch Categories (for YVON)

| Category | What to Watch | Why |
|----------|--------------|-----|
| **Agent architectures** | Multi-agent systems, tool use, planning | Core to YVON OS |
| **Context windows** | >1M token models, memory systems | Enables better agent sessions |
| **Cost efficiency** | Cheaper inference, quantization, distillation | Reduces YVON operating costs |
| **Structured output** | JSON mode, function calling improvements | Agent tool reliability |
| **Evaluation** | New benchmarks, contamination detection | Validating model choices |
| **Safety/alignment** | Red-teaming advances, constitutional AI | YVON security |
| **Open source models** | LLaMA, Mistral, DeepSeek, Qwen advances | Alternative to paid APIs |
| **Vector/embeddings** | New embedding models, RAG advances | Better agent memory retrieval |

## Output: Technology Radar Entry

```yaml
radar_entry:
  technology: "<name>"
  category: "<from categories above>"
  trl: 1-9
  first_seen: YYYY-MM-DD
  signals:
    - {type: paper|investment|oss|corporate, source: "<url>", date: YYYY-MM-DD}
  potential_impact: transformational|significant|incremental|none
  yvon_relevance: direct|indirect|none
  time_to_impact: "<6 months|6-12 months|1-2 years|2+ years"
  recommended_action: monitor|evaluate|pilot|adopt
  monitored_by: scout|forge|velette
```

## Integration
- **Forge agent:** Deep evaluation of promising technologies
- **Velette agent:** Fact-check radar claims
- **Board:** Quarterly radar review for strategic planning
