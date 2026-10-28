# Employee Auth Module (`src/modules/employeeAuth`)

The **Employee Auth Module** (`src/modules/employeeAuth`) handles login, JWT token refresh, profile retrieval, password management, and logout for both Host Employees (`employerType: 'HOST'`) and Business Partner Employees (`employerType: 'BUSINESS'`).

---

## 1. Directory Structure

```text
src/modules/employeeAuth/
├── employeeAuth.controller.ts   # HTTP handlers for login, refresh token, profile, password, and logout
├── employeeAuth.interface.ts    # TypeScript interfaces for auth payloads and responses
├── employeeAuth.model.ts        # Re-exports Employee model
├── employeeAuth.route.ts        # Express router mounted at /api/employee-auth
├── employeeAuth.service.ts      # Self-contained employee authentication service
├── employeeAuth.validation.ts   # Zod schemas for login, refresh token, and password change
└── README.md                    # Module documentation
```

---

## 2. Endpoints & API Reference (`/api/employee-auth`)

| Method | Endpoint | Auth Roles | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/employee-auth/login` | Public | Login with `email` and `password`. Returns `accessToken`, `refreshToken`, `employerType`, and `employer` summary. |
| `POST` | `/api/employee-auth/refresh-token` | Public | Exchange `refreshToken` for a new token pair. |
| `GET` | `/api/employee-auth/me` | `EMPLOYEE` | Get logged-in employee profile and employer details. |
| `PATCH` | `/api/employee-auth/change-password` | `EMPLOYEE` | Change employee's own password. |
| `POST` | `/api/employee-auth/logout` | `EMPLOYEE` | Logout and clear stored `refreshToken`. |

