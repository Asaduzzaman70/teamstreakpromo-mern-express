# Host Analytics Module (`src/modules/hostAnalytics`)

The **Host Analytics Module** aggregates and computes metrics, key performance indicators (KPIs), financial earnings, and ticket sales velocity strictly for the authenticated Event Host.

---

## 1. Overview & Capabilities

- **Zero IDs Required**: No `hostId` is needed in requests. The host's identity is extracted directly from their JWT Bearer token (`req.user.id`).
- **Host Dashboard Analytics**: Provides complete financial and attendance analytics matching the Host Dashboard UI.
- **Top Summary Metrics**: Calculates exact lifetime or filtered `totalRevenue`, `totalTicketsSold`, `totalEvents`, and `totalOrders`.
- **Revenue Analytics**:
  - Time bucket aggregation with customizable resolutions (`week`, `month`, `year`, `last6months`, `last30days`, `last7days`).
  - Zero-padded series generation: ensures all chart ticks (e.g. all 12 months or 7 days) are rendered without gaps or missing dates.
  - Accurate monetary sums rounded to two decimal places.
- **Ticket Sales Velocity**:
  - Mirrors revenue chart capabilities with quantity counts for attendance and ticket sales.
  - Fully decoupled filters: allows the Revenue chart (e.g. Week) and Ticket Sales chart (e.g. Month) to update independently.
- **Optional Single-Event Drilldown**: Accepts optional `eventId` query parameter to scope analytics to an individual event owned by the host.

---

## 2. Directory Structure

```text
src/modules/hostAnalytics/
├── hostAnalytics.controller.ts    # Extracts host identity from token and dispatches response
├── hostAnalytics.interface.ts     # TypeScript interfaces, queries, and DTO types
├── hostAnalytics.model.ts         # Mongoose schema for metrics and snapshots
├── hostAnalytics.route.ts         # Express routes guarded by protect & authorizeRoles
├── hostAnalytics.service.ts       # MongoDB aggregation pipelines and bucket formatters
├── hostAnalytics.validation.ts    # Zod schemas for query parameters
└── README.md                      # This documentation file
```

---

## 3. Endpoints & API Reference

Base Prefix: `/api/host-analytics`

All endpoints require authentication (`Bearer <token>`) and authorization (`HOST` role). **No ID parameter is needed**.

### 3.1 Get Complete Host Analytics
- **Path**: `GET /api/host-analytics`
- **Description**: Returns summary cards, revenue chart data, and ticket sales chart data in a single unified payload for the authenticated host.
- **Query Parameters**:
  - `range` *(optional)*: Global timeframe fallback (`'week' | 'month' | 'year' | 'last6months' | 'last30days' | 'last7days'`). Default: `'year'`.
  - `revenueRange` *(optional)*: Specific timeframe for revenue chart. Default: `'year'`.
  - `ticketRange` *(optional)*: Specific timeframe for ticket sales chart. Default: `'month'`.
  - `year` *(optional)*: Target year (defaults to current UTC year).
  - `month` *(optional)*: Target month `1-12` (defaults to current UTC month).
  - `eventId` *(optional)*: Filter analytics to a specific event of the host.
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Host analytics retrieved successfully",
  "data": {
    "overview": {
      "totalRevenue": 12450,
      "totalTicketsSold": 12450,
      "totalEvents": 8,
      "totalOrders": 142
    },
    "revenueChart": {
      "range": "year",
      "year": 2026,
      "totalRevenue": 12450,
      "data": [
        { "label": "Jan", "date": "2026-01-01", "revenue": 1200, "ordersCount": 15 },
        { "label": "Feb", "date": "2026-02-01", "revenue": 2100, "ordersCount": 24 },
        { "label": "Mar", "date": "2026-03-01", "revenue": 1400, "ordersCount": 18 },
        { "label": "Apr", "date": "2026-04-01", "revenue": 500, "ordersCount": 8 },
        { "label": "May", "date": "2026-05-01", "revenue": 1800, "ordersCount": 20 },
        { "label": "Jun", "date": "2026-06-01", "revenue": 2200, "ordersCount": 25 }
      ]
    },
    "ticketSalesChart": {
      "range": "month",
      "year": 2026,
      "month": 5,
      "totalTicketsSold": 12450,
      "data": [
        { "label": "01", "date": "2026-05-01", "ticketsSold": 120, "ordersCount": 4 },
        { "label": "02", "date": "2026-05-02", "ticketsSold": 210, "ordersCount": 7 }
      ]
    }
  }
}
```

### 3.2 Get Overview Statistics Only
- **Path**: `GET /api/host-analytics/overview`
- **Description**: Returns top summary statistics cards (`totalRevenue`, `totalTicketsSold`, `totalEvents`, `totalOrders`) for the logged-in host.
- **Query Parameters**:
  - `eventId` *(optional)*: Filter by specific event ObjectId.

### 3.3 Get Host Revenue Chart
- **Path**: `GET /api/host-analytics/revenue`
- **Description**: Returns time-bucketed revenue data for rendering bar and area charts.
- **Query Parameters**:
  - `range` *(optional)*: `'week' | 'month' | 'year' | 'last6months' | 'last30days' | 'last7days'` (Default: `'year'`).
  - `year` *(optional)*: Year number (e.g. `2026`).
  - `month` *(optional)*: Month number `1-12`.
  - `eventId` *(optional)*: Filter by event ObjectId.

### 3.4 Get Host Ticket Sales Chart
- **Path**: `GET /api/host-analytics/ticket-sales`
- **Description**: Returns time-bucketed ticket sales counts for rendering line charts.
- **Query Parameters**:
  - `range` *(optional)*: `'week' | 'month' | 'year' | 'last6months' | 'last30days' | 'last7days'` (Default: `'month'`).
  - `year` *(optional)*: Year number (e.g. `2026`).
  - `month` *(optional)*: Month number `1-12`.
  - `eventId` *(optional)*: Filter by event ObjectId.

---

## 4. Calculation Rules & Invariants

1. **Eligible Statuses**:
   - Only orders with `status: { $in: ['PAID', 'COMPLETED'] }` belonging to the authenticated host are included.
   - Cancelled orders (`'CANCELLED'`) are strictly excluded.
2. **Revenue Calculation**:
   - `totalRevenue`: Sum of `totalAmount` across all matching event orders.
   - All monetary values are rounded to two decimal places: `Math.round(val * 100) / 100`.
3. **Ticket Quantity Calculation**:
   - `totalTicketsSold`: Sum of `totalTicketQuantity` across all matching event orders.
4. **Zero Padding & Continuous Series**:
   - The aggregation service fills all missing buckets (months, days, or days of week) with `0` so charts never have missing axes or discontinuous series.
