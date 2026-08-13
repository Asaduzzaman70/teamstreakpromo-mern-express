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
    │   └── swagger.ts         # Swagger/OpenAPI 3.0 specification & setup middleware
    ├── middlewares/           # Express custom global middlewares
    │   ├── authMiddleware.ts  # JWT Authentication & Request protection middleware
    │   └── errorHandler.ts    # Global error handling middleware
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
- `src/middlewares/`: Shared global Express middlewares (`authMiddleware.ts`, `errorHandler.ts`).
- `src/utils/`: Shared utilities (`AppError.ts`, `catchAsync.ts`, `sendResponse.ts`).
- `src/config/`: Application configuration & DB connection helper.
- `src/docs/`: OpenAPI / Swagger UI setup.


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