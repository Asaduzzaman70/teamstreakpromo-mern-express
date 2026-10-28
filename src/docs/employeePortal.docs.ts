export const employeePortalDocs = {
  // ==========================================================================
  // 1. HOST EMPLOYEE — TICKET SCANNER & DASHBOARD (/api/employee-portal/host/*)
  // ==========================================================================
  '/api/employee-portal/host/scan-ticket': {
    post: {
      tags: ['Employee - 3. Portal (Host & Business Operations)'],
      summary: '[Host Employee] Scan & Verify Event Ticket QR Code',
      description:
        'Allows a logged-in Host Employee (`employerType: "HOST"`) to scan an attendee ticket QR code using `ticketId` (e.g. `MOT3203920212`), `orderId`, or raw `qrData`. Marks `isScanned: true` and saves `scannedBy: employeeId`.',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                ticketId: { type: 'string', example: 'MOT3203920212' },
                orderId: { type: 'string', example: '66e520000000000000000001' },
                qrData: { oneOf: [{ type: 'string' }, { type: 'object' }] },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'This Ticket is Valid.' },
        '400': { description: 'Invalid, Cancelled, Expired, or Already Scanned Ticket' },
        '403': { description: 'Forbidden — Only Host employees of this event organizer can scan' },
      },
    },
  },
  '/api/employee-portal/host/scan-ticket/{id}': {
    patch: {
      tags: ['Employee - 3. Portal (Host & Business Operations)'],
      summary: '[Host Employee] Scan & Verify Event Ticket by Ticket ID or Order ID in URL',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string', example: 'MOT3203920212' },
          description: 'Readable Ticket ID (e.g. MOT3203920212) or EventOrder ID',
        },
      ],
      responses: {
        '200': { description: 'This Ticket is Valid.' },
        '400': { description: 'Already scanned, cancelled, or expired' },
        '403': { description: 'Forbidden' },
      },
    },
  },
  '/api/employee-portal/host/scanned-tickets': {
    get: {
      tags: ['Employee - 3. Portal (Host & Business Operations)'],
      summary: '[Host Employee] Get My Scanned Tickets Dashboard Table',
      description:
        'Returns ONLY the tickets scanned by this logged-in Host Employee (`Ticket ID`, `Event Name`, `Date & Time`). The employee cannot view un-scanned tickets or tickets scanned by other employees.',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
        { in: 'query', name: 'limit', schema: { type: 'integer', default: 10 } },
        {
          in: 'query',
          name: 'search',
          schema: { type: 'string' },
          description: 'Search by Ticket ID or Event Name',
        },
        {
          in: 'query',
          name: 'eventId',
          schema: { type: 'string' },
          description: 'Optional Event ID filter',
        },
      ],
      responses: {
        '200': { description: 'Scanned event tickets retrieved successfully' },
        '403': { description: 'Forbidden — Restricted to HOST employees' },
      },
    },
  },
  '/api/employee-portal/host/scanned-tickets/{id}': {
    get: {
      tags: ['Employee - 3. Portal (Host & Business Operations)'],
      summary: '[Host Employee] Get Single Scanned Ticket Details (Must be scanned by self)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string', example: 'MOT3203920212' },
          description: 'Ticket ID or EventOrder ID (must have been scanned by this employee)',
        },
      ],
      responses: {
        '200': { description: 'Scanned ticket details retrieved successfully' },
        '404': { description: 'Scanned ticket not found or was not scanned by your account' },
      },
    },
  },

  // ==========================================================================
  // 2. BUSINESS PARTNER EMPLOYEE — REWARDS & ORDER STATUS (/api/employee-portal/business/*)
  // ==========================================================================
  '/api/employee-portal/business/rewards': {
    get: {
      tags: ['Employee - 3. Portal (Host & Business Operations)'],
      summary: '[Business Employee] Get Business Partner Reward List (Read-Only)',
      description:
        'Returns the paginated list of Marketplace Rewards belonging strictly to the logged-in Business Partner Employee\'s employer (`employerType: "BUSINESS"`). Read-only access.',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
        { in: 'query', name: 'limit', schema: { type: 'integer', default: 10 } },
        {
          in: 'query',
          name: 'search',
          schema: { type: 'string' },
          description: 'Search rewards by title',
        },
        { in: 'query', name: 'isActive', schema: { type: 'boolean' } },
      ],
      responses: {
        '200': { description: 'Business Partner rewards retrieved successfully' },
        '403': { description: 'Forbidden — Restricted to BUSINESS employees' },
      },
    },
  },
  '/api/employee-portal/business/rewards/{id}': {
    get: {
      tags: ['Employee - 3. Portal (Host & Business Operations)'],
      summary: '[Business Employee] Get Single Business Partner Reward Details (Read-Only)',
      description:
        'Retrieves full details of a single reward item belonging to the Business Partner Employee\'s employer.',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
          description: 'Marketplace Reward ID',
        },
      ],
      responses: {
        '200': { description: 'Business Partner reward details retrieved successfully' },
        '404': { description: 'Reward not found or does not belong to employer' },
      },
    },
  },
  '/api/employee-portal/business/orders': {
    get: {
      tags: ['Employee - 3. Portal (Host & Business Operations)'],
      summary: '[Business Employee] Get Reward Orders & Check if User Clicked Redeem (Read-Only)',
      description:
        'Allows a Business Partner Employee to view customer reward orders for their employer and check whether the customer has clicked the Redeem button (`status: "CLAIMED" | "REDEEMED"`, `isRedeemed: true | false`). Employees cannot redeem orders themselves.',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
        { in: 'query', name: 'limit', schema: { type: 'integer', default: 10 } },
        {
          in: 'query',
          name: 'status',
          schema: { type: 'string', enum: ['CLAIMED', 'REDEEMED', 'CANCELLED'] },
          description: 'Filter by CLAIMED or REDEEMED',
        },
        {
          in: 'query',
          name: 'itemId',
          schema: { type: 'string' },
          description: 'Optional filter by specific Marketplace Reward ID',
        },
      ],
      responses: {
        '200': { description: 'Business Partner reward orders retrieved successfully' },
        '403': { description: 'Forbidden — Restricted to BUSINESS employees' },
      },
    },
  },
  '/api/employee-portal/business/orders/{id}': {
    get: {
      tags: ['Employee - 3. Portal (Host & Business Operations)'],
      summary: '[Business Employee] Get Single Reward Order Details & Check Redeem Status (Read-Only)',
      description:
        'Retrieves single reward order details (`status: "CLAIMED" | "REDEEMED"`, `isRedeemed: true | false`) so the Business Partner Employee can verify whether the customer has clicked the Redeem button.',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
          description: 'Order ID',
        },
      ],
      responses: {
        '200': { description: 'Business Partner reward order details retrieved successfully' },
        '404': { description: 'Order not found or does not belong to employer' },
      },
    },
  },
};

