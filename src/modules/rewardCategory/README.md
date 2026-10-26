# Reward Category Module (`src/modules/rewardCategory`)

The **Reward Category Module** manages parent promotional categories used to organize products, services, and vouchers available for points redemption in the marketplace.

---

## 1. Overview & Capabilities

- **Taxonomy Organization**: Defines top-level reward classifications (e.g., "Food & Beverages", "Electronics", "Apparel & Merch", "VIP Experiences").
- **Marketplace Linkage**: Used by `src/modules/marketplace` to categorize reward listings (`category: ObjectId`).
- **Access Control**: Category lists are publicly readable by all clients, while create, update, and delete actions are strictly restricted to `ADMIN` users.

---

## 2. Directory Structure

```text
src/modules/rewardCategory/
├── rewardCategory.controller.ts    # Handlers for CRUD operations and reward category metrics
├── rewardCategory.interface.ts     # TypeScript interface for IRewardCategory document
├── rewardCategory.model.ts         # Mongoose schema with unique name constraint and timestamps
├── rewardCategory.route.ts         # Express routes guarded by ADMIN role authorization
├── rewardCategory.service.ts       # Service methods for DB queries, pagination, and deletion safety
├── rewardCategory.validation.ts   # Zod validation schemas for payload validation
└── README.md                       # This documentation file
```

---

## 3. Data Model Reference (`RewardCategory`)

| Field | Type | Description |
| :--- | :--- | :--- |
| `name` | String | Unique name of the reward category (e.g. "Merchandise") |
| `description` | String | Optional summary or description |
| `isActive` | Boolean | Visibility toggle (default: `true`) |
| `createdAt` | Date | Document creation timestamp |
| `updatedAt` | Date | Document update timestamp |

---

## 4. Endpoints & API Reference

Base Prefix: `/api/reward-categories`

| Method | Endpoint | Auth Required | Roles | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | No (Public) | Anyone | Fetch all active reward categories with search and pagination. |
| `GET` | `/stats` | No (Public) | Anyone | Aggregate statistics on reward categories and active counts. |
| `GET` | `/:id` | No (Public) | Anyone | Fetch single reward category by ObjectId. |
| `POST` | `/` | Yes | `ADMIN` | Create a new reward category. |
| `PATCH` | `/:id` | Yes | `ADMIN` | Update reward category name, description, or active status. |
| `DELETE` | `/:id` | Yes | `ADMIN` | Delete category (verifies child subcategories or marketplace references). |

---

## 5. Domain Rules & Relationships

- **Uniqueness**: Category names are unique across the collection.
- **Hierarchical Children**: Granular subdivisions of these categories are managed in `src/modules/rewardSubCategory`.
- **Marketplace Protection**: Before deleting a category, ensure active marketplace items are not orphaned or reassign them to an active category.
