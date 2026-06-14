---
name: competitor-intelligence
version: 1.0.0
description: Structured competitor monitoring. Track funding rounds, product launches, pricing changes, team moves, tech stack. Battlecard format. SWOT integration.
triggers:
  - "competitor analysis"
  - "track competitor"
  - "competitive intelligence"
  - "what are competitors doing"
  - "competitor update"
---

# Competitor Intelligence

When this skill activates, systematically monitor competitors and produce actionable intelligence. Competitor intelligence is NOT just collecting data — it's answering: what does this mean for us?

## Competitor Tracking Matrix

For each competitor, track:

```yaml
competitor:
  name: "<name>"
  funding:
    total_raised: "$XM"
    last_round: "Series A"
    last_round_date: "YYYY-MM"
    lead_investor: "<VC>"
    valuation: "$XM" # estimated
  product:
    recent_launches: ["feature X (date)", "feature Y (date)"]
    pricing_changes: ["increased from $X to $Y on date"]
    tech_stack_signals: ["migrated from X to Y", "hiring for Z roles"]
  team:
    total_employees: N # LinkedIn estimate
    recent_hires: ["role, from company (date)"]
    recent_departures: ["role (date)"]
    key_executives: [{name, title, background}]
  go_to_market:
    target_segment: "SMB|Mid-market|Enterprise"
    primary_channel: "PLG|Sales-led|Partnerships"
    recent_campaigns: ["campaign X on channel Y"]
    content_strategy: ["blog frequency", "social platforms"]
  market_signals:
    website_traffic_estimate: "N visits/month"
    app_store_rating: X.X (N reviews)
    g2_crowd_rating: X.X
    social_growth: "platform Y: N followers, trending direction"
```

## Signal Prioritization

| Signal Type | Urgency | Example |
|-------------|---------|---------|
| **Pricing change** | HIGH — Immediate revenue impact | Competitor drops price 40%, launches free tier |
| **Major product launch** | HIGH — May shift market | Launches feature that was our differentiator |
| **Funding round** | MEDIUM — 3-6 month impact window | Raised $50M Series B → aggressive hiring/spending |
| **Key executive hire** | MEDIUM — Signals strategy shift | Hired VP Enterprise → going upmarket |
| **Partnership announcement** | MEDIUM — Distribution channel shift | Partnered with major platform |
| **Office opening** | LOW — Long-term geographic expansion | New office in Berlin |
| **Rebrand/website refresh** | LOW — Positioning change | New messaging, targeting new segment |

## Monitoring Sources

| Source | What It Reveals | Frequency |
|--------|----------------|-----------|
| **Crunchbase** | Funding, acquisitions, key hires | Weekly |
| **LinkedIn** | Employee count, new hires, departures | Weekly |
| **Product Hunt / Hacker News** | Product launches, community sentiment | Daily |
| **Competitor blogs / changelogs** | Feature releases, strategy | Weekly |
| **G2 / Capterra / TrustRadius** | Customer satisfaction, feature gaps | Monthly |
| **App Store / Play Store** | Reviews, version updates | Weekly |
| **Job boards** | Hiring priorities, tech stack | Monthly |
| **SEC EDGAR** | Financials (if public), material events | Quarterly |
| **Wayback Machine** | Historical website/pricing changes | As needed |
| **SimilarWeb / Semrush** | Traffic estimates, keywords | Monthly |

## Battlecard Format

For each major competitor, maintain a one-page battlecard:

```markdown
# Competitor: [Name]
**One-liner:** What they claim to be
**Funding:** $X raised, Y employees

## Strengths (what they do better)
1. 
2. 

## Weaknesses (where we win)
1. 
2. 

## Objection handling
| Customer says... | We respond... |
|-----------------|---------------|
| "[Competitor] has feature X" | "Here's how we solve that differently..." |

## Win/Loss Analysis
Last 5 deals: 3 wins, 2 losses
Why we won: [reasons]
Why we lost: [reasons]
```

## Integration
- **Kai (Analyst):** Feed competitive positioning data
- **Radar self:** Continuous monitoring, alert on significant changes
- **Board:** Escalate existential competitive threats
