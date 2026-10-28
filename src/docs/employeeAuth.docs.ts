export const employeeAuthDocs = {
  '/api/employee-auth/login': {
    post: {
      tags: ['Employee Auth'],
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
        200: {
          description: 'Employee logged in successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Employee logged in successfully' },
                  data: {
                    type: 'object',
                    properties: {
                      _id: { type: 'string', example: '6630c9a8e4b0a1b2c3d4e5f6' },
                      name: { type: 'string', example: 'John Doe' },
                      email: { type: 'string', example: 'staff@teamstreak.com' },
                      role: { type: 'string', example: 'EMPLOYEE' },
                      employerId: { type: 'string', example: '6630c888e4b0a1b2c3d4e111' },
                      employerType: {
                        type: 'string',
                        enum: ['HOST', 'BUSINESS'],
                        example: 'HOST',
                      },
                      isActive: { type: 'boolean', example: true },
                      employer: {
                        type: 'object',
                        nullable: true,
                        properties: {
                          _id: { type: 'string', example: '6630c888e4b0a1b2c3d4e111' },
                          name: { type: 'string', example: 'Music of Tour' },
                          email: { type: 'string', example: 'host@teamstreak.com' },
                          role: { type: 'string', example: 'HOST' },
                          businessName: { type: 'string', example: 'Music of Tour LLC' },
                          location: { type: 'string', example: 'Alaska 99611, USA' },
                        },
                      },
                      accessToken: { type: 'string' },
                      refreshToken: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
        400: { description: 'Invalid email or password' },
        403: { description: 'Employee or employer account is inactive/suspended' },
      },
    },
  },
  '/api/employee-auth/refresh-token': {
    post: {
      tags: ['Employee Auth'],
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
        200: { description: 'Employee token refreshed successfully' },
        401: { description: 'Invalid or expired refresh token' },
      },
    },
  },
  '/api/employee-auth/me': {
    get: {
      tags: ['Employee Auth'],
      summary: 'Get logged-in employee profile & employer organization details',
      security: [{ bearerAuth: [] }],
      responses: {
        200: { description: 'Employee profile retrieved successfully' },
        401: { description: 'Unauthorized' },
      },
    },
  },
  '/api/employee-auth/change-password': {
    patch: {
      tags: ['Employee Auth'],
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
                oldPassword: {
                  type: 'string',
                  format: 'password',
                  example: 'secret123',
                  description: 'Current password (or provide currentPassword)',
                },
                currentPassword: {
                  type: 'string',
                  format: 'password',
                  example: 'secret123',
                },
                newPassword: {
                  type: 'string',
                  format: 'password',
                  example: 'newSecret456',
                },
                confirmPassword: {
                  type: 'string',
                  format: 'password',
                  example: 'newSecret456',
                },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Employee password changed successfully' },
        400: { description: 'Incorrect current password or validation error' },
        401: { description: 'Unauthorized' },
      },
    },
  },
  '/api/employee-auth/logout': {
    post: {
      tags: ['Employee Auth'],
      summary: 'Logout logged-in employee',
      security: [{ bearerAuth: [] }],
      responses: {
        200: { description: 'Employee logged out successfully' },
        401: { description: 'Unauthorized' },
      },
    },
  },
};

