# Order Module (`src/modules/order`)

The **Order Module** manages loyalty reward point redemptions across the TeamStreak Promo ecosystem. It handles claiming rewards from the `Marketplace` (merchant items/vouchers) and `Event` reward tiers, deducts user point balances, generates redemption QR passes, and tracks fulfillment through `CLAIMED` and `REDEEMED` lifecycles.

---

## 1. Overview & Capabilities

- **Point-Based Transactions**: Users exchange earned loyalty points for items rather than fiat currency.
- **Dual Item Support**:
  - `MARKETPLACE`: Redeems products or vouchers listed by a `BUSINESS` user.
  - `EVENT`: Redeems loyalty items offered by an event `HOST`.
- **Atomic Balance & Inventory Checks**:
  - For `EVENT` items: Validates that the user has sufficient points scoped to that specific host (`UserHostPoint.points >= totalPointsRequired`). Points earned from Host A cannot be used on Host B's rewards.
  - For `MARKETPLACE` items: Validates user total points (`user.totalPoints >= totalPointsRequired`).
  - Validates item availability (`quantity - claimQuantity >= requestedQuantity` or event reward stock).
  - Atomically deducts user points from the host ledger and reserves stock.
- **Redemption QR Pass**: Generates a scannable QR code PNG saved to AWS S3.
- **In-Person Verification & Redemption**: The merchant (`BUSINESS`), host (`HOST`), or on-ground `Employee` scans the QR code and calls `PATCH /:id/redeem` to mark the order `REDEEMED`.
- **Review Eligibility Gate**: Completing an order unlocks review eligibility in `src/modules/partnerReview`.

---

## 2. Directory Structure

```text
src/modules/order/
├── order.controller.ts    # Handlers for placing orders, order history, and redemption
├── order.interface.ts     # TypeScript interface for IOrder document and status types
├── order.model.ts         # Mongoose schema, compound indexes, and item type discriminators
├── order.route.ts         # Express routes guarded by protect and role authorizations
├── order.service.ts       # Business logic: point deduction, stock decrement, QR creation, redemption
├── order.validation.ts   # Zod validation schemas for order creation
└── README.md              # This documentation file
```

---

## 3. Data Model Reference (`Order`)

| Field | Type | Description |
| :--- | :--- | :--- |
| `user` | ObjectId | Reference to redeeming `User` |
| `itemType` | Enum | `'MARKETPLACE'` \| `'EVENT'` |
| `businessOwnerId` | ObjectId | Reference to `User` (for `MARKETPLACE` items) |
| `itemId` | ObjectId | Reference to `Marketplace` item |
| `hostId` | ObjectId | Reference to `User` (for `EVENT` reward items) |
| `eventId` | ObjectId | Reference to `Event` |
| `rewardItemId` | ObjectId | Subdocument ID of reward inside the `Event` |
| `itemPoints` | Number | Points cost per unit |
| `quantity` | Number | Number of items redeemed |
| `status` | Enum | `'CLAIMED'` \| `'REDEEMED'` \| `'CANCELLED'` (default: `'CLAIMED'`) |
| `qrCode` | String | S3 URL to the generated redemption QR code |
| `createdAt` | Date | Order creation timestamp |
| `updatedAt` | Date | Order status update timestamp |

---

## 4. Endpoints & API Reference

Base Prefix: `/api/orders`

All routes require authentication via `protect`.

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/` | `USER` | Redeem points for a Marketplace or Event item. Deducts points and creates QR code. |
| `GET` | `/my-orders` | `USER`, `BUSINESS`, `EMPLOYEE`, `HOST` | Get the logged-in user's order history (or for `BUSINESS` / `EMPLOYEE` / `HOST`, their organization's reward orders & `isRedeemed` status). |
| `GET` | `/business-orders` | `BUSINESS`, `EMPLOYEE`, `HOST`, `ADMIN` | View the Business Partner's reward orders and check whether users have clicked the Redeem button (`status: 'CLAIMED' \| 'REDEEMED'`, `isRedeemed: true \| false`). |
| `GET` | `/:id` | `USER`, `ADMIN`, `BUSINESS`, `HOST`, `EMPLOYEE` | Get detailed order profile with populated user, item, `status`, `isRedeemed`, and QR code. |
| `PATCH` | `/:id/redeem` | `USER`, `BUSINESS`, `HOST`, `ADMIN` | Marks the order as fulfilled (`REDEEMED`). Employees (`EMPLOYEE`) **cannot** redeem orders; they can only view the redemption status. |

---

## 5. Domain Rules & Lifecycle

1. **Order Redemption Flow**:
   ```mermaid
   sequenceDiagram
       participant User as Consumer (App)
       participant OrderService as order.service.ts
       participant Marketplace as Marketplace Model
       participant UserModel as User Model
       participant S3 as AWS S3 Storage

       User->>OrderService: POST /api/orders (itemType, itemId, quantity)
       OrderService->>Marketplace: Check item active and stock available
       OrderService->>UserModel: Check user totalPoints >= required
       OrderService->>UserModel: Deduct user points
       OrderService->>Marketplace: Increment claimQuantity
       OrderService->>S3: Generate & upload redemption QR code
       OrderService->>User: Return Order (status: CLAIMED)
   ```
2. **Concurrency, Indexing & Cancellation Rules**:
   - Stock and user point deductions use atomic `findOneAndUpdate` operations with `$inc` and `$gte` conditions (rolling back stock reservation if point deduction fails).
   - Indexed on `{ user: 1, createdAt: -1 }`, `{ businessOwnerId: 1, status: 1 }`, and `{ hostId: 1, status: 1 }`.
   - If an unfulfilled order is cancelled, the spent reward points are refunded back to `user.totalPoints`, and `claimQuantity` on the item is decremented.
