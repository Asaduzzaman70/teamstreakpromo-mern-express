# Customer Support Module (`src/modules/customerSupport`)

The **Customer Support Module** provides an in-app ticketing and two-way messaging system between users/hosts/merchants and the TeamStreak Promo customer care / admin team.

---

## 1. Overview & Features

- **Ticketing System**: Users (`USER`, `HOST`, `BUSINESS`, `ADMIN`) can raise support tickets with a title, initial description, and priority level.
- **Embedded Conversation Thread**: Each ticket contains an embedded message log (`messages: ISupportMessage[]`) supporting real-time back-and-forth chat.
- **Auto Ticket ID Generation**: Every ticket receives a unique identifier (e.g. `TICK-XXXXXX`).
- **Status Lifecycle**:
  - `UNDER_REVIEW`: Default status upon creation or active customer support dialogue.
  - `SOLVED`: Marked resolved by admin or support agent.
  - `CLOSED`: Fully finalized ticket where no further replies are permitted.
- **UI Formatter Helper**: Outputs pre-formatted UI attributes including `statusBadge` (`amber`, `green`, `gray`), `isMyMessage`, `alignment` (`left` vs `right`), and relative `timeAgo` timestamps.

---

## 2. Directory Structure

```text
src/modules/customerSupport/
├── customerSupport.controller.ts    # Request handlers for ticket creation, messaging, and admin overview
├── customerSupport.interface.ts     # TypeScript definitions for tickets, messages, badges, and filters
├── customerSupport.model.ts         # Mongoose Ticket schema with subdocument messages and indexes
├── customerSupport.route.ts         # Express routes for user tickets and admin moderation
├── customerSupport.service.ts       # Business logic, authorization checks, and message appending
├── customerSupport.validation.ts   # Zod validation schemas for tickets and messages
└── README.md                        # This documentation file
```

---

## 3. Data Model Reference (`SupportTicket`)

| Field | Type | Description |
| :--- | :--- | :--- |
| `ticketId` | String | Unique ticket reference (e.g. `TICK-102938`) |
| `userId` | ObjectId | Reference to creator `User` |
| `userRole` | Enum | Role of user at time of creation (`USER`, `HOST`, `BUSINESS`, `ADMIN`) |
| `title` | String | Short subject or title of issue |
| `description` | String | Initial problem statement |
| `status` | Enum | `'UNDER_REVIEW'` \| `'SOLVED'` \| `'CLOSED'` (default: `'UNDER_REVIEW'`) |
| `priority` | Enum | `'LOW'` \| `'MEDIUM'` \| `'HIGH'` \| `'URGENT'` (default: `'MEDIUM'`) |
| `messages` | Array | Array of message subdocuments (`senderId`, `senderName`, `senderRole`, `isSupportReply`, `message`, `createdAt`) |
| `lastMessageAt`| Date | Timestamp of most recent message (used for chat inbox ordering) |
| `isDeleted` | Boolean | Soft delete flag |

---

## 4. Endpoints & API Reference

Base Prefixes: `/api/customer-support` and `/api/support`

### User / Creator Endpoints (`USER`, `HOST`, `BUSINESS`, `ADMIN`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/tickets` | Create a new support ticket and send initial message. |
| `GET` | `/my-tickets` | List current user's submitted support tickets with pagination and status filters. |
| `GET` | `/tickets/:id` | Get ticket details and full conversational thread. |
| `GET` | `/tickets/:id/messages` | Fetch messages only for a specific ticket. |
| `POST` | `/tickets/:id/messages` | Append a new reply to the ticket thread. Fails if ticket is `CLOSED`. |

### Admin Endpoints (`ADMIN`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/admin/tickets` | View all platform tickets across all users with role, status, and text search. |
| `PATCH` | `/admin/tickets/:id/status` | Update ticket status (`UNDER_REVIEW`, `SOLVED`, `CLOSED`). |

---

## 5. Security & Business Logic

1. **Access Authorization**:
   - Non-admin users can **only** view or post messages to tickets where `userId === req.user._id`.
   - Admins can view and reply to any ticket on the platform.
2. **Closed Ticket Immutability**:
   - Posting a message to a ticket marked `CLOSED` throws an operational `AppError("Ticket is closed and cannot receive new messages", 400)`.
3. **Optimized Indexes**:
   - Indexed on `{ userId: 1, lastMessageAt: -1 }` for instant personal support screen rendering.
   - Indexed on `{ status: 1, lastMessageAt: -1 }` for administrative dashboard feeds.
