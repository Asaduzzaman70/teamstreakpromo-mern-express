# Event Order Module (`src/modules/eventOrder`)

The **Event Order Module** handles event ticket purchases, automated QR code generation, attendee digital ticket passes, venue QR scanning & entry check-in, stock deduction, and ticket cancellation workflows.

---

## 1. Overview & Capabilities

- **Post-Payment Ticket Generation**: Triggered automatically upon Stripe webhook confirmation (`checkout.session.completed`).
- **Dynamic QR Code Pass**: Creates a structured QR code image embedded with event name, venue, date/time, ticket ID, order ID, and ticket breakdown. The QR code image is uploaded to AWS S3.
- **Readable Ticket Codes**: Automatically formats human-readable ticket numbers (e.g. `MOT3203920212`) based on organizer or event initials.
- **Venue QR Ticket Scanning & Check-In**: Enables event hosts (`HOST`, `BUSINESS`), their subordinate staff (`EMPLOYEE`), or `ADMIN` to scan attendee QR codes (`POST /scan` or `PATCH /:id/scan`) at the event entrance, verifying validity and atomically marking `isScanned = true` to prevent ticket reuse.
- **Stock Decrement**: Atomically reduces available ticket inventory in the corresponding `priceCategories` of the `Event` document.
- **Reward Points Credit**: Credits the buyer with promotional loyalty points upon ticket acquisition.
- **Ticket Cancellation & Refunds**: Routes ticket cancellations through the `payment` module to process Stripe refunds and restore ticket stock, subject to event start time cutoffs.

---

## 2. Directory Structure

```text
src/modules/eventOrder/
├── eventOrder.controller.ts    # Handlers for personal order history, ticket inspection, and QR scanning
├── eventOrder.interface.ts     # TypeScript interfaces for EventOrder, ticket tiers, scan inputs, and payout status
├── eventOrder.model.ts         # Mongoose schema, compound indexes, and references
├── eventOrder.route.ts         # Express routes guarded by protect and role middlewares
├── eventOrder.service.ts       # Logic for ticket creation, QR generation, venue scan check-in, and order queries
├── eventOrder.validation.ts    # Zod validation schema for QR scan requests
└── README.md                   # This documentation file
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
| `ticketId` | String | Human-readable ticket identifier (e.g. `MOT3203920212`) |
| `qrCode` | String | AWS S3 URL of the generated QR code PNG |
| `status` | Enum | `'PAID'` \| `'CANCELLED'` \| `'COMPLETED'` (default: `'PAID'`) |
| `isScanned` | Boolean | Whether the ticket QR code has been scanned for venue entry (default: `false`) |
| `scannedAt` | Date | Timestamp when the ticket was scanned at the venue |
| `scannedBy` | ObjectId | Reference to the Host, Employee, or Admin who scanned the ticket |
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

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/scan` | `HOST`, `BUSINESS`, `EMPLOYEE`, `ADMIN` | Scan & verify ticket via `ticketId`, `orderId`, or raw `qrData` in request body. |
| `PATCH` | `/:id/scan` | `HOST`, `BUSINESS`, `EMPLOYEE`, `ADMIN` | Scan & verify ticket by passing `orderId` or `ticketId` (`MOT3203920212`) in URL path. |
| `GET` | `/scanned-tickets` | `EMPLOYEE`, `HOST`, `BUSINESS`, `ADMIN` | Dashboard list of scanned tickets (`ticketId`, `eventName`, `dateTime`). Host Employees see **only** tickets they personally scanned (`scannedBy = req.user.id`). |
| `GET` | `/my-orders` | All logged-in | Fetch the current user's purchased event tickets (or for `EMPLOYEE`, their personally scanned tickets). |
| `GET` | `/:id` | Buyer, Host, Employee (if scanned by self), `ADMIN` | Retrieve single ticket pass details by `orderId` or `ticketId`. Host Employees can only view tickets they personally scanned. |
| `POST` | `/:orderId/cancel` | Ticket owner, `ADMIN` | Cancel ticket and initiate Stripe refund (delegated to `PaymentController.cancelEventOrder`). |

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
2. **Venue QR Ticket Scan Flow**:
   - Host or Employee scans attendee's QR code using the mobile scanner (`POST /api/event-orders/scan` or `PATCH /api/event-orders/:id/scan`).
   - Service verifies that the scanner owns the event (or is an active employee of the event host), checks that the ticket is not `CANCELLED` or expired, and atomically updates `isScanned: true` and `scannedAt`.
   - If the same ticket is scanned a second time, the API rejects it (`400 Bad Request - Already Scanned`).
3. **Cancellation & Concurrency Rules**:
   - `stripeSessionId` is indexed with `{ unique: true, sparse: true }`, and compound indexes on `{ user: 1, createdAt: -1 }` and `{ eventId: 1, status: 1 }` optimize order history and sales aggregations.
   - Ticket cancellations cannot be executed within 10 minutes of event start time (or after the event has started/ended).
   - Once refunded, the order status changes to `CANCELLED`, `stripeRefundId` is stamped, and ticket inventory is atomically returned to the event.
