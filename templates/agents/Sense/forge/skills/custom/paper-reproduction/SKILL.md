---
name: paper-reproduction
version: 1.0.0
description: Reproduce results from ML/AI papers. Code release verification, dataset availability, hyperparameter sensitivity analysis, statistical significance testing (p<0.05).
triggers:
  - "reproduce this paper"
  - "verify paper results"
  - "paper claims"
  - "can I trust this result"
  - "reproducibility check"
---

# Paper Reproduction

When this skill activates, systematically evaluate whether published ML/AI results can be reproduced. The ML reproducibility crisis is real — NeurIPS 2022 replication study found only 40% of accepted papers had reproducible results.

## Reproduction Levels

| Level | What It Verifies | Difficulty |
|-------|-----------------|------------|
| **L1: Code runs** | Published code executes without errors | Low |
| **L2: Numbers match** | Reproduced results match paper within statistical error | Medium |
| **L3: Claims hold** | Core claims validated with reproduced results | High |
| **L4: Generalizes** | Method works on held-out datasets | Very High |
| **L5: Robust** | Method works with different hyperparameters, seeds, hardware | Expert |

## Pre-Reproduction Checklist

### Availability Score (0-5)
- [ ] Code released? (0=no, 1=promised, 2=partial, 3=full)
- [ ] Dataset available? (0=proprietary, 1=on request, 2=partial public, 3=full public)
- [ ] Model weights released? (0=no, 1=on request, 2=partial, 3=full)
- [ ] Training configuration documented? (0=vague, 1=some, 2=detailed)
- [ ] Evaluation code released? (0=no, 1=partial, 2=full)

**Reproduction viability score:** Sum all 5. 10+ → viable. 5-9 → difficult. <5 → nearly impossible.

### Red Flags
- "Code will be released" — paper is >6 months old, no code yet
- "Due to space constraints" — critical details omitted
- "We found that" without quantitative evidence
- Cherry-picked examples in figures instead of random samples
- Missing error bars or standard deviations
- Describing outlier results without discussing representative ones
- Training on test set (explicitly or implicitly through data leakage)

## Reproduction Protocol

### Step 1: Environment Reproduction
```bash
# Exactly match the paper's environment
python --version  # Must match paper
pip freeze > my_env.txt
diff my_env.txt paper_env.txt
```
**Pitfall:** PyTorch 2.x vs 1.x — non-deterministic behavior changes introduced in 2.0.

### Step 2: Minimum Working Example
Run the simplest experiment first (smallest dataset, fewest epochs). If this fails, full reproduction is unlikely.

### Step 3: Exact Reproduction
Run with paper's reported hyperparameters. Record:
- [ ] Training loss curve (match paper figure?)
- [ ] Final metrics (within reported error bars?)
- [ ] Inference time (within 20%?)

### Step 4: Sensitivity Analysis
Vary one hyperparameter at a time (±20%):
- Learning rate
- Batch size
- Random seed (min 5 seeds for stable estimate)
- Weight initialization

**Critical finding:** If performance varies >5% with seed change, the paper's single-seed results are unreliable.

### Step 5: Statistical Significance
For claimed improvements over baseline:
- Run both methods with same seeds
- Paired statistical test (paired bootstrap or Wilcoxon)
- Report p-value and effect size (Cohen's d)
- **p < 0.05 is standard threshold, but also look at effect size**

## Output Format
```yaml
reproduction_report:
  paper: "<title>"
  arxiv_id: "<id>"
  reproduction_level: L1|L2|L3|L4|L5
  code_availability: 0-5
  key_claims:
    - claim: "Method X outperforms baseline by Y%"
      reproduced: true|false|partial
      original_value: XX
      reproduced_value: YY
      within_error_bars: true|false
  sensitivity:
    seed_stability: "±X%"
    hyperparameter_robustness: robust|sensitive|fragile
  verdict: reproduced|partially_reproduced|not_reproduced|inconclusive
```
