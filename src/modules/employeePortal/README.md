# Employee Portal Module (`src/modules/employeePortal`)

The **Employee Portal Module** (`src/modules/employeePortal`) provides dedicated, self-contained operational endpoints for authenticated employees (`role: 'EMPLOYEE'`):
1. **Host Employees (`employerType: 'HOST'`)**: Scan event ticket QR codes and view a dashboard table of **only** the tickets that they personally scanned.
2. **Business Partner Employees (`employerType: 'BUSINESS'`)**: View their Business Partner's reward list/details and check customer reward orders to see whether the customer has clicked the Redeem button (`status: 'CLAIMED' | 'REDEEMED'`, `isRedeemed: true | false`).

---

## 1. Directory Structure

```text
src/modules/employeePortal/
├── employeePortal.controller.ts   # HTTP handlers for host scanner and business reward views
├── employeePortal.interface.ts    # TypeScript interfaces for scanner inputs and query filters
├── employeePortal.model.ts        # Re-exports Employee model
├── employeePortal.route.ts        # Express router mounted at /api/employee-portal
├── employeePortal.service.ts      # Self-contained database queries (no external service dependencies)
├── employeePortal.validation.ts   # Zod schemas for ticket scan payloads
└── README.md                      # Module documentation
```

---

## 2. Endpoints & API Reference (`/api/employee-portal`)

### 2.1 Host Employee Endpoints (`employerType: 'HOST'`)

| Method | Endpoint | Auth Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/employee-portal/host/scan-ticket` | `EMPLOYEE` (`HOST`) | Scan & verify an event ticket QR code (`ticketId`, `orderId`, or `qrData`). |
| `PATCH` | `/api/employee-portal/host/scan-ticket/:id` | `EMPLOYEE` (`HOST`) | Scan & verify an event ticket by passing `ticketId` or `orderId` in the URL. |
| `GET` | `/api/employee-portal/host/scanned-tickets` | `EMPLOYEE` (`HOST`) | Dashboard table (`ticketId`, `eventName`, `dateTime`) returning **ONLY** the tickets scanned by this specific Host Employee. |
| `GET` | `/api/employee-portal/host/scanned-tickets/:id` | `EMPLOYEE` (`HOST`) | View single ticket details (strictly restricted to tickets scanned by this employee). |

### 2.2 Business Partner Employee Endpoints (`employerType: 'BUSINESS'` — Read-Only)

| Method | Endpoint | Auth Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/employee-portal/business/rewards` | `EMPLOYEE` (`BUSINESS`) | View the reward list belonging to the employee's Business Partner (`employerId`). |
| `GET` | `/api/employee-portal/business/rewards/:id` | `EMPLOYEE` (`BUSINESS`) | View details of a single reward belonging to the employee's Business Partner. |
| `GET` | `/api/employee-portal/business/orders` | `EMPLOYEE` (`BUSINESS`) | View customer reward orders for the Business Partner and check whether the customer clicked Redeem (`status`, `isRedeemed`). |
| `GET` | `/api/employee-portal/business/orders/:id` | `EMPLOYEE` (`BUSINESS`) | View single reward order details and check `status` / `isRedeemed` (Read-Only; employees cannot redeem). |

