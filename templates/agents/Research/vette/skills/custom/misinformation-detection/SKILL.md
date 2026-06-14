---
name: misinformation-detection
version: 1.0.0
description: Detect common misinformation patterns. Cherry-picked data, correlation not causation, survivorship bias, p-hacking, predatory journals (Beall's list), unreproducible claims.
triggers:
  - "detect bias"
  - "is this misleading"
  - "misinformation check"
  - "statistical error"
  - "data quality check"
---

# Misinformation Detection

Detect common patterns of misinformation, statistical manipulation, and misleading claims.

## Pattern 1: Cherry-Picked Data
Selecting data points that support a conclusion while ignoring contradictory data.

Detection questions:
- Is the timeframe arbitrary?
- Is the baseline cherry-picked?
- Are they reporting best case without typical case?
- Is the sample selective?

## Pattern 2: Correlation Confused with Causation
"X increased after Y, therefore Y caused X."

Detection questions:
- Is there a plausible mechanism?
- Are there confounding variables? (Wealth, education, engagement are common confounders)
- Which came first?
- Could reverse causation explain it?

## Pattern 3: Survivorship Bias
Drawing conclusions from survivors while ignoring failures.

Detection questions:
- Where are the failures in the dataset?
- Would the conclusion hold if failures were included?

## Pattern 4: P-Hacking and Multiple Comparisons
Running many tests and reporting only significant ones.

Detection questions:
- How many hypotheses were tested?
- Is there correction for multiple comparisons? (Bonferroni, Holm, Benjamini-Hochberg)
- Were hypotheses pre-registered?
- Are they reporting p-values for subgroups not in the original hypothesis?

## Pattern 5: Predatory Journals (Beall's List)
Journals that will publish anything for a fee.

Indicators:
- Journal solicits you to publish (real journals don't)
- Promise rapid review (<2 weeks)
- Editorial board includes people who don't know they're listed
- Journal name sounds like prestigious one (Journal of Nature Science)
- Fake or fraudulent impact factor

## Pattern 6: Base Rate Fallacy
Reporting a statistic without the base rate.

Example: "Our fraud detection is 99% accurate!" but fraud occurs in 0.1% of transactions. A system that says "no fraud" for everything is 99.9% accurate.

## Pattern 7: Unreproducible Claims
Results that cannot be verified because methodology, code, or data is unavailable.

Detection questions:
- Is code available?
- Is data available?
- Are hyperparameters fully specified?
- Have others reproduced this?
- Has anyone tried and failed to reproduce? (Check PubPeer, OpenReview)

## Output: Misinformation Pattern Report
```yaml
misinformation_check:
  document: "<title>"
  date: YYYY-MM-DD
  patterns_detected:
    - pattern: cherry_picking|correlation_causation|survivorship_bias|p_hacking|predatory_journal|base_rate_fallacy|unreproducible
      location: "<quote or section>"
      severity: critical|significant|minor
      explanation: "<why this is misleading>"
  clean_bill_of_health: true|false
  recommendation: trust|trust_with_caution|verify_independently|reject
```
