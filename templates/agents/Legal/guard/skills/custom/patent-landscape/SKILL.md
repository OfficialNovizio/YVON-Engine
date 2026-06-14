---
name: patent-landscape
version: 1.0.0
description: Patent landscape analysis. Prior art search, CPC/IPC classification, freedom-to-operate analysis, provisional vs non-provisional, patentability assessment.
triggers:
  - "patent search"
  - "prior art"
  - "freedom to operate"
  - "patent landscape"
  - "is this patentable"
---

# Patent Landscape Analysis

When this skill activates, analyze the patent landscape for freedom-to-operate, prior art, and patentability of YVON innovations.

## Patent Types

| Type | Duration | Purpose | Cost (Typical) |
|------|----------|---------|-----------------|
| **Utility** | 20 years from filing | Functional inventions (process, machine, manufacture, composition) | $10K-$25K |
| **Design** | 15 years from grant | Ornamental design of functional item | $2K-$5K |
| **Provisional** | 12 months (placeholder) | Establish priority date, "patent pending" status | $2K-$5K |
| **PCT (International)** | 30-31 months to national stage | Reserve right to file in 157 countries | $3K-$5K + national fees |

## Patentability Requirements (35 U.S.C. §§101, 102, 103, 112)

| Requirement | Standard |
|-------------|----------|
| **Patentable subject matter** (§101) | Process, machine, manufacture, or composition of matter. NOT: abstract ideas, laws of nature, natural phenomena |
| **Novelty** (§102) | Not already disclosed in a single prior art reference |
| **Non-obviousness** (§103) | Would not have been obvious to person of ordinary skill in the art (POSITA) |
| **Enablement** (§112) | Description enables POSITA to make and use the invention |

### AI/Software Patentability (Post-Alice, 2014)
Alice Corp. v. CLS Bank two-step test:
1. Is the claim directed to an abstract idea? (If NO → patentable)
2. If YES: Does the claim add "significantly more" — an inventive concept that transforms the abstract idea into a patent-eligible application?

**Key:** AI patents survive Alice when they claim a specific technical improvement, not just "doing X with AI."

## Prior Art Search

### Databases
| Database | Coverage | Access |
|----------|----------|--------|
| **USPTO Patent Full-Text** | US patents since 1976, applications since 2001 | Free (patft.uspto.gov) |
| **Google Patents** | 120M+ documents, 100+ countries | Free (patents.google.com) |
| **Espacenet** | 140M+ documents, EPO member states | Free (worldwide.espacenet.com) |
| **WIPO Patentscope** | 110M+ documents, PCT applications | Free (patentscope.wipo.int) |

### Search Strategy
1. **Keywords:** Describe invention in 5-10 keyword combinations
2. **Classification:** Identify CPC (Cooperative Patent Classification) codes
3. **Citation trees:** Forward citations (who cited this) and backward (what this cited)
4. **Assignee search:** Competitor patent portfolios
5. **Inventor search:** Key researchers in the field

### Relevant CPC Classifications for AI
- **G06N** — Computer systems based on specific computational models
  - G06N 3/08 — Learning methods (neural networks)
  - G06N 20/00 — Machine learning
- **G06F 40/30** — Semantic analysis / NLP
- **G06V** — Image/video recognition

## Freedom-to-Operate (FTO) Analysis

| Step | Activity |
|------|----------|
| 1 | Identify product features/components |
| 2 | Search for patents covering each feature |
| 3 | Determine patent status (active, expired, pending) |
| 4 | Analyze claim scope vs product |
| 5 | Assess infringement risk (literal or doctrine of equivalents) |
| 6 | Identify design-around options |
| 7 | Document FTO opinion |

**Risk levels:**
- **Green:** No active patents covering feature
- **Yellow:** Expired patents or patents with clear design-around
- **Orange:** Pending applications that could issue with relevant claims
- **Red:** Active patent with claims that read on product → consult patent attorney

## Integration
- **Scout agent:** Feed new competitor patent filings
- **Forge agent:** Alert on novel technical approaches in patent literature
- **Board:** Escalate if FTO risk is red/orange
