---
name: open-source-compliance
version: 1.0.0
description: Open source license compliance. GPL, MIT, Apache 2.0, BSD, AGPL comparison. Copyleft vs permissive. License compatibility matrix. Attribution requirements. Dependency scanning.
triggers:
  - "open source license"
  - "license compliance"
  - "GPL check"
  - "dependency license"
  - "open source audit"
---

# Open Source License Compliance

When this skill activates, audit software dependencies for license compliance. Every dependency in the codebase must have a compatible license.

## License Categories

### Permissive (Low Risk)
Can be used in proprietary software with minimal obligations:

| License | Attribution Required | Patent Grant | Key Obligation |
|---------|---------------------|--------------|----------------|
| **MIT** | Yes (keep copyright notice) | No | Simplest — just retain notice |
| **Apache 2.0** | Yes (keep NOTICE file) | Yes (explicit) | State changes made to files |
| **BSD 2-Clause** | Yes (keep notice) | No | Similar to MIT |
| **BSD 3-Clause** | Yes (keep notice) | No | No endorsement clause added |
| **ISC** | Yes (keep notice) | No | Functionally equivalent to MIT |

### Weak Copyleft (Medium Risk)
Derivative works of the library itself must be open-sourced. Proprietary code that links to it (dynamically) may not need to be:

| License | Copyleft Trigger | Risk |
|---------|-----------------|------|
| **LGPL v2.1/v3** | Modifications to the library | Medium — dynamic linking usually safe |
| **MPL 2.0** | Modifications to MPL-licensed files | Low-Medium — file-level copyleft |
| **EPL 1.0/2.0** | Modifications to EPL-licensed modules | Medium |

### Strong Copyleft (High Risk)
Any code that incorporates or links to the library (statically or dynamically) must be open-sourced under the same license:

| License | Copyleft Trigger | Risk |
|---------|-----------------|------|
| **GPL v2** | Distribution of derivative works | HIGH — viral; proprietary code may need to be released |
| **GPL v3** | Distribution + patent retaliation | HIGH — also includes anti-Tivoization, patent terms |
| **AGPL v3** | Network use counts as distribution | CRITICAL — SaaS using AGPL must release source |
| **SSPL** | All software required to provide service | CRITICAL — MongoDB's license, not OSI-approved |

### Public Domain / Other
| License | Obligations |
|---------|-------------|
| **Unlicense** | None — public domain dedication |
| **CC0** | None — public domain dedication (more legally robust than Unlicense) |
| **WTFPL** | None — but legally questionable |

## License Compatibility Matrix

| Can I use | MIT | Apache 2.0 | GPL v2 | GPL v3 | LGPL | AGPL |
|-----------|-----|------------|--------|--------|------|------|
| **In MIT project** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **In Apache 2.0 project** | ✓ | ✓ | ✗(1) | ✓(3) | ✓ | ✗ |
| **In GPL v2 project** | ✓(2) | ✗ | ✓ | ✗(4) | ✓ | ✗ |
| **In GPL v3 project** | ✓(2) | ✓(3) | ✗(4) | ✓ | ✓ | ✗(5) |
| **In proprietary** | ✓ | ✓ | ✗ | ✗ | Depends(6) | CRITICAL ✗ |

Notes:
1. GPL v2 is incompatible with Apache 2.0 (patent clause conflict)
2. MIT can be re-licensed as GPL
3. Apache 2.0 is compatible with GPL v3 ONLY
4. GPL v2 and v3 are incompatible with each other
5. AGPL cannot be used in GPL v3 projects (one-way incompatibility)
6. LGPL: dynamic linking generally safe for proprietary; static linking may trigger copyleft

## Dependency Scanning

### What to Scan
- `package.json` / `node_modules` (npm)
- `requirements.txt` / `Pipfile` (Python)
- `Cargo.toml` (Rust)
- `go.mod` (Go)
- Docker base images
- CDN-loaded libraries

### What to Flag
- [ ] Any GPL/AGPL in proprietary codebase
- [ ] Missing or incorrect license files
- [ ] License not included in dependency metadata
- [ ] Dependencies with no license (default = all rights reserved)
- [ ] Multi-licensed dependencies (must comply with at least one)

### Attribution Requirements
Even permissive licenses require attribution:
```
This product includes software developed by [Author] (MIT License)
Copyright (c) [Year] [Author]
```
Keep attribution in a NOTICE or CREDITS file.
