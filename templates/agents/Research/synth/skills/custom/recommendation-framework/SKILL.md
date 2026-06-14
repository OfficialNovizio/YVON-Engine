---
name: recommendation-framework
version: 1.0.0
description: Structured recommendation framework. 3+ options, trade-off analysis (speed vs quality vs cost), implementation difficulty (1-5), impact (1-5), reversibility assessment, decision criteria.
triggers:
  - "what should we do"
  - "recommendation"
  - "options analysis"
  - "decision framework"
  - "which option"
---

# Recommendation Framework

Produce structured recommendations with multiple options, explicit trade-offs, and decision criteria.

## Option Generation

Always present minimum 3 options:
| Option | Type | When to Include |
|--------|------|-----------------|
| 1. Status Quo | Baseline | Always |
| 2. Minimum Viable Action | Conservative | Always |
| 3. Recommended Action | Balanced | Always |
| 4. Aggressive / Moonshot | Ambitious | When upside justifies risk |
| 5. Alternative Approach | Divergent | When solving differently is viable |

## Option Evaluation (Score 1-5)

| Dimension | 1 (Poor) | 3 (Acceptable) | 5 (Excellent) |
|-----------|----------|----------------|---------------|
| Impact | Minimal improvement | Meaningful | Transformative |
| Speed | >6 months | 1-3 months | <2 weeks |
| Cost | >$100K or 10+ person-months | $10K-$50K | <$5K |
| Risk | Catastrophic if fails | Manageable | Negligible |
| Reversibility | Hard to undo | Undoable with effort | Trivially reversible |

**Weighted Score** = Impact*2 + Speed*1 + Cost(Inverted)*1 + Risk(Inverted)*2 + Reversibility*1

## Trade-off Analysis
You can optimize for 2 of 3 corners: Speed, Quality, Cost. Be explicit what you're sacrificing.

## Decision Criteria
Define before evaluating:
1. Must-have criteria (dealbreakers)
2. Should-have criteria (weighted in scoring)
3. Nice-to-have criteria (tiebreaker only)

## Reversibility Assessment
| Type | Definition | Decision Process |
|------|------------|------------------|
| Type 1: Reversible | Can undo with low cost | Decide fast, >70% confidence |
| Type 2: Semi-reversible | Can undo with moderate cost | Decide deliberately, >85% confidence |
| Type 3: Irreversible | Cannot undo or prohibitive cost | Max deliberation, seek disconfirming evidence |

**Jeff Bezos Rule:** "Most decisions are Type 1. The problem is we treat them as Type 2."

## Principles
- No false precision: if uncertainty is ±30%, don't present 2 decimal places
- Acknowledge the counterfactual: what happens if we're wrong?
- Speed matters: for Type 1 decisions, speed beats perfect analysis
- Escalate Type 3 decisions to Board
