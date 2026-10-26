# Folder Structure & File Placement Rules

This document specifies the exact directory layout, naming standards, and placement guidelines for files in the `teamstreakpromo-mern-express` repository.

---

## 1. Directory Tree & Scope Definition

```text
teamstreakpromo-mern-express/
├── .agents/                          # Custom agent guidelines and rules
│   └── rules/                        # Agent rule documents
├── logs/                             # Winston rotation logs (never committed to git)
├── src/                              # Main application source root
│   ├── config/                       # Centralized configuration & DB connectors
│   ├── docs/                         # OpenAPI 3.0 specs & Swagger UI runner
│   ├── middlewares/                  # Express HTTP middlewares
│   ├── modules/                      # Domain feature modules
│   └── utils/                        # Reusable helpers and shared utilities
├── package.json                      # Dependency manifests & npm scripts
├── tsconfig.json                     # TypeScript strict configuration
└── vercel.json                       # Serverless deployment configuration
```

---

## 2. Subdirectory Conventions

### 2.1 `src/config/`
- **Purpose**: Centralized application configuration, environment variable schemas, and connection managers.
- **Rules**:
  - `config.ts`: Loads and validates `.env` variables and exports a centralized config object.
  - `db.ts`: Manages the MongoDB connection pool (cached promise pattern for serverless and VPS).
  - `s3.config.ts`: Exports initialized AWS S3 clients.
  - No domain logic or route handling is permitted here.

### 2.2 `src/docs/`
- **Purpose**: OpenAPI / Swagger documentation.
- **Naming Pattern**: `<moduleName>.docs.ts` (e.g., `event.docs.ts`, `payment.docs.ts`).
- **Aggregator**: `swagger.ts` imports all modular docs, merges paths, and mounts Swagger UI.
- **Rule**: Every new feature module must have a corresponding `<moduleName>.docs.ts` file in this directory.

### 2.3 `src/middlewares/`
- **Purpose**: Reusable Express middleware functions.
- **Naming Pattern**: `camelCase.ts` or `<name>.middleware.ts`.
- **Existing Middlewares**:
  - `authMiddleware.ts`: JWT verification (`protect`) and RBAC (`authorizeRoles`).
  - `errorHandler.ts`: Global terminal error catcher.
  - `multer.middleware.ts`: Memory buffer file parser with filter helpers.
  - `requestLogger.ts`: Winston request auditor.
  - `validation.middleware.ts`: Zod request payload validator.
- **Rule**: Middlewares must remain domain-agnostic and reusable across multiple modules.

### 2.4 `src/modules/`
- **Purpose**: Encapsulated feature domains.
- **Naming Convention for Folders**: Strictly `camelCase` (e.g., `businessProfile`, `eventOrder`, `rewardSubCategory`).
- **File Structure Invariant**:
  Each feature module directory must contain:
  1. `<moduleName>.interface.ts`
  2. `<moduleName>.model.ts`
  3. `<moduleName>.validation.ts`
  4. `<moduleName>.service.ts`
  5. `<moduleName>.controller.ts`
  6. `<moduleName>.route.ts`
  7. `README.md` (Dedicated module documentation - MUST be updated whenever module code is modified)

### 2.5 `src/utils/`
- **Purpose**: Generic utilities, helpers, and base classes.
- **Naming Pattern**:
  - `PascalCase.ts` for classes (e.g., `AppError.ts`).
  - `camelCase.ts` for helper functions or objects (e.g., `catchAsync.ts`, `sendResponse.ts`, `s3.ts`, `sendEmail.ts`, `logger.ts`).
- **Rule**: Utilities must be stateless, side-effect-free (or isolated), and domain-neutral.

---

## 3. Placement Rules for New Additions

| What are you adding? | Destination Directory | Expected Naming Pattern |
| :--- | :--- | :--- |
| **New Feature Module** | `src/modules/<featureName>/` | Folder: `camelCase`<br>Files: `<featureName>.<layer>.ts` |
| **New API Documentation** | `src/docs/` | `<featureName>.docs.ts` |
| **New Reusable Middleware** | `src/middlewares/` | `<purpose>.middleware.ts` or `<purpose>.ts` |
| **New Shared Helper** | `src/utils/` | Function: `camelCase.ts`<br>Class: `PascalCase.ts` |
| **New Config / Driver** | `src/config/` | `<service>.config.ts` or `<service>.ts` |
| **New Agent Rule** | `.agents/rules/` | `<rule-name>.md` |

---

## 4. Anti-Patterns to Avoid

- **DO NOT** create ad-hoc utility folders inside individual modules if the utility can be shared.
- **DO NOT** place routes or controllers outside `src/modules/`.
- **DO NOT** create flat files in `src/` other than `app.ts` and `server.ts`.
- **DO NOT** place test scripts, mock files, or scratch files in `src/`. Use the designated scratch directory.
