# Business Partner Analytics Module (`src/modules/businessPartnerAnalytics`)

The **Business Partner Analytics Module** aggregates and computes metrics, redemption volumes, store footfall velocity, and reward sales for Business Partners and Platform Administrators.

---

## 1. Overview & Capabilities

- **Zero IDs Required**: No `businessOwnerId` is needed in requests. The business partner's identity is extracted directly from their JWT Bearer token (`req.user.id`).
- **Dashboard Summary Cards**:
  - `totalClaims`: Total quantity of marketplace reward items claimed by consumers across all active/redeemed orders.
  - `storeVisits`: Total in-store redemptions (`status: 'REDEEMED'`), reflecting physical store visits by customers.
  - `totalRewards`: Total marketplace rewards created by the business partner.
  - `activeRewards`: Total currently active marketplace reward campaigns.
- **Reward Sell Analytics Chart**:
  - Time-bucketed aggregation with customizable resolutions (`week`, `month`, `year`, `last6months`, `last30days`, `last7days`).
  - Zero-padded series generation: ensures all chart ticks (e.g. all 12 months or 7 days) are rendered continuously without missing dates.
  - Measures both total sales (`sells`), order transactions (`claimsCount`), and footfall redemptions (`storeVisits`) for each time period.
- **Optional Single-Reward Drilldown**: Accepts optional `itemId` query parameter to filter analytics to a specific marketplace reward item.

---

## 2. Directory Structure

```text
src/modules/businessPartnerAnalytics/
├── businessPartnerAnalytics.controller.ts    # Extracts partner identity and dispatches responses
├── businessPartnerAnalytics.interface.ts     # TypeScript interfaces, queries, and DTO types
├── businessPartnerAnalytics.model.ts         # Mongoose schema for metric snapshots
├── businessPartnerAnalytics.route.ts         # Express routes guarded by protect & authorizeRoles
├── businessPartnerAnalytics.service.ts       # MongoDB aggregation pipelines and bucket formatters
├── businessPartnerAnalytics.validation.ts    # Zod schemas for query parameters
└── README.md                                 # This documentation file
```

---

## 3. Endpoints & API Reference

Base Prefix: `/api/business-partner-analytics`

All endpoints require authentication (`Bearer <token>`) and authorization (`BUSINESS` or `ADMIN` role). **No ID parameter is required in requests.**

### 3.1 Get Complete Business Partner Analytics
- **Path**: `GET /api/business-partner-analytics`
- **Description**: Returns summary cards (Total Claims, Store Visits, Active Rewards) and the Reward Sell chart data in a single unified payload.
- **Query Parameters**:
  - `range` *(optional)*: Timeframe for reward sell chart (`'week' | 'month' | 'year' | 'last6months' | 'last30days' | 'last7days'`). Default: `'year'`.
  - `year` *(optional)*: Target year (defaults to current UTC year).
  - `month` *(optional)*: Target month `1-12` (defaults to current UTC month).
  - `itemId` *(optional)*: Filter analytics to a specific marketplace reward item.
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Business partner analytics retrieved successfully",
  "data": {
    "overview": {
      "totalClaims": 12450,
      "storeVisits": 12450,
      "totalRewards": 15,
      "activeRewards": 12,
      "totalClaimOrders": 3820
    },
    "rewardSellChart": {
      "range": "year",
      "year": 2026,
      "totalSells": 12450,
      "totalStoreVisits": 12450,
      "data": [
        { "label": "Jan", "date": "2026-01-01", "sells": 120, "claimsCount": 35, "storeVisits": 110 },
        { "label": "Feb", "date": "2026-02-01", "sells": 210, "claimsCount": 42, "storeVisits": 195 },
        { "label": "Mar", "date": "2026-03-01", "sells": 140, "claimsCount": 30, "storeVisits": 130 },
        { "label": "Apr", "date": "2026-04-01", "sells": 280, "claimsCount": 55, "storeVisits": 270 },
        { "label": "May", "date": "2026-05-01", "sells": 300, "claimsCount": 60, "storeVisits": 290 },
        { "label": "Jun", "date": "2026-06-01", "sells": 420, "claimsCount": 78, "storeVisits": 405 }
      ]
    }
  }
}
```

### 3.2 Get Overview Statistics Only
- **Path**: `GET /api/business-partner-analytics/overview`
- **Description**: Returns top summary statistics cards (`totalClaims`, `storeVisits`, `totalRewards`, `activeRewards`).
- **Query Parameters**:
  - `itemId` *(optional)*: Filter by specific marketplace reward item.

### 3.3 Get Reward Sell Chart Data
- **Path**: `GET /api/business-partner-analytics/reward-sells`
- **Description**: Returns time-bucketed reward sales and footfall redemption counts for rendering line/bar charts.
- **Query Parameters**:
  - `range` *(optional)*: `'week' | 'month' | 'year' | 'last6months' | 'last30days' | 'last7days'` (Default: `'week'`).
  - `year` *(optional)*: Year number (e.g. `2026`).
  - `month` *(optional)*: Month number `1-12`.
  - `itemId` *(optional)*: Filter by reward item ObjectId.

---

## 4. Calculation Rules & Invariants

1. **Eligible Statuses**:
   - `totalClaims`: Sum of order `quantity` where `itemType: 'MARKETPLACE'` and `status: { $in: ['CLAIMED', 'REDEEMED'] }`.
   - `storeVisits`: Sum of order `quantity` where `itemType: 'MARKETPLACE'` and `status: 'REDEEMED'`.
   - Cancelled claims (`'CANCELLED'`) are strictly excluded.
2. **Zero Padding & Continuous Series**:
   - The aggregation service fills all missing buckets with `0` so charts never have missing axes or discontinuous points.
