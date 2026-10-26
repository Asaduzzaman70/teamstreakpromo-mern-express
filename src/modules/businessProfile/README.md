# Business Profile Module (`src/modules/businessProfile`)

The **Business Profile Module** defines and manages the merchant/organizer identity for `HOST` and `BUSINESS` accounts. It tracks government ID verification, business documentation (EIN or business licenses), platform reputation (`rating` and `sold`), and Stripe Connect payout account linkages.

---

## 1. Overview & Business Purpose

In TeamStreak Promo:
- Every `HOST` (event creator) and `BUSINESS` (marketplace seller) is backed by a 1-to-1 `BusinessProfile` document linked to their `User` ID (`userId`).
- Organizers cannot receive payouts unless their Stripe Connect account is active and verified.
- The platform enforces KYC (Know Your Customer) compliance by storing government identity images and business proofs in AWS S3 and tracking verification status (`PENDING`, `APPROVED`, `REJECTED`).

---

## 2. Directory Structure

```text
src/modules/businessProfile/
├── businessProfile.interface.ts   # Document interfaces, status enums, Zod inferred types
├── businessProfile.model.ts       # Mongoose Schema, compound indexes, instance methods
├── businessProfile.validation.ts  # Zod validation schema (EIN vs. Business License conditions)
└── README.md                      # This documentation file
```

---

## 3. Data Model Reference (`BusinessProfile`)

| Field | Type | Description |
| :--- | :--- | :--- |
| `userId` | ObjectId | Reference to the `User` owner (`unique: true`) |
| `businessName` | String | Trade name or legal entity name |
| `businessDescription`| String | Overview of company, organization, or events |
| `einNumber` | String | Employer Identification Number (Optional if license images provided) |
| `location` | String | Operating address or physical location |
| `govtIdFrontImage` | String | S3 URL to front of government-issued ID |
| `govtIdBackImage` | String | S3 URL to back of government-issued ID |
| `businessLicenseFrontImage` | String | S3 URL to business license front |
| `businessLicenseBackImage` | String | S3 URL to business license back |
| `verificationStatus` | Enum | `'PENDING'` \| `'APPROVED'` \| `'REJECTED'` |
| `stripeAccountId` | String | Stripe Express connected account ID (e.g. `acct_...`) |
| `stripeAccountStatus` | Enum | `'UNLINKED'` \| `'PENDING'` \| `'ACTIVE'` \| `'RESTRICTED'` \| `'INACTIVE'` |
| `isStripeConnected` | Boolean | True once Stripe Connect account is linked |
| `isStripeVerified` | Boolean | True when Stripe requirements are fulfilled |
| `stripePayoutsEnabled` | Boolean | True when Stripe allows outbound transfers |
| `stripeChargesEnabled` | Boolean | True when Stripe allows charge processing |
| `rating` | Number | Aggregate customer rating score (0.0 to 5.0) |
| `sold` | Number | Lifetime tally of tickets/items sold |
| `submittedAt` | Date | Timestamp of document submission |
| `verifiedAt` | Date | Timestamp when Admin approved verification |

---

## 4. Key Business Rules & Validation

1. **KYC Document Requirement**:
   - `govtIdFrontImage` and `govtIdBackImage` are strictly mandatory for all Host and Business profiles.
   - Either a valid `einNumber` OR both `businessLicenseFrontImage` and `businessLicenseBackImage` must be supplied.
2. **Stripe Connect Integration**:
   - Managed in collaboration with the `payment` module (`/api/payments/create-connect-account`).
   - Webhooks update `stripeAccountStatus`, `stripePayoutsEnabled`, and `stripeChargesEnabled` directly on this model.
3. **Reputation Metrics**:
   - `rating` and `sold` counters are automatically refreshed by the review and order modules.

---

## 5. Developer & Agent Integration Notes

- **Model Linking**: When a user registers as `HOST` or `BUSINESS`, `auth.service.ts` creates the `BusinessProfile` and updates `user.businessProfileId`.
- **Population**: Use `User.findById(...).populate('businessProfileId')` when user business details are needed.
- **Instance Methods**:
  - `profile.updateProfile(data)`: Updates fields and saves.
  - `profile.submitForVerification()`: Resets `verificationStatus` to `PENDING` and stamps `submittedAt`.
