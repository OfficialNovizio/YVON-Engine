---
name: data-privacy-audit
version: 1.0.0
description: Systematic data privacy audit. Data inventory, processing register (ROPA), consent management audit, third-party processor assessment. Aligned with GDPR Art. 30 and CCPA data mapping.
triggers:
  - "privacy audit"
  - "data inventory"
  - "processing register"
  - "third-party assessment"
  - "consent audit"
---

# Data Privacy Audit

Conduct systematic audit of data processing activities. Maintain Records of Processing Activities (ROPA) as required by GDPR Art. 30.

## Data Inventory (ROPA Entry)
```yaml
processing_activity:
  name: "<descriptive>"
  purpose: "<why>"
  lawful_basis: consent|contract|legal_obligation|vital_interests|public_task|legitimate_interests
  data_categories:
    - personal: [name, email, IP]
    - special_category: [health, biometric, political] # Art. 9 — requires explicit consent
  data_subjects: [customers, employees, visitors]
  recipients: [internal, processors, third parties]
  transfers_outside_eea: true|false
  retention_period: "<duration or criteria>"
  security_measures: [encryption, access control, pseudonymization]
```

## Special Category Data (Art. 9)
PROHIBITED unless explicit consent or exemption: racial/ethnic origin, political opinions, religious beliefs, trade union membership, genetic data, biometric data, health data, sex life/sexual orientation.

## Third-Party Processor Assessment
| Criterion | Pass Threshold |
|-----------|----------------|
| DPA in place | Must be YES |
| Security certifications | SOC 2, ISO 27001, or equivalent |
| Sub-processors disclosed | Full list provided |
| Breach notification | Contractual 72h obligation |
| Data location | Known and acceptable |
| Deletion commitment | At contract end |
| Audit right | At least questionnaire |

## Consent Management Audit
- [ ] Freely given (no bundling, no negative consequences for refusal)
- [ ] Specific (separate consent for each purpose)
- [ ] Informed (plain language)
- [ ] Unambiguous (affirmative action, no pre-ticked boxes)
- [ ] Withdrawable (as easy to withdraw as to give)
- [ ] Records kept (who, when, what, how)
- [ ] Cookie consent compliant (no dark patterns)

## Privacy Notice Audit (Art. 13/14)
Required disclosures: controller identity, DPO contact, purposes and lawful basis, legitimate interests, recipients, international transfers, retention period, data subject rights, right to withdraw consent, right to lodge complaint, automated decision-making logic.
