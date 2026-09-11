# Project Documentation & Architecture Guide

## Overview
`teamstreakpromo-express` is a backend REST API built using **Node.js**, **Express**, **TypeScript**, and **MongoDB (Mongoose)**. It implements an architecture with controller-service layer separation, runtime payload validation using **Zod**, OpenAPI/Swagger UI documentation via **swagger-ui-express**, and strong TypeScript typing.

---

## Directory & File Structure

```text
teamstreakpromo-mern-express/
├── .env                       # Environment variables configuration
├── .env.example               # Template for environment variables
├── .gitignore                 # Git ignore rules
├── AGENT.md                   # Agent and project architectural guide
├── package.json               # Dependencies and scripts setup
├── tsconfig.json              # TypeScript compiler options
└── src/                       # Application source code
    ├── app.ts                 # Express application initialization & middleware setup
    ├── server.ts              # Server entry point & database connection trigger
    ├── config/                # Environment and configuration files
    │   ├── config.ts          # Centralized configuration object
    │   └── db.ts              # MongoDB database connection helper
    ├── docs/                  # API Documentation & OpenAPI Specifications
    │   ├── auth.docs.ts       # Swagger OpenAPI paths for Authentication API
    │   ├── category.docs.ts   # Swagger OpenAPI paths for Category API
    │   ├── employee.docs.ts   # Swagger OpenAPI paths for Employee API
    │   ├── event.docs.ts      # Swagger OpenAPI paths for Event API
    │   └── swagger.ts         # Main Swagger setup & specification entrypoint
    ├── middlewares/           # Express custom global middlewares
    │   ├── authMiddleware.ts  # JWT Authentication & Request protection middleware
    │   ├── errorHandler.ts    # Global error handling middleware
    │   ├── multer.middleware.ts      # Multer file upload middleware & memory storage helpers
    │   └── validation.middleware.ts  # Express request validation middleware (Zod body/query/params)
    ├── modules/               # Feature modules
    │   └── <module_name>/     # Feature module directory (e.g., auth, user, etc.)
    │       ├── <module_name>.controller.ts # Request & response handlers
    │       ├── <module_name>.interface.ts  # TypeScript interfaces & inferred types
    │       ├── <module_name>.model.ts      # Mongoose database model & schema
    │       ├── <module_name>.route.ts      # Express route definitions
    │       ├── <module_name>.service.ts    # Domain & business logic
    │       └── <module_name>.validation.ts # Zod payload validation schemas
    └── utils/                 # Application utilities & helpers
        ├── AppError.ts        # Custom operational error class
        ├── catchAsync.ts      # Async error handler wrapper for Express route handlers
        ├── s3.ts              # AWS S3 file upload & deletion helpers
        ├── sendEmail.ts       # Email delivery helper (Nodemailer)
        └── sendResponse.ts    # Standardized API response formatter
```

---

## API Documentation & Endpoints

Interactive Swagger UI documentation is available when running the application server:
- **Swagger UI Interactive Documentation**: `http://localhost:3000/api-docs`
- **OpenAPI JSON Spec**: `http://localhost:3000/api-docs.json`

### Endpoints Overview

| Method | Endpoint | Description | Auth Required |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Register a new user | No |
| `POST` | `/api/auth/login` | Login user & get JWT token | No |
| `POST` | `/api/auth/forgot-password` | Request password reset instructions | No |
| `GET` | `/api/auth/me` | Get logged-in user profile details | Yes (`Bearer <token>`) |
| `POST` | `/api/employees` | Create a new employee for employer | Yes (`HOST`, `BUSINESS`) |
| `GET` | `/api/employees` | Fetch all employees created by employer | Yes (`HOST`, `BUSINESS`) |
| `POST` | `/api/payments/create-connect-account` | Create Stripe Connect account & get onboarding link | Yes (`HOST`, `BUSINESS`) |
| `GET` | `/api/payments/account-status` | Get host Stripe Connect status & verification | Yes (`HOST`, `BUSINESS`) |
| `POST` | `/api/payments/create-login-link` | Generate Stripe Express Dashboard login link | Yes (`HOST`, `BUSINESS`) |
| `POST` | `/api/payments/webhook` | Stripe webhook listener for real-time status synchronization | No (Stripe Signature) |

---

## Key Architecture & Modular Responsibilities

The application follows a **Modular Feature Architecture**. Each feature module is self-contained within `src/modules/<module_name>/` and follows consistent file naming (`<module_name>.<layer>.ts`):

### 1. Controllers (`<module_name>.controller.ts`)
- Handles incoming HTTP requests (`req`) and formulates standard responses (`res`).
- Performs runtime schema validation using Zod schemas from `<module_name>.validation.ts`.
- Delegates business operations to the service layer (`<module_name>.service.ts`).
- Catches errors and forwards them to Express `next(error)`.

### 2. Services (`<module_name>.service.ts`)
- Encapsulates all domain and business logic (e.g., calculations, database operations, token generation).
- Interacts directly with module database models (`<module_name>.model.ts`).
- Throws operational errors (`AppError`) with appropriate HTTP status codes.

### 3. Validation (`<module_name>.validation.ts`)
- Uses **Zod** for runtime request payload validation schemas.
- Validates field types, formats, constraints, and custom refinement rules.

### 4. Interfaces (`<module_name>.interface.ts`)
- Defines TypeScript interface contracts and types inferred from Zod schemas (`z.infer<typeof schema>`).
- Defines API response interfaces and payload DTOs.

### 5. Models (`<module_name>.model.ts`)
- Mongoose schemas and models defining database structure, indexes, middleware hooks, and instance methods.

### 6. Routes (`<module_name>.route.ts`)
- Defines Express route mappings and attaches middleware (e.g., `protect`) and controller handlers.

### 7. Shared Cross-Cutting Modules
- `src/middlewares/`: Shared global & route Express middlewares:
  - `authMiddleware.ts`: JWT token authentication (`protect`) and role-based access control (`authorizeRoles`).
  - `errorHandler.ts`: Global error handling middleware formatting operational and system error responses.
  - `multer.middleware.ts`: Multer image file upload middleware using memory buffer storage, 5MB limit, and filter helpers (`uploadSingle`, `uploadFields`, `uploadArray`, `uploadAny`).
  - `validation.middleware.ts`: Request validation middleware (`validateRequest`) that validates `body`, `query`, and `params` payloads using Zod schemas.
- `src/utils/`: Shared utilities (`AppError.ts`, `catchAsync.ts`, `sendResponse.ts`, `s3.ts`, `sendEmail.ts`).
- `src/config/`: Application configuration & DB connection helper.
- `src/docs/`: OpenAPI / Swagger UI setup and modular section docs (`auth.docs.ts`, `category.docs.ts`, `employee.docs.ts`, `event.docs.ts`, `swagger.ts`).

---

## Domain Rules & Guidelines

### Event & Subcategory Management
- **Subcategory Requirement**: When creating or updating an event, hosts must provide `subCategoryId` in the request payload (not a top-level category).
- **Subcategory Validation**: The service layer validates that the provided ID exists in the `Category` collection and is a valid subcategory (i.e. `parentCategory` is not null). If a main category ID is provided, an operational error (`400 Bad Request`) is thrown.
- **Database Schema**: The database model (`Event`) stores the subcategory reference in the `categoryId` field. No extra `subCategoryId` field is added to the MongoDB database schema.
- **Event Reward Multi-Image Support**: Each event reward supports uploading and storing multiple images (stored in `images: string[]` array in `RewardSchema`). Reward image files can be uploaded via `rewardImages` or index-specific field names (`rewardImages_0`, `rewardImages_1`, etc.).
- **Artist Image File Upload Support**: Artists added dynamically can have profile image files uploaded via `artistImages` array or index-specific field names (`artistImage_0`, `artistImages_0`, `artistImage[0]`, etc.), which are uploaded to AWS S3 and saved in `artist.image`.
- **S3 File Cleanup**: When updating an event, any previously uploaded S3 image URLs (event main images, artist images, reward images array) that are replaced or removed are automatically deleted from AWS S3 via `deleteFromS3`. Similarly, deleting an event cleans up all associated images from S3.

### Business Profile & Host Registration Rules
- **Host / Business Registration Verification**: When registering a user with role `HOST` or `BUSINESS`, `businessName`, `businessDescription`, `location`, `govtIdFrontImage`, and `govtIdBackImage` are required.
- **Conditional EIN vs. License Images**: User must provide **EITHER** `einNumber` **OR** both `businessLicenseFrontImage` and `businessLicenseBackImage`. If `einNumber` is provided, business license front/back images are optional. If `einNumber` is omitted, both business license front and back images are mandatory.

### Stripe Connect Host Bank Account & Payouts Rules
- **Host Stripe Connect Account Creation**: Hosts initiate Stripe onboarding via `POST /api/payments/create-connect-account`. A Stripe Express connected account is provisioned, saved in `BusinessProfile.stripeAccountId`, and a secure onboarding URL is generated (`stripe.accountLinks.create`).
- **Bank Account & Identity Verification**: The host accesses the returned Stripe-hosted onboarding link to verify identity and link bank details.
- **Webhook Synchronization**: When Stripe processes host verification or status updates, `account.updated` webhook events are received at `POST /api/payments/webhook`, cryptographically verified, and used to update `BusinessProfile` status flags (`isStripeConnected`, `isStripeVerified`, `stripePayoutsEnabled`, `stripeChargesEnabled`, `stripeDetailsSubmitted`, and `stripeAccountStatus`).
- **Host Express Dashboard**: Verified hosts can generate a direct management session to their Stripe Express Dashboard via `POST /api/payments/create-login-link`.

### Event Listing & Querying Rules
- **Active Events Only**: `GET /api/events` only returns active events whose `endDate` is strictly greater than the current server date and time (`endDate > new Date()`). Past/expired events are automatically excluded.
- **50km Radius Location Filtering**: Clients can supply `latitude` (or `lat`) and `longitude` (or `lng`/`lan`/`lon`) query parameters. When provided, the API filters results to events located within a 50 km spherical radius of those coordinates using Haversine distance calculation.
- **Per-User Seeded Random Ordering**: Events are presented in a pseudo-random order per user/session derived from `seed` or `userId`. Using a deterministic hash score (`getSeedHash`), the random ordering remains consistent across paginated requests (`page=1`, `page=2`, etc.) without dropping or duplicating events across pages.


---
config:
    layout: elk
--- 

classDiagram
direction TB
    class UserRole {
        USER
        HOST
        BUSINESS
    }

    class EmployerType {
        HOST
        BUSINESS
    }

    class TicketPaymentStatus {
        PENDING
        HELD_IN_ESCROW
        RELEASED_TO_HOST
        REFUNDED
        FAILED
    }

    class VerificationStatus {
        PENDING
        APPROVED
        REJECTED
    }

    class Category {
        +ObjectId _id
        +string name
        +string description
        +ObjectId parentCategory
        +boolean isActive
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
        +boolean stripeChargesEnabled
        +boolean stripeDetailsSubmitted
        +date submittedAt
        +date verifiedAt
        +updateProfile(ProfileData)
        +submitForVerification()
    }

    class User {
        +ObjectId _id
        +string name
        +string email
        +string password
        +UserRole role
        +int totalPoints = 0
        +double walletBalance = 0.0
        +viewEvents()
        +buyTicket(ObjectId eventId, int quantity, string referralCode)
        +requestTicketRefund(ObjectId ticketId)
        +buyProductFromBusiness(ObjectId productId)
        +claimReward(ObjectId eventRewardId)
        +generateReferralLink(ObjectId eventId) string
        +createEvent(EventData)
        +createReward(RewardData)
        +addEmployee(EmployeeData)
        +addProduct(ProductData)
    }

    class TicketPayment {
        +ObjectId _id
        +ObjectId ticketId
        +ObjectId userId
        +ObjectId eventId
        +double amount
        +TicketPaymentStatus status
        +string transactionId
        +date paymentDate
        +date refundDate
        +releaseEscrowToHost()
        +processRefund()
    }

    class Employee {
        +ObjectId _id
        +string name
        +string email
        +string password
        +ObjectId employerId
        +EmployerType employerType
        +boolean isActive
        +scanTicket(ObjectId ticketId)
        +verifyProductDelivery(ObjectId orderId)
    }

    class Event {
        +ObjectId _id
        +ObjectId hostId
        +ObjectId categoryId
        +string title
        +double latitude
        +double longitude
        +int ageRestriction
        +string placeName
        +string description
        +date startDate
        +date endDate
        +double ticketPrice
        +int stock
        +array images
        +array artistInfo
    }

    class Ticket {
        +ObjectId _id
        +ObjectId eventId
        +ObjectId userId
        +string referralCode
        +string status
        +date purchaseDate
        +boolean isScanned
        +string scannerId
        +cancelAndRefund()
    }

    class Reward {
        +ObjectId _id
        +ObjectId eventId
        +string title
        +string description
        +int pointsRequired
        +int stock
        +array images
        +claimStock()
    }

    class Product {
        +ObjectId _id
        +ObjectId businessId
        +string productName
        +int pointCost
        +string image
        +int stock
    }

    class EventReferral {
        +ObjectId _id
        +string referralCode
        +ObjectId referrerId
        +ObjectId eventId
        +int totalUsesCount
    }

    <<enumeration>> UserRole
    <<enumeration>> EmployerType
    <<enumeration>> TicketPaymentStatus
    <<enumeration>> VerificationStatus

    User --> UserRole : has_role
    Employee --> EmployerType : belongs_to_type
    TicketPayment --> TicketPaymentStatus : tracking_status
    BusinessProfile --> VerificationStatus : verification_state
    
    User "1" --> "0..1" BusinessProfile : has_profile (Host/Business)
    User "1" --> "0..*" Event : creates (Host)
    User "1" --> "0..*" Employee : hires (Host/Business)
    User "1" --> "0..*" Product : sells (Business)
    Event "1" --> "0..*" Ticket : has
    Event "1" --> "0..*" Reward : includes
    User "1" --> "0..*" Ticket : buys (User)
    Ticket "1" --> "1" TicketPayment : linked_to_payment
    User "1" --> "0..*" EventReferral : generates (User)
    Event "1" --> "0..*" EventReferral : linked_to
    User "1" --> "0..*" Product : buys_with_points (User)
    Category "0..1" <-- "0..*" Category : parent_of (Subcategory)
    Category "1" <-- "0..*" Event : belongs_to