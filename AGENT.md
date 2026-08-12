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
    ├── app.ts                 # Express application initialization, Swagger setup & middleware
    ├── server.ts              # Server entry point & database connection trigger
    ├── config/                # Environment and configuration files
    │   ├── config.ts          # Centralized configuration object
    │   └── db.ts              # MongoDB database connection helper
    ├── controllers/           # HTTP Request & Response handlers
    │   └── authController.ts  # Auth endpoints controller (delegates to authService & validates with Zod)
    ├── docs/                  # API Documentation & OpenAPI Specifications
    │   └── swagger.ts         # Swagger/OpenAPI 3.0 specification & setup middleware
    ├── interfaces/            # TypeScript interface definitions & inferred types
    │   └── authInterface.ts   # Authentication types and interfaces
    ├── middlewares/           # Express custom middlewares
    │   ├── authMiddleware.ts  # JWT Authentication & Request protection middleware
    │   └── errorHandler.ts    # Global error handling middleware
    ├── models/                # Mongoose database models & schemas
    │   └── User.ts            # User schema, password hashing hooks, and comparison methods
    ├── routes/                # Express routing definitions
    │   └── authRoutes.ts      # Authentication routes definition (/api/auth)
    ├── services/              # Business logic layer
    │   └── authService.ts     # Auth business logic (registration, authentication, password reset, user profile)
    ├── utils/                 # Application utilities & helpers
    │   ├── AppError.ts        # Custom operational error class
    │   ├── catchAsync.ts      # Async error handler wrapper for Express route handlers
    │   └── sendResponse.ts    # Standardized API response formatter
    └── validation/            # Runtime payload validation schemas
        └── authValidation.ts  # Zod schemas for register, login, and forgotPassword
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

---

## Key Modules & Responsibilities

### 1. Documentation (`src/docs/swagger.ts`)
- Contains full OpenAPI 3.0.0 specifications (paths, schemas, parameters, security definitions) isolated cleanly from route definitions.
- Configures `swagger-jsdoc` and mounts Swagger UI (`swagger-ui-express`) on `/api-docs` and `/api-docs.json`.

### 2. Controllers (`src/controllers/`)
- Handles incoming HTTP requests (`req`) and formulates responses (`res`).
- Performs runtime schema validation using Zod schemas from `src/validation/`.
- Delegates business operations to the service layer (`src/services/`).
- Catches errors and forwards them to Express `next(error)`.

### 3. Services (`src/services/`)
- Encapsulates all domain and business logic (e.g., user existence checks, password verification, token generation).
- Interacts directly with database models (`src/models/`).
- Throws errors with appropriate HTTP status codes for the error handler.

### 4. Validation (`src/validation/`)
- Uses **Zod** for schema definitions and runtime request payload validation.
- Validates field presence, string formats (email), minimum lengths, boolean consent flags, and field matching (confirmPassword).

### 5. Interfaces (`src/interfaces/`)
- Contains TypeScript type definitions, including types inferred directly from Zod validation schemas (`z.infer<typeof schema>`).
- Defines API response contracts (`AuthResponse`, `ForgotPasswordResponse`, `UserProfileResponse`).

### 6. Models (`src/models/`)
- Mongoose schemas and models defining data structure, validations, pre-save hooks (e.g. bcrypt password hashing), and instance methods.

### 7. Middlewares & Routes (`src/middlewares/` & `src/routes/`)
- `authMiddleware.ts`: Verifies JWT tokens in `Authorization: Bearer <token>` headers.
- `errorHandler.ts`: Central error handler formatting standard JSON error responses.
- `authRoutes.ts`: Clean Express route mappings (`/register`, `/login`, `/forgot-password`, `/me`).


schema

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
        +string title
        +double latitude
        +double longitude
        +int ageRestriction
        +string placeName
        +string description
        +date startDate
        +date endDate
        +double ticketPrice
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
        +object image
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

    User --> UserRole : has_role
    Employee --> EmployerType : belongs_to_type
    TicketPayment --> TicketPaymentStatus : tracking_status
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