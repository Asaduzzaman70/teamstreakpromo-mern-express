export const employeeAuthDocs = {
  '/api/employee-auth/login': {
    post: {
      tags: ['Employee - 2. Auth & Profile'],
      summary: 'Login as a Host Employee or Business Partner Employee',
      description:
        'Authenticates an employee account created by a `HOST` or `BUSINESS` partner using email and password. Returns JWT `accessToken` and `refreshToken` with `role: "EMPLOYEE"`, `employerType: "HOST" | "BUSINESS"`, and parent employer summary.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'password'],
              properties: {
                email: {
                  type: 'string',
                  format: 'email',
                  example: 'staff@teamstreak.com',
                },
                password: {
                  type: 'string',
                  format: 'password',
                  example: 'secret123',
                },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'Employee logged in successfully' },
        '400': { description: 'Invalid email or password' },
        '403': { description: 'Employee or employer account is inactive/suspended' },
      },
    },
  },
  '/api/employee-auth/me': {
    get: {
      tags: ['Employee - 2. Auth & Profile'],
      summary: 'Get logged-in employee profile & employer organization details',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': { description: 'Employee profile retrieved successfully' },
        '401': { description: 'Unauthorized' },
      },
    },
  },
  '/api/employee-auth/refresh-token': {
    post: {
      tags: ['Employee - 2. Auth & Profile'],
      summary: 'Refresh employee access token',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['refreshToken'],
              properties: {
                refreshToken: {
                  type: 'string',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'Employee token refreshed successfully' },
        '401': { description: 'Invalid or expired refresh token' },
      },
    },
  },
  '/api/employee-auth/change-password': {
    patch: {
      tags: ['Employee - 2. Auth & Profile'],
      summary: 'Change logged-in employee password',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['newPassword'],
              properties: {
                oldPassword: { type: 'string', format: 'password', example: 'secret123' },
                currentPassword: { type: 'string', format: 'password', example: 'secret123' },
                newPassword: { type: 'string', format: 'password', example: 'newSecret456' },
                confirmPassword: { type: 'string', format: 'password', example: 'newSecret456' },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'Employee password changed successfully' },
        '400': { description: 'Incorrect current password or validation error' },
      },
    },
  },
  '/api/employee-auth/logout': {
    post: {
      tags: ['Employee - 2. Auth & Profile'],
      summary: 'Logout logged-in employee',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': { description: 'Employee logged out successfully' },
      },
    },
  },
};

