# Employee Module (`src/modules/employee`)

The **Employee Module** enables event organizers (`HOST`) and marketplace merchants (`BUSINESS`) to create, manage, and delegate operational access to subordinate staff members (e.g., ticket verification scanners at venue entrances, order fulfillment handlers).

> **Note:** Employee login, token refresh, profile lookup, and password management are handled by the dedicated **Employee Authentication Module** (`src/modules/employeeAuth` mounted at `/api/employee-auth`).

---

## 1. Overview & Business Purpose

- **Sub-Account Hierarchy**: Employers (`HOST` or `BUSINESS`) create employee records scoped exclusively to their organization via `employerId`.
- **Operational Security**: Staff accounts do not receive full host access (such as bank details or payout settings). Instead, they are provisioned for on-ground execution (e.g., event check-in scanning, order redemption).
- **Independent Credentials**: Each employee has their own unique login email and bcrypt-hashed password.
- **UI Form Compatibility**: Supports both `name` and `userName` (for the "Invite New Team Member" modal) and validates optional `confirmPassword`.

---

## 2. Directory Structure

```text
src/modules/employee/
├── employee.controller.ts    # Handlers for employee creation, listing, updating, and removal
├── employee.interface.ts     # TypeScript definitions for Employee and employer types
├── employee.model.ts         # Mongoose schema, password hashing hook, and comparePassword method
├── employee.route.ts         # Express routes guarded by HOST and BUSINESS role authorization
├── employee.service.ts       # Database operations and employer-scoping validation
├── employee.validation.ts   # Zod validation schemas for employee fields
└── README.md                 # This documentation file
```

---

## 3. Data Model Reference (`Employee`)

| Field | Type | Description |
| :--- | :--- | :--- |
| `name` | String | Full name / userName of staff member |
| `email` | String | Unique login email address |
| `password` | String | Bcrypt-hashed password (never returned in plain text) |
| `employerId` | ObjectId | Reference to the owning `User` (`HOST` or `BUSINESS`) |
| `employerType` | Enum | `'HOST'` \| `'BUSINESS'` |
| `isActive` | Boolean | Account status toggle (default: `true`) |
| `refreshToken` | String | Active refresh token for employee session management |
| `createdAt` | Date | Record creation timestamp |
| `updatedAt` | Date | Record last updated timestamp |

---

## 4. Endpoints & API Reference

Base Prefix: `/api/employees`

All routes require authentication via `protect` and role authorization (`HOST` or `BUSINESS`).

| Method | Endpoint | Auth Roles | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/` | `HOST`, `BUSINESS` | Create a new employee under the authenticated employer (`name` or `userName`, `email`, `password`, optional `confirmPassword`). |
| `GET` | `/` | `HOST`, `BUSINESS` | List all employees belonging to the authenticated employer. |
| `GET` | `/:id` | `HOST`, `BUSINESS` | Retrieve details of a specific employee (strictly employer-scoped). |
| `PATCH` | `/:id` | `HOST`, `BUSINESS` | Update employee details, reset password, or toggle `isActive`. |
| `DELETE` | `/:id` | `HOST`, `BUSINESS` | Remove an employee account from the system. |

---

## 5. Security & Isolation Rules

1. **Strict Multi-Tenant Isolation**:
   - An employer can never view, edit, or delete employees belonging to another host or business. Every query enforces `{ _id: id, employerId: req.user._id }`.
2. **Password Integrity**:
   - Updates to the `password` field trigger Mongoose pre-save hashing (`bcrypt.genSalt(10)`).
   - Passwords and refresh tokens are eliminated from standard serialization.
