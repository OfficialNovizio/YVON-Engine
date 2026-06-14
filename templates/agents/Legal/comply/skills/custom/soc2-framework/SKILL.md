---
name: soc2-framework
version: 1.0.0
description: SOC 2 compliance framework. Trust Services Criteria (Security, Availability, Processing Integrity, Confidentiality, Privacy). Type I vs Type II. Audit preparation, control mapping, evidence collection.
triggers:
  - "SOC2 compliance"
  - "SOC 2 audit"
  - "trust services criteria"
  - "SOC2 readiness"
  - "security audit framework"
---

# SOC 2 Compliance Framework

AICPA attestation standard for service organizations. Critical for B2B SaaS selling to enterprises.

## Trust Services Criteria (TSC)

### 1. Security (Common Criteria — REQUIRED)
- Logical and physical access controls
- System monitoring and alerting (SIEM)
- Change management process
- Risk assessment program
- Incident response plan
- Vulnerability management (patching cadence)

### 2. Availability
- Uptime monitoring (99.9%+ target)
- Disaster recovery plan + testing
- Business continuity plan
- Capacity planning and monitoring
- Backup and restoration procedures

### 3. Processing Integrity
- Input validation
- Processing completeness checks
- Error handling and logging
- Data quality monitoring
- Reconciliation procedures

### 4. Confidentiality
- Data classification policy
- Encryption at rest and in transit (AES-256, TLS 1.3)
- Confidentiality agreements (NDAs)
- Secure disposal procedures
- Access revocation on termination

### 5. Privacy
- Privacy notice (published, accurate)
- Consent management
- Data subject access rights process
- Data retention and disposal schedule
- Third-party data sharing agreements

## Type I vs Type II

| Aspect | Type I | Type II |
|--------|--------|---------|
| What it assesses | Design of controls at a point in time | Operating effectiveness over a period |
| Observation period | Single date | 3-12 months (typically 6) |
| Time to complete | 2-3 months | 4-8 months |
| Cost (typical) | $15K-$30K | $30K-$80K |
| Client requirement | Rarely sufficient | Enterprise standard |

**Recommendation:** Start with Type I (faster, cheaper), transition to Type II for enterprise sales.

## Audit Preparation Timeline
```
Month 1-2: Gap assessment + remediation
Month 3-4: Control implementation + documentation
Month 5: Readiness assessment
Month 6: Audit fieldwork (Type I) or Month 6-11 (Type II observation)
```

## Evidence Types
- **System-generated:** Access logs, change logs, automated dashboards
- **Process evidence:** Approved change requests, incident tickets
- **Policy documents:** Information security policy, acceptable use policy
- **Training records:** Security awareness completion
- **Vendor assessments:** Third-party risk assessments, DPAs

**Target:** <48 hours for standard evidence requests, <4 hours for critical.
