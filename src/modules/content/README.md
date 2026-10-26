# Content Module (`src/modules/content`)

The **Content Module** is the Content Management System (CMS) for TeamStreak Promo. It manages public legal pages (Terms and Conditions, Privacy Policy), company information (About Us, Mission), and dynamic support/FAQ pages supporting HTML, Markdown, and plain text formats.

---

## 1. Overview & Capabilities

- **Flexible Retrieval**: Pages can be fetched either by MongoDB ObjectId (`/:idOrSlug`) or by human-readable URL slug (e.g. `/api/contents/terms-and-conditions`).
- **Access Control & Draft Mode**: Public users only see pages with status `PUBLISHED`. Administrators authenticated via `optionalAuth` can view draft and archived pages.
- **Slug Upserting**: Provides an idempotency endpoint (`PUT /upsert/:slug`) allowing seed scripts or admin CMS dashboards to update or create standardized policy pages without ID lookups.
- **System Page Protection**: Identifies system-critical pages (`isSystemPage: true`) that should not be deleted.

---

## 2. Directory Structure

```text
src/modules/content/
├── content.controller.ts    # Handlers for CRUD, slug lookup, status toggle, and upsert
├── content.interface.ts     # IContent document interface, status & contentType types
├── content.model.ts         # Mongoose schema, compound indexes on slug and category
├── content.route.ts         # Express routes with optionalAuth and role protection
├── content.service.ts       # Database queries, slug resolution, and upsert logic
├── content.validation.ts   # Zod validation schemas for page creation and editing
└── README.md                # This documentation file
```

---

## 3. Data Model Reference (`Content`)

| Field | Type | Description |
| :--- | :--- | :--- |
| `title` | String | Title of the page (e.g. "Terms of Service") |
| `slug` | String | URL-friendly unique identifier (e.g. `terms-and-conditions`) |
| `content` | String | Body text (rich HTML or Markdown) |
| `contentType` | Enum | `'HTML'` \| `'MARKDOWN'` \| `'TEXT'` (default: `'HTML'`) |
| `category` | Enum | `'LEGAL'` \| `'TERMS_AND_CONDITIONS'` \| `'COMPANY'` \| `'SUPPORT'` \| `'GENERAL'` |
| `status` | Enum | `'PUBLISHED'` \| `'DRAFT'` \| `'ARCHIVED'` (default: `'PUBLISHED'`) |
| `metaTitle` | String | SEO meta title |
| `metaDescription`| String | SEO meta description |
| `isSystemPage` | Boolean | True for core pages that cannot be deleted |
| `createdBy` | ObjectId | Reference to `User` who created the page |
| `updatedBy` | ObjectId | Reference to `User` who last modified the page |

---

## 4. Endpoints & API Reference

Base Prefix: `/api/contents` (also aliased at `/api/content`)

| Method | Endpoint | Auth Required | Roles | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | Optional | Anyone (Admin sees drafts) | List all pages with optional category, status, and search filters. |
| `GET` | `/:idOrSlug` | Optional | Anyone (Admin sees drafts) | Retrieve page details by ObjectId or slug. |
| `POST` | `/` | Yes | `ADMIN` | Create a new CMS page. |
| `PUT` | `/upsert/:slug` | Yes | `ADMIN` | Create or update a page by its slug. |
| `PATCH` | `/:idOrSlug` | Yes | `ADMIN` | Partially update page title, content, or metadata. |
| `PATCH` | `/:idOrSlug/status` | Yes | `ADMIN` | Update publication status (`PUBLISHED`, `DRAFT`, `ARCHIVED`). |
| `DELETE` | `/:idOrSlug` | Yes | `ADMIN` | Delete CMS page (fails if `isSystemPage: true`). |

---

## 5. Developer & Integration Guidelines

- **Dual ID/Slug Resolver**: The service method `findContentByIdOrSlug(idOrSlug)` detects if the parameter is a valid MongoDB 24-character hexadecimal ObjectId. If so, it queries `_id`; otherwise, it matches on `{ slug: idOrSlug.toLowerCase() }`.
- **System Pages**: Always check `isSystemPage` before attempting deletions.
