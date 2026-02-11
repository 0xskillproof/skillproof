# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | Yes       |

## Reporting a Vulnerability

If you discover a security vulnerability, **do not open a public issue**. Instead, report it privately:

**Email:** skillproof@proton.me

Include:

- Description of the vulnerability
- Steps to reproduce
- Affected package(s) and version(s)
- Potential impact

## Response Timeline

- **Acknowledgment:** within 48 hours
- **Initial assessment:** within 1 week
- **Fix or mitigation:** depends on severity, targeting 30 days for critical issues

## Scope

The following are in scope for security reports:

- Smart contract vulnerabilities (reentrancy, access control, overflow, etc.)
- ZK circuit soundness issues (constraint under-specification, proof forgery)
- Sandbox escapes in the auditor package
- Permission tracking bypasses
- Dependency vulnerabilities with a clear exploit path

## Out of Scope

- Issues in third-party dependencies without a demonstrated impact on SkillProof
- Denial of service on public RPC endpoints
- Social engineering

## Disclosure

We follow coordinated disclosure. We ask that you give us reasonable time to address the issue before making it public. We will credit reporters in the fix announcement unless they prefer to remain anonymous.
