# Marketplace Module (`src/modules/marketplace`)

The **Marketplace Module** powers the partner promotional catalog where merchants (`BUSINESS`) list products, services, discount vouchers, and exclusive experiences that users can redeem using accumulated loyalty points.

---

## 1. Overview & Capabilities

- **Reward Points Redemption**: Items in the marketplace are priced in reward `points`. Users redeem points earned from event participation to acquire items.
- **Merchant Management**: Businesses create and maintain their listings, upload product photos to AWS S3, set validity dates (`startDateTime`, `endDateTime`), and monitor inventory quotas (`quantity` vs `claimQuantity`).
- **Geo-Location & Category Browsing**: Listings are categorized by `RewardCategory` and optional `RewardSubCategory`, and include latitude/longitude coordinates for location-based nearby deals.
- **S3 Asset Lifecycle**: Updating or deleting a marketplace item cleans up associated photos from AWS S3.

---

## 2. Directory Structure

```text
src/modules/marketplace/
├── marketplace.controller.ts    # Handlers for listing creation, discovery, stats, and updates
├── marketplace.interface.ts     # TypeScript interface for IMarketplace document and inputs
├── marketplace.model.ts         # Mongoose schema, validation hooks, and references
├── marketplace.route.ts         # Express router with uploadAny, protect, and BUSINESS role guards
├── marketplace.service.ts       # Service methods for CRUD, filtering, pagination, and stock tracking
├── marketplace.validation.ts   # Zod validation schemas for marketplace payloads
└── README.md                    # This documentation file
```

---

## 3. Data Model Reference (`Marketplace`)

| Field | Type | Description |
| :--- | :--- | :--- |
| `businessOwnerId` | ObjectId | Reference to owning `User` with role `BUSINESS` |
| `title` | String | Item or reward title |
| `description` | String | Detailed product/service description |
| `category` | ObjectId | Reference to `RewardCategory` |
| `subCategory` | ObjectId | Optional reference to `RewardSubCategory` |
| `location` | String | Physical address or service area |
| `latitude` | Number | Location latitude coordinate |
| `longitude` | Number | Location longitude coordinate |
| `startDateTime` | Date | Promotional campaign start date |
| `endDateTime` | Date | Promotional campaign expiration date |
| `points` | Number | Point cost required to redeem this item |
| `quantity` | Number | Total available inventory |
| `claimQuantity` | Number | Count of items claimed so far (default: 0) |
| `photos` | Array | S3 image URLs (at least 1 photo required) |
| `isActive` | Boolean | Listing active toggle (default: `true`) |

---

## 4. Endpoints & API Reference

Base Prefix: `/api/marketplaces`

| Method | Endpoint | Auth Required | Roles | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | No (Public) | Anyone | Browse active marketplace listings with search, category filtering, and pagination. |
| `GET` | `/stats` | No (Public) | Anyone | Platform marketplace summary statistics. |
| `GET` | `/:id` | No (Public) | Anyone | Retrieve detailed view of a single listing with owner and category populated. |
| `POST` | `/` | Yes | `BUSINESS`, `ADMIN` | Create a new listing with photo uploads. |
| `GET` | `/my-marketplaces`| Yes | `BUSINESS`, `EMPLOYEE`, `ADMIN` | List all marketplace items belonging to the authenticated business owner (or the Business Partner Employee's employer). |
| `PATCH` | `/:id` | Yes | `BUSINESS` (owner), `ADMIN` | Update listing details, change photo assets, or adjust inventory. |
| `DELETE` | `/:id` | Yes | `BUSINESS` (owner), `ADMIN` | Delete listing and clean up images from AWS S3. |

---

## 5. Domain Rules & Integration Lifecycle

1. **Inventory Stock Checks**:
   - When a user redeems an item via `order.service.ts`, `quantity` must be strictly greater than `claimQuantity`.
   - Successful orders increment `claimQuantity` by the redeemed amount.
2. **Category Validation**:
   - `category` must reference a valid and active `RewardCategory` document.
3. **Owner Isolation**:
   - When updating or deleting, `marketplace.service.ts` verifies that `businessOwnerId` matches `req.user._id` (unless the user has the `ADMIN` role).
