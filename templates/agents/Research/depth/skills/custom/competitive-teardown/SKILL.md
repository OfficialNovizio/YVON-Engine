---
name: competitive-teardown
version: 1.0.0
description: Product competitive teardown. UX audit (Nielsen's 10 heuristics), feature matrix (P0/P1/P2), pricing comparison, tech stack inference, team size proxy. From public information only.
triggers:
  - "teardown this product"
  - "competitive analysis"
  - "product teardown"
  - "analyze competitor product"
  - "reverse engineer UX"
---

# Competitive Teardown

Conduct a systematic competitive product teardown using only publicly available information.

## Teardown Sections

### 1. Company & Product Overview
- Founded: Year, location
- Funding: Total raised, last round, lead investors
- Team size: LinkedIn employee count (proxy)
- Target audience: From website copy, case studies, pricing page

### 2. UX Audit (Nielsen's 10 Heuristics)

Score each 1-5 (1=violates, 5=exemplary):
1. Visibility of system status
2. Match between system and real world
3. User control and freedom (undo/redo)
4. Consistency and standards
5. Error prevention
6. Recognition rather than recall
7. Flexibility and efficiency of use
8. Aesthetic and minimalist design
9. Help users recognize, diagnose, recover from errors
10. Help and documentation

**Overall UX Score: /50**

### 3. Feature Matrix

| Feature | Category | Competitor | YVON | Gap |
|---------|----------|-----------|------|-----|
| Feature 1 | Onboarding | Present | Missing | Behind |
| Feature 2 | Core workflow | Present | Present | Parity |
| Feature 3 | Analytics | Missing | Present | Ahead |

- **P0 (Table stakes):** Must-have to compete. No P0 gaps = existential risk.
- **P1 (Differentiator):** Important, users compare. Close P1 gaps.
- **P2 (Nice-to-have):** Low priority.

### 4. Pricing Analysis

| Tier | Price | Key Limitations | Target |
|------|-------|-----------------|--------|
| Free | $0 | Limited to X | Individuals |
| Pro | $X/mo | Up to Y | Small teams |
| Enterprise | Custom | Unlimited | Companies |

### 5. Tech Stack Inference

From public signals (job postings, engineering blog, browser devtools):
- Frontend framework, backend language, database, infrastructure, AI/ML models
- Confidence: High (blogged) / Medium (job posting) / Low (educated guess)

### 6. Growth & Market Signals
- Website traffic estimate (SimilarWeb)
- App Store rating and reviews
- Social media following and engagement
- Content strategy (blog frequency, topics)

### 7. GTM Analysis
- Primary acquisition channel: PLG, sales, partnerships, content?
- Ideal Customer Profile (ICP): From case studies, testimonials
- Messaging: How do they position vs alternatives?

### 8. Strengths & Weaknesses
- What they do better than anyone (strengths)
- Where we can beat them (weaknesses)
- What customers rave about vs complain about

### 9. Strategic Implications
- Threat level: Existential / Significant / Moderate / Low
- Urgency: Act now / This quarter / This year / Monitor
- Recommended response: Build parity / Differentiate / Partner / Ignore
