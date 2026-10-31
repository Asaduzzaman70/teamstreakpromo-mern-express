# Referral & Host-Scoped Points Module (`referral`)

The **Referral & Host-Scoped Points** module manages peer-to-peer event referral links, two-sided referral rewards, and host-scoped point balances for the TeamStreak Promo platform.

---

## 1. Overview & Business Rules

1. **Two-Sided Event Referrals**:
   - When User 1 shares their unique event referral link (`/events/:eventId?ref=<referralCode>`) with User 2, and User 2 purchases a ticket for that event:
     - User 1 (Referrer) receives **1 reward point** credited under that event's specific Host.
     - User 2 (Buyer) receives **1 reward point** credited under that event's specific Host.
   - Self-referrals (`referrerId === buyerId`) are prevented.
   - Idempotency ensures that referral rewards are credited only once per ticket order.
2. **Host-Scoped Points (Crucial Invariant)**:
   - Points earned from Host A's events are strictly locked to Host A.
   - When a user claims an event reward created by Host A, points are validated and deducted solely from that user's balance with Host A (`UserHostPoint`).
   - A user cannot spend points earned from Host A to claim rewards created by Host B.

---

## 2. File Organization

```
src/modules/referral/
├── referral.interface.ts   # Document interfaces, DTOs, and response shapes
├── referral.model.ts       # Mongoose schemas: UserHostPoint and EventReferral
├── referral.validation.ts  # Zod validation schemas for request parameters
├── referral.service.ts     # Business logic: host points ledger, referral crediting, deduction
├── referral.controller.ts # Request handlers wrapped in catchAsync
├── referral.route.ts      # Express routes for user point queries and referral links
└── README.md              # Module architecture and endpoint documentation
```

---

## 3. Endpoints

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/referrals/my-points` | `protect` | Returns all host point balances for the authenticated user. |
| `GET` | `/api/referrals/my-referrals` | `protect` | Returns the user's historical referral transactions. |
| `GET` | `/api/referrals/event/:eventId` | `protect` | Retrieves the shareable referral link, referral code, and available host points for an event. |

---

## 4. Models

### `UserHostPoint`
- `user`: Reference to `User` (the point holder).
- `hostId`: Reference to `User` (the event host/organizer).
- `points`: Current spendable points for this specific host.
- `totalEarned`: Lifetime points earned under this host.
- `totalSpent`: Lifetime points spent on this host's rewards.
- **Index**: Unique compound index on `{ user: 1, hostId: 1 }`.

### `EventReferral`
- `referrer`: Reference to `User` (User 1).
- `referee`: Reference to `User` (User 2).
- `eventId`: Reference to `Event`.
- `hostId`: Reference to `User` (the host).
- `eventOrderId`: Reference to `EventOrder` (if credited on ticket purchase).
- `pointsAwarded`: Number of points awarded (default 1).
- `status`: `'PENDING' | 'COMPLETED' | 'CANCELLED'`.

