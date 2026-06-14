---
name: research-methodology
version: 1.0.0
description: Structured research methodology. Hypothesis formation, source triangulation (minimum 3 independent sources), evidence grading (primary/secondary/tertiary), limitation declaration, confidence scoring.
triggers:
  - "research this topic"
  - "deep dive into"
  - "comprehensive research"
  - "research methodology"
  - "how to research"
---

# Research Methodology

When this skill activates, conduct structured deep research. Every claim must be triangulated across minimum 3 independent sources. Evidence must be graded by type and reliability.

## Research Protocol

### Phase 1: Hypothesis Formation
- **H1 (Primary):** The main question you're investigating
- **H2 (Alternative):** The opposite or competing explanation
- **H3 (Null):** No effect, no relationship, no significance

### Phase 2: Source Collection

Minimum source count by claim type:
| Claim Type | Min Sources | Ideal Sources |
|------------|-------------|---------------|
| Factual (price, date, feature) | 2 | 3+ |
| Statistical (market size, % change) | 3 | 5+ |
| Causal (X causes Y) | 3 + methodology review | 5+ with diverse methods |
| Opinion/forecast | 2 + disclose author | 3+ with conflicting views |

### Phase 3: Source Triangulation

For each claim, find sources that:
1. **Corroborate** (same finding, different data/method)
2. **Qualify** (same direction but weaker/conditional)
3. **Contradict** (opposite finding)

A claim with only corroborating sources but no qualifying/contradicting sources suggests selection bias.

### Phase 4: Evidence Grading

| Grade | Type | Example |
|-------|------|---------|
| **A — Primary** | Original research, first-hand data | Peer-reviewed RCT, government census, company 10-K |
| **B — Secondary** | Analysis of primary sources | Meta-analysis, systematic review, industry report |
| **C — Tertiary** | Summaries, compilations | Wikipedia, blog summary, news aggregation |
| **D — Anecdotal** | Individual experience | Single customer story, founder interview |
| **F — Unverifiable** | No source, hearsay | Viral tweet without citation |

**Rule:** Grade C or below may corroborate but cannot alone support a key claim.

### Phase 5: Confidence Scoring

For each finding:
| Confidence | Evidence Required |
|------------|-------------------|
| High (5/5) | 3+ Grade A/B sources, independent methods, consistent |
| Medium-High (4/5) | 2+ Grade A/B, consistent but limited perspectives |
| Medium (3/5) | 1 Grade A/B + Grade C corroboration |
| Low-Medium (2/5) | Grade C sources only, or conflicting signals |
| Low (1/5) | Anecdotal only, or single unverified source |

### Phase 6: Limitations Declaration

Must declare:
- Sources that contradict findings
- Context/timeframe limitations
- Geographic limitations
- Methodology limitations (correlation, not causation)
- Conflicts of interest
- Assumptions made when data was missing

## Output Template
```yaml
research_brief:
  topic: "<question>"
  date: YYYY-MM-DD
  hypotheses:
    h1: {description: "...", verdict: supported|rejected|inconclusive}
    h2: {description: "...", verdict: supported|rejected|inconclusive}
  key_findings:
    - {finding: "...", confidence: 1-5, sources: N, grades: [A,B,C]}
  triangulation:
    corroborating_sources: N
    qualifying_sources: N
    contradicting_sources: N
  evidence_quality_score: A-F
  limitations: [...]
  recommendation: "<what to do with this information>"
```
