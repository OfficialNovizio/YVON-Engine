---
name: trend-detection
version: 1.0.0
description: Trend detection using quantitative signals. Google Trends comparison, GitHub star velocity, HN frontpage frequency, Crunchbase funding signals, social sentiment analysis. Leading vs lagging indicators.
triggers:
  - "what's trending"
  - "trend detection"
  - "is this growing"
  - "technology trend"
  - "market trend"
---

# Trend Detection

When this skill activates, detect emerging trends using quantitative signals. Distinguish between hype (noise) and genuine trends (signal) using multiple independent data sources.

## Signal Sources

### 1. Google Trends
Compare up to 5 terms over time (2004-present).
- **Rising:** Search volume growing steadily (6+ months). Real interest.
- **Spiking:** Sudden peak, drops quickly. News-driven, not sustainable.
- **Seasonal:** Predictable pattern. Tax software = Q1 peak.
- **Declining:** Long-term downward trend. Technology being replaced.

**How to use:** Compare "term A" vs "term B" to see relative interest, not absolute volume. Normalize to 100.

### 2. GitHub Star Velocity
Track stars/day for open-source projects.
- **<10 stars/day:** Early stage or niche
- **10-50 stars/day:** Growing project, active community
- **50-200 stars/day:** Fast-growing, likely on HN/Reddit front page
- **200+ stars/day:** Viral growth (e.g., DeepSeek, Stable Diffusion)

**Important:** Stars are a leading indicator of developer interest, NOT production readiness. High stars + low commit frequency = abandoned but popular.

### 3. Hacker News Frontpage Frequency
Track how often a technology/company appears.
- **1-2 frontpages/month:** Emerging interest
- **1-2 frontpages/week:** Active discussion, growth phase
- **3+ frontpages/week:** Peak hype (caution)
- **<1 frontpage/month:** Interest fading or mature

### 4. Crunchbase Funding Signals
Track investment in a category.
- **Increasing round sizes quarter-over-quarter:** Investor confidence growing
- **New VC firms entering the category:** Category heating up
- **Follow-on rate (Seed→Series A %):** 30%+ = healthy. <15% = selection problem
- **"AI" in company description:** 2023-2024 = noise. Need to filter.

### 5. Job Posting Trends
Track hiring demand for skills.
- **Increasing job postings for technology X:** Enterprise adoption growing (lagging indicator)
- **Salary growth for role Y:** Demand exceeds supply

## Trend Assessment Framework

For each trend, score 1-5 on three axes:

| Axis | 1 (Weak) | 3 (Moderate) | 5 (Strong) |
|------|----------|--------------|------------|
| **Velocity** | <10% growth/year | 10-40% growth/year | >40% growth/year |
| **Persistence** | Fading after <3 months | Sustained 3-12 months | Sustained 12+ months |
| **Amplitude** | Niche community | Growing to adjacent audiences | Mainstream adoption signals |

**Trend Score = Velocity × Persistence × Amplitude** (range: 1-125)

| Score | Classification | Action |
|-------|---------------|--------|
| 1-15 | Noise | Monitor, no action |
| 16-45 | Emerging | Research deeper, monthly review |
| 46-80 | Growing | Active analysis, quarterly strategy review |
| 81-125 | Established | Competitive response required |

## Leading vs Lagging Indicators

| Leading (predicts future) | Lagging (confirms past) |
|---------------------------|------------------------|
| GitHub stars acceleration | GitHub total stars |
| HN frontpage frequency increase | HN frontpage total count |
| VC investment in category (early stage) | Revenue of companies in category |
| Job postings for skill X | Number of people with skill X |
| Conference paper submissions | Published papers |
| API call volume growth | Total API customers |

**Rule:** Act on leading indicators. Validate with lagging indicators.

## Integration
- **Scout agent:** Provide new tools/technologies to evaluate
- **Kai (Analyst):** Feed trend data for content strategy
- **Board:** Escalate trends that threaten core business
