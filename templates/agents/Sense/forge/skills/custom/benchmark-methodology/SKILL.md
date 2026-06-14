---
name: benchmark-methodology
version: 1.0.0
description: LLM benchmark methodology. MMLU (57 subjects, 15,908 questions), GSM8K (8.5K grade-school math), HumanEval (164 programming problems), MT-Bench (80 multi-turn), Chatbot Arena (1M+ human votes). Contamination awareness and interpretation guide.
triggers:
  - "benchmark this model"
  - "how good is this model"
  - "compare benchmarks"
  - "eval results"
  - "benchmark methodology"
---

# Benchmark Methodology

When this skill activates, evaluate LLM performance using standardized benchmarks with awareness of their limitations and contamination risks.

## Core Benchmarks

### MMLU (Massive Multitask Language Understanding)
- **What:** 57 subjects across STEM, humanities, social sciences, and more
- **Size:** 15,908 questions (4-choice multiple choice)
- **Scoring:** Accuracy (0-100%). 25% = random baseline
- **What it really measures:** Breadth of knowledge, not reasoning
- **Contamination note:** Widespread in training data for models after 2023

### GSM8K (Grade School Math 8K)
- **What:** 8,500 elementary to middle-school math word problems
- **Scoring:** Final answer match (0-100%)
- **What it really measures:** Multi-step arithmetic reasoning, not advanced math
- **Contamination note:** Heavily leaked — many models train on GSM8K directly

### HumanEval
- **What:** 164 hand-written programming problems
- **Scoring:** pass@k (k=1, 10, 100). pass@1 = % solved on first try
- **What it really measures:** Code generation from docstrings
- **Contamination note:** 164 is small — high variance, ±3-5% swings common

### MT-Bench
- **What:** 80 multi-turn conversation questions across 8 categories (writing, reasoning, math, coding, extraction, STEM, humanities, roleplay)
- **Scoring:** LLM-as-judge (GPT-4 rates responses 1-10). Single-model grading.
- **What it really measures:** Conversational quality, instruction following
- **Bias note:** GPT-4 judge favors GPT-4-style responses (self-enhancement bias)

### Chatbot Arena (LMSYS)
- **What:** 1M+ human preference votes from blind A/B comparisons
- **Scoring:** Elo rating (like chess)
- **What it really measures:** Human preference, not capability
- **Strength:** Difficult to game. Human judgments. Largest sample.

## Interpretation Rules

### Never Compare Across Different Evaluation Setups
- Different prompts → different scores even on same benchmark
- Different evaluation harness versions → different scores
- Few-shot vs zero-shot → massive difference (5-shot MMLU can be 5-10% higher)

### Understand Confidence Intervals
- HumanEval 164 problems: ±3-5% uncertainty
- MMLU 15K questions: ±0.5-1% uncertainty (but contamination inflates)
- GSM8K: ±1-2% on final answer, but testing methodology varies

### Contamination Awareness
| Signal | Means |
|--------|-------|
| Model scores 95%+ on HumanEval but fails simple novel coding tasks | Likely contaminated |
| Model scores >90% on GSM8K but can't solve new math problems | Likely contaminated |
| Model performs worse on recently published benchmarks | Clean evaluation |

## Evaluation Best Practices
1. Always report: model name, evaluation harness, number of shots, temperature, prompt format
2. Use temperature=0 for reproducible results
3. Run multiple seeds when temperature>0 (min 3, report mean ± std)
4. Prefer LMSYS Chatbot Arena Elo for overall ranking (hardest to game)
5. For coding: prefer SWE-bench (real GitHub issues) over HumanEval
6. For reasoning: prefer GPQA (graduate-level, Google-proof) over MMLU
