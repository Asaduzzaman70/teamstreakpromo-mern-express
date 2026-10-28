# Auth Module (`src/modules/auth`)

The **Auth Module** is responsible for user registration, authentication, role assignment, multi-part document verification (for Host/Business users), OTP verification, password recovery, session token management (Access & Refresh JWTs), and user profile management.

---

## 1. Overview & Business Context

TeamStreak Promo supports 4 core user roles:
- `USER`: Regular mobile/web consumer who discovers events, buys tickets, earns reward points, and redeems marketplace products.
- `HOST`: Event organizer who creates and manages events, sets up ticket tiers, and connects Stripe for ticket payouts.
- `BUSINESS`: Merchant who lists products and services in the marketplace for points/fiat and connects Stripe.
- `ADMIN`: Platform super-administrator managing users, categories, approvals, and dispute resolutions.

During registration, `HOST` and `BUSINESS` users are required to submit identity and business verification documents (Govt ID and either EIN or Business License images). These documents are uploaded to AWS S3, and a corresponding `BusinessProfile` is created in a `PENDING` state.

---

## 2. Directory Structure

```text
src/modules/auth/
├── auth.controller.ts    # HTTP request handlers & response dispatchers
├── auth.interface.ts     # TypeScript interfaces for User, Auth Tokens, and Payloads
├── auth.model.ts         # Mongoose User schema, password hashing pre-hooks, and methods
├── auth.route.ts         # Express route definitions with Multer and Zod middleware
├── auth.service.ts       # Domain logic: registration, JWT generation, password reset, S3 uploads
├── auth.validation.ts   # Zod validation schemas for request bodies
└── README.md             # This documentation file
```

---

## 3. Data Models & Entities

### User (`User` in `auth.model.ts`)
| Field | Type | Description |
| :--- | :--- | :--- |
| `name` | String | Full user name |
| `email` | String | Unique, lowercased user email address |
| `password` | String | Bcrypt-hashed password (hidden by default via `select: false`) |
| `role` | Enum (`USER`, `HOST`, `BUSINESS`, `ADMIN`) | User authorization role |
| `profileImage` | String | S3 URL for profile avatar |
| `points` | Number | Loyalty reward points balance (default: 0) |
| `isVerified` | Boolean | Account activation status via OTP |
| `status` | Enum (`ACTIVE`, `SUSPENDED`, `DELETED`) | Administrative account status |
| `businessProfileId` | ObjectId | Reference to `BusinessProfile` (for `HOST` and `BUSINESS`) |
| `refreshToken` | String | Hashed or stored refresh token for session renewals |

---

## 4. Endpoints & API Reference

Base Prefix: `/api/auth`

| Method | Endpoint | Auth Required | Roles | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/register` | No (Public) | Anyone | Register a new user (`multipart/form-data` for Host/Business docs). Generates activation OTP. |
| `POST` | `/verify-register-otp` | No (Public) | Anyone | Verify email activation OTP and activate account. Returns JWT tokens. |
| `POST` | `/verify-account` | No (Public) | Anyone | Alias for `/verify-register-otp`. |
| `POST` | `/resend-activation-otp` | No (Public) | Anyone | Resend OTP code for unactivated accounts. |
| `POST` | `/login` | No (Public) | Anyone | Authenticate with email & password. Returns access token, refresh token, and user data. |
| `POST` | `/forgot-password` | No (Public) | Anyone | Request a 6-digit password reset OTP sent via email. |
| `POST` | `/verify-forgot-password-otp` | No (Public) | Anyone | Verify the password reset OTP before allowing password change. |
| `POST` | `/reset-password` | No (Public) | Anyone | Set a new password using email, verified OTP, and new password. |
| `POST` | `/change-password` | Yes | Any logged-in user | Update password by verifying the old password. |
| `POST` | `/refresh-token` | No (Public) | Anyone | Exchange a valid refresh token for a fresh access token. |
| `POST` | `/logout` | Yes | Any logged-in user | Invalidate current user refresh token. |
| `GET` | `/me` | Yes | Any logged-in user | Fetch current user profile with populated `businessProfileId`. |
| `PATCH` | `/me` or `/profile` | Yes | Any logged-in user | Update profile details and optional new profile image. |
| `DELETE` | `/delete-account` or `/me` | Yes | Any logged-in user | Confirm password and permanently delete or soft-delete account. |

---

## 5. Key Workflows & Rules

1. **Host/Business Onboarding Validation**:
   - If `role` is `HOST` or `BUSINESS`, `businessName`, `businessDescription`, `location`, `govtIdFrontImage`, and `govtIdBackImage` are mandatory.
   - Either `einNumber` OR (`businessLicenseFrontImage` + `businessLicenseBackImage`) must be provided.
2. **OTP & Rate-Limiting Protection**:
   - Public authentication and OTP routes are protected by `authRateLimiter` (15 requests / 15 minutes per IP) in `src/middlewares/security.middleware.ts`.
   - OTPs are managed via `src/modules/otp/otp.service.ts` with `crypto.randomInt`, a 60-second resend cooldown, 10-minute expiry, and automatic invalidation after 5 failed attempts.
   - `protect` middleware (`src/middlewares/authMiddleware.ts`) performs real-time account status verification (`isActive`, `isSuspend`, `isDeleted`).
3. **Password Security**:
   - Passwords hashed with `bcryptjs` (salt rounds: 10 or 12).
   - Never returned in JSON responses (`select: false` on Schema).
4. **S3 Asset Management**:
   - Changing `profileImage` triggers `deleteFromS3` on the old avatar to avoid orphan files.

---

## 6. Developer Guidelines & Gotchas

- **Native ESM Import Extensions**: When importing in or from `auth`, always include `.js` (e.g. `import { User } from './auth.model.js';`).
- **Do Not Query Database in Controllers**: All queries must stay in `auth.service.ts`.
- **Swagger Documentation**: Swagger schemas for this module are synchronized in `src/docs/auth.docs.ts`.
