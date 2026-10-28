# Employee Module (`src/modules/employee`)

The **Employee Module** (`src/modules/employee`) enables event organizers (`HOST`) and marketplace merchants (`BUSINESS`) to create, list, view, update, and delete their subordinate staff members (`EMPLOYEE`).

- **Employee Login & Profile**: Handled in `src/modules/employeeAuth` (`/api/employee-auth`).
- **Employee Operational Portal (Ticket Scanning & Business Rewards)**: Handled in `src/modules/employeePortal` (`/api/employee-portal`).

---

## 1. Directory Structure

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

## 2. Endpoints & API Reference (`/api/employees`)

All routes require authentication via `protect` and role authorization (`HOST` or `BUSINESS`).

| Method | Endpoint | Auth Roles | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/employees` | `HOST`, `BUSINESS` | Create a new employee (`name` or `userName`, `email`, `password`, optional `confirmPassword`). |
| `GET` | `/api/employees` | `HOST`, `BUSINESS` | List all employees belonging to the authenticated employer. |
| `GET` | `/api/employees/:id` | `HOST`, `BUSINESS` | Retrieve details of a specific employee (strictly employer-scoped). |
| `PATCH` | `/api/employees/:id` | `HOST`, `BUSINESS` | Update employee details, reset password, or toggle `isActive`. |
| `DELETE` | `/api/employees/:id` | `HOST`, `BUSINESS` | Remove an employee account from the system. |
