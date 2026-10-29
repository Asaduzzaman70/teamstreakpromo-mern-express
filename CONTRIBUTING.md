# Contributing to TeamStreak Promo Backend

Thank you for your interest in contributing to the **TeamStreak Promo** Express Backend! This document outlines our development workflow, coding standards, architectural rules, and pull request guidelines to ensure a smooth collaboration experience for everyone.

---

## 1. Code of Conduct

By participating in this project, you are expected to uphold our code of conduct and treat all contributors with respect, fairness, and empathy.

---

## 2. Tech Stack & Environment

- **Runtime**: Node.js (`>= 18.x`, recommend `20.x` or latest LTS)
- **Framework**: Express v5 (`express@^5.2.1`)
- **Language**: TypeScript (`5.x`) running native ECMAScript Modules (`"type": "module"`, `"moduleResolution": "nodenext"`)
- **Database**: MongoDB via Mongoose (`mongoose@^9.9.2`)
- **Validation**: Zod (`zod@^4.4.3`)
- **Logging**: Winston logger (`winston@^3.19.0`)
- **Documentation**: Swagger / OpenAPI 3.0 (`swagger-ui-express`, `swagger-jsdoc`)

---

## 3. Getting Started

### 3.1 Clone the Repository
```bash
git clone <repository-url>
cd teamstreakpromo-mern-express
```

### 3.2 Install Dependencies
```bash
npm install
```

### 3.3 Configure Environment Variables
Copy the `.env.example` file (or create `.env`) in the root directory and provide the necessary credentials:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/teamstreakpromo
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=your_refresh_secret
REFRESH_TOKEN_EXPIRES_IN=30d
```

### 3.4 Build and Run
- **Development Mode** (with file watch and hot reload):
  ```bash
  npm run dev
  ```
- **Type Check & Production Build**:
  ```bash
  npm run build
  ```
- **Run Built Server**:
  ```bash
  npm start
  ```

---

## 4. Core Development Rules & Guidelines

To maintain code quality and architectural integrity across the repository, every contributor must follow these mandatory rules:

### 4.1 Native ESM & File Extensions (MANDATORY)
The project runs native ECMAScript Modules.
- **Rule**: All local relative imports **must explicitly include the `.js` extension**.
  ```typescript
  // ✅ Correct
  import logger from '../utils/logger.js';
  import { UserModel } from './user.model.js';

  // ❌ Incorrect
  import logger from '../utils/logger';
  ```

### 4.2 Type-Only Imports (MANDATORY)
`"verbatimModuleSyntax": true` is enforced in `tsconfig.json`.
- **Rule**: Always use `import type { ... }` when importing types or interfaces.
  ```typescript
  // ✅ Correct
  import type { Request, Response, NextFunction } from 'express';
  import type { IUser } from './user.interface.js';

  // ❌ Incorrect
  import { Request, Response, IUser } from 'express';
  ```

### 4.3 Layered Architecture & Separation of Concerns
Every feature is divided into 5 standard layer files under `src/modules/<moduleName>/`:
- `<moduleName>.interface.ts`: TypeScript interfaces and types.
- `<moduleName>.model.ts`: Mongoose schema and model definition.
- `<moduleName>.validation.ts`: Zod validation schemas for request bodies, queries, and params.
- `<moduleName>.service.ts`: All business logic and direct database queries. **Services must NEVER accept or touch Express `req` or `res` objects.**
- `<moduleName>.controller.ts`: Handles HTTP request/response extraction, triggers validation, calls service methods, and responds using `sendResponse()`. **Controllers must NEVER perform direct database queries.**
- `<moduleName>.route.ts`: Express router connecting routes, middleware, and controller methods.

### 4.4 Error Handling & Responses
- Wrap all async controller functions with `catchAsync`.
- Throw operational errors using `new AppError(message, statusCode)`.
- Use the unified `sendResponse(res, { statusCode, success, message, data, meta })` utility for HTTP responses.

### 4.5 Logging Standards (No `console.log`)
- Never use `console.log`, `console.error`, or `console.warn`.
- Always use Winston `logger` (`src/utils/logger.js`):
  ```typescript
  import logger from '../../utils/logger.js';
  logger.info('Action executed successfully');
  logger.error('Error occurred:', error);
  ```

### 4.6 Module README Synchronization (MANDATORY)
Every module directory under `src/modules/<moduleName>/` must have a dedicated `README.md`.
- Whenever you add, update, or modify routes, models, services, or validations in a module, you **must update that module's `README.md`** to keep the API documentation and contract current.

### 4.7 Portable Repository Paths (MANDATORY)
- **Never** write or commit local machine absolute paths (e.g. `C:\Users\...` or `file:///...`) in documentation, comments, or code. Always use **repository-relative paths** (`src/modules/...`).

---

## 5. Development Workflow & Pull Request Process

1. **Create a Feature Branch**:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bugfix-name
   ```
2. **Implement Your Changes**:
   - Follow the layered architecture and naming conventions.
   - Update or add Zod validation schemas and OpenAPI/Swagger documentation.
   - Update the respective module's `README.md`.
3. **Verify Zero Compiler Errors**:
   - Run the TypeScript compiler to ensure 100% type safety:
     ```bash
     npx tsc --noEmit
     npm run build
     ```
   - PRs with TypeScript errors will not be accepted.
4. **Commit Your Changes**:
   - Write descriptive, detailed commit messages describing **what** was changed and **why**.
   ```bash
   git commit -m "feat(employeePortal): add host employee ticket scan and personal dashboard isolation"
   ```
5. **Open a Pull Request**:
   - Push your branch to the repository and open a PR against the `main` or development branch.
   - Provide a clear summary of the changes, related issue numbers, and testing steps.

---

## 6. Questions & Discussions

If you have questions about architectural patterns, database schemas, or API conventions, refer to:
- [AGENTS.md](AGENTS.md)
- [CODE_STRUCTURE.md](CODE_STRUCTURE.md)
- [AGENT.md](AGENT.md)
