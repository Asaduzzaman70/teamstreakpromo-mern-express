# Category Module (`src/modules/category`)

The **Category Module** provides hierarchical taxonomy (parent categories and child subcategories) used across events, discovery features, and merchant business classification on TeamStreak Promo.

---

## 1. Overview & Purpose

Categories organize platform content:
- Parent categories (e.g. "Sports", "Music", "Food & Drink").
- Subcategories pointing to a parent category via `parentCategory` (e.g. "Football" under "Sports", "Rock Concert" under "Music").
- Publicly readable by all clients, but strictly managed and mutated only by `ADMIN` users.

---

## 2. Directory Structure

```text
src/modules/category/
├── category.controller.ts    # Request handlers for CRUD and category statistics
├── category.interface.ts     # TypeScript category interface & input types
├── category.model.ts         # Mongoose schema supporting recursive self-reference
├── category.route.ts         # Express routes with role authorization and Zod validation
├── category.service.ts       # Database queries, pagination, search, and hierarchy lookups
├── category.validation.ts   # Zod validation schemas for create/update operations
└── README.md                 # This documentation file
```

---

## 3. Data Model Reference (`Category`)

| Field | Type | Description |
| :--- | :--- | :--- |
| `name` | String | Unique name of the category (trimmed) |
| `description` | String | Informational description or summary |
| `parentCategory`| ObjectId | Optional reference to a parent `Category`. `null` for root categories. |
| `isActive` | Boolean | Visibility toggle (default: `true`) |
| `createdAt` | Date | Document creation timestamp |
| `updatedAt` | Date | Document last updated timestamp |

---

## 4. Endpoints & API Reference

Base Prefix: `/api/categories`

| Method | Endpoint | Auth Required | Roles | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | No (Public) | Anyone | Fetch all categories (supports search, pagination, and parent category filtering). |
| `GET` | `/stats` | No (Public) | Anyone | Retrieve aggregate stats (total categories, active count, subcategory counts). |
| `GET` | `/:id` | No (Public) | Anyone | Fetch single category details with populated `parentCategory`. |
| `POST` | `/` | Yes | `ADMIN` | Create a new top-level category or subcategory. |
| `PATCH` | `/:id` | Yes | `ADMIN` | Update category details, parent reference, or `isActive` status. |
| `DELETE` | `/:id` | Yes | `ADMIN` | Delete category (checks for child dependencies or associated events). |

---

## 5. Domain Rules & Considerations

1. **Unique Name Constraint**: Category names are case-insensitively unique in the database.
2. **Hierarchical Relationships**:
   - When `parentCategory` is provided, the service verifies that the referenced parent exists and is itself an active category.
3. **Event Association**:
   - Events in `src/modules/event` validate both `categoryId` and optional `subCategoryId` against active categories in this collection.
