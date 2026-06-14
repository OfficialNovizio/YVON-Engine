---
name: market-mapping
version: 1.0.0
description: Market landscape mapping. 2x2 positioning matrix, value chain analysis, Porter's Five Forces, market concentration (HHI). Identify white space and competitive dynamics.
triggers:
  - "market map"
  - "market landscape"
  - "positioning map"
  - "competitive landscape"
  - "market structure"
---

# Market Mapping

Map the competitive landscape to identify positioning, market structure, and strategic opportunities.

## 1. 2x2 Positioning Matrix

Choose two dimensions that matter to customers. Common axes for SaaS:
- Price (low to high) vs Breadth of features (narrow to broad)
- Self-serve to High-touch vs Generalist to Specialist
- SMB to Enterprise vs Horizontal to Vertical

**Rules for good axes:**
- NOT correlated (price vs features IS correlated — bad)
- Differentiates competitors
- Meaningful to customers

## 2. Porter's Five Forces

Score each force 1-5 (1=weak, 5=strong):

### Threat of New Entrants
- Capital requirements, network effects, switching costs, regulatory barriers

### Bargaining Power of Suppliers
- Number of suppliers, uniqueness, switching cost, forward-integration risk

### Bargaining Power of Buyers
- Number of buyers, price sensitivity, substitute availability, switching cost

### Threat of Substitutes
- Alternative solutions, price-performance ratio, buyer propensity to substitute

### Industry Rivalry
- Number of competitors, industry growth rate, exit barriers, differentiation

**Overall Industry Attractiveness:** Sum forces. 5-10 = attractive. 11-17 = moderate. 18-25 = unattractive.

## 3. Market Concentration (Herfindahl-Hirschman Index)

HHI = Sum of squared market shares of all firms.
- HHI under 1,500: Unconcentrated (competitive)
- HHI 1,500-2,500: Moderately concentrated
- HHI over 2,500: Highly concentrated

Rough estimation: 5 equal players = HHI 2,000. 3 equal players = HHI 3,333.

## 4. Value Chain Analysis

Map the industry value chain:
```
[Infrastructure] -> [Platform] -> [Application] -> [Distribution] -> [End user]
```

Identify where margin accumulates and where commoditization is happening.

## 5. Strategic Group Map

Cluster competitors by strategy:
| Group | Examples | Strategy |
|-------|----------|----------|
| Open source | Project A, B | Community growth to enterprise |
| Platform plays | Company C, D | Developer tooling to infrastructure |
| Vertical SaaS | Company E, F | Deep vertical integration |

**Mobility barriers:** What prevents a competitor from one group entering another?
