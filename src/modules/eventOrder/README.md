# Event Order Module (`src/modules/eventOrder`)

The **Event Order Module** handles event ticket purchases, automated QR code generation, attendee digital ticket passes, stock deduction, and ticket cancellation workflows.

---

## 1. Overview & Capabilities

- **Post-Payment Ticket Generation**: Triggered automatically upon Stripe webhook confirmation (`checkout.session.completed`).
- **Dynamic QR Code Pass**: Creates an encrypted/structured QR code image embedded with event name, venue, date/time, ticket ID, order ID, and ticket breakdown. The QR code image is uploaded to AWS S3.
- **Readable Ticket Codes**: Automatically formats human-readable ticket numbers (e.g. `MOT3203920212`) based on organizer or event initials.
- **Stock Decrement**: Atomically reduces available ticket inventory in the corresponding `priceCategories` of the `Event` document.
- **Reward Points Credit**: Credits the buyer with promotional loyalty points upon ticket acquisition.
- **Ticket Cancellation & Refunds**: Routes ticket cancellations through the `payment` module to process Stripe refunds and restore ticket stock, subject to event start time cutoffs.

---

## 2. Directory Structure

```text
src/modules/eventOrder/
├── eventOrder.controller.ts    # Handlers for personal order history and ticket inspection
├── eventOrder.interface.ts     # TypeScript interfaces for EventOrder, ticket tiers, and payout status
├── eventOrder.model.ts         # Mongoose schema, compound indexes, and references
├── eventOrder.route.ts         # Express routes guarded by protect middleware
├── eventOrder.service.ts       # Logic for ticket creation, QR generation, and order queries
└── README.md                    # This documentation file
```

---

## 3. Data Model Reference (`EventOrder`)

| Field | Type | Description |
| :--- | :--- | :--- |
| `user` | ObjectId | Reference to purchasing `User` |
| `hostId` | ObjectId | Reference to event organizer `User` |
| `eventId` | ObjectId | Reference to `Event` |
| `tickets` | Array | `[{ priceCategoryId, categoryName, unitPrice, quantity }]` |
| `totalTicketQuantity` | Number | Sum of all tickets in order |
| `totalAmount` | Number | Total fiat price paid in USD |
| `stripeSessionId` | String | Stripe Checkout Session ID |
| `ticketId` | String | Human-readable ticket identifier (e.g. `MOT9821401`) |
| `qrCode` | String | AWS S3 URL of the generated QR code PNG |
| `status` | Enum | `'PAID'` \| `'CANCELLED'` \| `'COMPLETED'` (default: `'PAID'`) |
| `payoutStatus` | Enum | `'PENDING'` \| `'COMPLETED'` \| `'SKIPPED'` |
| `hostPayoutAmount` | Number | Net amount owed to host after commission |
| `platformFeeAmount`| Number | Platform service fee |
| `stripeTransferId` | String | Stripe transfer reference once paid out |
| `stripeRefundId` | String | Stripe refund ID if ticket was cancelled |
| `cancelledAt` | Date | Timestamp of order cancellation |
| `pointsEarned` | Number | Loyalty reward points rewarded for this order |

---

## 4. Endpoints & API Reference

Base Prefix: `/api/event-orders`

All routes require authentication (`protect`).

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/my-orders` | Fetch the current user's purchased event tickets with pagination and status filters (`PAID`, `CANCELLED`). |
| `GET` | `/:id` | Retrieve single ticket pass details, including populated event, host, and QR code. |
| `POST` | `/:orderId/cancel` | Cancel ticket and initiate Stripe refund (delegated to `PaymentController.cancelEventOrder`). |

---

## 5. Domain Rules & Integration Lifecycle

1. **Stripe Checkout Webhook Flow**:
   ```mermaid
   sequenceDiagram
       participant Stripe as Stripe API
       participant Webhook as payment.controller.ts
       participant EventOrderService as eventOrder.service.ts
       participant S3 as AWS S3 Storage
       participant DB as MongoDB

       Stripe->>Webhook: checkout.session.completed
       Webhook->>EventOrderService: createEventOrder(payload)
       EventOrderService->>DB: Deduct ticket stock from Event
       EventOrderService->>S3: Upload generated QR Code PNG
       EventOrderService->>DB: Save EventOrder (Status: PAID)
       EventOrderService->>DB: Credit User loyalty points
   ```
2. **Cancellation Rules**:
   - Ticket cancellations cannot be executed within 10 minutes of event start time (or after the event has started/ended).
   - Once refunded, the order status changes to `CANCELLED`, `stripeRefundId` is stamped, and ticket inventory is returned to the event.
