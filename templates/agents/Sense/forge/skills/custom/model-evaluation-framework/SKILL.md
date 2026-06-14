---
name: model-evaluation-framework
version: 1.0.0
description: Side-by-side LLM evaluation methodology. Controlled variables, same prompts, temperature=0 for reproducibility, multiple seeds, blind comparison. Cost-normalized scoring.
triggers:
  - "compare models"
  - "A/B test models"
  - "which model is better for"
  - "model evaluation"
  - "side-by-side comparison"
---

# Model Evaluation Framework

When this skill activates, conduct rigorous side-by-side comparisons of LLMs for specific tasks. Go beyond benchmark scores to task-specific evaluation.

## Controlled Variables

Keep these CONSTANT across all models being compared:
- **Prompt:** Exact same prompt template (copy-paste, no variations)
- **Temperature:** 0 for reproducible results, 0.7-1.0 for creative tasks
- **Top-p:** Same across models (or disable for both)
- **Max tokens:** Same output budget for fair comparison
- **System prompt:** Identical (if applicable)
- **Examples:** Same few-shot examples, same order
- **Context:** Same retrieved documents if RAG

## Evaluation Design

### 1. Define the Task
Be specific. NOT "which model is better" but:
- "Which model writes better TypeScript React components given a Figma design description?"
- "Which model more accurately extracts invoice fields from unstructured PDF text?"
- "Which model gives better product recommendations given user purchase history?"

### 2. Build the Test Set
- **Minimum:** 20 test cases (30+ recommended for statistical power)
- **Composition:** Real examples from production, not cherry-picked
- **Difficulty mix:** 30% easy, 50% medium, 20% hard
- **Edge cases included:** Empty inputs, extremely long inputs, ambiguous inputs

### 3. Blind Evaluation Protocol
Evaluator should NOT know which model produced which output:
1. Randomize output order
2. Strip model identifiers
3. Rate each output independently before seeing others
4. Use rubric with anchored scores (what 1 means, what 5 means)

### 4. Scoring Dimensions

| Dimension | 1 (Poor) | 3 (Acceptable) | 5 (Excellent) |
|-----------|----------|----------------|---------------|
| **Accuracy** | Incorrect, misleading | Minor errors, no major mistakes | Fully correct, nuanced |
| **Completeness** | Missing key elements | Covers basics, 1-2 gaps | Thorough, anticipates follow-ups |
| **Clarity** | Confusing, ambiguous | Understandable, some friction | Crystal clear, well-structured |
| **Conciseness** | Verbose, repetitive | Reasonable length | No wasted words |
| **Style/Tone** | Inappropriate for context | Acceptable tone | Perfect tone for audience |

### 5. Cost-Normalized Scoring

Raw quality scores are incomplete without cost:
```
Cost-Normalized Score = Quality Score / log10(Cost per 1000 queries)
```

This penalizes expensive models that only marginally outperform cheaper ones.

### 6. Statistical Analysis

```python
from scipy import stats

# Paired comparison (same test cases across models)
t_stat, p_value = stats.ttest_rel(model_a_scores, model_b_scores)
effect_size = (mean(model_a) - mean(model_b)) / pooled_std

# Report: "Model A outperforms Model B by X points (p=0.0X, Cohen's d=X.X)"
```

### 7. Failure Analysis
For each model, categorize errors:
- **Hallucination:** Confidently stated wrong information
- **Task misunderstanding:** Didn't do what was asked
- **Format error:** Wrong output format/structure
- **Incomplete:** Stopped too early, missing information
- **Off-target:** Answered a different question

## Output Template
```yaml
model_comparison:
  task: "<description>"
  date: YYYY-MM-DD
  test_cases: N
  models_compared: [model_a, model_b, model_c]
  key_findings:
    - {finding: "...", confidence: high|medium|low}
  scores:
    model_a: {accuracy: X, completeness: X, clarity: X, conciseness: X, style: X, cost_per_1k: $X}
    model_b: {accuracy: X, ...}
  cost_normalized_ranking: [best, ..., worst]
  recommendation: <which model for this task>
  caveats: [limitations of this evaluation]
```
