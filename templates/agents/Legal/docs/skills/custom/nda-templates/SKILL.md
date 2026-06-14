---
name: nda-templates
version: 1.0.0
description: Non-Disclosure Agreement templates. Mutual vs unilateral, key clauses, term duration, exclusions, governing law. For vendor, partner, and employee relationships.
triggers:
  - "draft NDA"
  - "non-disclosure agreement"
  - "confidentiality agreement"
  - "mutual NDA"
  - "one-way NDA"
---

# NDA Templates

When this skill activates, draft or review Non-Disclosure Agreements. Choose between mutual (both parties share confidential info) or unilateral (one party discloses).

## NDA Type Selection

| Type | Use When | Example |
|------|----------|---------|
| **Mutual (Bilateral)** | Both parties share confidential info | Partnership discussions, joint ventures, M&A talks |
| **Unilateral (One-Way)** | One party discloses, other receives | Vendor evaluation, contractor engagement, employee onboarding |

## Key Clauses

### 1. Definition of Confidential Information
Must be specific enough to be enforceable:
- **Good:** "All information disclosed in writing and marked 'Confidential', or disclosed orally and confirmed in writing within 30 days."
- **Bad:** "All information" (too vague — unenforceable)

### 2. Exclusions from Confidentiality
Standard exclusions — information that is NOT confidential:
- **(a)** Already known to receiving party (must prove)
- **(b)** Publicly available (not through receiving party's breach)
- **(c)** Rightfully received from third party without restriction
- **(d)** Independently developed without use of confidential info
- **(e)** Required to be disclosed by law/court order (must notify disclosing party first)

### 3. Obligations of Receiving Party
- Use only for stated purpose (specify the purpose precisely)
- Limit access to employees/contractors who need to know
- Protect with same degree of care as own confidential info (minimum: reasonable care)
- Not reverse engineer, decompile, or disassemble
- Return or destroy upon request or termination

### 4. Term and Survival
- **Term of agreement:** Typically 2-5 years
- **Survival of confidentiality obligation:** Continues after termination
  - Trade secrets: perpetual
  - Other confidential info: 2-5 years post-termination (standard)
  - Competitive info: shorter (18-24 months) if negotiated

### 5. No License Grant
- Confidential info disclosure does NOT grant any license to IP, patents, or trademarks
- "No warranty" — info provided "AS IS" without representation of accuracy

### 6. Governing Law and Jurisdiction
- Choose venue convenient to your side
- Delaware or home state for US companies
- Specify arbitration vs litigation

### 7. Remedies
- Injunctive relief (monetary damages inadequate)
- Entitled to seek injunction without posting bond (boost this clause)

## Red Flags to Watch For

| Red Flag | Why It's Dangerous |
|----------|-------------------|
| **Residuals clause** | Allows receiving party to use info retained in "unaided memory" — effectively kills NDA protection |
| **No exclusions** | You could be liable for info already public |
| **Perpetual term for non-trade-secrets** | Unreasonable and may be unenforceable, but risky |
| **Jury trial waiver** | Removes right to jury — consider implications |
| **Overbroad definition** | "All information" — courts may strike entire clause |
| **Governing law in inconvenient forum** | Costs to litigate become prohibitive |

## Integration
- **Guard agent:** Review for IP protection gaps
- **Comply agent:** Verify GDPR/CCPA compliance for personal data in NDA scope
