# TeamStreak Promo - Code Structure & Guidelines

This document outlines the codebase structure and development guidelines for the **TeamStreak Promo** Express application. For any future changes, these structural rules and naming conventions must be followed to maintain consistency.

## Overview

The application follows a **Modular (Feature-Based) Architecture**, meaning the codebase is organized by business domain features (e.g., `auth`, `employee`, `category`) rather than strictly by technical role (e.g., not having one global `controllers/` folder and one global `models/` folder).

It is built with **Node.js, Express, TypeScript, and Mongoose (MongoDB)**.

## Directory Structure

```text
src/
├── app.ts                  # Main Express application setup (cors, middlewares, routes mounting, error handler)
├── server.ts               # Server entry point (starts the HTTP server)
├── config/                 # Environment variables and configurations (e.g., config.ts, db.ts, s3.config.ts)
├── docs/                   # Swagger OpenAPI definitions (one file per module + swagger.ts for setup)
├── middlewares/            # Global Express middlewares (authMiddleware.ts, errorHandler.ts, validation.middleware.ts)
├── utils/                  # Helper utilities (catchAsync.ts, sendResponse.ts, AppError.ts)
└── modules/                # Feature modules (the core of the application)
    ├── auth/
    ├── category/
    ├── employee/
    ├── event/
    └── ...                 # Other business modules
```

## Module Structure

Each feature inside `src/modules/<moduleName>` should be self-contained and typically includes the following files, following the `<moduleName>.<type>.ts` naming convention:

1. **`<moduleName>.interface.ts`**
   - Contains TypeScript interfaces for the Mongoose schema and any other module-specific types.

2. **`<moduleName>.model.ts`**
   - Defines the Mongoose Schema and exports the Model.
   - Imports types from `<moduleName>.interface.ts`.

3. **`<moduleName>.validation.ts`**
   - Defines validation schemas (usually Zod or Joi) for request bodies, queries, and params.

4. **`<moduleName>.service.ts`**
   - Contains the core business logic.
   - Interacts with the Mongoose model.
   - Should *not* have access to the Express `Request` and `Response` objects.

5. **`<moduleName>.controller.ts`**
   - Handles incoming HTTP requests.
   - Wraps asynchronous operations with `catchAsync` utility.
   - Calls the appropriate service methods.
   - Sends formatted responses using the `sendResponse` utility.

6. **`<moduleName>.route.ts`**
   - Defines the Express router for the module.
   - Attaches validation middlewares (e.g., `validateRequest`), authentication middlewares, and the controller functions.

## Common Utilities & Conventions

- **`catchAsync(fn)`**: Used in controllers to wrap async functions, eliminating the need for `try-catch` blocks in every controller. Errors are automatically passed to the global error handler.
- **`sendResponse(res, data)`**: Used to format all API responses consistently (e.g., `{ success: true, statusCode: 200, message: "...", data: {...} }`).
- **`AppError`**: Custom error class to throw specific HTTP status codes from services or controllers.
- **`errorHandler`**: The global error handling middleware defined in `src/middlewares/errorHandler.ts` that catches `AppError`, Mongoose errors, etc., and formats them nicely.

## Guidelines for Adding/Modifying Features

1. **Keep it Modular:** When adding a new entity, create a new folder in `src/modules/` with the standard files.
2. **Naming Convention:** Use `camelCase` for folder names (e.g., `rewardCategory`) and the `<moduleName>.<type>.ts` format for files (e.g., `rewardCategory.controller.ts`).
3. **API Documentation:** Any new routes must be documented in `src/docs/<moduleName>.docs.ts` and then imported/registered in `src/docs/swagger.ts`.
4. **Validation:** All incoming data (body, query, params) must be validated in the route layer using the validation middleware before hitting the controller.
5. **Separation of Concerns:** 
   - Controllers should only parse requests and send responses.
   - Services should handle business logic and database queries.
   - Routes should define endpoints and middleware chains.

*Note: As an AI Assistant, I will refer to these guidelines before proposing or executing architectural or structural changes to this codebase.*
