---
name: source-credibility
version: 1.0.0
description: Source credibility evaluation rubric. Domain authority, author expertise (h-index, publications), publication date, citation count, peer review status, funding disclosure, conflict of interest.
triggers:
  - "is this source credible"
  - "source evaluation"
  - "can I trust this"
  - "source check"
  - "credibility assessment"
---

# Source Credibility Rubric

Evaluate the credibility of information sources. A fact is only as good as its source.

## Credibility Dimensions (Score 1-5 each)

### 1. Domain Authority
| Score | Criteria |
|-------|----------|
| 5 | Official government (.gov), major peer-reviewed journal (Nature, Science), SEC 10-K |
| 4 | Research institution (MIT, Stanford), Gartner/IDC, Reuters/AP |
| 3 | Industry publication (TechCrunch), university press, established think tank |
| 2 | Company blog, Medium by unknown author, trade publication without review |
| 1 | Anonymous, self-published blog, social media, forum comment |

### 2. Author Expertise
| Score | Criteria |
|-------|----------|
| 5 | Recognized expert: h-index >40, field-defining contributions |
| 4 | Published researcher: h-index 10-40, peer-reviewed publications |
| 3 | Practitioner: industry experience, relevant credentials |
| 2 | Enthusiast: knowledgeable but uncredentialed |
| 1 | Anonymous, pseudonymous, no verifiable expertise |

### 3. Publication Recency
| Score | Criteria (for AI/tech fields) |
|-------|----------|
| 5 | Within 3 months |
| 4 | 3-6 months old |
| 3 | 6-12 months old |
| 2 | 1-2 years old |
| 1 | >2 years old |

**Exception:** Foundational papers (e.g., "Attention Is All You Need", 2017) remain relevant.

### 4. Citation Count & Impact
| Score | Criteria |
|-------|----------|
| 5 | 100+ citations recent, 1000+ established |
| 4 | 20-100 citations, referenced in literature reviews |
| 3 | 5-20 citations, found in related work |
| 2 | <5 citations, mostly self-citations |
| 1 | Uncited, new (not necessarily bad — just unvalidated) |

### 5. Peer Review Status
| Score | Criteria |
|-------|----------|
| 5 | Double-blind at top venue (NeurIPS, ICML, ICLR, Nature) |
| 4 | Peer-reviewed at reputable venue |
| 3 | Workshop paper, preprint with community validation |
| 2 | Preprint without community feedback (arXiv only) |
| 1 | Not peer-reviewed, no validation mechanism |

### 6. Funding & Conflict of Interest
| Score | Criteria |
|-------|----------|
| 5 | Fully disclosed, no conflicts, independent research |
| 4 | Disclosed, potential conflicts acknowledged and mitigated |
| 3 | Industry-funded but methodology transparent |
| 2 | Partially disclosed or vague |
| 1 | Undisclosed funding, clear conflict of interest |

### 7. Methodology Transparency
| Score | Criteria |
|-------|----------|
| 5 | Full methodology, code and data available, reproducible |
| 4 | Methodology described in detail, code partially available |
| 3 | Summary provided, key details missing |
| 2 | Vague methodology ("we analyzed...") |
| 1 | No methodology, "trust me" claims |

## Composite Score
Weighted: Domain Authority (20%) + Author Expertise (15%) + Recency (15%) + Citations (10%) + Peer Review (20%) + Funding (10%) + Methodology (10%)

| Score | Rating | Use For |
|-------|--------|---------|
| 4.0-5.0 | A — Highly Credible | Foundation of key claims |
| 3.0-3.9 | B — Credible | Supporting evidence |
| 2.0-2.9 | C — Questionable | Corroboration only |
| 1.0-1.9 | D — Unreliable | Do not cite |
| <1.0 | F — Not a source | Ignore |
