export const userDocs = {
  '/api/users/stats': {
    get: {
      summary: 'Get aggregate user statistics for admin overview',
      tags: ['Users (Admin)'],
      security: [{ bearerAuth: [] }],
      responses: {
        '200': {
          description: 'User statistics retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  statusCode: { type: 'number', example: 200 },
                  message: { type: 'string', example: 'User statistics retrieved successfully' },
                  data: {
                    type: 'object',
                    properties: {
                      totalUsers: { type: 'number', example: 120 },
                      totalRegularUsers: { type: 'number', example: 95 },
                      totalHosts: { type: 'number', example: 15 },
                      totalBusinesses: { type: 'number', example: 8 },
                      totalAdmins: { type: 'number', example: 2 },
                      activeUsers: { type: 'number', example: 110 },
                      inactiveUsers: { type: 'number', example: 10 },
                      suspendedUsers: { type: 'number', example: 3 },
                      newUsersThisMonth: { type: 'number', example: 24 },
                    },
                  },
                },
              },
            },
          },
        },
        '401': { description: 'Unauthorized' },
        '403': { description: 'Forbidden: Requires ADMIN role' },
      },
    },
  },
  '/api/users': {
    get: {
      summary: 'Fetch all users with search, role filters, status filters, sorting, and pagination',
      tags: ['Users (Admin)'],
      security: [{ bearerAuth: [] }],
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
          description: 'Items per page (default: 10, max: 100)',
          schema: { type: 'integer', default: 10 },
        },
        {
          name: 'search',
          in: 'query',
          description: 'Search by user name, email, or phone number',
          schema: { type: 'string' },
        },
        {
          name: 'role',
          in: 'query',
          description: 'Filter by user role',
          schema: { type: 'string', enum: ['USER', 'HOST', 'BUSINESS', 'ADMIN', 'all'] },
        },
        {
          name: 'isActive',
          in: 'query',
          description: 'Filter by active state',
          schema: { type: 'boolean' },
        },
        {
          name: 'isSuspend',
          in: 'query',
          description: 'Filter by suspension state',
          schema: { type: 'boolean' },
        },
        {
          name: 'startDate',
          in: 'query',
          description: 'Filter users registered on or after this ISO date',
          schema: { type: 'string', format: 'date' },
        },
        {
          name: 'endDate',
          in: 'query',
          description: 'Filter users registered on or before this ISO date',
          schema: { type: 'string', format: 'date' },
        },
        {
          name: 'sortBy',
          in: 'query',
          description: 'Sort by field',
          schema: {
            type: 'string',
            enum: ['createdAt', 'name', 'email', 'totalPoints', 'walletBalance', 'rating', 'sold'],
            default: 'createdAt',
          },
        },
        {
          name: 'sortOrder',
          in: 'query',
          description: 'Sort order',
          schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
        },
      ],
      responses: {
        '200': {
          description: 'Users retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  statusCode: { type: 'number', example: 200 },
                  message: { type: 'string', example: 'Users retrieved successfully' },
                  meta: {
                    type: 'object',
                    properties: {
                      page: { type: 'integer', example: 1 },
                      limit: { type: 'integer', example: 10 },
                      total: { type: 'integer', example: 120 },
                      totalPage: { type: 'integer', example: 12 },
                    },
                  },
                  data: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        _id: { type: 'string', example: '65c8f1e29a8f3b0012345678' },
                        name: { type: 'string', example: 'Alex Morgan' },
                        email: { type: 'string', example: 'alex@example.com' },
                        phoneNumber: { type: 'string', example: '+1234567890' },
                        profileImage: { type: 'string', example: 'https://s3.amazonaws.com/...' },
                        role: { type: 'string', example: 'USER' },
                        totalPoints: { type: 'number', example: 450 },
                        walletBalance: { type: 'number', example: 25.5 },
                        rating: { type: 'number', example: 4.8 },
                        sold: { type: 'number', example: 0 },
                        isAgeOver18: { type: 'boolean', example: true },
                        agreesToTerms: { type: 'boolean', example: true },
                        isActive: { type: 'boolean', example: true },
                        isSuspend: { type: 'boolean', example: false },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                        businessProfile: {
                          type: 'object',
                          nullable: true,
                          description: 'Populated if the user is a HOST or BUSINESS partner',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '401': { description: 'Unauthorized' },
        '403': { description: 'Forbidden: Requires ADMIN role' },
      },
    },
  },
  '/api/users/{id}': {
    get: {
      summary: 'Get single user details by ID',
      tags: ['Users (Admin)'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: '24-character hexadecimal User ID',
          schema: { type: 'string' },
        },
      ],
      responses: {
        '200': {
          description: 'User details retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  statusCode: { type: 'number', example: 200 },
                  message: { type: 'string', example: 'User details retrieved successfully' },
                  data: {
                    type: 'object',
                    properties: {
                      _id: { type: 'string', example: '65c8f1e29a8f3b0012345678' },
                      name: { type: 'string', example: 'Alex Morgan' },
                      email: { type: 'string', example: 'alex@example.com' },
                      phoneNumber: { type: 'string', example: '+1234567890' },
                      profileImage: { type: 'string', example: 'https://s3.amazonaws.com/...' },
                      role: { type: 'string', example: 'USER' },
                      totalPoints: { type: 'number', example: 450 },
                      walletBalance: { type: 'number', example: 25.5 },
                      rating: { type: 'number', example: 4.8 },
                      sold: { type: 'number', example: 0 },
                      isActive: { type: 'boolean', example: true },
                      isSuspend: { type: 'boolean', example: false },
                      createdAt: { type: 'string', format: 'date-time' },
                      updatedAt: { type: 'string', format: 'date-time' },
                      businessProfile: { type: 'object', nullable: true },
                    },
                  },
                },
              },
            },
          },
        },
        '401': { description: 'Unauthorized' },
        '403': { description: 'Forbidden: Requires ADMIN role' },
        '404': { description: 'User not found' },
      },
    },
    delete: {
      summary: 'Delete user account by ID',
      tags: ['Users (Admin)'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'User ID to delete',
          schema: { type: 'string' },
        },
      ],
      responses: {
        '200': {
          description: 'User deleted successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  statusCode: { type: 'number', example: 200 },
                  message: { type: 'string', example: 'User deleted successfully' },
                  data: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', example: '65c8f1e29a8f3b0012345678' },
                    },
                  },
                },
              },
            },
          },
        },
        '400': { description: 'Cannot delete your own admin account' },
        '401': { description: 'Unauthorized' },
        '403': { description: 'Forbidden: Requires ADMIN role' },
        '404': { description: 'User not found' },
      },
    },
  },
  '/api/users/{id}/status': {
    patch: {
      summary: 'Update user active or suspended status (Admin moderation)',
      tags: ['Users (Admin)'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'User ID',
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
                isActive: { type: 'boolean', example: true },
                isSuspend: { type: 'boolean', example: false },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'User status updated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  statusCode: { type: 'number', example: 200 },
                  message: { type: 'string', example: 'User status updated successfully' },
                  data: { type: 'object' },
                },
              },
            },
          },
        },
        '400': { description: 'Validation error' },
        '401': { description: 'Unauthorized' },
        '403': { description: 'Forbidden: Requires ADMIN role' },
        '404': { description: 'User not found' },
      },
    },
  },
  '/api/users/{id}/role': {
    patch: {
      summary: 'Update user role (USER, HOST, BUSINESS, ADMIN)',
      tags: ['Users (Admin)'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'User ID',
          schema: { type: 'string' },
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['role'],
              properties: {
                role: {
                  type: 'string',
                  enum: ['USER', 'HOST', 'BUSINESS', 'ADMIN'],
                  example: 'HOST',
                },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'User role updated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  statusCode: { type: 'number', example: 200 },
                  message: { type: 'string', example: 'User role updated successfully' },
                  data: { type: 'object' },
                },
              },
            },
          },
        },
        '400': { description: 'Invalid role value' },
        '401': { description: 'Unauthorized' },
        '403': { description: 'Forbidden: Requires ADMIN role' },
        '404': { description: 'User not found' },
      },
    },
  },
};
