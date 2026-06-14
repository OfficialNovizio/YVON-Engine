---
name: market-sizing
version: 1.0.0
description: TAM/SAM/SOM market sizing methodology. Bottom-up vs top-down calculation. Credible data sources: Gartner, IDC, Statista, OECD, World Bank. CAGR projection with confidence intervals.
triggers:
  - "market size"
  - "TAM SAM SOM"
  - "how big is the market"
  - "market sizing"
  - "addressable market"
---

# Market Sizing

When this skill activates, calculate Total Addressable Market (TAM), Serviceable Addressable Market (SAM), and Serviceable Obtainable Market (SOM) using verifiable data sources.

## Definitions

| Term | Definition | Calculation |
|------|------------|-------------|
| **TAM** | Total worldwide revenue opportunity if you had 100% market share | (Total potential customers) × (Annual contract value) |
| **SAM** | Portion of TAM you can reach with your current business model and geography | TAM filtered by: geography, company size, industry verticals you serve |
| **SOM** | Realistic market share you can capture in 3-5 years | SAM × (realistic market share %) — benchmarked against competitors |

## Top-Down vs Bottom-Up

### Top-Down
Start with industry reports, narrow down.
```
Global software market ($650B, Gartner 2024)
  → AI/ML segment ($150B)
    → NLP/Chatbot segment ($25B)
      → Enterprise chatbot ($8B) = TAM
```

**Pros:** Quick, uses analyst reports
**Cons:** Often inflated, analyst optimism bias, hard to validate

### Bottom-Up
Start with customer counts and pricing.
```
Target companies in US: 50,000 (mid-market SaaS, 50-500 employees)
% that would buy an AI agent OS: 15% (survey data or proxy)
= 7,500 potential customers
× $12,000 average ACV
= $90M TAM (US mid-market only)
```

**Pros:** More defensible, tied to actual customer economics
**Cons:** Requires primary research, assumptions must be justified

### Best Practice
Calculate BOTH. If they diverge by >2x, investigate why. Report the bottom-up as primary, top-down as validation.

## Credible Data Sources

| Source | What It Provides | Trust Level |
|--------|-----------------|-------------|
| **Gartner** | IT spending, software market sizes, Magic Quadrant | High (paid, methodology disclosed) |
| **IDC** | IT market forecasts, vendor market share | High (paid) |
| **Statista** | Aggregated market data across industries | Medium (aggregates, check original source) |
| **OECD** | Economic indicators, broadband penetration, R&D spend | High (public, methodology transparent) |
| **World Bank** | Country-level economic data, population | High (public) |
| **Bureau of Labor Statistics** | Employment by industry, wage data | High (US government) |
| **Crunchbase** | Startup funding, company counts by category | Medium (self-reported, incomplete) |
| **SEC EDGAR** | Public company 10-K/10-Q filings | High (legally required, audited) |

## CAGR Projection

Compound Annual Growth Rate:
```
CAGR = (End Value / Start Value)^(1/n) - 1
```
where n = number of years.

**Example:** Market grows from $10B to $18B over 5 years → CAGR = (18/10)^(1/5) - 1 = 12.5%

### Confidence Interval
- **High confidence:** Multiple analyst reports agree within ±20%
- **Medium confidence:** One credible source, some proxy data
- **Low confidence:** Extrapolated from adjacent markets, no direct data → MUST flag

## SOM Reality Check

Apply these filters to be honest:
1. **Winner-takes-most?** If market is winner-takes-most (social networks, OS), SOM should be aggressive (20-40% of SAM). If fragmented (consulting, local services), SOM should be modest (1-5%).
2. **Competitor benchmark:** What market share does the #3 player have in adjacent markets?
3. **Time to market:** SOM grows over time. Year 1: <1%, Year 3: 2-5%, Year 5: 5-15% (if successful).

## Output Template
```yaml
market_sizing:
  market: "<description>"
  date: YYYY-MM-DD
  methodology: bottom_up|top_down|both
  tam: $XM
  tam_source: "<report, calculation>"
  sam: $XM
  sam_filters: [geography, company_size, industry]
  som_year3: $XM
  som_year5: $XM
  cagr: X%
  confidence: high|medium|low
  key_assumptions: [...]
  risks: [...]
```
