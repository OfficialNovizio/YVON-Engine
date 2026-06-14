---
name: api-assessment
version: 1.0.0
description: Evaluate third-party APIs for integration. Rate limits, pricing tiers, SDK availability, uptime/SLA, breaking change policy, vendor lock-in risk.
triggers:
  - "evaluate this API"
  - "API assessment"
  - "should we integrate"
  - "API pricing"
  - "vendor assessment"
---

# API Assessment

When this skill activates, evaluate third-party APIs for potential integration. Every external API is a dependency — and a potential failure point.

## Assessment Dimensions

### 1. API Maturity

| Level | Characteristics |
|-------|----------------|
| **L1: Alpha** | May break without notice. No SLA. Limited access. |
| **L2: Beta** | API stable-ish. Some documentation. Limited support. |
| **L3: GA (General Availability)** | Versioned API. Deprecation policy. SLA offered. |
| **L4: Enterprise** | Custom SLAs. Dedicated support. Compliance certs (SOC 2, etc.). |

**Recommendation:** Production-critical integrations → L3 minimum.

### 2. Rate Limits

Understand both:
- **Hard limits:** Request rejected with 429. Must back off.
- **Soft limits:** May work occasionally above limit (don't depend on it).
- **Burst vs sustained:** Can burst to X req/s, sustained Y req/min.
- **Per-endpoint vs global:** Some APIs limit per endpoint, others globally.

**Questions to answer:**
- What's our expected call volume? Does the free tier cover it?
- What's the cost at our projected scale?
- Can we cache responses to reduce calls?

### 3. Pricing Analysis

| Tier | Monthly Limit | Cost | Overage |
|------|--------------|------|---------|
| Free | X calls/month | $0 | Hard stop? Or pay-as-you-go? |
| Starter | Y calls/month | $Z/mo | $A per 1K calls |
| Growth | ... | ... | ... |
| Enterprise | Custom | Custom | Custom |

**Hidden costs:**
- Data egress fees (e.g., cloud APIs charging for data transfer out)
- Per-seat minimum (enterprise contracts)
- Annual commitment required for reasonable pricing
- Support tiers (email only free, Slack/phone paid)

### 4. SDK & Documentation Quality

| Criterion | Score (1-5) |
|-----------|-------------|
| SDK in our language (TypeScript/Python) | |
| SDK supports all API features | |
| SDK has TypeScript types | |
| Quickstart <5 minutes to first call | |
| Error messages are actionable | |
| Changelog maintained | |
| Migration guides for breaking changes | |
| Code examples for common use cases | |

### 5. Reliability & SLA

| Metric | Acceptable | Good | Excellent |
|--------|-----------|------|-----------|
| Uptime SLA | 99.5% | 99.9% | 99.95%+ |
| Credit for breach | 10% of monthly | 25% | 100% |
| Status page | Exists | Real-time | Historical data |
| Incident history | Not disclosed | Last 90 days | Full history |
| Deprecation notice | 30 days | 90 days | 12 months |

### 6. Vendor Lock-In Risk

| Risk Factor | High Lock-In | Low Lock-In |
|-------------|-------------|-------------|
| Data export | No export API | Standard format export (JSON, CSV, Parquet) |
| Proprietary format | Custom data model | Open standards |
| Integration depth | Deep (e.g., auth, database) | Shallow (e.g., single API call) |
| Alternatives | Sole provider | Multiple competitors |
| Migration cost | Months of work | Days of work |

## Decision Matrix

```yaml
api_assessment:
  name: "<API name>"
  provider: "<company>"
  maturity: L1|L2|L3|L4
  purpose: "<what we'd use it for>"
  criticality: critical|important|nice_to_have
  scores:
    api_maturity: N/5
    pricing_fit: N/5
    sdk_quality: N/5
    reliability: N/5
    lock_in_risk: N/5
  weighted_score: X.X/5.0
  monthly_cost_at_scale: $XXX
  recommendation: adopt|evaluate|reject
  alternatives: [option_a, option_b]
```
