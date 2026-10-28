# Employee Authentication Module (`src/modules/employeeAuth`)

The **Employee Authentication Module** provides dedicated authentication, token refresh, profile retrieval, password management, and logout capabilities for subordinate staff accounts (`EMPLOYEE`) created by either Event Organizers (`HOST`) or Marketplace Merchants (`BUSINESS`).

---

## 1. Overview & Business Purpose

- **Dual Employer Support (`HOST` & `BUSINESS`)**:
  - **Host Employees (`employerType: 'HOST'`)**: Log in to scan event tickets (`POST /api/event-orders/scan`) and event reward orders (`PATCH /api/orders/:id/redeem`) belonging to their Host employer.
  - **Business Partner Employees (`employerType: 'BUSINESS'`)**: Log in to scan and redeem marketplace reward orders (`GET /api/orders/:id` and `PATCH /api/orders/:id/redeem`) belonging to their Business Partner employer.
- **Employer Status Verification**: During login, the service verifies both the employee's `isActive` flag and the parent employer's account status (`isActive`, `isSuspend`, `isDeleted`).
- **Employer Context in Profile & Login Response**: Returns a summary of the parent employer (`_id`, `name`, `email`, `role`, `businessName`, `location`) so mobile scanner apps can immediately display the organization context.

---

## 2. Directory Structure

```text
src/modules/employeeAuth/
├── employeeAuth.controller.ts   # HTTP request handlers wrapped in catchAsync
├── employeeAuth.interface.ts    # TypeScript interfaces for login, tokens, and profile responses
├── employeeAuth.model.ts        # Re-exports the Employee Mongoose model
├── employeeAuth.route.ts        # Express router mounted at /api/employee-auth
├── employeeAuth.service.ts      # Login, token generation, profile lookup, and password logic
├── employeeAuth.validation.ts   # Zod schemas for login, refresh token, and password change
└── README.md                    # Module documentation
```

---

## 3. Endpoints & API Reference

Base Prefix: `/api/employee-auth`

| Method | Endpoint | Auth Roles | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/login` | Public (Rate-Limited) | Authenticate an employee (`HOST` or `BUSINESS` staff) with `email` and `password`, returning `accessToken`, `refreshToken`, `employerType`, and `employer` summary. |
| `POST` | `/refresh-token` | Public (Rate-Limited) | Exchange a valid employee `refreshToken` for a new `accessToken` and `refreshToken` pair. |
| `GET` | `/me` | `EMPLOYEE` | Retrieve the authenticated employee's profile along with their parent employer's details. |
| `PATCH` | `/change-password` | `EMPLOYEE` | Update the authenticated employee's password after verifying `oldPassword` / `currentPassword`. |
| `POST` | `/logout` | `EMPLOYEE` | Invalidate the employee's stored `refreshToken`. |

