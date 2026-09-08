export const marketplaceDocs = {
  '/api/marketplaces': {
    post: {
      summary: 'Create a new marketplace item',
      tags: ['Marketplace'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: [
                'title',
                'description',
                'categoryId',
                'location',
                'latitude',
                'longitude',
                'startDateTime',
                'endDateTime',
                'points',
                'quantity',
                'photos'
              ],
              properties: {
                title: { type: 'string', example: 'Example Reward' },
                description: { type: 'string', example: 'This is a description' },
                categoryId: { type: 'string', example: '65c8f1e29a8f3b0012345678', description: 'Category ObjectId' },
                subCategoryId: { type: 'string', example: '65c8f1e29a8f3b0012345679', description: 'Subcategory ObjectId' },
                location: { type: 'string', example: 'New York' },
                latitude: { type: 'number', example: 40.7128 },
                longitude: { type: 'number', example: -74.0060 },
                startDateTime: { type: 'string', format: 'date-time' },
                endDateTime: { type: 'string', format: 'date-time' },
                points: { type: 'number', example: 100 },
                quantity: { type: 'number', example: 10 },
                photos: { type: 'array', items: { type: 'string', format: 'binary' }, description: 'Upload multiple images' },
                isActive: { type: 'boolean', example: true },
              },
            },
          },
        },
      },
      responses: {
        '201': { description: 'Marketplace item created successfully' },
        '400': { description: 'Validation error' },
        '401': { description: 'Unauthorized' },
      },
    },
    get: {
      summary: 'Get list of all marketplace items',
      tags: ['Marketplace'],
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
          name: 'categoryId',
          in: 'query',
          description: 'Filter by category ID',
          schema: { type: 'string' },
        },
        {
          name: 'subCategoryId',
          in: 'query',
          description: 'Filter by subcategory ID',
          schema: { type: 'string' },
        },
        {
          name: 'startDate',
          in: 'query',
          description: 'Filter marketplaces starting on or after this date. Format: YYYY-MM-DD (e.g. 2026-09-01)',
          schema: { type: 'string', format: 'date', example: '2026-09-01' },
        },
        {
          name: 'endDate',
          in: 'query',
          description: 'Filter marketplaces ending on or before this date. Format: YYYY-MM-DD (e.g. 2026-09-30)',
          schema: { type: 'string', format: 'date', example: '2026-09-30' },
        },
        {
          name: 'minPoints',
          in: 'query',
          description: 'Filter marketplaces with points greater than or equal to this value',
          schema: { type: 'integer', example: 10 },
        },
        {
          name: 'maxPoints',
          in: 'query',
          description: 'Filter marketplaces with points less than or equal to this value',
          schema: { type: 'integer', example: 95 },
        },
        {
          name: 'points',
          in: 'query',
          description: 'Filter marketplaces by an exact point value (overrides minPoints/maxPoints if provided)',
          schema: { type: 'integer', example: 25 },
        },
        {
          name: 'isExpired',
          in: 'query',
          description: 'Filter marketplaces by expiration status. If true, returns items whose end date has passed. If false, returns active/upcoming items.',
          schema: { type: 'boolean', example: false },
        },
      ],
      responses: {
        '200': {
          description: 'Marketplace items retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  statusCode: { type: 'number', example: 200 },
                  message: { type: 'string', example: 'Marketplace items retrieved successfully' },
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
                        title: { type: 'string', example: 'Example Reward' },
                        description: { type: 'string', example: 'This is a description' },
                        category: {
                          type: 'object',
                          properties: {
                            _id: { type: 'string', example: '65c8f1e29a8f3b0012345678' },
                            name: { type: 'string', example: 'Gift Cards' },
                            description: { type: 'string', example: 'Digital and physical gift cards' }
                          }
                        },
                        subCategory: {
                          type: 'object',
                          properties: {
                            _id: { type: 'string', example: '65c8f1e29a8f3b0012345679' },
                            name: { type: 'string', example: 'Amazon Gift Cards' },
                            description: { type: 'string', example: 'Amazon store credit' }
                          }
                        },
                        location: { type: 'string', example: 'New York' },
                        latitude: { type: 'number', example: 40.7128 },
                        longitude: { type: 'number', example: -74.0060 },
                        startDateTime: { type: 'string', format: 'date-time' },
                        endDateTime: { type: 'string', format: 'date-time' },
                        points: { type: 'number', example: 100 },
                        quantity: { type: 'number', example: 10 },
                        claimQuantity: { type: 'number', example: 0 },
                        photos: { type: 'array', items: { type: 'string' } },
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
  '/api/marketplaces/{id}': {
    get: {
      summary: 'Get marketplace item details by ID',
      tags: ['Marketplace'],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
        },
      ],
      responses: {
        '200': { description: 'Marketplace item details retrieved successfully' },
        '404': { description: 'Marketplace item not found' },
      },
    },
    patch: {
      summary: 'Update marketplace item by ID',
      description: `Update an existing marketplace item by ID (supports multipart/form-data).

### Frontend Image Update Instructions:
- **To keep existing photos**: Send existing image URL string(s) in form-data text fields (e.g. \`photos\`: \`"https://example.com/photo1.jpg"\`). Or send a JSON array string \`["url1", "url2"]\`.
- **To add new image files**: Attach binary image file(s) to form-data field \`photos\`.
- **To delete an image**: Omit that image URL string from the form-data fields.
- **To delete ALL images**: Send an empty JSON array string \`"[]"\` to the \`photos\` field.

#### Sample Form-Data Field Inputs:
- **Text Field \`photos\`**: \`"https://example.com/existing_photo.jpg"\`
- **File Field \`photos\`**: \`[Binary Image File]\``,
      tags: ['Marketplace'],
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
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
                title: { type: 'string', example: 'Example Reward' },
                description: { type: 'string', example: 'This is a description' },
                categoryId: { type: 'string', example: '65c8f1e29a8f3b0012345678', description: 'Category ObjectId' },
                subCategoryId: { type: 'string', example: '65c8f1e29a8f3b0012345679', description: 'Subcategory ObjectId' },
                location: { type: 'string', example: 'New York' },
                latitude: { type: 'number', example: 40.7128 },
                longitude: { type: 'number', example: -74.0060 },
                startDateTime: { type: 'string', format: 'date-time' },
                endDateTime: { type: 'string', format: 'date-time' },
                points: { type: 'number', example: 100 },
                quantity: { type: 'number', example: 10 },
                photos: { type: 'array', items: { type: 'string', format: 'binary' }, description: 'Upload multiple images (will replace existing)' },
                isActive: { type: 'boolean', example: true },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'Marketplace item updated successfully' },
        '400': { description: 'Validation error' },
        '404': { description: 'Marketplace item not found' },
      },
    },
    delete: {
      summary: 'Delete marketplace item by ID',
      tags: ['Marketplace'],
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
        '200': { description: 'Marketplace item deleted successfully' },
        '404': { description: 'Marketplace item not found' },
      },
    },
  },
};
