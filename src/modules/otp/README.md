# OTP Module (`src/modules/otp`)

The **OTP Module** is an internal utility and security module providing One-Time Password generation, cryptographic validation, automated invalidation, and TTL-based document expiration for email verification and password resets.

---

## 1. Overview & Functionality

- **Cryptographic Random Numbers**: Generates standard 6-digit numeric codes via `generateNumericOtp()`.
- **MongoDB TTL Index**: Automatically purges expired OTP documents from MongoDB without requiring background cron jobs (`index: { expires: 0 }` on `expiresAt`).
- **Single-Use & Invalidation Policy**:
  - Requesting a new OTP automatically deletes all previous unverified OTPs for the same email and purpose.
  - Successfully verifying an OTP marks `isUsed = true`.
- **Purpose Scoping**: Scoped by purpose (`EMAIL_VERIFICATION`, `FORGOT_PASSWORD`, `TWO_FACTOR_AUTH`) to prevent cross-flow token replay attacks.

---

## 2. Directory Structure

```text
src/modules/otp/
├── otp.interface.ts     # TypeScript interfaces for IOtp, CreateOtpParams, and VerifyOtpParams
├── otp.model.ts         # Mongoose schema with TTL index and compound index on email + purpose
├── otp.service.ts       # Service methods: createOtpService, verifyOtpService, generateNumericOtp
└── README.md            # This documentation file
```

---

## 3. Data Model Reference (`Otp`)

| Field | Type | Description |
| :--- | :--- | :--- |
| `email` | String | Lowercased, trimmed recipient email address |
| `otp` | String | 6-digit numeric string |
| `purpose` | Enum | `'FORGOT_PASSWORD'` \| `'EMAIL_VERIFICATION'` \| `'TWO_FACTOR_AUTH'` |
| `expiresAt` | Date | Expiration timestamp (Indexed with `{ expires: 0 }` for MongoDB TTL auto-cleanup) |
| `isUsed` | Boolean | True once successfully verified (default: `false`) |
| `createdAt` | Date | Creation timestamp |
| `updatedAt` | Date | Update timestamp |

---

## 4. Service API (Internal Export)

This module does not expose external HTTP routes directly; it is consumed internally by `src/modules/auth`:

### `createOtpService(params: CreateOtpParams): Promise<string>`
```typescript
import { createOtpService } from '../otp/otp.service.js';

const otpCode = await createOtpService({
  email: user.email,
  purpose: 'EMAIL_VERIFICATION',
  expirationMinutes: 10, // Default 10 minutes
});
```
- Deletes any existing unused OTPs for the given email and purpose.
- Returns the generated 6-digit numeric string.

### `verifyOtpService(params: VerifyOtpParams): Promise<boolean>`
```typescript
import { verifyOtpService } from '../otp/otp.service.js';

await verifyOtpService({
  email: req.body.email,
  otp: req.body.otp,
  purpose: 'FORGOT_PASSWORD',
});
```
- Throws `AppError(400)` if OTP not found, expired, already used, or mismatched.
- Marks `isUsed = true` upon success.

---

## 5. Security Principles

1. **Normalized Case**: All incoming email addresses are normalized with `.toLowerCase().trim()` to prevent bypasses.
2. **Replay Prevention**: The query explicitly filters for `{ isUsed: false }` and sets `isUsed = true` immediately upon verification.
3. **Automatic Cleanup**: Stale OTP records are automatically cleaned up by MongoDB's background TTL thread.
