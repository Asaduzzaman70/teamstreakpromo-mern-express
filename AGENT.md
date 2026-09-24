# Project Documentation & Architecture Guide

## Overview
`teamstreakpromo-express` is a backend REST API built using **Node.js**, **Express 5.x**, **TypeScript 5.7.x**, and **MongoDB (Mongoose 9.x)**. It implements an enterprise architecture with controller-service layer separation, runtime request payload validation using **Zod**, OpenAPI/Swagger UI documentation via **swagger-ui-express**, Stripe Connect payout automation, AWS S3 asset management, and strict TypeScript typing.

---

## Directory & File Structure

```text
teamstreakpromo-mern-express/
├── .agents/                          # Workspace agent customizations and rules
│   └── rules/                        # Agent rule definitions
│       ├── agent-rules.md            # Agent operational & coding behavior rules
│       ├── code-structure.md         # Code architecture & layering standards
│       └── folder-structure.md       # Folder hierarchy & file placement rules
├── .env                              # Environment variables configuration
├── .env.example                      # Template for environment variables
├── .gitignore                        # Git ignore rules
├── AGENT.md                          # AI and developer architectural guide (this file)
├── AGENTS.md                         # Hierarchical workspace agent rules entrypoint
├── CODE_STRUCTURE.md                 # System structure and architectural guidelines
├── package.json                      # Dependencies and scripts setup
├── tsconfig.json                     # TypeScript compiler options
├── vercel.json                       # Serverless deployment configuration
├── logs/                             # Application logs (error.log, combined.log)
└── src/                              # Application source code
    ├── app.ts                        # Express application initialization & middleware setup
    ├── server.ts                     # Server entry point, DB trigger, & payout scheduler
    ├── config/                       # Centralized configuration files
    │   ├── config.ts                 # Centralized configuration object & env loader
    │   ├── db.ts                     # MongoDB connection manager (cached promise)
    │   └── s3.config.ts              # AWS S3 client configuration
    ├── docs/                         # OpenAPI 3.0 specifications
    │   ├── auth.docs.ts              # Swagger specs for Authentication endpoints
    │   ├── category.docs.ts          # Swagger specs for Category endpoints
    │   ├── employee.docs.ts          # Swagger specs for Employee endpoints
    │   ├── event.docs.ts             # Swagger specs for Event endpoints
    │   ├── eventOrder.docs.ts        # Swagger specs for Event Order / Ticket endpoints
    │   ├── marketplace.docs.ts       # Swagger specs for Marketplace endpoints
    │   ├── order.docs.ts             # Swagger specs for Marketplace Order endpoints
    │   ├── payment.docs.ts           # Swagger specs for Stripe & Payout endpoints
    │   ├── rewardCategory.docs.ts    # Swagger specs for Reward Category endpoints
    │   ├── rewardSubCategory.docs.ts # Swagger specs for Reward SubCategory endpoints
    │   └── swagger.ts                # Main Swagger setup & specification entrypoint
    ├── middlewares/                  # Express custom global middlewares
    │   ├── authMiddleware.ts         # JWT Authentication (`protect`) & RBAC (`authorizeRoles`)
    │   ├── errorHandler.ts           # Global error handling middleware (Winston logged)
    │   ├── multer.middleware.ts      # Multer file upload memory storage & filter helpers
    │   ├── requestLogger.ts          # Request timing and HTTP audit logger
    │   └── validation.middleware.ts  # Zod request validation middleware (body/query/params)
    ├── modules/                      # 12 Domain Feature Modules
    │   ├── auth/                     # Authentication, users, profiles, OTP verification
    │   ├── businessProfile/          # Merchant profiles, EIN verification, Stripe linkage
    │   ├── category/                 # Event and business categories & subcategories
    │   ├── employee/                 # Employer subordinate accounts & privileges
    │   ├── event/                    # Events, ticket tiers, venues, geo-radius queries
    │   ├── eventOrder/               # Event ticket purchases, check-in, refunds
    │   ├── marketplace/              # Marketplace catalog, products, pricing, stock
    │   ├── order/                    # Marketplace product orders & delivery tracking
    │   ├── otp/                      # OTP generation, delivery, and TTL validation
    │   ├── payment/                  # Stripe Connect onboarding, webhooks, payouts
    │   ├── rewardCategory/           # Loyalty reward program categories
    │   └── rewardSubCategory/        # Loyalty reward sub-classifications
    └── utils/                        # Application utilities & helpers
        ├── AppError.ts               # Custom operational error class
        ├── catchAsync.ts             # Async error handler wrapper for Express route handlers
        ├── logger.ts                 # Winston logging setup (console + file rotation)
        ├── s3.ts                     # AWS S3 upload and deletion helpers
        ├── sendEmail.ts              # Email delivery helper (Nodemailer)
        └── sendResponse.ts           # Standardized API response formatter
```

---

## API Documentation & Endpoints

Interactive Swagger UI documentation is available when running the application server:
- **Swagger UI Interactive Documentation**: `http://localhost:3000/api-docs`
- **OpenAPI JSON Spec**: `http://localhost:3000/api-docs.json`

### Complete Endpoints Overview Table

| Method | Endpoint | Description | Auth Required / Roles |
| :--- | :--- | :--- | :--- |
| **Auth Module** | | | |
| `POST` | `/api/auth/register` | Register a new user (`USER`, `HOST`, `BUSINESS`) with image uploads | Public |
| `POST` | `/api/auth/verify-register-otp` | Verify 6-digit OTP to activate newly registered account | Public |
| `POST` | `/api/auth/verify-account` | Alias for account activation OTP verification | Public |
| `POST` | `/api/auth/resend-activation-otp` | Resend account activation OTP | Public |
| `POST` | `/api/auth/resend-forgot-password-otp` | Resend password reset OTP | Public |
| `POST` | `/api/auth/login` | Login user & issue JWT Access and Refresh tokens | Public |
| `POST` | `/api/auth/forgot-password` | Request password reset OTP via email | Public |
| `POST` | `/api/auth/verify-forgot-password-otp`| Verify password reset OTP code | Public |
| `POST` | `/api/auth/verify-otp` | General OTP verification endpoint | Public |
| `POST` | `/api/auth/reset-password` | Reset password using verified OTP | Public |
| `POST` | `/api/auth/change-password` | Change account password while logged in | Yes (`Bearer <token>`) |
| `POST` | `/api/auth/refresh-token` | Exchange refresh token for new access token | Public |
| `POST` | `/api/auth/logout` | Invalidate user session | Yes (`Bearer <token>`) |
| `GET` | `/api/auth/me` | Get logged-in user profile details | Yes (`Bearer <token>`) |
| `PATCH` | `/api/auth/me` | Update logged-in user profile & avatar | Yes (`Bearer <token>`) |
| `PATCH` | `/api/auth/profile` | Update profile (alias) | Yes (`Bearer <token>`) |
| `PUT` | `/api/auth/profile` | Update profile (full update) | Yes (`Bearer <token>`) |
| **Category Module** | | | |
| `POST` | `/api/categories` | Create main category or subcategory | Yes (`ADMIN`) |
| `GET` | `/api/categories` | Fetch all active categories & nested subcategories | Public |
| `GET` | `/api/categories/:id` | Fetch category details by ID | Public |
| `PATCH` | `/api/categories/:id` | Update category details | Yes (`ADMIN`) |
| `DELETE` | `/api/categories/:id` | Delete category | Yes (`ADMIN`) |
| **Employee Module** | | | |
| `POST` | `/api/employees` | Create subordinate employee account | Yes (`HOST`, `BUSINESS`) |
| `GET` | `/api/employees` | Fetch all employees belonging to authenticated employer | Yes (`HOST`, `BUSINESS`) |
| `GET` | `/api/employees/:id` | Get employee details by ID | Yes (`HOST`, `BUSINESS`) |
| `PATCH` | `/api/employees/:id` | Update employee information & status | Yes (`HOST`, `BUSINESS`) |
| `DELETE` | `/api/employees/:id` | Remove employee account | Yes (`HOST`, `BUSINESS`) |
| **Event Module** | | | |
| `POST` | `/api/events` | Create new event (enforces 30/month limit, S3 uploads) | Yes (`HOST`, `BUSINESS`) |
| `GET` | `/api/events` | Query events (50km radius, seeded random pagination, ticketsSold) | Yes (`Bearer <token>`) |
| `GET` | `/api/events/admin` | Admin query for all events with pagination & ticketsSold | Yes (`ADMIN`) |
| `GET` | `/api/events/:id` | Get single event details with dynamic `ticketsSold` count | Yes (`Bearer <token>`) |
| `PATCH` | `/api/events/:id` | Update event details (cleans replaced S3 images) | Yes (`HOST`, `BUSINESS`) |
| `PUT` | `/api/events/:id` | Full update event details | Yes (`HOST`, `BUSINESS`) |
| `DELETE` | `/api/events/:id` | Delete event and cleanup all S3 images | Yes (`HOST`, `BUSINESS`, `ADMIN`) |
| **Event Order Module** | | | |
| `GET` | `/api/event-orders/my-orders` | Fetch logged-in user's event ticket purchase orders | Yes (`Bearer <token>`) |
| `GET` | `/api/event-orders/:id` | Fetch specific ticket order details | Yes (`Bearer <token>`) |
| `POST` | `/api/event-orders/:orderId/cancel`| Cancel ticket order & issue full refund (10-min cutoff) | Yes (`Bearer <token>`) |
| **Marketplace Module** | | | |
| `POST` | `/api/marketplaces` | Create new marketplace product listing with images | Yes (`BUSINESS`) |
| `GET` | `/api/marketplaces` | Query all marketplace listings (filtering & pagination) | Public |
| `GET` | `/api/marketplaces/my-marketplaces`| Fetch listings created by authenticated business | Yes (`BUSINESS`) |
| `GET` | `/api/marketplaces/:id` | Fetch marketplace item details by ID | Public |
| `PATCH` | `/api/marketplaces/:id` | Update marketplace item details and images | Yes (`BUSINESS`) |
| `DELETE` | `/api/marketplaces/:id` | Delete marketplace item and cleanup S3 assets | Yes (`BUSINESS`) |
| **Order Module** | | | |
| `POST` | `/api/orders` | Place marketplace product order using loyalty points | Yes (`USER`) |
| `GET` | `/api/orders/my-orders` | Fetch marketplace orders placed by current user | Yes (`USER`) |
| `GET` | `/api/orders/:id` | Get marketplace order by ID | Yes (`USER`, `ADMIN`) |
| **Payment & Stripe Module** | | | |
| `POST` | `/api/payments/webhook` | Stripe webhook listener (cryptographic rawBody verification) | Public (Stripe Signature) |
| `POST` | `/api/payments/create-checkout-session`| Create Stripe Checkout Session for event ticket purchase | Yes (`Bearer <token>`) |
| `POST` | `/api/payments/create-connect-account` | Provision Stripe Connect Express account & onboarding link | Yes (`HOST`, `BUSINESS`, `ADMIN`) |
| `GET` | `/api/payments/account-status` | Check host Stripe Connect verification & payout status | Yes (`HOST`, `BUSINESS`, `ADMIN`) |
| `POST` | `/api/payments/create-login-link` | Generate Stripe Express Dashboard login link | Yes (`HOST`, `BUSINESS`, `ADMIN`) |
| `POST` | `/api/payments/events/:eventId/payout` | Trigger payout transfer for an ended event | Yes (`HOST`, `BUSINESS`, `ADMIN`) |
| `POST` | `/api/payments/process-payouts` | Sweep and process payouts for all completed ended events | Yes (`ADMIN`) |
| `GET` | `/api/payments/events/:eventId/payout-status` | Get payout breakdown and status for an event | Yes (`HOST`, `BUSINESS`, `ADMIN`) |
| `POST` | `/api/payments/event-orders/:orderId/cancel` | Cancel ticket order & issue full Stripe refund | Yes (`Bearer <token>`) |
| **Reward Category Module** | | | |
| `POST` | `/api/reward-categories` | Create new promotional reward category | Yes (`ADMIN`) |
| `GET` | `/api/reward-categories` | Fetch all active reward categories | Public |
| `GET` | `/api/reward-categories/:id` | Fetch reward category details by ID | Public |
| `PATCH` | `/api/reward-categories/:id` | Update reward category | Yes (`ADMIN`) |
| `DELETE` | `/api/reward-categories/:id` | Delete reward category | Yes (`ADMIN`) |
| **Reward SubCategory Module** | | | |
| `POST` | `/api/reward-subcategories` | Create promotional reward subcategory | Yes (`ADMIN`) |
| `GET` | `/api/reward-subcategories` | Fetch all reward subcategories | Public |
| `GET` | `/api/reward-subcategories/:id` | Fetch reward subcategory by ID | Public |
| `PATCH` | `/api/reward-subcategories/:id` | Update reward subcategory | Yes (`ADMIN`) |
| `DELETE` | `/api/reward-subcategories/:id` | Delete reward subcategory | Yes (`ADMIN`) |

---

## Key Architecture & Modular Responsibilities

The application follows a **Modular Feature Architecture**. Each feature module is self-contained within `src/modules/<module_name>/` and adheres strictly to layer separation:

### 1. Controllers (`<module_name>.controller.ts`)
- Handles incoming HTTP requests (`req`) and formulates responses (`res`).
- Extracts parameters, body, query, and user credentials.
- Delegates business operations to `<module_name>.service.ts`.
- Uses `sendResponse` for consistent JSON serialization.
- Wrapped in `catchAsync` to forward unhandled errors to the global error handler.
- **Rule**: Controllers must never contain database queries (`Model.find()`, `Model.create()`).

### 2. Services (`<module_name>.service.ts`)
- Encapsulates all domain and business logic (e.g., calculations, database operations, token generation).
- Interacts directly with Mongoose models (`<module_name>.model.ts`).
- Throws operational errors (`AppError`) with appropriate HTTP status codes.
- **Rule**: Services must never accept or touch Express `req` or `res` objects.

### 3. Validation (`<module_name>.validation.ts`)
- Uses **Zod** for runtime request payload validation schemas.
- Validates field types, formats, constraints, and custom refinement rules.

### 4. Interfaces (`<module_name>.interface.ts`)
- Defines TypeScript interface contracts and types inferred from Zod schemas (`z.infer<typeof schema>`).
- Defines API response interfaces and payload DTOs.
- Contains zero executable code.

### 5. Models (`<module_name>.model.ts`)
- Mongoose schemas and models defining database structure, indexes, middleware hooks, and instance methods.

### 6. Routes (`<module_name>.route.ts`)
- Defines Express route mappings and attaches middleware (`protect`, `authorizeRoles`, `validateRequest`, `uploadAny`).

### 7. Shared Cross-Cutting Infrastructure
- `src/middlewares/`: Shared global & route Express middlewares:
  - `authMiddleware.ts`: JWT token authentication (`protect`) and role-based access control (`authorizeRoles`).
  - `errorHandler.ts`: Global error handling middleware formatting operational and system error responses.
  - `multer.middleware.ts`: Multer image file upload middleware using memory buffer storage, 5MB limit, and filter helpers.
  - `validation.middleware.ts`: Request validation middleware (`validateRequest`) that validates `body`, `query`, and `params` payloads using Zod schemas.
  - `requestLogger.ts`: Request execution duration and status logger.
- `src/utils/`: Shared utilities (`AppError.ts`, `catchAsync.ts`, `sendResponse.ts`, `s3.ts`, `sendEmail.ts`, `logger.ts`).
- `src/config/`: Application configuration & cached DB connection manager.
- `src/docs/`: OpenAPI / Swagger UI setup and modular section docs.

---

## Domain Rules & Guidelines

### Event Creation & Monthly Quota
- **Monthly Limit**: A host may create a maximum of **30 events per calendar month**. Enforced via `Event.countDocuments({ hostId, createdAt: { $gte: startOfMonth, $lte: endOfMonth } })`.
- **Subcategory Requirement**: When creating or updating an event, hosts must provide `subCategoryId`. The service layer validates that the provided ID exists in `Category` and is a valid subcategory (`parentCategory` is not null).
- **Database Schema**: The database model (`Event`) stores the subcategory reference in the `categoryId` field.
- **Reward Multi-Image Support**: Each event reward supports uploading and storing multiple images (stored in `images: string[]`).
- **Artist Image Support**: Profile image files uploaded for artists via `artistImages` are uploaded to AWS S3 and saved in `artist.image`.
- **S3 File Cleanup**: Replaced or deleted image URLs (event main images, artist images, reward images) are automatically purged from AWS S3 via `deleteFromS3`.

### Event Listing & Dynamic Aggregations
- **Active Events by Default**: `GET /api/events` excludes expired events (`endDate > new Date()`) unless `past=true`, `isEnded=true`, or `status=ENDED` or `ALL` is requested.
- **50km Radius Location Filtering**: When clients supply `latitude` and `longitude`, MongoDB bounding box pre-filtering followed by Haversine formula calculation restricts results to within 50 km spherical radius.
- **Per-User Seeded Random Ordering**: Events are ordered using a deterministic hash score (`getSeedHash`) based on `seed` or `userId`. This ensures consistent pagination across pages without duplicate or missing items.
- **Real-Time `ticketsSold`**: `ticketsSold` is dynamically calculated across all events using MongoDB aggregation on non-cancelled `EventOrder` documents.

### Event Ticket Order Cancellation & Refund Rules
- **10-Minute Cutoff Constraint**: Users can cancel paid ticket orders strictly **up to 10 minutes prior to `event.startDate`**. If `Date.now() > event.startDate - 10 minutes`, cancellation is rejected (`400 Bad Request`).
- **Stripe Refund**: Invokes `stripe.refunds.create({ payment_intent: paymentIntentId })` via the associated Stripe Checkout Session to issue a full monetary refund.
- **Inventory Restoration & Points Reversal**: Automatically restores ticket seat stock in `event.priceCategories` and deducts the reward points earned (`user.totalPoints -= order.pointsEarned`).

### Business Profile & Host Registration Rules
- **Host / Business Verification**: When registering with role `HOST` or `BUSINESS`, `businessName`, `businessDescription`, `location`, `govtIdFrontImage`, and `govtIdBackImage` are required.
- **Conditional EIN vs. License Images**: User must provide **EITHER** `einNumber` **OR** both `businessLicenseFrontImage` and `businessLicenseBackImage`.

### Stripe Connect Host Bank Account & Payouts Rules
- **Host Stripe Connect Account Creation**: Provisioned via `POST /api/payments/create-connect-account` returning a secure Stripe onboarding URL (`stripe.accountLinks.create`).
- **Webhook Synchronization**: `account.updated` and `checkout.session.completed` webhooks at `POST /api/payments/webhook` cryptographically update business profile verification status and finalize orders.
- **Platform Fee Calculation**: The platform retains **$0.99 per ticket sold** as a platform fee (`totalTicketQuantity * 0.99`). Net host payout equals `Total Revenue - Platform Fee`.
- **Automated Event Payouts**: When an event ends (`endDate <= new Date()`), the background payout scheduler (`payout.scheduler.ts`) automatically sweeps and initiates Stripe transfers (`stripe.transfers.create()`) to the host's connected bank account.

---

## Domain Class Diagram

```mermaid
classDiagram
direction TB
    class UserRole {
        <<enumeration>>
        USER
        HOST
        BUSINESS
        ADMIN
    }

    class EmployerType {
        <<enumeration>>
        HOST
        BUSINESS
    }

    class EventOrderStatus {
        <<enumeration>>
        PENDING
        PAID
        CANCELLED
        COMPLETED
    }

    class VerificationStatus {
        <<enumeration>>
        PENDING
        APPROVED
        REJECTED
    }

    class MarketplaceStatus {
        <<enumeration>>
        ACTIVE
        INACTIVE
    }

    class User {
        +ObjectId _id
        +string name
        +string email
        +string password
        +UserRole role
        +string profileImage
        +boolean isVerified
        +boolean isActive
        +int totalPoints
        +double walletBalance
    }

    class BusinessProfile {
        +ObjectId _id
        +ObjectId userId
        +string businessName
        +string businessDescription
        +string einNumber
        +string location
        +string govtIdFrontImage
        +string govtIdBackImage
        +string businessLicenseFrontImage
        +string businessLicenseBackImage
        +VerificationStatus verificationStatus
        +string stripeAccountId
        +string stripeAccountStatus
        +boolean isStripeConnected
        +boolean isStripeVerified
        +boolean stripePayoutsEnabled
    }

    class Category {
        +ObjectId _id
        +string name
        +string description
        +ObjectId parentCategory
        +boolean isActive
    }

    class Employee {
        +ObjectId _id
        +string name
        +string email
        +string password
        +ObjectId employerId
        +EmployerType employerType
        +boolean isActive
    }

    class Event {
        +ObjectId _id
        +ObjectId hostId
        +ObjectId categoryId
        +string title
        +string description
        +string placeName
        +double latitude
        +double longitude
        +int ageRestriction
        +date startDate
        +date endDate
        +array images
        +array artistInfo
        +array priceCategories
        +array rewards
        +string status
        +boolean isPaidOut
        +int ticketsSold
    }

    class EventOrder {
        +ObjectId _id
        +ObjectId userId
        +ObjectId eventId
        +array tickets
        +int totalTicketQuantity
        +double totalPrice
        +double platformFee
        +double netAmount
        +int pointsEarned
        +string referralCode
        +EventOrderStatus status
        +string stripeSessionId
        +string stripePaymentIntentId
        +boolean isRefunded
        +boolean isScanned
    }

    class Marketplace {
        +ObjectId _id
        +ObjectId businessId
        +ObjectId categoryId
        +string title
        +string description
        +double price
        +int pointPrice
        +int stock
        +array images
        +MarketplaceStatus status
    }

    class Order {
        +ObjectId _id
        +ObjectId userId
        +array items
        +double totalAmount
        +int totalPointsSpent
        +string shippingAddress
        +string status
        +string deliveryCode
    }

    class OTP {
        +ObjectId _id
        +string email
        +string otp
        +string type
        +date expiresAt
        +boolean isUsed
    }

    class RewardCategory {
        +ObjectId _id
        +string name
        +string description
        +boolean isActive
    }

    class RewardSubCategory {
        +ObjectId _id
        +string name
        +string description
        +ObjectId categoryId
        +boolean isActive
    }

    User --> UserRole : has_role
    Employee --> EmployerType : belongs_to_type
    EventOrder --> EventOrderStatus : tracks_status
    BusinessProfile --> VerificationStatus : verification_state
    Marketplace --> MarketplaceStatus : listing_status

    User "1" --> "0..1" BusinessProfile : has_profile
    User "1" --> "0..*" Event : creates
    User "1" --> "0..*" Employee : hires
    User "1" --> "0..*" Marketplace : lists_products
    Event "1" --> "0..*" EventOrder : receives_orders
    User "1" --> "0..*" EventOrder : purchases_tickets
    User "1" --> "0..*" Order : places_orders
    Category "0..1" <-- "0..*" Category : parent_of
    Category "1" <-- "0..*" Event : classifies
    Category "1" <-- "0..*" Marketplace : categorizes
    RewardCategory "1" <-- "0..*" RewardSubCategory : groups