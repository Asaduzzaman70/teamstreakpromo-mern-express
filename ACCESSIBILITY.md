# Accessibility Statement for TeamStreak Promo

At **TeamStreak Promo**, we believe digital experiences should be accessible, transparent, and usable for everyone—including developers, business partners, hosts, employees, and end users regardless of ability or assistive technology used.

As the backend API and server service powering the TeamStreak Promo ecosystem, our accessibility focus centers on **API clarity, predictable error formatting, machine-readable data structures for assistive devices (screen readers, voice assistants), accessible interactive API documentation (Swagger/OpenAPI), and inclusive communications**.

---

## 1. Accessibility Priorities

We design and maintain our backend services to support inclusive client interfaces by adhering to the following priorities:

1. **Clear and Actionable Error Responses**:
   - Error messages are structured in plain language without cryptic error codes alone.
   - Validation failures pinpoint the exact field, expected format, and helpful resolution steps so frontend clients and screen readers can announce them naturally.
2. **Accessible API Documentation & Interactive Consoles**:
   - Our Swagger / OpenAPI 3.0 documentation (`/api-docs`) strives to comply with **WCAG 2.1 Level AA** standards.
   - High contrast themes, keyboard-navigable endpoints, readable font sizes, and well-structured semantic HTML tags (`<nav>`, `<main>`, `<button>`) for screen reader support.
3. **Multi-Input Fallbacks for Physical Operations**:
   - Real-world operations like event entry verification support both visual scanning (**QR code scans**) and manual textual fallback (**alphanumeric Ticket IDs** like `#MOT1174745308` or Order IDs).
   - This ensures employees or venue staff with visual, motor, or camera hardware limitations can seamlessly complete ticket validation.
4. **Predictable & Semantic Data Payloads**:
   - Clean, standardized JSON payloads (`success`, `message`, `data`, `meta`) that make frontend accessible component development straightforward and predictable.

---

## 2. Contributor Expectations

When contributing to the TeamStreak Promo backend, contributors are expected to uphold these accessibility standards:

- **Semantic Error Messaging**: Always use descriptive, human-readable error messages in Zod schemas and `AppError` calls instead of raw database stack dumps.
- **Accessible Swagger Annotations**: When documenting new endpoints in `src/docs/*.docs.ts`, provide clear summaries, parameter descriptions, and realistic example payloads so interactive documentation remains intuitive.
- **Alternative Text for Media & Assets**: Any service or notification sending emails, HTML receipts, or push notifications must include descriptive `alt` text for images and logos.
- **Documentation Readability**: Keep markdown documentation, guides, and module `README.md` files well-structured with clear headings (`#`, `##`, `###`), descriptive link texts (no bare URLs or generic "click here" links), and proper list semantics.

---

## 3. Supported Environments & Assistive Tools

Our public documentation and developer interfaces are evaluated for compatibility across:

- **Screen Readers**: NVDA (Windows), JAWS (Windows), VoiceOver (macOS / iOS), and TalkBack (Android).
- **Modern Browsers**: Google Chrome, Mozilla Firefox, Microsoft Edge, and Safari (desktop & mobile).
- **Navigation**: Full keyboard navigation (Tab, Shift+Tab, Enter, Space, Arrow keys) across all Swagger documentation panels.

---

## 4. Reporting Accessibility Barriers

If you encounter an accessibility barrier while using our API, reading our developer documentation, or integrating with client applications, please let us know:

1. **How to Report**:
   - Open an issue in our GitHub repository with the tag `accessibility`.
   - Or contact our team at: `accessibility@teamstreakpromo.com` (or project maintainers).
2. **Helpful Context to Include**:
   - The endpoint, page URL, or documentation section where you encountered the barrier.
   - The assistive technology used (e.g., NVDA, keyboard only, zoom magnifier).
   - The observed behavior and the expected accessible experience.
   - *Note: Disclosing personal disability details is never required.*

---

## 5. How We Respond

- **Acknowledgment**: Accessibility reports are acknowledged within **2 business days**.
- **Triage & Remediation**: Critical accessibility blockers (such as inaccessible authentication or unusable documentation) are treated as high priority bug fixes.
- **Verification**: Reporters are invited (optionally) to review and verify the fix before release.

---

## 6. Continuous Improvement

We view accessibility as an ongoing commitment. We regularly review our API documentation UI, error message clarity, and developer resources to eliminate friction and ensure an inclusive experience for all contributors and users.
