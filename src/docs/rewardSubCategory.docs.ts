export const rewardSubCategoryDocs = {
  '/api/reward-subcategories': {
    post: {
      summary: 'Create a new reward subcategory',
      tags: ['Reward Subcategory'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'rewardCategory'],
              properties: {
                name: { type: 'string', example: 'Gold Tier Rewards' },
                description: { type: 'string', example: 'Exclusive rewards for gold tier' },
                rewardCategory: { type: 'string', example: '60d0fe4f5311236168a109ca' },
                isActive: { type: 'boolean', example: true },
              },
            },
          },
        },
      },
      responses: {
        '201': { description: 'Reward subcategory created successfully' },
        '400': { description: 'Validation error or subcategory already exists' },
      },
    },
    get: {
      summary: 'Get all reward subcategories',
      tags: ['Reward Subcategory'],
      parameters: [
        {
          name: 'search',
          in: 'query',
          schema: { type: 'string' },
          description: 'Search by subcategory name',
        },
        {
          name: 'isActive',
          in: 'query',
          schema: { type: 'boolean' },
          description: 'Filter by active status',
        },
        {
          name: 'rewardCategory',
          in: 'query',
          schema: { type: 'string' },
          description: 'Filter by Reward Category ID',
        },
        {
          name: 'page',
          in: 'query',
          schema: { type: 'integer' },
          description: 'Page number',
        },
        {
          name: 'limit',
          in: 'query',
          schema: { type: 'integer' },
          description: 'Items per page',
        },
      ],
      responses: {
        '200': { description: 'Reward subcategories retrieved successfully' },
      },
    },
  },
  '/api/reward-subcategories/{id}': {
    get: {
      summary: 'Get reward subcategory by ID',
      tags: ['Reward Subcategory'],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
        },
      ],
      responses: {
        '200': { description: 'Reward subcategory details retrieved successfully' },
        '404': { description: 'Reward subcategory not found' },
      },
    },
    patch: {
      summary: 'Update reward subcategory by ID',
      tags: ['Reward Subcategory'],
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
                name: { type: 'string', example: 'Updated Subcategory Name' },
                description: { type: 'string', example: 'Updated description' },
                rewardCategory: { type: 'string', example: '60d0fe4f5311236168a109ca' },
                isActive: { type: 'boolean', example: true },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'Reward subcategory updated successfully' },
        '400': { description: 'Validation error' },
        '404': { description: 'Reward subcategory not found' },
      },
    },
    delete: {
      summary: 'Delete reward subcategory by ID',
      tags: ['Reward Subcategory'],
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
        '200': { description: 'Reward subcategory deleted successfully' },
        '404': { description: 'Reward subcategory not found' },
      },
    },
  },
};
