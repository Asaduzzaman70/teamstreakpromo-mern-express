export const categoryDocs = {
  '/api/categories': {
    post: {
      summary: 'Create a new category',
      tags: ['Category'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name'],
              properties: {
                name: { type: 'string', example: 'Sports & Fitness' },
                description: { type: 'string', example: 'Sports events, fitness classes, and competitions' },
                parentCategory: { type: 'string', example: '65c8f1e29a8f3b0012345678' },
                isActive: { type: 'boolean', example: true },
              },
            },
          },
        },
      },
      responses: {
        '201': { description: 'Category created successfully' },
        '400': { description: 'Validation error or duplicate name' },
        '401': { description: 'Unauthorized' },
      },
    },
    get: {
      summary: 'Get list of all categories',
      tags: ['Category'],
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
          description: 'Search categories by name',
          schema: { type: 'string' },
        },
        {
          name: 'isActive',
          in: 'query',
          description: 'Filter by active state',
          schema: { type: 'boolean' },
        },
        {
          name: 'parentCategory',
          in: 'query',
          description: 'Filter by parent category ID',
          schema: { type: 'string' },
        },
        {
          name: 'getAllParentCategory',
          in: 'query',
          description: 'If true, returns only main parent categories (where parentCategory is null)',
          schema: { type: 'boolean' },
        },
      ],
      responses: {
        '200': {
          description: 'Categories retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  statusCode: { type: 'number', example: 200 },
                  message: { type: 'string', example: 'Categories retrieved successfully' },
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
                        name: { type: 'string', example: 'Sports & Fitness' },
                        description: { type: 'string', example: 'Sports events and fitness' },
                        parentCategory: { type: 'object', nullable: true },
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
  '/api/categories/{id}': {
    get: {
      summary: 'Get category details by ID',
      tags: ['Category'],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
        },
      ],
      responses: {
        '200': { description: 'Category details retrieved successfully' },
        '404': { description: 'Category not found' },
      },
    },
    patch: {
      summary: 'Update category by ID',
      tags: ['Category'],
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
                name: { type: 'string', example: 'Updated Category Name' },
                description: { type: 'string', example: 'Updated description' },
                parentCategory: { type: 'string', example: '65c8f1e29a8f3b0012345678' },
                isActive: { type: 'boolean', example: true },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'Category updated successfully' },
        '400': { description: 'Validation error or invalid parent category' },
        '404': { description: 'Category not found' },
      },
    },
    delete: {
      summary: 'Delete category by ID',
      tags: ['Category'],
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
        '200': { description: 'Category deleted successfully' },
        '400': { description: 'Cannot delete category with subcategories' },
        '404': { description: 'Category not found' },
      },
    },
  },
};
