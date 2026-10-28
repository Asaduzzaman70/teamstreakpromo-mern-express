export const employeeDocs = {
  '/api/employees': {
    post: {
      summary: 'Create a new employee (for HOST or BUSINESS)',
      tags: ['Employee'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'password'],
              properties: {
                name: { type: 'string', example: 'John Staff', description: 'Employee name (or pass userName)' },
                userName: { type: 'string', example: 'John Staff', description: 'Alias for name (matches UI Invite New Team Member modal)' },
                email: { type: 'string', example: 'staff@example.com' },
                password: { type: 'string', example: 'password123' },
                confirmPassword: { type: 'string', example: 'password123', description: 'Optional password confirmation check' },
              },
            },
          },
        },
      },
      responses: {
        '201': {
          description: 'Employee created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  statusCode: { type: 'number', example: 201 },
                  message: { type: 'string', example: 'Employee created successfully' },
                  data: {
                    type: 'object',
                    properties: {
                      _id: { type: 'string', example: '65c8f1e29a8f3b0012345678' },
                      name: { type: 'string', example: 'John Staff' },
                      email: { type: 'string', example: 'staff@example.com' },
                      employerId: { type: 'string', example: '65c8f1e29a8f3b0087654321' },
                      employerType: { type: 'string', example: 'HOST' },
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
        '400': { description: 'Validation error or email already exists' },
        '401': { description: 'Unauthorized' },
        '403': { description: 'Forbidden: Requires HOST or BUSINESS role' },
      },
    },
    get: {
      summary: 'Fetch all employees created by the authenticated HOST or BUSINESS',
      tags: ['Employee'],
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
          description: 'Number of items per page (default: 10)',
          schema: { type: 'integer', default: 10 },
        },
        {
          name: 'search',
          in: 'query',
          description: 'Search employees by name or email',
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
          description: 'Employees retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  statusCode: { type: 'number', example: 200 },
                  message: { type: 'string', example: 'Employees retrieved successfully' },
                  meta: {
                    type: 'object',
                    properties: {
                      page: { type: 'integer', example: 1 },
                      limit: { type: 'integer', example: 10 },
                      total: { type: 'integer', example: 5 },
                      totalPage: { type: 'integer', example: 1 },
                    },
                  },
                  data: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        _id: { type: 'string', example: '65c8f1e29a8f3b0012345678' },
                        name: { type: 'string', example: 'John Staff' },
                        email: { type: 'string', example: 'staff@example.com' },
                        employerId: { type: 'string', example: '65c8f1e29a8f3b0087654321' },
                        employerType: { type: 'string', example: 'HOST' },
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
        '401': { description: 'Unauthorized' },
        '403': { description: 'Forbidden: Requires HOST or BUSINESS role' },
      },
    },
  },
  '/api/employees/{id}': {
    get: {
      summary: 'Fetch an employee by ID (for HOST or BUSINESS)',
      tags: ['Employee'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Employee ID',
          schema: { type: 'string' },
        },
      ],
      responses: {
        '200': {
          description: 'Employee retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  statusCode: { type: 'number', example: 200 },
                  message: { type: 'string', example: 'Employee retrieved successfully' },
                  data: {
                    type: 'object',
                    properties: {
                      _id: { type: 'string', example: '65c8f1e29a8f3b0012345678' },
                      name: { type: 'string', example: 'John Staff' },
                      email: { type: 'string', example: 'staff@example.com' },
                      employerId: { type: 'string', example: '65c8f1e29a8f3b0087654321' },
                      employerType: { type: 'string', example: 'HOST' },
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
        '401': { description: 'Unauthorized' },
        '403': { description: 'Forbidden: Requires HOST or BUSINESS role' },
        '404': { description: 'Employee not found' },
      },
    },
    patch: {
      summary: 'Update an employee by ID (for HOST or BUSINESS)',
      tags: ['Employee'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Employee ID',
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
                name: { type: 'string', example: 'John Staff Updated' },
                userName: { type: 'string', example: 'John Staff Updated' },
                email: { type: 'string', example: 'staff.updated@example.com' },
                password: { type: 'string', example: 'newpassword123' },
                confirmPassword: { type: 'string', example: 'newpassword123' },
                isActive: { type: 'boolean', example: true },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Employee updated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  statusCode: { type: 'number', example: 200 },
                  message: { type: 'string', example: 'Employee updated successfully' },
                  data: {
                    type: 'object',
                    properties: {
                      _id: { type: 'string', example: '65c8f1e29a8f3b0012345678' },
                      name: { type: 'string', example: 'John Staff Updated' },
                      email: { type: 'string', example: 'staff.updated@example.com' },
                      employerId: { type: 'string', example: '65c8f1e29a8f3b0087654321' },
                      employerType: { type: 'string', example: 'HOST' },
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
        '400': { description: 'Validation error or email already exists' },
        '401': { description: 'Unauthorized' },
        '403': { description: 'Forbidden: Requires HOST or BUSINESS role' },
        '404': { description: 'Employee not found' },
      },
    },
    delete: {
      summary: 'Delete an employee by ID (for HOST or BUSINESS)',
      tags: ['Employee'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Employee ID',
          schema: { type: 'string' },
        },
      ],
      responses: {
        '200': {
          description: 'Employee deleted successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  statusCode: { type: 'number', example: 200 },
                  message: { type: 'string', example: 'Employee deleted successfully' },
                  data: { type: 'null', example: null },
                },
              },
            },
          },
        },
        '401': { description: 'Unauthorized' },
        '403': { description: 'Forbidden: Requires HOST or BUSINESS role' },
        '404': { description: 'Employee not found' },
      },
    },
  },
};
