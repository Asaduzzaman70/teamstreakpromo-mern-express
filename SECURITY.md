# Security Policy

At **TeamStreak Promo**, security is a top priority. As an Express & MongoDB backend handling user accounts, authentication tokens, financial transactions, reward redemptions, and event ticketing, we take data protection and system integrity very seriously.

This document outlines our supported versions, security architecture standards, vulnerability reporting procedure, and incident response guidelines.

---

## 1. Supported Versions

Only actively maintained versions of the TeamStreak Promo Backend receive security updates, vulnerability patches, and dependency upgrades.

| Version | Status | Security Support |
| :--- | :--- | :--- |
| **1.x (Current - `main`)** | Active Development | :white_check_mark: Supported |
| **< 1.0.0** | Deprecated / Beta | :x: Not Supported |

We recommend always running the latest version from the primary release branch to ensure all known vulnerabilities are patched.

---

## 2. Core Security Architecture & Defenses

Our backend is built with defense-in-depth principles across multiple layers:

### 2.1 Authentication & Authorization
- **JWT Protection**: Stateless authentication using industry-standard JSON Web Tokens signed with cryptographically strong secrets (`HS256`).
- **Token Rotation & Revocation**: Dedicated refresh token rotation mechanisms with configurable expiration windows.
- **Strict Role-Based Access Control (RBAC)**: Role checks (`USER`, `HOST`, `BUSINESS`, `ADMIN`, `EMPLOYEE`) enforced at the middleware layer before any controller execution.
- **Employer Isolation**: Multi-tenant isolation ensuring hosts and business partners can only manage their own staff, orders, and event data.

### 2.2 Password & Credential Security
- **Bcrypt Hashing**: Passwords stored using `bcryptjs` with robust salt rounds (`>= 10` rounds).
- **Zero Plaintext Exposure**: Passwords and sensitive tokens are explicitly excluded (`select: false` or omitted) from database query responses.

### 2.3 Input Validation & Injection Prevention
- **Schema Validation via Zod**: Every incoming request payload (body, query, and params) is validated through strict Zod schemas, stripping unexpected fields and blocking prototype pollution or malformed inputs.
- **NoSQL Injection Defense**: MongoDB queries use Mongoose object modeling and parameterized conditions rather than raw unsanitized inputs.

### 2.4 Transactional Integrity & Idempotency
- **Atomic Operations**: Reward point deductions, ticket scans, and order status updates utilize Mongoose database sessions / atomic conditional increments (`$inc`, `$set`) to prevent race conditions or double-spending.
- **Scan Invalidation**: Event ticket QR codes and IDs are validated against existing scan records to reject duplicate admission attempts.

### 2.5 Sensitive Configuration Protection
- **Environment Isolation**: Secrets, private API keys, and connection strings are managed via `.env` and must never be committed to source control.
- **Safe Error Responses**: Operational error messages are sanitized; stack traces and internal database errors are withheld from client responses in production mode (`NODE_ENV === 'production'`).

---

## 3. Reporting a Vulnerability

We appreciate the responsible disclosure of security vulnerabilities by security researchers, developers, and users.

> [!IMPORTANT]
> **Please do not report security vulnerabilities through public GitHub issues or public discussions.**

### 3.1 How to Submit a Security Report
Please send an email to our security team at:
- **Email**: `security@teamstreakpromo.com` (or contact the repository maintainers privately via GitHub Security Advisories).

### 3.2 What Information to Include
To help us triage and resolve the issue quickly, please provide:
1. **Summary**: A clear description of the vulnerability and its potential impact.
2. **Affected Endpoints / Files**: The specific routes, controllers, or services involved.
3. **Proof of Concept (PoC)**: Step-by-step reproduction instructions or a minimal script/cURL command.
4. **Environment**: Version, operating system, and deployment context if applicable.

---

## 4. Vulnerability Response Timeline

When a report is received, the TeamStreak Promo maintainers adhere to the following response timeline:

| Phase | Target Timeline | Action |
| :--- | :--- | :--- |
| **Initial Acknowledgment** | Within **24–48 hours** | We confirm receipt of your report and begin initial assessment. |
| **Triage & Validation** | Within **3–5 business days** | We verify the issue, determine severity, and reproduce the vulnerability. |
| **Patch & Remediation** | Within **7–14 business days** | We prepare a hotfix or patch in a private branch, run integration tests, and deploy. |
| **Public Disclosure** | Coordinated | Once the fix is released and verified, we publish an advisory and credit the reporter (if desired). |

---

## 5. Safe Harbor

We consider security research conducted under this policy to be authorized. We will not take legal action against researchers who:
- Make a good faith effort to avoid privacy violations, data destruction, and service interruption.
- Give us reasonable time to fix the vulnerability before publicly disclosing it.
- Do not access, modify, or retain customer data without explicit authorization.
