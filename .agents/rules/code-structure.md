# Code Structure & Layering Rules

This document outlines the strict code structural rules and architectural invariants for developing within the **TeamStreak Promo** Express backend.

---

## 1. Layered Feature Pattern

The codebase is organized into self-contained feature modules located in `src/modules/<moduleName>/`. Each module encapsulates its complete functional lifecycle across 6 distinct layers:

```
[ HTTP Client Request ]
         │
         ▼
[ Express Router (*.route.ts) ]
   ├── Authentication Middleware (`protect`)
   ├── Role Authorization Middleware (`authorizeRoles`)
   ├── Multer File Upload Helper (`uploadSingle` / `uploadAny`)
   └── Zod Validation Middleware (`validateRequest`)
         │
         ▼
[ Controller Handler (*.controller.ts) ]
   ├── Wrapped in `catchAsync`
   ├── Extracts req.body, req.query, req.params, req.user
   └── Calls Service Layer
         │
         ▼
[ Service Domain Logic (*.service.ts) ]
   ├── Domain calculations & business validations
   ├── Throws operational `AppError` on violations
   ├── Invokes External Integrations (Stripe, AWS S3)
   └── Queries Mongoose Database Models (*.model.ts)
         │
         ▼
[ Database Model (*.model.ts) ]
   ├── Typed with Interface (*.interface.ts)
   └── Performs MongoDB queries / updates
         │
         ▼
[ Controller Response Dispatch ]
   └── Serializes response using `sendResponse`
```

---

## 2. Canonical File Specifications & Implementation Templates

### 2.1 Interface (`<moduleName>.interface.ts`)
- Defines pure TypeScript interfaces for documents, DTOs, and query parameters.
- Must not import runtime functions or contain executable code.

```typescript
import type { Document, Types } from 'mongoose';

export interface IExampleItem {
  name: string;
  price: number;
}

export interface IExample extends Document {
  title: string;
  ownerId: Types.ObjectId;
  items: IExampleItem[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateExampleInput {
  title: string;
  items: IExampleItem[];
}
```

### 2.2 Model (`<moduleName>.model.ts`)
- Builds Mongoose schema, sets indexes, and exports the typed model.
- Schema names must follow PascalCase: `ExampleSchema`. Model export: `Example`.

```typescript
import { Schema, model } from 'mongoose';
import type { IExample } from './example.interface.js';

const ExampleSchema = new Schema<IExample>(
  {
    title: { type: String, required: true, trim: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true, min: 0 },
      },
    ],
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for frequent query patterns
ExampleSchema.index({ ownerId: 1, createdAt: -1 });

export const Example = model<IExample>('Example', ExampleSchema);
```

### 2.3 Validation (`<moduleName>.validation.ts`)
- Exports Zod validation schemas for request validation.
- Validates `body`, `query`, and/or `params`.

```typescript
import { z } from 'zod';

export const createExampleSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    items: z.array(
      z.object({
        name: z.string().min(1, 'Item name is required'),
        price: z.number().positive('Price must be greater than zero'),
      })
    ).min(1, 'At least one item is required'),
  }),
});

export const getExamplesQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
  }),
});
```

### 2.4 Service (`<moduleName>.service.ts`)
- Encapsulates business logic, data persistence, and external service interactions.
- Never accepts `req` or `res`.
- Always throws `AppError` on operational failure.

```typescript
import { Example } from './example.model.js';
import type { CreateExampleInput, IExample } from './example.interface.js';
import AppError from '../../utils/AppError.js';
import logger from '../../utils/logger.js';

export const createExampleService = async (
  userId: string,
  payload: CreateExampleInput
): Promise<IExample> => {
  const existing = await Example.findOne({ title: payload.title, ownerId: userId });
  if (existing) {
    throw new AppError('An item with this title already exists for your account', 400);
  }

  const created = await Example.create({
    ...payload,
    ownerId: userId,
  });

  logger.info('Created new example record', { id: created._id, userId });
  return created;
};
```

### 2.5 Controller (`<moduleName>.controller.ts`)
- Extracts parameters and dispatches formatted responses.
- Every function is wrapped with `catchAsync`.
- Uses `sendResponse` for JSON output.

```typescript
import type { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { createExampleService } from './example.service.js';

export const createExample = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user._id;
  const result = await createExampleService(userId, req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Example created successfully',
    data: result,
  });
});
```

### 2.6 Route (`<moduleName>.route.ts`)
- Defines Express route table and middleware chains.

```typescript
import { Router } from 'express';
import { createExample } from './example.controller.js';
import { createExampleSchema } from './example.validation.js';
import { protect, authorizeRoles } from '../../middlewares/authMiddleware.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';

const router = Router();

router.post(
  '/',
  protect,
  authorizeRoles('HOST', 'BUSINESS'),
  validateRequest(createExampleSchema),
  createExample
);

export default router;
```

---

## 3. Strict Prohibitions (Anti-Patterns)

1. **NO Raw Database Queries in Controllers**:
   Controllers must delegate directly to services. Never call `Model.find`, `Model.findOneAndUpdate`, or `Model.aggregate` within a controller.
2. **NO Express Objects in Services**:
   Services must remain decoupled from HTTP. Never accept `req`, `res`, or `next` inside a service function.
3. **NO Relative Imports without `.js`**:
   Always include `.js` extension on relative imports (e.g. `import foo from './foo.js'`).
4. **NO Untyped Error Throwing**:
   Always throw `new AppError(message, statusCode)`. Do not throw generic strings or bare errors.
5. **NO Unhandled Async Controllers**:
   Every controller handler must be wrapped with `catchAsync(...)`.
