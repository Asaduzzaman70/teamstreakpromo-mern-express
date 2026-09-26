export const eventOrderDocs = {
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
                        qrCode: { type: 'string', example: 'https://teamstreakpromo-bucket.s3.us-east-1.amazonaws.com/qrcodes/1727330000000-order-66e520000000000000000001.png' },
                        status: { type: 'string', example: 'PAID' },
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
      description: 'Retrieves details for a specific event ticket order by ID.',
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
          description: 'Event Order ID',
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
                      qrCode: { type: 'string', example: 'https://teamstreakpromo-bucket.s3.us-east-1.amazonaws.com/qrcodes/1727330000000-order-66e520000000000000000001.png' },
                      status: { type: 'string', example: 'PAID' },
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
