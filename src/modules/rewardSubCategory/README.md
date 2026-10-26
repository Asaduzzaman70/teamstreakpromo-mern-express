# Reward SubCategory Module (`src/modules/rewardSubCategory`)

The **Reward SubCategory Module** manages granular, secondary classifications for promotional items in the marketplace, linked to a parent `RewardCategory`.

---

## 1. Overview & Capabilities

- **Fine-Grained Classification**: Enables specific sub-groupings under a parent category (e.g. "Beverages" or "Snacks" under "Food & Drinks", "Hats" or "T-Shirts" under "Apparel").
- **Scoped Uniqueness**: Names are uniquely indexed relative to their parent category (`{ name: 1, rewardCategory: 1 }`), allowing duplicate names across different parent categories.
- **Access Control**: Publicly readable for consumers and businesses; mutated strictly by `ADMIN` users.

---

## 2. Directory Structure

```text
src/modules/rewardSubCategory/
├── rewardSubCategory.controller.ts    # Handlers for subcategory CRUD and analytics
├── rewardSubCategory.interface.ts     # TypeScript interface for IRewardSubCategory document
├── rewardSubCategory.model.ts         # Mongoose schema, compound unique index, and references
├── rewardSubCategory.route.ts         # Express routes guarded by protect and ADMIN role
├── rewardSubCategory.service.ts       # Database queries, parent validation, and deletion safety
├── rewardSubCategory.validation.ts   # Zod validation schemas for payload validation
└── README.md                          # This documentation file
```

---

## 3. Data Model Reference (`RewardSubCategory`)

| Field | Type | Description |
| :--- | :--- | :--- |
| `name` | String | Subcategory name (e.g. "Energy Drinks") |
| `description` | String | Description of the subcategory |
| `rewardCategory` | ObjectId | Reference to parent `RewardCategory` (`required: true`) |
| `isActive` | Boolean | Active status toggle (default: `true`) |
| `createdAt` | Date | Record creation timestamp |
| `updatedAt` | Date | Record modification timestamp |

---

## 4. Endpoints & API Reference

Base Prefix: `/api/reward-subcategories`

| Method | Endpoint | Auth Required | Roles | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | No (Public) | Anyone | Fetch all active reward subcategories with search and parent filtering. |
| `GET` | `/stats` | No (Public) | Anyone | Retrieve aggregate stats on subcategories and parent distributions. |
| `GET` | `/:id` | No (Public) | Anyone | Fetch single subcategory with populated `rewardCategory`. |
| `POST` | `/` | Yes | `ADMIN` | Create a new reward subcategory linked to a parent category. |
| `PATCH` | `/:id` | Yes | `ADMIN` | Update subcategory name, parent link, or active toggle. |
| `DELETE` | `/:id` | Yes | `ADMIN` | Delete subcategory (validates that no marketplace items depend on it). |

---

## 5. Domain Rules & Considerations

- **Parent Integrity**: Creating or updating a subcategory verifies that `rewardCategory` points to an existing, active `RewardCategory` document.
- **Compound Unique Index**: Cannot create two subcategories with the same name under the same parent category.
