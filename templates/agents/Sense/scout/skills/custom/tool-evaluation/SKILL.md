---
name: tool-evaluation
version: 1.0.0
description: Evaluate new developer tools and AI products. Stars/forks ratio, commit frequency, issue response time, documentation quality, community size, bus factor.
triggers:
  - "evaluate this tool"
  - "is this project good"
  - "should we use this"
  - "tool assessment"
  - "library evaluation"
---

# Tool Evaluation

When this skill activates, systematically evaluate new developer tools, libraries, and AI products for potential integration into the YVON stack.

## Evaluation Dimensions

### 1. Project Health (GitHub Signals)

| Metric | Green | Yellow | Red |
|--------|-------|--------|-----|
| **Commits (last month)** | >20 | 5-20 | <5 |
| **Last commit** | <7 days | 7-30 days | >30 days |
| **Open issues** | <50 with active triage | 50-200 | >200 untriaged |
| **Issue response time** | <48 hours | 2-7 days | >7 days |
| **PR merge time** | <1 week | 1-4 weeks | >1 month |
| **Stars/forks ratio** | 5:1 to 20:1 | <5:1 or >50:1 | N/A |
| **Contributors (last 6 months)** | >10 | 3-10 | <3 (bus factor risk) |
| **Releases (last 6 months)** | >5 | 2-5 | <2 |

### 2. Quality Signals

| Signal | How to Check |
|--------|-------------|
| **Documentation** | Is there a README? Quickstart? API reference? Examples? |
| **Tests** | CI passing? Coverage badge? Integration tests? |
| **TypeScript types** | Built-in or DefinitelyTyped? Recent updates? |
| **Breaking changes** | Changelog exists? Semver followed? Migration guides? |
| **Dependencies** | How many? Any deprecated? Security advisories? |
| **Bundle size** | (npm packages) Check on bundlephobia.com |

### 3. Community Health

| Signal | How to Check |
|--------|-------------|
| **Discord/Slack** | Active? Questions get answered? |
| **Stack Overflow** | Tag exists? Questions answered? |
| **GitHub Discussions** | Active? Maintainers participate? |
| **Conference talks** | Maintainers speaking at conferences? (signals investment) |
| **Sponsored** | Backed by company or individual? (sustainability) |

### 4. Security

| Check | Tool |
|-------|------|
| **Known vulnerabilities** | `npm audit`, Snyk, GitHub Security Advisories |
| **Supply chain** | NPM provenance? Signed commits? |
| **License** | Compatible with project? (see open-source-compliance skill) |
| **Data handling** | Telemetry? What data sent home? |

## Scoring Rubric

| Category | Weight | Score (1-5) |
|----------|--------|-------------|
| Project activity | 25% | 1=dead, 5=vibrant |
| Code quality | 20% | 1=mess, 5=exemplary |
| Documentation | 15% | 1=none, 5=comprehensive |
| Community | 15% | 1=ghost town, 5=thriving |
| Security | 15% | 1=vulnerable, 5=clean |
| License fit | 10% | 1=incompatible, 5=perfect |

**Weighted Score:** Sum (score × weight). 4.0+ → adopt. 3.0-3.9 → evaluate further. <3.0 → reject or monitor.

## Red Flags (Any ONE = Reject or Extreme Caution)
- License incompatible (GPL for proprietary, no license at all)
- Last commit >6 months, no maintenance announcement
- Founder/sole maintainer unreachable
- Known unfixed critical security vulnerability >30 days
- npm package with install scripts that phone home
- Project with <100 stars but claims to replace established tool
- Repository archived/read-only without successor
