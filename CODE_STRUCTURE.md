# TeamStreak Promo - Code Structure & Architecture Guide

This document defines the complete architectural design, directory layout, coding conventions, and operational workflows for the **TeamStreak Promo** Express backend application. All future modifications, feature additions, and refactors must adhere to these guidelines to ensure consistency, type safety, and maintainability.

---

## 1. System Overview & Technology Stack

The application is architected as a **Modular (Feature-Based) Enterprise REST API** with distinct separation between controllers, services, database models, and validation layers.

- **Runtime & Module System**: Node.js (ESM / ECMAScript Modules, `"type": "module"`).
- **Web Framework**: Express.js 5.x.
- **Language & Compiler**: TypeScript 5.x (Strict mode enabled, `nodenext` module resolution, `verbatimModuleSyntax: true`).
- **Database & ODM**: MongoDB with Mongoose 9.x (Dual-mode connection pooling supporting both serverless environments and traditional VPS servers).
- **Validation**: Zod (Type-inferred schema validation for request body, query params, and route params).
- **Authentication & Security**: JWT (Access & Refresh tokens), bcryptjs password hashing, role-based access control (`USER`, `HOST`, `BUSINESS`, `ADMIN`), and CORS protection.
- **Payment Processing**: Stripe API & Stripe Connect (Custom / Express host onboarding, direct transfers, refunds, webhooks with raw body verification, and automated payout scheduling).
- **File Storage**: AWS S3 SDK v3 (`@aws-sdk/client-s3`) paired with Multer memory storage.
- **Mailing**: Nodemailer (SMTP / Gmail transport).
- **Logging**: Winston 3.x with custom HTTP request logging middleware, formatted colorized console outputs, and rotating file transports (`logs/`).
- **API Documentation**: OpenAPI 3.0 specifications served interactively via Swagger UI (`/api-docs` and `/api-docs.json`).

---

## 2. Directory Tree Structure

```text
teamstreakpromo-mern-express/
├── .env                              # Environment configuration (ignored in git)
├── .env.example                      # Template configuration with all required keys
├── .gitignore                        # Git ignore rules (node_modules, dist, .env, logs/)
├── AGENT.md                          # AI and developer reference manual
├── CODE_STRUCTURE.md                 # System structure and architectural guidelines (this file)
├── package.json                      # NPM dependencies, scripts, and module definitions
├── tsconfig.json                     # TypeScript compiler configuration (nodenext, strict)
├── vercel.json                       # Serverless deployment configuration
├── logs/                             # Generated runtime logs (ignored in git)
│   ├── combined.log                  # All application logs (HTTP, info, warn, error)
│   └── error.log                     # Dedicated error and exception logs
└── src/
    ├── app.ts                        # Express app setup, global middlewares, routes, and error handler
    ├── server.ts                     # Application entry point, DB trigger, and background schedulers
    ├── config/                       # Centralized configurations
    │   ├── config.ts                 # Environment variables schema and defaults
    │   ├── db.ts                     # MongoDB connection manager (cached promise)
    │   └── s3.config.ts              # AWS S3 client initialization
    ├── docs/                         # OpenAPI / Swagger specifications
    │   ├── auth.docs.ts              # Swagger spec for Auth endpoints
    │   ├── category.docs.ts          # Swagger spec for Category endpoints
    │   ├── employee.docs.ts          # Swagger spec for Employee endpoints
    │   ├── event.docs.ts             # Swagger spec for Event endpoints
    │   ├── eventOrder.docs.ts        # Swagger spec for Event Order / Ticket endpoints
    │   ├── marketplace.docs.ts       # Swagger spec for Marketplace endpoints
    │   ├── order.docs.ts             # Swagger spec for Marketplace Order endpoints
    │   ├── payment.docs.ts           # Swagger spec for Stripe & Payout endpoints
    │   ├── rewardCategory.docs.ts    # Swagger spec for Reward Category endpoints
    │   ├── rewardSubCategory.docs.ts # Swagger spec for Reward SubCategory endpoints
    │   └── swagger.ts                # Swagger UI setup, runner, and path aggregation
    ├── middlewares/                  # Express global and route-level middlewares
    │   ├── authMiddleware.ts         # JWT authentication and role-based authorization
    │   ├── errorHandler.ts           # Global error-catching middleware with Winston logging
    │   ├── multer.middleware.ts      # Multipart form-data memory parser and file filter
    │   ├── requestLogger.ts          # HTTP request logger measuring response duration and status
    │   └── validation.middleware.ts  # Zod schema validation middleware for body/query/params
    ├── utils/                        # Shared utility helpers
    │   ├── AppError.ts               # Custom operational error class with HTTP status codes
    │   ├── catchAsync.ts             # Higher-order async wrapper eliminating try/catch blocks
    │   ├── logger.ts                 # Winston logger with console and file rotation transports
    │   ├── s3.ts                     # S3 file upload, delete, and public URL helpers
    │   ├── sendEmail.ts              # Nodemailer email sender helper
    │   └── sendResponse.ts           # Standardized API response formatter
    └── modules/                      # Business feature modules (Feature-based architecture)
        ├── auth/                     # User authentication, registration, passwords, roles
        ├── businessProfile/          # Host business profiles and Stripe account linkage
        ├── category/                 # Event and business categories
        ├── employee/                 # Employer-managed employee sub-accounts
        ├── event/                    # Event management, ticket tiers, venues, scheduling
        ├── eventOrder/               # Event ticket purchasing, attendance tracking, validation
        ├── marketplace/              # Marketplace catalog, goods/services listings
        ├── order/                    # Marketplace order management and lifecycle
        ├── otp/                      # One-Time Password generation and verification
        ├── payment/                  # Stripe Connect, webhooks, refunds, payout scheduler
        ├── rewardCategory/           # Reward program categories
        └── rewardSubCategory/        # Reward program sub-categories
```

---

## 3. Feature Modules Breakdown

The project contains **12 distinct feature modules** inside `src/modules/`. Each module is self-contained and encapsulates its own domain logic:

| Module | Core Responsibility | Key Endpoints / Components |
| :--- | :--- | :--- |
| **`auth`** | User registration, login, JWT issuance (access/refresh), password recovery, user profile management. | `/api/auth/register`, `/api/auth/login`, `/api/auth/me`, `/api/auth/forgot-password` |
| **`businessProfile`**| Merchant and host profile details, legal business information, and Stripe Connect status. | Linked to `auth` and `payment` workflows. |
| **`category`** | Parent categories for events, businesses, and platform discovery. | `/api/categories` (CRUD operations) |
| **`employee`** | Employer-created subordinate employee accounts with role delegation. | `/api/employees` (Host/Business access only) |
| **`event`** | Creation, updating, ticket tiers (VIP, Regular, etc.), date limits, status (`DRAFT`, `PUBLISHED`, `ENDED`). | `/api/events` |
| **`eventOrder`** | Ticket purchases for events, check-in QR codes, attendee tracking, and order state. | `/api/event-orders` |
| **`marketplace`**| Products and services catalog, pricing, inventory stock, and merchant listings. | `/api/marketplaces` |
| **`order`** | Orders placed on the marketplace, shipping/fulfillment status, and tracking. | `/api/orders` |
| **`otp`** | Generates, sends, and verifies short-lived OTP codes for email verification and password resets. | Internal service helper (`otp.service.ts`) |
| **`payment`** | Stripe Connect onboarding, login links, webhooks, refund processing, transfers, and automated payout sweeper. | `/api/payments/*`, `payout.scheduler.ts` |
| **`rewardCategory`** | Loyalty and promotional reward program categories. | `/api/reward-categories` |
| **`rewardSubCategory`**| Granular sub-classifications for promotional rewards. | `/api/reward-subcategories` |

---

## 4. Standard Module File Structure

Every feature module strictly implements the following file conventions:

```text
src/modules/<moduleName>/
├── <moduleName>.interface.ts   # TypeScript interfaces & Mongoose document types
├── <moduleName>.model.ts       # Mongoose Schema definition and model export
├── <moduleName>.validation.ts  # Zod schemas for request validation
├── <moduleName>.service.ts     # Business logic and database operations
├── <moduleName>.controller.ts  # HTTP request/response handler
└── <moduleName>.route.ts       # Express router definitions and middleware chaining
```

### Layer Responsibilities:

1. **`interface.ts`**:
   - Defines pure TypeScript interfaces for the data model, DTOs (Data Transfer Objects), and schema options.
   - Types are inferred from Zod schemas or defined directly as Mongoose document extensions.

2. **`model.ts`**:
   - Builds the Mongoose schema with appropriate indexes, timestamps, and validations.
   - Exports the Mongoose model typed with the module's interface.

3. **`validation.ts`**:
   - Exports Zod validation schemas for `body`, `query`, and `params`.
   - Used by `validateRequest` middleware before requests reach the controller.

4. **`service.ts`**:
   - Contains all domain business logic, data transformations, and database queries.
   - **Rule**: Services must **never** accept or touch Express `req` or `res` objects.
   - Throws `AppError` instances for operational failures (e.g., `404 Not Found`, `400 Bad Request`).

5. **`controller.ts`**:
   - Extracts data from `req.body`, `req.query`, `req.params`, and authenticated user `req.user`.
   - Delegates execution to the corresponding method in `service.ts`.
   - Uses `sendResponse` to format outgoing JSON responses.
   - Wrapped inside `catchAsync` to forward unhandled rejections to the global error handler.

6. **`route.ts`**:
   - Instantiates an `express.Router()`.
   - Assembles middleware chains: `authenticateUser`, `authorizeRoles(...)`, `validateRequest(...)`, `uploadSingle(...)`.
   - Dispatches requests to the appropriate controller method.

---

## 5. Core Infrastructure & Cross-Cutting Concerns

### 5.1 Logging System
- **File**: `src/utils/logger.ts`
- Built on **Winston** using RFC5424/npm log levels (`error`, `warn`, `info`, `http`, `debug`).
- **Console Transport**: Outputs colorized, human-readable entries with timestamps and full error stack traces during development.
- **File Transports**: Automatically creates and maintains log files in `logs/`:
  - `logs/error.log`: Records all error-level logs (5MB max size, 5 rotated backup files).
  - `logs/combined.log`: Records all log levels including HTTP requests and info messages (10MB max size, 5 rotated backup files).
- **HTTP Request Logger (`src/middlewares/requestLogger.ts`)**: Intercepts every inbound HTTP request and logs method, URL path, response status, duration in milliseconds, and client IP.

### 5.2 Error Handling
- **`AppError` (`src/utils/AppError.ts`)**: Operational error class holding an HTTP status code (e.g. 400, 401, 403, 404, 500) and error message.
- **`errorHandler` (`src/middlewares/errorHandler.ts`)**: The terminal Express middleware that intercepts all errors passed to `next(err)`.
  - Logs the error with full stack trace and request metadata via `logger.error`.
  - Formats a clean JSON response: `{ success: false, message, stack?: string }` (stack trace included only in development).

### 5.3 Response Standardization
- **`sendResponse` (`src/utils/sendResponse.ts`)**:
  Ensures every successful API response adheres to a predictable structure:
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Resource fetched successfully",
    "data": { ... }
  }
  ```

### 5.4 Database Connection Architecture
- **File**: `src/config/db.ts`
- Uses a cached promise (`cachedPromise`) pattern:
  - **Traditional Server (VPS)**: Initialized on server start in `src/server.ts`.
  - **Serverless (e.g. Vercel)**: Per-request verification in `src/app.ts` ensures re-use of warm connection pools without reopening connections.

### 5.5 Background Schedulers
- **File**: `src/modules/payment/payout.scheduler.ts`
- Started automatically after successful database connection in `src/server.ts`.
- Runs a recurring sweep (default every 15 minutes) to automatically process Stripe payouts and transfers to hosts for events that have ended.

### 5.6 File Storage & Media Upload
- **`multer.middleware.ts`**: Handles multipart form submissions in memory (`multer.memoryStorage()`) with file size limits (5MB) and image MIME type filtering.
- **`s3.ts` & `s3.config.ts`**: Uses AWS S3 SDK v3 to upload buffers and delete old assets.

### 5.7 OpenAPI / Swagger Documentation
- **File**: `src/docs/swagger.ts`
- Modular documentation: each module defines its OpenAPI endpoints inside `src/docs/<moduleName>.docs.ts`.
- All module specs are combined in `swagger.ts` and served at:
  - `/api-docs` (interactive UI)
  - `/api-docs.json` (raw OpenAPI JSON spec)

---

## 6. Coding Standards & Conventions

### 1. ECMAScript Modules (ESM) & TypeScript Rules
- **Import Extensions**: Because the project runs native ESM (`"type": "module"` with `"module": "nodenext"`), **all relative local imports must explicitly include the `.js` extension**:
  ```typescript
  // CORRECT
  import logger from './utils/logger.js';
  import { connectDB } from './config/db.js';

  // INCORRECT (Will trigger runtime module not found error)
  import logger from './utils/logger';
  ```
- **Type-Only Imports**: The project enforces `"verbatimModuleSyntax": true`. Type imports must use `import type`:
  ```typescript
  // CORRECT
  import type { Request, Response, NextFunction } from 'express';

  // INCORRECT
  import { Request, Response, NextFunction } from 'express';
  ```

### 2. Naming Conventions
- **Module Folders**: `camelCase` (e.g., `businessProfile`, `eventOrder`, `rewardSubCategory`).
- **Module Files**: `<moduleName>.<layer>.ts` (e.g., `event.controller.ts`, `event.service.ts`).
- **Docs Files**: `<moduleName>.docs.ts` in `src/docs/`.
- **Classes**: `PascalCase` (e.g., `AppError`, `PaymentService`).
- **Interfaces & Types**: `PascalCase` with descriptive names (e.g., `IUser`, `CreateEventInput`).

### 3. Controller & Service Separation
- Controllers must **only**:
  1. Extract input from `req`.
  2. Call the service.
  3. Respond using `sendResponse(res, { ... })`.
- Controllers must **never** contain raw database queries (`Model.find()`, `Model.create()`).
- Services must **never** receive `req` or `res` objects.

### 4. Route Security & Validation Pipeline
Every route handler should declare its middleware chain in order:
```typescript
router.post(
  '/',
  authenticateUser,                          // 1. Verify JWT
  authorizeRoles('HOST', 'BUSINESS'),        // 2. Check Role
  uploadSingle('image'),                     // 3. Parse File (if upload)
  validateRequest(createEntityValidation),   // 4. Validate Zod Payload
  entityController.createEntity              // 5. Execute Controller
);
```

### 5. Logging Standard
- Do **not** use `console.log` or `console.error` in production code.
- Always import and use `logger`:
  ```typescript
  import logger from '../utils/logger.js';

  logger.info('Processing order payout', { orderId });
  logger.warn('Stripe webhook account mismatch', { accountId });
  logger.error('Failed to process payment', { error });
  ```

---

## 7. Adding a New Feature Module (Step-by-Step Checklist)

When creating a new feature module (e.g., `review`):

1. **Create Directory**: `src/modules/review/`
2. **Interface**: Create `review.interface.ts` defining data types and Mongoose document interfaces.
3. **Model**: Create `review.model.ts` defining schema and exporting the Mongoose model.
4. **Validation**: Create `review.validation.ts` with Zod schemas for request validation.
5. **Service**: Create `review.service.ts` containing business logic and Mongoose operations.
6. **Controller**: Create `review.controller.ts` with `catchAsync` handlers calling the service and responding via `sendResponse`.
7. **Route**: Create `review.route.ts` assembling middlewares and controllers.
8. **Mount Route**: Register the router in `src/app.ts` (`app.use('/api/reviews', reviewRoutes);`).
9. **API Documentation**: Create `src/docs/review.docs.ts` with OpenAPI specs and register it in `src/docs/swagger.ts`.
10. **Verify**: Run `npx tsc --noEmit` and verify routes through Swagger at `/api-docs`.
