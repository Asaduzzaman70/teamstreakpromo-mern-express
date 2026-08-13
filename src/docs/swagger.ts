import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import type { Express, Request, Response } from 'express';
import config from '../config/config.js';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TeamStreak Promo API',
      version: '1.0.0',
      description: 'REST API documentation for TeamStreak Promo application built with Express and TypeScript.',
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer <token>',
        },
      },
    },
    paths: {
      '/api/auth/register': {
        post: {
          summary: 'Register a new user',
          tags: ['Authentication'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'email', 'password', 'confirmPassword', 'isAgeOver18', 'agreesToTerms'],
                  properties: {
                    name: { type: 'string', example: 'John Doe' },
                    email: { type: 'string', example: 'john@example.com' },
                    password: { type: 'string', example: 'password123' },
                    confirmPassword: { type: 'string', example: 'password123' },
                    role: { type: 'string', enum: ['USER', 'HOST', 'BUSINESS'], example: 'USER', default: 'USER' },
                    isAgeOver18: { type: 'boolean', example: true },
                    agreesToTerms: { type: 'boolean', example: true },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'User registered successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      statusCode: { type: 'number', example: 201 },
                      message: { type: 'string', example: 'User registered successfully' },
                      data: {
                        type: 'object',
                        properties: {
                          _id: { type: 'string', example: '65c8f1e29a8f3b0012345678' },
                          name: { type: 'string', example: 'John Doe' },
                          email: { type: 'string', example: 'john@example.com' },
                          role: { type: 'string', example: 'USER' },
                          accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                          refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                        },
                      },
                    },
                  },
                },
              },
            },
            '400': {
              description: 'Validation error or user already exists',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: false },
                      message: { type: 'string', example: 'User already exists with this email' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/auth/login': {
        post: {
          summary: 'Authenticate a user & get JWT token',
          tags: ['Authentication'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', example: 'john@example.com' },
                    password: { type: 'string', example: 'password123' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'User authenticated successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      statusCode: { type: 'number', example: 200 },
                      message: { type: 'string', example: 'User authenticated successfully' },
                      data: {
                        type: 'object',
                        properties: {
                          _id: { type: 'string', example: '65c8f1e29a8f3b0012345678' },
                          name: { type: 'string', example: 'John Doe' },
                          email: { type: 'string', example: 'john@example.com' },
                          role: { type: 'string', example: 'USER' },
                          accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                          refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                        },
                      },
                    },
                  },
                },
              },
            },
            '400': {
              description: 'Invalid credentials or validation error',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: false },
                      message: { type: 'string', example: 'Invalid credentials' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/auth/forgot-password': {
        post: {
          summary: 'Request password reset OTP code sent to email',
          tags: ['Authentication'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email'],
                  properties: {
                    email: { type: 'string', example: 'john@example.com' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'OTP code sent to email address',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      statusCode: { type: 'number', example: 200 },
                      message: { type: 'string', example: 'OTP has been sent to your email address.' },
                      data: {
                        type: 'object',
                        properties: {
                          message: { type: 'string', example: 'OTP has been sent to your email address.' },
                        },
                      },
                    },
                  },
                },
              },
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: false },
                      message: { type: 'string', example: 'Invalid email address' },
                    },
                  },
                },
              },
            },
            '404': {
              description: 'User not found',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: false },
                      message: { type: 'string', example: 'No account found with this email address' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/auth/verify-otp': {
        post: {
          summary: 'Verify 6-digit OTP code and get password reset token',
          tags: ['Authentication'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'otp'],
                  properties: {
                    email: { type: 'string', example: 'john@example.com' },
                    otp: { type: 'string', example: '123456' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'OTP verified successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      statusCode: { type: 'number', example: 200 },
                      message: { type: 'string', example: 'OTP verified successfully.' },
                      data: {
                        type: 'object',
                        properties: {
                          message: { type: 'string', example: 'OTP verified successfully.' },
                          resetToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                        },
                      },
                    },
                  },
                },
              },
            },
            '400': {
              description: 'Invalid or expired OTP code',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: false },
                      message: { type: 'string', example: 'Invalid or expired OTP code' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/auth/reset-password': {
        post: {
          summary: 'Reset password using valid reset token',
          tags: ['Authentication'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['resetToken', 'newPassword', 'confirmPassword'],
                  properties: {
                    resetToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                    newPassword: { type: 'string', example: 'newsecretpassword123' },
                    confirmPassword: { type: 'string', example: 'newsecretpassword123' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Password reset successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      statusCode: { type: 'number', example: 200 },
                      message: { type: 'string', example: 'Password reset successfully. You can now log in with your new password.' },
                      data: {
                        type: 'object',
                        properties: {
                          message: { type: 'string', example: 'Password reset successfully. You can now log in with your new password.' },
                        },
                      },
                    },
                  },
                },
              },
            },
            '400': {
              description: 'Invalid reset token or validation error',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: false },
                      message: { type: 'string', example: 'Invalid or expired reset token' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/auth/me': {
        get: {
          summary: 'Get currently authenticated user profile',
          tags: ['Authentication'],
          security: [
            {
              bearerAuth: [],
            },
          ],
          responses: {
            '200': {
              description: 'User profile retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      statusCode: { type: 'number', example: 200 },
                      data: {
                        type: 'object',
                        properties: {
                          _id: { type: 'string', example: '65c8f1e29a8f3b0012345678' },
                          name: { type: 'string', example: 'John Doe' },
                          email: { type: 'string', example: 'john@example.com' },
                          role: { type: 'string', example: 'USER' },
                          totalPoints: { type: 'integer', example: 0 },
                          walletBalance: { type: 'number', example: 0.0 },
                          isAgeOver18: { type: 'boolean', example: true },
                          agreesToTerms: { type: 'boolean', example: true },
                          createdAt: { type: 'string', format: 'date-time' },
                          updatedAt: { type: 'string', format: 'date-time' },
                        },
                      },
                    },
                  },
                },
              },
            },
            '401': {
              description: 'Unauthorized - Missing or invalid token',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: false },
                      message: { type: 'string', example: 'Not authorized, token missing' },
                    },
                  },
                },
              },
            },
            '404': {
              description: 'User not found',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: false },
                      message: { type: 'string', example: 'User not found' },
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
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Express): void => {
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      swaggerOptions: {
        defaultModelsExpandDepth: -1, // Hides the Schemas/Models section at bottom of UI
      },
    })
  );
  app.get('/api-docs.json', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};
