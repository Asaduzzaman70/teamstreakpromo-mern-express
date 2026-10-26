# TeamStreak Promo - Code Structure & Architecture Guide

This document defines the complete architectural design, directory layout, coding conventions, and operational workflows for the **TeamStreak Promo** Express backend application. All future modifications, feature additions, and refactors must adhere to these guidelines to ensure consistency, type safety, and maintainability.

---

## 1. System Overview & Technology Stack

The application is architected as a **Modular (Feature-Based) Enterprise REST API** with strict separation between controllers, services, database models, request validations, and route definitions.

- **Runtime & Module System**: Node.js (Native ESM / ECMAScript Modules, `"type": "module"`).
- **Web Framework**: Express.js 5.x.
- **Language & Compiler**: TypeScript 5.7.x (Strict mode enabled, `nodenext` module resolution, `verbatimModuleSyntax: true`).
- **Database & ODM**: MongoDB with Mongoose 9.x (Dual-mode connection pooling supporting both serverless environments and traditional VPS servers via cached promise).
- **Validation**: Zod 4.x (Type-inferred schema validation for request `body`, `query`, and `params`).
- **Authentication & Security**: JWT (Access & Refresh tokens), bcryptjs password hashing, role-based access control (`USER`, `HOST`, `BUSINESS`, `ADMIN`), and CORS protection.
- **Payment Processing**: Stripe API & Stripe Connect (Express host onboarding, direct transfers, refunds, webhooks with raw body signature verification, and automated background payout scheduling).
- **File Storage**: AWS S3 SDK v3 (`@aws-sdk/client-s3`) paired with Multer memory storage and automatic orphan file cleanup.
- **Mailing**: Nodemailer (SMTP / Gmail transport) with OTP verification and templated notifications.
- **Logging**: Winston 3.x with custom HTTP request logging middleware, formatted colorized console outputs, and rotating file transports (`logs/`).
- **API Documentation**: OpenAPI 3.0 specifications served interactively via Swagger UI (`/api-docs` and `/api-docs.json`).

---

## 2. Directory Tree Structure

```text
teamstreakpromo-mern-express/
├── .agents/                          # Workspace agent customizations and rules
│   └── rules/                        # Agent rule definitions
│       ├── agent-rules.md            # Agent operational & coding behavior rules
│       ├── code-structure.md         # Code architecture & layering standards
│       └── folder-structure.md       # Folder hierarchy & file placement rules
├── .env                              # Environment configuration (ignored in git)
├── .env.example                      # Template configuration with all required keys
├── .gitignore                        # Git ignore rules (node_modules, dist, .env, logs/)
├── AGENT.md                          # AI and developer architectural guide
├── AGENTS.md                         # Hierarchical workspace agent rules entrypoint
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
    │   ├── authMiddleware.ts         # JWT authentication (`protect`) and role authorization (`authorizeRoles`)
    │   ├── errorHandler.ts           # Global error-catching middleware with Winston logging
    │   ├── multer.middleware.ts      # Multipart form-data memory parser and file filter helpers
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
        ├── auth/                     # User authentication, registration, passwords, roles, OTP
        ├── businessProfile/          # Host business profiles, legal verification, Stripe Connect linkage
        ├── category/                 # Event and discovery categories & subcategories
        ├── employee/                 # Employer-managed employee sub-accounts & permissions
        ├── event/                    # Event management, ticket tiers, venues, scheduling, geo-queries
        ├── eventOrder/               # Event ticket purchasing, attendance tracking, ticket cancellation & refunds
        ├── marketplace/              # Marketplace catalog, products/services listings, stock
        ├── order/                    # Marketplace order management, point purchasing, fulfillment
        ├── otp/                      # One-Time Password generation, TTL expiration, and verification
        ├── payment/                  # Stripe Connect onboarding, webhooks, refunds, transfers, payout sweeper
        ├── rewardCategory/           # Reward program categories
        ├── rewardSubCategory/        # Reward program sub-categories
        ├── user/                     # Administrative user accounts, roles, and status management
        └── content/                  # Legal & static pages CMS (Terms, Privacy Policy, About Us, custom pages)
```

---

## 3. Feature Modules Breakdown & Endpoint Mapping

The project contains **14 distinct feature modules** inside `src/modules/`. Each module is self-contained and encapsulates its own domain logic:

| Module | Core Responsibility | Route Prefix | Key Endpoints | Auth / Roles |
| :--- | :--- | :--- | :--- | :--- |
| **`auth`** | User registration with file uploads, account activation, login, JWT token issuance, refresh token, password recovery & reset, user profile management. | `/api/auth` | `POST /register`<br>`POST /verify-register-otp`<br>`POST /login`<br>`POST /forgot-password`<br>`POST /verify-forgot-password-otp`<br>`POST /reset-password`<br>`POST /change-password`<br>`POST /refresh-token`<br>`POST /logout`<br>`GET /me`<br>`PATCH /profile` | Public & Protected (`Bearer <token>`) |
| **`businessProfile`**| Merchant and host profile details, legal business verification (`einNumber` vs. license images), and Stripe Connect account linkage. | Linked via `auth` & `payment` | Integrated directly into host registration and profile queries | `HOST`, `BUSINESS`, `ADMIN` |
| **`category`** | Parent categories and subcategories for events, businesses, and platform discovery. | `/api/categories` | `POST /`<br>`GET /`<br>`GET /:id`<br>`PATCH /:id`<br>`DELETE /:id` | Read: Public<br>Mutations: `ADMIN` |
| **`employee`** | Employer-created subordinate employee accounts with ticket scanning and order verification privileges. | `/api/employees` | `POST /`<br>`GET /`<br>`GET /:id`<br>`PATCH /:id`<br>`DELETE /:id` | Protected: `HOST`, `BUSINESS` |
| **`event`** | Creation (max 30/month limit), update, delete (with S3 cleanup), ticket tiers, 50km radius spherical queries, seed-based deterministic random pagination, ticket sales aggregation. | `/api/events` | `POST /`<br>`GET /`<br>`GET /admin`<br>`GET /:id`<br>`PATCH /:id`<br>`DELETE /:id` | Read/Detail: Protected<br>Create/Edit: `HOST`, `BUSINESS`<br>Admin: `ADMIN` |
| **`eventOrder`** | Ticket orders, check-in QR codes, attendee tracking, my-orders query, and 10-minute cutoff cancellation. | `/api/event-orders` | `GET /my-orders`<br>`GET /:id`<br>`POST /:orderId/cancel` | Protected (`Bearer <token>`) |
| **`marketplace`**| Products and services catalog, pricing in fiat and loyalty points, inventory stock, business listings. | `/api/marketplaces` | `POST /`<br>`GET /`<br>`GET /my-marketplaces`<br>`GET /:id`<br>`PATCH /:id`<br>`DELETE /:id` | Read: Public<br>Mutations: `BUSINESS` |
| **`order`** | Orders placed on the marketplace, points deduction, shipping address, fulfillment lifecycle, and tracking. | `/api/orders` | `POST /`<br>`GET /my-orders`<br>`GET /:id` | Protected: `USER`, `ADMIN` |
| **`otp`** | Generates, sends, and verifies short-lived OTP codes (TTL index) for email verification and password resets. | Internal service helper | `generateOTP`, `sendOTP`, `verifyOTP` | Internal module used by `auth` |
| **`payment`** | Stripe Connect host onboarding, dashboard login links, webhooks, checkout sessions, refund processing, automated payout sweeper. | `/api/payments` | `POST /webhook`<br>`POST /create-checkout-session`<br>`POST /create-connect-account`<br>`GET /account-status`<br>`POST /create-login-link`<br>`POST /events/:eventId/payout`<br>`POST /process-payouts`<br>`GET /events/:eventId/payout-status`<br>`POST /event-orders/:orderId/cancel` | Public (Webhook with signature)<br>Protected (`HOST`, `BUSINESS`, `ADMIN`) |
| **`rewardCategory`** | Promotional and loyalty reward program categories. | `/api/reward-categories` | `POST /`<br>`GET /`<br>`GET /:id`<br>`PATCH /:id`<br>`DELETE /:id` | Read: Public<br>Mutations: `ADMIN` |
| **`rewardSubCategory`**| Granular sub-classifications for promotional loyalty rewards. | `/api/reward-subcategories` | `POST /`<br>`GET /`<br>`GET /:id`<br>`PATCH /:id`<br>`DELETE /:id` | Read: Public<br>Mutations: `ADMIN` |
| **`user`** | Administrative user management, platform analytics/stats, account suspension, role changes, and deletion. | `/api/users` | `GET /stats`<br>`GET /`<br>`GET /:id`<br>`PATCH /:id/status`<br>`PATCH /:id/role`<br>`DELETE /:id` | Protected: `ADMIN` |
| **`content`** | Legal & Static Content CMS (Terms of Service, Privacy Policy, About Us, FAQ, custom pages, rich HTML/Markdown, slug upsert, category groupings). | `/api/contents` | `GET /`<br>`GET /:idOrSlug`<br>`POST /`<br>`PUT /upsert/:slug`<br>`PATCH /:idOrSlug`<br>`PATCH /:idOrSlug/status`<br>`DELETE /:idOrSlug` | Read: Public<br>Mutations: `ADMIN` |


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
├── <moduleName>.route.ts       # Express router definitions and middleware chaining
└── README.md                   # Dedicated module architecture, schema, and API documentation
```

### Layer Responsibilities & Strict Boundaries:

1. **`interface.ts`**:
   - Defines pure TypeScript interfaces for the data model, DTOs (Data Transfer Objects), and query parameters.
   - Types are inferred from Zod schemas (`z.infer<typeof schema>`) or defined directly as Mongoose document extensions (`extends Document`).
   - Must contain zero executable runtime logic.

2. **`model.ts`**:
   - Builds the Mongoose schema with appropriate indexes, timestamps, field defaults, and validations.
   - Exports the Mongoose model typed with the module's document interface.
   - Defines compound indexes (e.g. `{ hostId: 1, createdAt: -1 }` on `Event`).

3. **`validation.ts`**:
   - Exports Zod validation schemas for `body`, `query`, and `params`.
   - Contains custom refinements (e.g. date validations, password confirmations, EIN/license conditional checks).
   - Used by `validateRequest` middleware before requests reach the controller.

4. **`service.ts`**:
   - Contains all domain business logic, data transformations, external integrations (Stripe, S3), and database queries.
   - **Architectural Rule**: Services must **never** accept or touch Express `req` or `res` objects. All required inputs must be passed as plain typed arguments.
   - Throws `AppError` instances for operational failures (e.g., `404 Not Found`, `400 Bad Request`, `403 Forbidden`).

5. **`controller.ts`**:
   - Extracts data from `req.body`, `req.query`, `req.params`, `req.files`, and authenticated user `req.user`.
   - Delegates execution to the corresponding method in `<moduleName>.service.ts`.
   - Uses `sendResponse` to format outgoing JSON responses.
   - Wrapped inside `catchAsync` to forward unhandled rejections to the global error handler.
   - **Architectural Rule**: Controllers must **never** execute raw database queries (`Model.find()`, `Model.create()`, etc.).

6. **`route.ts`**:
   - Instantiates an `express.Router()`.
   - Assembles middleware chains in exact execution order:
     `protect` ➔ `authorizeRoles(...)` ➔ Multer file parser (if applicable) ➔ `validateRequest(...)` ➔ Controller handler.
   - Dispatches requests to the appropriate controller method.

7. **`README.md`**:
   - Comprehensive module guide documenting domain overview, file roles, Mongoose data schema, complete API endpoint tables, business rules, and sequence diagrams.
   - **Architectural Rule**: Whenever an agent or developer modifies any code within a module (`route`, `controller`, `service`, `model`, `validation`, `interface`), they **MUST immediately update that module's `README.md`** so the documentation never becomes obsolete.

---

## 5. Core Infrastructure & Cross-Cutting Concerns

### 5.1 Logging System
- **File**: `src/utils/logger.ts`
- Built on **Winston** using standard log levels (`error`, `warn`, `info`, `http`, `debug`).
- **Console Transport**: Outputs colorized, human-readable entries with timestamps and full error stack traces during development.
- **File Transports**: Automatically creates and maintains log files in `logs/`:
  - `logs/error.log`: Records all error-level logs (5MB max size, 5 rotated backup files).
  - `logs/combined.log`: Records all log levels including HTTP requests and info messages (10MB max size, 5 rotated backup files).
- **HTTP Request Logger (`src/middlewares/requestLogger.ts`)**: Intercepts every inbound HTTP request and logs method, URL path, response status, duration in milliseconds, and client IP.

### 5.2 Error Handling Architecture
- **`AppError` (`src/utils/AppError.ts`)**: Operational error class holding an HTTP status code (e.g. 400, 401, 403, 404, 500), error message, and operational flag.
- **`errorHandler` (`src/middlewares/errorHandler.ts`)**: The terminal Express middleware that intercepts all errors passed to `next(err)`.
  - Captures and logs the error with full stack trace and request metadata via `logger.error`.
  - Formats a clean JSON response: `{ success: false, message, stack?: string }` (stack trace included only in development).

### 5.3 Response Standardization
- **`sendResponse` (`src/utils/sendResponse.ts`)**:
  Ensures every successful API response adheres to a predictable structure:
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Resource fetched successfully",
    "meta": {
      "page": 1,
      "limit": 10,
      "total": 45,
      "totalPage": 5
    },
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

### 5.6 File Storage & S3 Asset Management
- **`multer.middleware.ts`**: Handles multipart form submissions in memory (`multer.memoryStorage()`) with file size limits (5MB) and image MIME type filtering.
- **`s3.ts` & `s3.config.ts`**: Uses AWS S3 SDK v3 to upload buffers and delete old assets.
- **Orphan Asset Cleanup**: When an event, product, or user profile is updated or deleted, replaced or removed S3 asset URLs are automatically deleted via `deleteFromS3` to prevent storage leakage.

### 5.7 OpenAPI / Swagger Documentation
- **File**: `src/docs/swagger.ts`
- Modular documentation: each module defines its OpenAPI endpoints inside `src/docs/<moduleName>.docs.ts`.
- All module specs are combined in `swagger.ts` and served at:
  - `/api-docs` (interactive UI)
  - `/api-docs.json` (raw OpenAPI JSON spec)

---

## 6. Key Domain Business Rules

### 6.1 Host Event Creation Limit (Monthly Quota)
- Hosts are restricted to creating a maximum of **30 events per calendar month**.
- Enforced in `event.service.ts`:
  ```typescript
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const monthlyEventCount = await Event.countDocuments({
    hostId,
    createdAt: { $gte: startOfMonth, $lte: endOfMonth },
  });
  if (monthlyEventCount >= 30) {
    throw new AppError('Monthly limit reached. You cannot create more than 30 events in a single month.', 400);
  }
  ```

### 6.2 Event Subcategory Validation & Model Storage
- When creating or updating an event, hosts must supply `subCategoryId` (or `categoryId`).
- The service verifies that the ID references a valid subcategory in the `Category` collection (`parentCategory != null`).
- The MongoDB model stores this reference in `Event.categoryId`.

### 6.3 50km Spherical Radius Geo-Filtering
- Clients can query events near their location by supplying `latitude` and `longitude`.
- **Pre-filtering**: MongoDB bounding box calculation (`deltaLat = 50 / 111`, `deltaLon = 50 / (111 * cos(lat))`) prunes candidate events.
- **Exact Spherical Distance**: Evaluated via the Haversine formula (`R = 6371 km`) to ensure exact 50km distance compliance.

### 6.4 Deterministic Pseudo-Random Seeded Pagination
- Events are served in a pseudo-random order per user/session based on a `seed` or `userId`.
- Uses a deterministic hash score (`getSeedHash`), ensuring events do not shift, repeat, or vanish across paginated views (`page=1`, `page=2`).
- Page limits are capped at a maximum of 20 items per page.

### 6.5 Dynamic Ticket Sales Aggregation (`ticketsSold`)
- In `getAllEventsService`, `getEventByIdService`, and `getAdminEventsService`, real-time ticket sales are computed dynamically using MongoDB aggregation on `EventOrder`:
  ```typescript
  EventOrder.aggregate([
    { $match: { eventId: { $in: eventIds }, status: { $ne: 'CANCELLED' } } },
    { $group: { _id: '$eventId', totalSold: { $sum: '$totalTicketQuantity' } } }
  ]);
  ```
- The aggregated count is attached as `ticketsSold` in the returned event objects.

### 6.6 Event Ticket Order Cancellation & Automated Refund
- **10-Minute Cutoff Constraint**: Users can cancel ticket orders strictly **up to 10 minutes prior to `event.startDate`**.
- **Stripe Refund**: Executes `stripe.refunds.create({ payment_intent: paymentIntentId })`.
- **Inventory & Points Reversal**: Automatically restores ticket seat stock in `event.priceCategories` and deducts earned loyalty points (`user.totalPoints -= order.pointsEarned`).

### 6.7 Host Registration: EIN vs. Business License
- When registering as `HOST` or `BUSINESS`, user must provide:
  - `businessName`, `businessDescription`, `location`, `govtIdFrontImage`, and `govtIdBackImage`.
  - **EITHER** `einNumber` **OR** both `businessLicenseFrontImage` and `businessLicenseBackImage`.

### 6.8 Stripe Connect & Automated Host Payouts
- Hosts connect bank accounts via Stripe Express Connect onboarding (`POST /api/payments/create-connect-account`).
- Stripe webhooks sync verification status (`isStripeVerified`, `stripePayoutsEnabled`).
- Platform fee: **$0.99 per ticket sold** is retained by the platform.
- When an event ends (`endDate <= new Date()`), the payout sweeper transfers net revenue (`totalRevenue - platformFee`) directly to the host's Stripe account via `stripe.transfers.create()`.

---

## 7. Coding Standards & Architectural Invariants

### 1. ECMAScript Modules (ESM) Import Extension Rule
Because the project runs native ESM (`"type": "module"` with `"module": "nodenext"`), **all relative local imports must explicitly include the `.js` extension**:
```typescript
// CORRECT
import logger from './utils/logger.js';
import { connectDB } from './config/db.js';
import { Event } from './modules/event/event.model.js';

// INCORRECT (Triggers runtime ERR_MODULE_NOT_FOUND)
import logger from './utils/logger';
import { connectDB } from './config/db';
```

### 2. Type-Only Imports Enforced
The project enforces `"verbatimModuleSyntax": true`. TypeScript type imports must explicitly use `import type`:
```typescript
// CORRECT
import type { Request, Response, NextFunction } from 'express';
import type { IEvent } from './event.interface.js';

// INCORRECT
import { Request, Response, NextFunction } from 'express';
```

### 3. Separation of Concerns
- **Controllers** only handle HTTP extraction, validation triggering, service invocation, and response dispatch. Controllers **never** interact directly with Mongoose models.
- **Services** only handle domain business logic, data persistence, and external APIs. Services **never** import or interact with `Request` or `Response` objects.
- **Operational Errors**: Always throw `AppError(message, statusCode)`. Do not use bare `throw new Error(...)`.

### 4. Logging Rules
- **Never** use `console.log`, `console.error`, or `console.warn` in backend application code.
- Always use `logger` from `src/utils/logger.js` (`logger.info`, `logger.warn`, `logger.error`, `logger.http`).

### 5. Verification Before Delivery
- Any code edit or feature addition must be verified by running `npx tsc --noEmit` to guarantee zero type errors.

---

## 8. Adding a New Feature Module (Step-by-Step Checklist)

When creating a new feature module (e.g., `notification`):

1. **Create Module Directory**: `src/modules/notification/`
2. **Interface (`notification.interface.ts`)**: Define TypeScript types, DTOs, and Mongoose document interfaces.
3. **Model (`notification.model.ts`)**: Build schema, define necessary compound indexes, and export Mongoose model.
4. **Validation (`notification.validation.ts`)**: Create Zod schemas for request `body`, `query`, and `params`.
5. **Service (`notification.service.ts`)**: Implement business logic, database queries, and throw `AppError` on failures.
6. **Controller (`notification.controller.ts`)**: Wrap handler methods in `catchAsync`, call service, and send responses via `sendResponse`.
7. **Route (`notification.route.ts`)**: Setup router, chain middlewares (`protect`, `authorizeRoles`, `validateRequest`), and attach controllers.
8. **Mount in App (`src/app.ts`)**: Register router (`app.use('/api/notifications', notificationRoutes);`).
9. **Swagger Documentation (`src/docs/notification.docs.ts`)**: Define OpenAPI path specs and register in `src/docs/swagger.ts`.
10. **Typecheck & Test**: Run `npx tsc --noEmit` and verify endpoints in Swagger UI (`/api-docs`).
