export const eventOrderDocs = {
  '/api/event-orders/scan': {
    post: {
      tags: ['Event Orders'],
      summary: 'Scan & Verify Event Ticket QR Code (Venue Entry Check-In)',
      description:
        'Scans an event ticket QR code at the venue entrance using ticketId (e.g. MOT3203920212), orderId, or raw qrData JSON. Validates ownership, ensures the ticket is not cancelled or expired, and atomically marks the ticket as scanned (isScanned: true) so it cannot be reused.',
      security: [
        {
          bearerAuth: [],
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                ticketId: {
                  type: 'string',
                  example: 'MOT3203920212',
                  description: 'Readable Ticket ID from QR code (e.g. MOT3203920212)',
                },
                orderId: {
                  type: 'string',
                  example: '66e520000000000000000001',
                  description: 'EventOrder MongoDB ID from QR code',
                },
                qrData: {
                  oneOf: [{ type: 'string' }, { type: 'object' }],
                  description: 'Optional raw QR code JSON string or parsed QR object from scanner',
                },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'This Ticket is Valid.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  statusCode: { type: 'number', example: 200 },
                  message: { type: 'string', example: 'This Ticket is Valid.' },
                  data: {
                    type: 'object',
                    properties: {
                      isValid: { type: 'boolean', example: true },
                      statusText: { type: 'string', example: 'This Ticket is Valid.' },
                      ticketId: { type: 'string', example: 'MOT3203920212' },
                      orderId: { type: 'string', example: '66e520000000000000000001' },
                      qrCode: {
                        type: 'string',
                        example:
                          'https://teamstreakpromo-bucket.s3.us-east-1.amazonaws.com/qrcodes/order-66e520000000000000000001.png',
                      },
                      event: {
                        type: 'string',
                        example: 'Music Celebration: Highland Park, Alaska',
                      },
                      eventLocation: { type: 'string', example: 'Alaska 99611, USA' },
                      dateTime: { type: 'string', example: 'Nov 24,23 - 10.00 PM' },
                      eventOrganizer: { type: 'string', example: 'Music of Tour' },
                      isScanned: { type: 'boolean', example: true },
                      scannedAt: { type: 'string', example: '2026-10-28T04:50:00.000Z' },
                      totalTicketQuantity: { type: 'number', example: 2 },
                      totalAmount: { type: 'number', example: 300 },
                    },
                  },
                },
              },
            },
          },
        },
        '400': {
          description: 'Invalid, Cancelled, Expired, or Already Scanned Ticket',
        },
        '403': {
          description: 'Forbidden - Ticket belongs to another organizer',
        },
        '404': {
          description: 'Ticket not found',
        },
      },
    },
  },
  '/api/event-orders/{id}/scan': {
    patch: {
      tags: ['Event Orders'],
      summary: 'Scan & Check-In Event Ticket by Order ID or Ticket ID',
      description:
        'Scans and verifies an event ticket by passing either the MongoDB Order ID or readable Ticket ID (e.g. MOT3203920212) in the URL path.',
      security: [
        {
          bearerAuth: [],
        },
      ],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
          description: 'Event Order ID or Ticket ID (e.g. MOT3203920212)',
        },
      ],
      responses: {
        '200': {
          description: 'This Ticket is Valid.',
        },
        '400': {
          description: 'Ticket already scanned, cancelled, or expired',
        },
        '403': {
          description: 'Forbidden - Not authorized to scan this event ticket',
        },
        '404': {
          description: 'Ticket not found',
        },
      },
    },
  },
  '/api/event-orders/scanned-tickets': {
    get: {
      tags: ['Event Orders'],
      summary: 'Get Scanned Tickets Dashboard List (Host Employee sees ONLY tickets they scanned)',
      description:
        'Returns a paginated table of scanned event tickets (`Ticket ID`, `Event Name`, `Date & Time`). When called by a Host Employee (`role: "EMPLOYEE"`), this endpoint strictly returns **only** the tickets scanned by that specific employee (`scannedBy: req.user.id`). When called by a `HOST`, it returns all scanned tickets for the host\'s events.',
      security: [
        {
          bearerAuth: [],
        },
      ],
      parameters: [
        {
          in: 'query',
          name: 'page',
          required: false,
          schema: { type: 'integer', default: 1 },
          description: 'Page number (default: 1)',
        },
        {
          in: 'query',
          name: 'limit',
          required: false,
          schema: { type: 'integer', default: 10 },
          description: 'Items per page (default: 10)',
        },
        {
          in: 'query',
          name: 'search',
          required: false,
          schema: { type: 'string' },
          description: 'Search by Ticket ID (e.g. MOT3203920212) or Event Name',
        },
        {
          in: 'query',
          name: 'eventId',
          required: false,
          schema: { type: 'string' },
          description: 'Optional Event ID filter',
        },
      ],
      responses: {
        '200': {
          description: 'Scanned event tickets retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  statusCode: { type: 'number', example: 200 },
                  message: {
                    type: 'string',
                    example: 'Scanned event tickets retrieved successfully',
                  },
                  meta: {
                    type: 'object',
                    properties: {
                      page: { type: 'number', example: 1 },
                      limit: { type: 'number', example: 10 },
                      total: { type: 'number', example: 8 },
                      totalPage: { type: 'number', example: 1 },
                    },
                  },
                  data: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        _id: { type: 'string', example: '66e520000000000000000001' },
                        orderId: { type: 'string', example: '66e520000000000000000001' },
                        ticketId: { type: 'string', example: 'MOT3203920212' },
                        eventName: {
                          type: 'string',
                          example: "Ella's Creative Showcase",
                        },
                        dateTime: {
                          type: 'string',
                          example: 'Aug 15,26 - 10.00 AM',
                        },
                        scannedAt: {
                          type: 'string',
                          format: 'date-time',
                          example: '2026-08-15T10:00:00.000Z',
                        },
                        eventStartDate: {
                          type: 'string',
                          format: 'date-time',
                          example: '2026-08-15T10:00:00.000Z',
                        },
                        eventLocation: { type: 'string', example: 'Alaska 99611, USA' },
                        totalTicketQuantity: { type: 'number', example: 1 },
                        totalAmount: { type: 'number', example: 150 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '401': { description: 'Unauthorized' },
        '403': { description: 'Forbidden' },
      },
    },
  },
  '/api/event-orders/my-orders': {
    get: {
      tags: ['Event Orders'],
      summary: 'Get My Event Ticket Orders',
      description: 'Retrieves a paginated list of event ticket purchase orders for the logged-in user.',
      security: [
        {
          bearerAuth: [],
        },
      ],
      parameters: [
        {
          in: 'query',
          name: 'page',
          schema: { type: 'integer', default: 1 },
          description: 'Page number',
        },
        {
          in: 'query',
          name: 'limit',
          schema: { type: 'integer', default: 10 },
          description: 'Number of items per page',
        },
        {
          in: 'query',
          name: 'status',
          schema: { type: 'string', enum: ['PAID', 'CANCELLED', 'COMPLETED'] },
          description: 'Filter by order status',
        },
      ],
      responses: {
        '200': {
          description: 'My event orders retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  statusCode: { type: 'number', example: 200 },
                  message: { type: 'string', example: 'My event orders retrieved successfully' },
                  meta: {
                    type: 'object',
                    properties: {
                      page: { type: 'number', example: 1 },
                      limit: { type: 'number', example: 10 },
                      total: { type: 'number', example: 5 },
                      totalPage: { type: 'number', example: 1 },
                    },
                  },
                  data: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        _id: { type: 'string', example: '66e520000000000000000001' },
                        user: { type: 'string', example: '66e510000000000000000001' },
                        hostId: { type: 'string', example: '66e510000000000000000002' },
                        eventId: {
                          type: 'object',
                          properties: {
                            _id: { type: 'string', example: '66e500000000000000000001' },
                            title: { type: 'string', example: 'Summer Music Festival 2026' },
                            description: { type: 'string', example: 'Annual summer music festival' },
                            placeName: { type: 'string', example: 'Central Park Arena' },
                            images: { type: 'array', items: { type: 'string' } },
                          },
                        },
                        tickets: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              priceCategoryId: { type: 'string', example: '66e500000000000000000010' },
                              categoryName: { type: 'string', example: 'VIP Pass' },
                              unitPrice: { type: 'number', example: 150 },
                              quantity: { type: 'number', example: 2 },
                            },
                          },
                        },
                        totalTicketQuantity: { type: 'number', example: 2 },
                        totalAmount: { type: 'number', example: 300 },
                        stripeSessionId: { type: 'string', example: 'cs_test_a1b2c3d4' },
                        ticketId: { type: 'string', example: 'MOT3203920212' },
                        qrCode: { type: 'string', example: 'https://teamstreakpromo-bucket.s3.us-east-1.amazonaws.com/qrcodes/1727330000000-order-66e520000000000000000001.png' },
                        status: { type: 'string', example: 'PAID' },
                        isScanned: { type: 'boolean', example: false },
                        pointsEarned: { type: 'number', example: 2 },
                        createdAt: { type: 'string', example: '2026-09-14T12:00:00.000Z' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '401': {
          description: 'Unauthorized - Missing or invalid token',
        },
      },
    },
  },
  '/api/event-orders/{id}': {
    get: {
      tags: ['Event Orders'],
      summary: 'Get Event Ticket Order Details',
      description: 'Retrieves details for a specific event ticket order by Order ID or Ticket ID (e.g. MOT3203920212).',
      security: [
        {
          bearerAuth: [],
        },
      ],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
          description: 'Event Order ID or Ticket ID',
        },
      ],
      responses: {
        '200': {
          description: 'Event order retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  statusCode: { type: 'number', example: 200 },
                  message: { type: 'string', example: 'Event order retrieved successfully' },
                  data: {
                    type: 'object',
                    properties: {
                      _id: { type: 'string', example: '66e520000000000000000001' },
                      user: { type: 'string', example: '66e510000000000000000001' },
                      hostId: { type: 'string', example: '66e510000000000000000002' },
                      eventId: { type: 'object' },
                      tickets: { type: 'array', items: { type: 'object' } },
                      totalTicketQuantity: { type: 'number', example: 2 },
                      totalAmount: { type: 'number', example: 300 },
                      ticketId: { type: 'string', example: 'MOT3203920212' },
                      qrCode: { type: 'string', example: 'https://teamstreakpromo-bucket.s3.us-east-1.amazonaws.com/qrcodes/1727330000000-order-66e520000000000000000001.png' },
                      status: { type: 'string', example: 'PAID' },
                      isScanned: { type: 'boolean', example: false },
                      pointsEarned: { type: 'number', example: 2 },
                    },
                  },
                },
              },
            },
          },
        },
        '401': { description: 'Unauthorized' },
        '403': { description: 'Forbidden - Not authorized to view this event order' },
        '404': { description: 'Event order not found' },
      },
    },
  },
};
