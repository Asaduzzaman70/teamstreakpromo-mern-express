# Agent Rules & Behavioral Guidelines

This document defines operational, behavioral, and architectural guidelines that every AI agent or pair-programmer MUST strictly follow when modifying, maintaining, or creating code in the `teamstreakpromo-mern-express` repository.

---

## 1. Core Operating Principles

1. **Do No Harm / Preserve Integrity**:
   - Never break working features or remove existing comments, docstrings, or business logic unless explicitly requested by the user.
   - Maintain backward compatibility of API contracts and responses.
2. **Strict Verification**:
   - Always run `npx tsc --noEmit` before concluding any coding task. Zero TypeScript compiler errors are permitted.
   - Test newly added endpoints or modifications against the established Zod validation schemas.
3. **No Direct Production Shortcuts**:
   - Do not mock database operations with in-memory arrays when adding new features; follow the standard Mongoose schema, model, and service patterns.
   - Do not bypass authentication (`protect`) or role checks (`authorizeRoles`) without explicit user instruction.
4. **Git Commit Messages**:
   - Follow detailed, descriptive commit message conventions.
   - Clearly state **what** changed and **why** it changed (e.g. `feat(event): enforce 30-event monthly quota per host to prevent resource spamming`).
5. **No Local Machine Paths in Documentation**:
   - **NEVER** use or commit local PC absolute paths (e.g. `C:\Users\...` or `file:///...`) in any markdown files, documentation, links, or code comments.
   - Always use **relative paths** (e.g. `.agents/rules/agent-rules.md` or `CODE_STRUCTURE.md`) so the repository remains fully portable across different machines, operating systems, and developer environments.

---

## 2. Code Modularity & Layering Invariants

Every agent must maintain clean separation of concerns across the feature layers:

- **Controllers (`<module>.controller.ts`)**:
  - Responsible ONLY for: extracting input (`req.body`, `req.query`, `req.params`, `req.user`, `req.files`), delegating to services, and formatting responses with `sendResponse`.
  - **INVARIANT**: Controllers must NEVER query the database directly (no `Model.find`, `Model.create`, etc.).
  - **INVARIANT**: Every controller handler must be wrapped in `catchAsync`.

- **Services (`<module>.service.ts`)**:
  - Responsible for all domain business logic, data calculations, database operations, and external API calls (e.g. Stripe, S3).
  - **INVARIANT**: Services must NEVER import or receive Express `Request` or `Response` objects. Pass only typed data primitives or interfaces.
  - **INVARIANT**: Throw operational errors using `new AppError(message, statusCode)`. Never throw generic untyped strings or bare errors.

- **Validation (`<module>.validation.ts`)**:
  - Build Zod schemas for `body`, `query`, and `params`.
  - Validate all incoming user payloads before controller invocation using `validateRequest(schema)`.

- **Models (`<module>.model.ts`)**:
  - Define Mongoose schemas with explicit types, defaults, and appropriate compound indexes.
  - Export models typed with interfaces from `<module>.interface.ts`.

- **Interfaces (`<module>.interface.ts`)**:
  - Declare pure TypeScript interfaces, document extensions (`extends Document`), and DTO types.
  - Zero executable JavaScript/TypeScript logic allowed.

---

## 3. ECMAScript Modules (ESM) & TypeScript Rules

1. **Mandatory `.js` Extensions on Relative Imports**:
   - The project runs native ESM (`"type": "module"` in `package.json` with `"moduleResolution": "nodenext"` in `tsconfig.json`).
   - All relative module imports MUST include the `.js` extension:
     ```typescript
     // CORRECT
     import { Event } from './event.model.js';
     import logger from '../../utils/logger.js';

     // FORBIDDEN (Will fail at runtime with ERR_MODULE_NOT_FOUND)
     import { Event } from './event.model';
     ```
2. **Type-Only Imports Enforced**:
   - The project compiler enforces `"verbatimModuleSyntax": true`.
   - Always import types using `import type`:
     ```typescript
     // CORRECT
     import type { Request, Response, NextFunction } from 'express';
     import type { IEvent } from './event.interface.js';

     // FORBIDDEN
     import { Request, Response } from 'express';
     ```

---

## 4. Logging & Error Handling Standards

1. **Logging Rules**:
   - **NEVER** use `console.log`, `console.error`, or `console.warn` in backend application code.
   - Always import `logger` from `src/utils/logger.js`.
   - Log meaningful context objects:
     ```typescript
     logger.info('Event created successfully', { eventId: event._id, hostId });
     logger.error('Failed to process payout', { error: err.message, stack: err.stack });
     ```
2. **Error Responses**:
   - Operational errors must use `AppError(message, statusCode)`.
   - Errors bubble up automatically via `catchAsync` to `src/middlewares/errorHandler.ts`.

---

## 5. Media & Asset Handling Standards

1. **Multer Storage**:
   - File uploads must use memory storage (`multer.memoryStorage()`) through helpers in `src/middlewares/multer.middleware.ts` (`uploadSingle`, `uploadFields`, `uploadAny`).
2. **AWS S3 Integration**:
   - Upload file buffers using `uploadToS3(file, folder)`.
   - Always clean up replaced or deleted media files from S3 using `deleteFromS3(url)` to prevent orphaned assets and storage bloat.

---

## 6. API Documentation Requirements

Whenever an endpoint is added, modified, or deleted:
1. Update or create the corresponding Swagger spec file in `src/docs/<module>.docs.ts`.
2. Ensure the doc is registered in `src/docs/swagger.ts`.
3. Update `CODE_STRUCTURE.md` and `AGENT.md` endpoint tables.

---

## 7. Mandatory Module README Maintenance

Every domain module in `src/modules/<moduleName>/` contains a dedicated `README.md` file documenting its business purpose, file structure, data model, API endpoints, lifecycle workflows, and developer gotchas.

**MANDATORY INVARIANT FOR ALL AGENTS & DEVELOPERS**:
Whenever you modify, add, or refactor any code within a module (including `route`, `controller`, `service`, `model`, `validation`, or `interface`):
1. **Immediately update that module's `README.md`**:
   - If an endpoint was added/changed/removed, update the **Endpoints & API Reference** table.
   - If a schema or interface changed, update the **Data Model Reference** table.
   - If business logic, quotas, limits, or workflows changed, update the **Key Capabilities / Workflows** section.
2. **Never leave documentation out of sync**: No code changes to a module are considered complete without updating its corresponding `README.md`.

