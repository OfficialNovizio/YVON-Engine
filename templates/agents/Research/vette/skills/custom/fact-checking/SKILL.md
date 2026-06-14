---
name: fact-checking
version: 1.0.0
description: Systematic fact-checking methodology. Claim extraction, source identification, cross-referencing (minimum 2 independent sources), confidence scoring, retraction awareness, truth-o-meter.
triggers:
  - "fact check"
  - "verify this claim"
  - "is this true"
  - "check these facts"
  - "truth check"
---

# Fact-Checking Methodology

Systematically verify factual claims. Determine what's true — not confirm what someone wants to be true.

## Fact-Checking Protocol

### Step 1: Claim Extraction
Separate facts from opinions:
- Verifiable claim: "We have 10,000 users" = CHECK
- Opinion/Judgment: "Our product is the best" = NOT CHECKABLE (flag as opinion)
- Prediction: "We'll reach 50K users by Q3" = NOT CHECKABLE (flag as forecast)
- Vague: "Industry-leading performance" = FLAG as unverifiable

### Step 2: Source Identification
For each claim: original source, methodology, date of collection.

### Step 3: Cross-Reference (Minimum 2 Independent Sources)
Sources must be independent (not citing each other), have direct knowledge, and be recent.

### Step 4: Verification Status

| Status | Definition |
|--------|------------|
| TRUE | 2+ independent, credible sources confirm. No credible contradiction. |
| MOSTLY TRUE | Generally accurate but needs clarification. Minor omissions. |
| HALF TRUE | Partially accurate but leaves out important context or exaggerates. |
| MOSTLY FALSE | Contains an element of truth but ignores critical facts. |
| FALSE | Not accurate. Credible sources contradict. |
| UNVERIFIABLE | No credible sources available. |
| OUTDATED | Was true but no longer accurate. |

### Step 5: Confidence Level
- High: Multiple primary sources, consistent methodology, recent data
- Medium: Secondary sources or methodological concerns
- Low: Single source, proxy data, or significant uncertainty

### Step 6: Retraction Awareness
Check: corrections/retractions published, history of misrepresentation, known bias, funding from interested parties.

## Red Flags — Likely False Claims

1. Cherry-picked timeframes: "Revenue grew 500%" but baseline was near-zero
2. Correlation presented as causation
3. Survivorship bias: only looking at successes
4. Small sample size without disclosure: "80% said..." but n=10
5. Misleading denominators: "99% uptime" measured over a weekend
6. Fake precision: market size estimated to the dollar with ±30% uncertainty
7. Appeal to authority without evidence: "According to Harvard research..." but paper doesn't say what's claimed
