# Workspace Agent Rules & Guidelines

Welcome to the **TeamStreak Promo** Express Backend repository (`teamstreakpromo-mern-express`).

All AI agents and developers operating in this repository must strictly adhere to the project conventions, layered architecture, and rules outlined in this document and the associated rule definitions in `.agents/rules/`.

---

## 1. Quick Reference & Core Rules

1. **Native ESM & File Extensions**:
   - The project runs native ECMAScript Modules (`"type": "module"`, `"moduleResolution": "nodenext"`).
   - **MANDATORY**: All relative local imports must explicitly include the `.js` extension (e.g. `import logger from '../utils/logger.js';`).
2. **Type-Only Imports**:
   - `"verbatimModuleSyntax": true` is enforced in `tsconfig.json`.
   - **MANDATORY**: Always use `import type { ... }` when importing types or interfaces.
3. **Layer Separation**:
   - **Controllers**: Must ONLY handle HTTP extraction, Zod triggering, service calls, and responses via `sendResponse`. Controllers MUST NEVER perform direct database queries.
   - **Services**: Contain all domain business logic and database queries. Services MUST NEVER accept or touch Express `req` or `res` objects.
   - **Validation**: Request payloads must be validated using Zod schemas via `validateRequest`.
   - **Errors**: Throw operational errors using `AppError(message, statusCode)`. All controller handlers must be wrapped in `catchAsync`.
4. **Zero Compiler Errors**:
   - Always run `npx tsc --noEmit` to verify type safety before completing tasks.
5. **Git Commit Messages**:
   - Write descriptive, detailed commit messages explaining **what** was changed and **why**.
6. **No Console Logs**:
   - Use Winston `logger` (`src/utils/logger.js`). Never use `console.log` or `console.error`.

---

## 2. Rule Files Index

Detailed rules and templates are organized within the `.agents/rules/` directory:

| Rule File | Topic & Scope |
| :--- | :--- |
| **[.agents/rules/agent-rules.md](file:///c:/Users/asdud/Desktop/Softvence/Teamstreakpromo/teamstreakpromo-mern-express/.agents/rules/agent-rules.md)** | Agent behavioral guidelines, safety rules, tool usage, verification standards, and git commit practices. |
| **[.agents/rules/code-structure.md](file:///c:/Users/asdud/Desktop/Softvence/Teamstreakpromo/teamstreakpromo-mern-express/.agents/rules/code-structure.md)** | Layered architecture rules, code patterns, interface/model/service/controller templates, and strict anti-patterns. |
| **[.agents/rules/folder-structure.md](file:///c:/Users/asdud/Desktop/Softvence/Teamstreakpromo/teamstreakpromo-mern-express/.agents/rules/folder-structure.md)** | Directory tree standards, module file organization, placement rules for new code, and naming conventions. |

---

## 3. Key Architectural Guides

- **[CODE_STRUCTURE.md](file:///c:/Users/asdud/Desktop/Softvence/Teamstreakpromo/teamstreakpromo-mern-express/CODE_STRUCTURE.md)**: Comprehensive architectural guide covering all 12 modules, full endpoint listings, cross-cutting concerns, and domain rules.
- **[AGENT.md](file:///c:/Users/asdud/Desktop/Softvence/Teamstreakpromo/teamstreakpromo-mern-express/AGENT.md)**: Developer & agent reference manual with complete endpoint tables, domain rules, and Mermaid class diagrams.
