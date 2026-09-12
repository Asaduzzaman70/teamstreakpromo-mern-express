export const orderDocs = {
  '/api/orders': {
    post: {
      summary: 'Place an order for a marketplace or event item (Access: USER)',
      description: `Place an order using points.
- **For Marketplace**: provide \`itemType: "MARKETPLACE"\` and \`itemId\` (Marketplace ID).
- **For Event**: provide \`itemType: "EVENT"\`, \`eventId\`, and \`rewardItemId\` (or \`itemId\` as the reward/event ID).`,
      tags: ['Order'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['itemType'],
              properties: {
                itemType: { type: 'string', enum: ['MARKETPLACE', 'EVENT'], example: 'MARKETPLACE' },
                itemId: { type: 'string', example: '6aa10171252cac29958233df', description: 'Marketplace Item ID (for MARKETPLACE)' },
                eventId: { type: 'string', example: '6aa10171252cac29958233df', description: 'Event ID (for EVENT)' },
                rewardItemId: { type: 'string', example: '6aa10171252cac29958233df', description: 'Reward ID inside event (for EVENT)' },
                quantity: { type: 'number', example: 1, default: 1 },
              },
            },
          },
        },
      },
      responses: {
        '201': {
          description: 'Order placed successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  statusCode: { type: 'number', example: 201 },
                  message: { type: 'string', example: 'Order placed successfully' },
                  data: {
                    type: 'object',
                    description: 'Returns created order with schema matching MARKETPLACE or EVENT',
                    example: {
                      _id: '6aa2680cf993a4a37bf63a9c',
                      user: '6a951aa343705f92365a4e14',
                      businessOwnerId: '6a951ab943705f92365a4e16',
                      itemId: '6aa10171252cac29958233df',
                      itemType: 'MARKETPLACE',
                      itemPoints: 100,
                      quantity: 1,
                      status: 'CLAIMED',
                      createdAt: '2024-10-23T20:45:00.000Z',
                      updatedAt: '2024-10-23T20:45:00.000Z',
                    },
                  },
                },
              },
            },
          },
        },
        '400': { description: 'Validation error, insufficient points, or item out of stock' },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Item or User not found' },
      },
    },
  },
  '/api/orders/my-orders': {
    get: {
      summary: 'Get logged in user orders list (Access: USER)',
      tags: ['Order'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'page',
          in: 'query',
          description: 'Page number',
          schema: { type: 'integer', default: 1 },
        },
        {
          name: 'limit',
          in: 'query',
          description: 'Items per page',
          schema: { type: 'integer', default: 10 },
        },
        {
          name: 'itemType',
          in: 'query',
          description: 'Filter by item type',
          schema: { type: 'string', enum: ['MARKETPLACE', 'EVENT'] },
        },
        {
          name: 'status',
          in: 'query',
          description: 'Filter by order status',
          schema: { type: 'string', enum: ['CLAIMED', 'REDEEMED', 'CANCELLED'] },
        },
      ],
      responses: {
        '200': {
          description: 'Orders retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  statusCode: { type: 'number', example: 200 },
                  message: { type: 'string', example: 'Orders retrieved successfully' },
                  meta: {
                    type: 'object',
                    properties: {
                      page: { type: 'integer', example: 1 },
                      limit: { type: 'integer', example: 10 },
                      total: { type: 'integer', example: 2 },
                      totalPage: { type: 'integer', example: 1 },
                    },
                  },
                  data: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        _id: { type: 'string', example: '6aa2680cf993a4a37bf63a9c' },
                        itemType: { type: 'string', enum: ['MARKETPLACE', 'EVENT'], example: 'MARKETPLACE' },
                        title: { type: 'string', example: 'Adidas Courtblock Shoes' },
                        photos: {
                          type: 'array',
                          items: { type: 'string' },
                          example: ['https://teamstreakpromo-bucket.s3.us-east-1.amazonaws.com/marketplaces/shoes.png'],
                        },
                        description: { type: 'string', example: 'NIKE is a leading athletic shoe brand known for innovation and quality.' },
                        location: { type: 'string', example: 'Kamisama Art Club' },
                        points: { type: 'number', example: 100 },
                        quantity: { type: 'number', example: 1 },
                        status: { type: 'string', example: 'CLAIMED' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                      },
                    },
                    example: [
                      {
                        _id: '6aa2680cf993a4a37bf63a9c',
                        itemType: 'MARKETPLACE',
                        title: 'Adidas Courtblock Shoes',
                        photos: [
                          'https://teamstreakpromo-bucket.s3.us-east-1.amazonaws.com/marketplaces/shoes.png',
                        ],
                        description: 'NIKE is a leading athletic shoe brand known for innovation and quality.',
                        location: 'Kamisama Art Club',
                        points: 100,
                        quantity: 1,
                        status: 'CLAIMED',
                        createdAt: '2024-10-23T20:45:00.000Z',
                        updatedAt: '2024-10-23T20:45:00.000Z',
                      },
                      {
                        _id: '6aa2680cf993a4a37bf63a9d',
                        itemType: 'EVENT',
                        title: 'Concert Ticket',
                        photos: [
                          'https://teamstreakpromo-bucket.s3.us-east-1.amazonaws.com/event_rewards/ticket.png',
                        ],
                        description: 'Get 50% off on your first ride',
                        location: 'Dhaka, Bangladesh',
                        points: 100,
                        quantity: 1,
                        status: 'CLAIMED',
                        createdAt: '2024-10-23T20:45:00.000Z',
                        updatedAt: '2024-10-23T20:45:00.000Z',
                      },
                    ],
                  },
                },
              },
            },
          },
        },
        '401': { description: 'Unauthorized' },
      },
    },
  },
  '/api/orders/{id}': {
    get: {
      summary: 'Get single order details by ID (Access: USER, ADMIN)',
      tags: ['Order'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Order ID',
          schema: { type: 'string', example: '6aa2680cf993a4a37bf63a9c' },
        },
      ],
      responses: {
        '200': {
          description: 'Order details retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  statusCode: { type: 'number', example: 200 },
                  message: { type: 'string', example: 'Order details retrieved successfully' },
                  data: {
                    type: 'object',
                    example: {
                      _id: '6aa2680cf993a4a37bf63a9c',
                      user: {
                        _id: '6a951aa343705f92365a4e14',
                        name: 'John Doe',
                        email: 'john@example.com',
                      },
                      businessOwnerId: {
                        _id: '6a951ab943705f92365a4e16',
                        name: 'Business Partner',
                        email: 'business@example.com',
                      },
                      itemId: {
                        _id: '6aa10171252cac29958233df',
                        title: 'Adidas Courtblock Shoes',
                        description: 'Detailed description',
                        location: 'Kamisama Art Club',
                        points: 100,
                        quantity: 10,
                        claimQuantity: 4,
                        photos: ['https://teamstreakpromo-bucket.s3.us-east-1.amazonaws.com/marketplaces/shoes.png'],
                        isActive: true,
                      },
                      itemType: 'MARKETPLACE',
                      itemPoints: 100,
                      quantity: 1,
                      status: 'CLAIMED',
                      createdAt: '2024-10-23T20:45:00.000Z',
                      updatedAt: '2024-10-23T20:45:00.000Z',
                    },
                  },
                },
              },
            },
          },
        },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Order not found' },
      },
    },
  },
};
