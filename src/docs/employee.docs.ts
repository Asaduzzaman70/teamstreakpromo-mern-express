export const employeeDocs = {
  '/api/employees': {
    post: {
      summary: 'Create a new employee (for HOST or BUSINESS)',
      tags: ['Employee - 1. Team Management (Host & Business)'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'password'],
              properties: {
                name: {
                  type: 'string',
                  example: 'John Staff',
                  description: 'Employee name (or pass userName)',
                },
                userName: {
                  type: 'string',
                  example: 'John Staff',
                  description: 'Alias for name (matches UI Invite New Team Member modal)',
                },
                email: { type: 'string', example: 'staff@example.com' },
                password: { type: 'string', example: 'password123' },
                confirmPassword: {
                  type: 'string',
                  example: 'password123',
                  description: 'Optional password confirmation check',
                },
              },
            },
          },
        },
      },
      responses: {
        '201': { description: 'Employee created successfully' },
        '400': { description: 'Validation error or email already exists' },
        '401': { description: 'Unauthorized' },
        '403': { description: 'Forbidden: Requires HOST or BUSINESS role' },
      },
    },
    get: {
      summary: 'Fetch all employees created by the authenticated HOST or BUSINESS',
      tags: ['Employee - 1. Team Management (Host & Business)'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        {
          name: 'search',
          in: 'query',
          schema: { type: 'string' },
          description: 'Search employees by name or email',
        },
        {
          name: 'isActive',
          in: 'query',
          schema: { type: 'boolean' },
          description: 'Filter by active state',
        },
      ],
      responses: {
        '200': { description: 'Employees retrieved successfully' },
        '401': { description: 'Unauthorized' },
        '403': { description: 'Forbidden: Requires HOST or BUSINESS role' },
      },
    },
  },
  '/api/employees/{id}': {
    get: {
      summary: 'Fetch an employee by ID (for HOST or BUSINESS)',
      tags: ['Employee - 1. Team Management (Host & Business)'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      ],
      responses: {
        '200': { description: 'Employee retrieved successfully' },
        '404': { description: 'Employee not found' },
      },
    },
    patch: {
      summary: 'Update an employee by ID (for HOST or BUSINESS)',
      tags: ['Employee - 1. Team Management (Host & Business)'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
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
        '200': { description: 'Employee updated successfully' },
        '404': { description: 'Employee not found' },
      },
    },
    delete: {
      summary: 'Delete an employee by ID (for HOST or BUSINESS)',
      tags: ['Employee - 1. Team Management (Host & Business)'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      ],
      responses: {
        '200': { description: 'Employee deleted successfully' },
        '404': { description: 'Employee not found' },
      },
    },
  },
};
