# Event Module (`src/modules/event`)

The **Event Module** is the core entertainment and ticketing engine of TeamStreak Promo. It enables event organizers (`HOST`) to publish events with multiple ticket tiers, venue coordinates, artist lineups, and promotional rewards, while empowering users to discover nearby events and purchase tickets.

---

## 1. Overview & Key Capabilities

- **Ticket Tiers & Pricing**: Supports up to 10 distinct pricing categories (`priceCategories`) per event, each with individual pricing and live inventory stock.
- **Geospatial Discovery (50km Radius)**: Calculates geographic proximity between user coordinates (`latitude`, `longitude`) and venue locations within a 50 km spherical radius.
- **Deterministic Seed-Based Random Discovery**: Ensures users browsing the discovery feed experience fair, non-repeating, randomized event suggestions across paginated requests using a client-provided `seed`.
- **Monthly Event Quota Enforcement**: Organizers are capped at a maximum of **30 events per calendar month**.
- **Payout Lifecycle Tracking**: Seamlessly integrates with the `payment` module and background payout sweeper (`PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`, `SKIPPED`).
- **S3 Media Cleanup**: Deleting or updating event posters and artist photos automatically purges orphaned media files from AWS S3.

---

## 2. Directory Structure

```text
src/modules/event/
├── event.controller.ts    # Handlers for event creation, listing, geo-querying, stats, and updates
├── event.interface.ts     # TypeScript definitions for Event, PriceCategory, Artist, and Query filters
├── event.model.ts         # Mongoose schema, compound indexes, and subdocuments
├── event.route.ts         # Express routes configured with Multer uploadAny and Zod validation
├── event.service.ts       # Domain logic: 30-event monthly limit, geo-filtering, S3 deletion
├── event.validation.ts   # Zod validation schemas for event payloads and query parameters
└── README.md              # This documentation file
```

---

## 3. Data Model Reference (`Event`)

| Field | Type | Description |
| :--- | :--- | :--- |
| `hostId` | ObjectId | Reference to `User` with role `HOST` or `BUSINESS` |
| `categoryId` | ObjectId | Reference to `Category` |
| `title` | String | Event headline / name |
| `description` | String | Full markdown/text event details |
| `placeName` | String | Venue address or facility name |
| `latitude` | Number | Venue latitude coordinate |
| `longitude` | Number | Venue longitude coordinate |
| `ageRestriction` | Number | Minimum age required for entry (e.g. 18, 21; default: 0) |
| `startDate` | Date | Event start date and time |
| `endDate` | Date | Event end date and time |
| `priceCategories`| Array | Array of ticket tiers: `[{ name, price, stock }]` (Max 10) |
| `images` | Array | S3 URLs of promotional posters and photos |
| `artistInfo` | Array | Featured artists / performers: `[{ name, role, image, socialMediaLinks }]` |
| `rewards` | Array | Loyalty items claimable with points: `[{ title, description, pointsRequired, stock, images }]` |
| `payoutStatus` | Enum | `'PENDING'` \| `'PROCESSING'` \| `'COMPLETED'` \| `'FAILED'` \| `'SKIPPED'` |
| `payoutAmount` | Number | Net revenue transferred to host via Stripe |
| `platformFeeAmount`| Number | Platform commission deducted |
| `stripeTransferId` | String | Stripe transfer reference |
| `isActive` | Boolean | Visibility toggle (default: `true`) |

---

## 4. Endpoints & API Reference

Base Prefix: `/api/events`

All routes require authentication via `protect`.

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/` | `HOST`, `BUSINESS`, `ADMIN` | Create a new event with image uploads (subject to 30 events/month quota). |
| `GET` | `/` | All logged-in | Discover events with search, category filter, 50km radius, date range, and seed-based shuffle. |
| `GET` | `/admin` | `ADMIN` | Administrative event overview with unrestricted filtering and payout status. |
| `GET` | `/stats` | All logged-in | Aggregate counts (live events, upcoming, tickets sold, revenue). |
| `GET` | `/:id` | All logged-in | Detailed event profile with ticket inventory and artist lineup. |
| `PATCH` or `PUT` | `/:id` | `HOST` (owner), `ADMIN` | Update event information, replace images, adjust ticket tiers. |
| `PATCH` | `/:id/status` | `HOST` (owner), `ADMIN` | Toggle event status or cancel event. |
| `DELETE` | `/:id` | `HOST` (owner), `ADMIN` | Delete event and cleanup all S3 media assets. |

---

## 5. Domain Rules & Gotchas

1. **Host 30-Event Monthly Quota**:
   - `event.service.ts` calculates start and end of the current calendar month:
     ```typescript
     const monthlyEventCount = await Event.countDocuments({
       hostId,
       createdAt: { $gte: startOfMonth, $lte: endOfMonth },
     });
     if (monthlyEventCount >= 30) {
       throw new AppError('Monthly limit reached. You cannot create more than 30 events in a single month.', 400);
     }
     ```
2. **Radius Proximity Search**:
   - When `latitude`, `longitude`, and `radiusInKm` (default 50) are provided in query params, results are filtered within distance.
3. **Ticket Stock Atomicity & Compound Indexes**:
   - Indexed on `{ hostId: 1, createdAt: -1 }`, `{ endDate: 1, isActive: 1, categoryId: 1 }`, `{ endDate: 1, payoutStatus: 1 }`, and `{ latitude: 1, longitude: 1 }`.
   - When orders are placed via `eventOrder` or Stripe webhooks, ticket stock is decremented using MongoDB `$inc: { "priceCategories.$.stock": -qty }` with condition `{ stock: { $gte: qty } }`.
