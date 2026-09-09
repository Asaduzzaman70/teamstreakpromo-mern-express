export const orderDocs = {
  '/api/orders': {
    post: {
      summary: 'Place an order for a marketplace or event item (Access: USER)',
      tags: ['Order'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['itemType', 'itemId'],
              properties: {
                itemType: { type: 'string', enum: ['MARKETPLACE', 'EVENT'], example: 'MARKETPLACE' },
                itemId: { type: 'string', example: '60d0fe4f5311236168a109ca' },
                quantity: { type: 'number', example: 1, default: 1 },
              },
            },
          },
        },
      },
      responses: {
        '201': { description: 'Order placed successfully' },
        '400': { description: 'Validation error, insufficient points, or item out of stock' },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Item or User not found' },
      },
    },
  },
  '/api/orders/my-orders': {
    get: {
      summary: 'Get logged in user orders (Access: USER)',
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
        '200': { description: 'Orders retrieved successfully' },
        '401': { description: 'Unauthorized' },
      },
    },
  },
};
