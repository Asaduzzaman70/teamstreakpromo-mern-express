export const rewardCategoryDocs = {
  '/api/reward-categories': {
    post: {
      summary: 'Create a new reward category',
      tags: ['Reward Category'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name'],
              properties: {
                name: { type: 'string', example: 'Gift Cards' },
                description: { type: 'string', example: 'Digital and physical gift cards' },
                isActive: { type: 'boolean', example: true },
              },
            },
          },
        },
      },
      responses: {
        '201': { description: 'Reward Category created successfully' },
        '400': { description: 'Validation error or duplicate name' },
        '401': { description: 'Unauthorized' },
      },
    },
    get: {
      summary: 'Get list of all reward categories',
      tags: ['Reward Category'],
      parameters: [
        {
          name: 'page',
          in: 'query',
          description: 'Page number for pagination (default: 1)',
          schema: { type: 'integer', default: 1 },
        },
        {
          name: 'limit',
          in: 'query',
          description: 'Number of items per page (default: 10)',
          schema: { type: 'integer', default: 10 },
        },
        {
          name: 'search',
          in: 'query',
          description: 'Search reward categories by name',
          schema: { type: 'string' },
        },
        {
          name: 'isActive',
          in: 'query',
          description: 'Filter by active state',
          schema: { type: 'boolean' },
        },
      ],
      responses: {
        '200': {
          description: 'Reward categories retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  statusCode: { type: 'number', example: 200 },
                  message: { type: 'string', example: 'Reward categories retrieved successfully' },
                  meta: {
                    type: 'object',
                    properties: {
                      page: { type: 'integer', example: 1 },
                      limit: { type: 'integer', example: 10 },
                      total: { type: 'integer', example: 25 },
                      totalPage: { type: 'integer', example: 3 },
                    },
                  },
                  data: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        _id: { type: 'string', example: '65c8f1e29a8f3b0012345678' },
                        name: { type: 'string', example: 'Gift Cards' },
                        description: { type: 'string', example: 'Digital and physical gift cards' },
                        isActive: { type: 'boolean', example: true },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  '/api/reward-categories/{id}': {
    get: {
      summary: 'Get reward category details by ID',
      tags: ['Reward Category'],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
        },
      ],
      responses: {
        '200': { description: 'Reward category details retrieved successfully' },
        '404': { description: 'Reward category not found' },
      },
    },
    patch: {
      summary: 'Update reward category by ID',
      tags: ['Reward Category'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'Updated Reward Category Name' },
                description: { type: 'string', example: 'Updated description' },
                isActive: { type: 'boolean', example: true },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'Reward category updated successfully' },
        '400': { description: 'Validation error' },
        '404': { description: 'Reward category not found' },
      },
    },
    delete: {
      summary: 'Delete reward category by ID',
      tags: ['Reward Category'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
        },
      ],
      responses: {
        '200': { description: 'Reward category deleted successfully' },
        '404': { description: 'Reward category not found' },
      },
    },
  },
};
