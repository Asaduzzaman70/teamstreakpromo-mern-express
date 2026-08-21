import swaggerJsdoc from 'swagger-jsdoc';
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
        url: config.serverUrl,
        description: 'Production server',
      },
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
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['name', 'email', 'password', 'confirmPassword', 'isAgeOver18', 'agreesToTerms'],
                  properties: {
                    name: { type: 'string', example: 'John Host' },
                    email: { type: 'string', example: 'host@example.com' },
                    password: { type: 'string', example: 'password123' },
                    confirmPassword: { type: 'string', example: 'password123' },
                    role: { type: 'string', enum: ['USER', 'HOST', 'BUSINESS'], example: 'HOST', default: 'USER' },
                    isAgeOver18: { type: 'boolean', example: true },
                    agreesToTerms: { type: 'boolean', example: true },
                    businessName: { type: 'string', example: 'Acme Corp', description: 'Required for HOST/BUSINESS' },
                    businessDescription: { type: 'string', example: 'Event management & hosting', description: 'Required for HOST/BUSINESS' },
                    einNumber: { type: 'string', example: '12-3456789', description: 'Optional for HOST/BUSINESS' },
                    location: { type: 'string', example: 'New York, NY', description: 'Required for HOST/BUSINESS' },
                    govtIdFrontImage: { type: 'string', format: 'binary', description: 'Govt ID Front Image (File upload for HOST/BUSINESS)' },
                    govtIdBackImage: { type: 'string', format: 'binary', description: 'Govt ID Back Image (File upload for HOST/BUSINESS)' },
                    businessLicenseFrontImage: { type: 'string', format: 'binary', description: 'Business License Front Image (File upload for HOST/BUSINESS)' },
                    businessLicenseBackImage: { type: 'string', format: 'binary', description: 'Business License Back Image (File upload for HOST/BUSINESS)' },
                  },
                },
              },
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
                    businessProfile: {
                      type: 'object',
                      description: 'Required if role is HOST or BUSINESS. einNumber is optional.',
                      required: [
                        'businessName',
                        'businessDescription',
                        'location',
                        'govtIdFrontImage',
                        'govtIdBackImage',
                        'businessLicenseFrontImage',
                        'businessLicenseBackImage',
                      ],
                      properties: {
                        businessName: { type: 'string', example: 'Acme Corp' },
                        businessDescription: { type: 'string', example: 'Event management & venue services' },
                        einNumber: { type: 'string', example: '12-3456789' },
                        location: { type: 'string', example: 'New York, NY' },
                        govtIdFrontImage: { type: 'string', example: 'https://example.com/govt_front.jpg' },
                        govtIdBackImage: { type: 'string', example: 'https://example.com/govt_back.jpg' },
                        businessLicenseFrontImage: { type: 'string', example: 'https://example.com/license_front.jpg' },
                        businessLicenseBackImage: { type: 'string', example: 'https://example.com/license_back.jpg' },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'User registered successfully. Activation OTP sent to email.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      statusCode: { type: 'number', example: 201 },
                      message: { type: 'string', example: 'User registered successfully. Please verify your email with the activation OTP sent to your inbox.' },
                      data: {
                        type: 'object',
                        properties: {
                          message: { type: 'string', example: 'User registered successfully. Please verify your email with the activation OTP sent to your inbox.' },
                          email: { type: 'string', example: 'john@example.com' },
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
      '/api/auth/verify-register-otp': {
        post: {
          summary: 'Verify registration OTP & activate account (returns JWT access/refresh tokens)',
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
              description: 'Account verified & activated successfully. Tokens generated.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      statusCode: { type: 'number', example: 200 },
                      message: { type: 'string', example: 'Account verified & activated successfully' },
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
              description: 'Invalid or expired OTP code',
            },
          },
        },
      },
      '/api/auth/resend-activation-otp': {
        post: {
          summary: 'Resend account activation OTP to email',
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
              description: 'Account activation OTP resent successfully',
            },
          },
        },
      },
      '/api/auth/resend-forgot-password-otp': {
        post: {
          summary: 'Resend forgot password OTP to email',
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
              description: 'Forgot password OTP resent successfully',
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
      '/api/auth/verify-forgot-password-otp': {
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
      '/api/auth/refresh-token': {
        post: {
          summary: 'Refresh access token using valid refresh token',
          tags: ['Authentication'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['refreshToken'],
                  properties: {
                    refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Token refreshed successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      statusCode: { type: 'number', example: 200 },
                      message: { type: 'string', example: 'Token refreshed successfully' },
                      data: {
                        type: 'object',
                        properties: {
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
              description: 'Validation error or inactive account',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: false },
                      message: { type: 'string', example: 'Refresh token is required' },
                    },
                  },
                },
              },
            },
            '401': {
              description: 'Invalid or expired refresh token',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: false },
                      message: { type: 'string', example: 'Invalid or expired refresh token' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/auth/change-password': {
        post: {
          summary: 'Change password for authenticated user (requires current password)',
          tags: ['Authentication'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['oldPassword', 'newPassword', 'confirmPassword'],
                  properties: {
                    oldPassword: { type: 'string', example: 'OldPassword123!' },
                    newPassword: { type: 'string', example: 'NewPassword123!' },
                    confirmPassword: { type: 'string', example: 'NewPassword123!' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Password changed successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      statusCode: { type: 'number', example: 200 },
                      message: { type: 'string', example: 'Password changed successfully' },
                      data: {
                        type: 'object',
                        properties: {
                          message: { type: 'string', example: 'Password changed successfully' },
                        },
                      },
                    },
                  },
                },
              },
            },
            '400': { description: 'Incorrect current password, password mismatch, or validation error' },
            '401': { description: 'Unauthorized' },
          },
        },
      },
      '/api/auth/logout': {
        post: {
          summary: 'Logout user & invalidate refresh token',
          tags: ['Authentication'],
          security: [
            {
              bearerAuth: [],
            },
          ],
          responses: {
            '200': {
              description: 'User logged out successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      statusCode: { type: 'number', example: 200 },
                      message: { type: 'string', example: 'User logged out successfully' },
                      data: {
                        type: 'object',
                        properties: {
                          message: { type: 'string', example: 'User logged out successfully' },
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
                          phoneNumber: { type: 'string', example: '+1234567890' },
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
        patch: {
          summary: 'Update currently authenticated user profile (name, email, phoneNumber, businessName, businessDescription, location)',
          tags: ['Authentication'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', example: 'John Doe Updated' },
                    email: { type: 'string', example: 'johnnew@example.com' },
                    phoneNumber: { type: 'string', example: '+1234567890' },
                    businessName: { type: 'string', example: 'Apex Events LLC', description: 'Allowed for HOST and BUSINESS roles' },
                    businessDescription: { type: 'string', example: 'Event management company', description: 'Allowed for HOST and BUSINESS roles' },
                    location: { type: 'string', example: 'New York, NY', description: 'Allowed for HOST and BUSINESS roles' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Profile updated successfully' },
            '400': { description: 'Validation error, email already in use, or unauthorized field for user role' },
            '401': { description: 'Unauthorized' },
          },
        },
      },
      '/api/auth/profile': {
        patch: {
          summary: 'Update user profile (name, email, phoneNumber, businessName, businessDescription, location)',
          tags: ['Authentication'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', example: 'John Doe Updated' },
                    email: { type: 'string', example: 'johnnew@example.com' },
                    phoneNumber: { type: 'string', example: '+1234567890' },
                    businessName: { type: 'string', example: 'Apex Events LLC', description: 'Allowed for HOST and BUSINESS roles' },
                    businessDescription: { type: 'string', example: 'Event management company', description: 'Allowed for HOST and BUSINESS roles' },
                    location: { type: 'string', example: 'New York, NY', description: 'Allowed for HOST and BUSINESS roles' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Profile updated successfully' },
            '400': { description: 'Validation error, email already in use, or unauthorized field for user role' },
            '401': { description: 'Unauthorized' },
          },
        },
      },
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
      '/api/events': {
        post: {
          summary: 'Create a new event',
          tags: ['Event'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['subCategoryId', 'title', 'latitude', 'longitude', 'placeName', 'description', 'startDate', 'endDate'],
                  properties: {
                    subCategoryId: { type: 'string', example: '65c8f1e29a8f3b0012345678', description: 'Subcategory ObjectId (must have parentCategory)' },
                    title: { type: 'string', example: 'Summer Music Festival 2026' },
                    latitude: { type: 'number', example: 40.7128 },
                    longitude: { type: 'number', example: -74.006 },
                    ageRestriction: { type: 'integer', example: 18 },
                    placeName: { type: 'string', example: 'Central Park Arena' },
                    description: { type: 'string', example: 'Annual summer live concert and music festival.' },
                    startDate: { type: 'string', format: 'date-time', example: '2026-09-01T18:00:00.000Z' },
                    endDate: { type: 'string', format: 'date-time', example: '2026-09-01T23:00:00.000Z' },
                    ticketPrice: { type: 'number', example: 49.99 },
                    images: { type: 'array', items: { type: 'string', format: 'binary' }, description: 'Event image files upload' },
                    artistImages: { type: 'array', items: { type: 'string', format: 'binary' }, description: 'Artist profile image files upload (mapped 1-to-1 with artistInfo index)' },
                    rewardImages: { type: 'array', items: { type: 'string', format: 'binary' }, description: 'Reward image files upload (mapped 1-to-1 with rewards index)' },
                    artistInfo: { type: 'string', example: '[{"name":"DJ Alex","role":"Headliner","socialMediaLinks":{"instagram":"https://instagram.com/djalex","spotify":"https://spotify.com/artist/123"}}]' },
                    rewards: { type: 'string', example: '[{"title":"VIP Pass Badge","description":"Free VIP area access badge","pointsRequired":150,"stock":50}]' },
                  },
                },
              },
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['subCategoryId', 'title', 'latitude', 'longitude', 'placeName', 'description', 'startDate', 'endDate'],
                  properties: {
                    subCategoryId: { type: 'string', example: '65c8f1e29a8f3b0012345678', description: 'Subcategory ObjectId (must have parentCategory)' },

                    title: { type: 'string', example: 'Summer Music Festival 2026' },
                    latitude: { type: 'number', example: 40.7128 },
                    longitude: { type: 'number', example: -74.006 },
                    ageRestriction: { type: 'integer', example: 18 },
                    placeName: { type: 'string', example: 'Central Park Arena' },
                    description: { type: 'string', example: 'Annual summer live concert and music festival.' },
                    startDate: { type: 'string', format: 'date-time', example: '2026-09-01T18:00:00.000Z' },
                    endDate: { type: 'string', format: 'date-time', example: '2026-09-01T23:00:00.000Z' },
                    ticketPrice: { type: 'number', example: 49.99 },
                    images: { type: 'array', items: { type: 'string' } },
                    artistInfo: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          name: { type: 'string', example: 'DJ Alex' },
                          role: { type: 'string', example: 'Headliner' },
                          image: { type: 'string', example: 'https://example.com/artist.jpg' },
                          socialMediaLinks: {
                            type: 'object',
                            additionalProperties: { type: 'string' },
                            example: {
                              instagram: 'https://instagram.com/djalex',
                              spotify: 'https://spotify.com/artist/123',
                            },
                          },
                        },
                      },
                    },
                    rewards: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          title: { type: 'string', example: 'VIP Pass Badge' },
                          description: { type: 'string', example: 'Free VIP area access badge' },
                          pointsRequired: { type: 'integer', example: 150 },
                          stock: { type: 'integer', example: 50 },
                          image: { type: 'string', example: 'https://example.com/reward.jpg' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            '201': { description: 'Event created successfully' },
            '400': { description: 'Validation error or invalid input' },
            '401': { description: 'Unauthorized' },
            '404': { description: 'Category not found' },
          },
        },
        get: {
          summary: 'Get all active events (For all users - USER, HOST, BUSINESS, ADMIN)',
          tags: ['Event'],
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
              description: 'Number of items per page (default: 10, max: 20)',
              schema: { type: 'integer', default: 10, maximum: 20 },
            },
            {
              name: 'search',
              in: 'query',
              description: 'Search events by title, description, or placeName',
              schema: { type: 'string' },
            },
            {
              name: 'subCategoryId',
              in: 'query',
              description: 'Filter events by subcategory ID',
              schema: { type: 'string' },
            },
            {
              name: 'categoryId',
              in: 'query',
              description: 'Filter events by category ID',
              schema: { type: 'string' },
            },
            {
              name: 'hostId',
              in: 'query',
              description: 'Filter events by host user ID',
              schema: { type: 'string' },
            },
            {
              name: 'latitude',
              in: 'query',
              description: 'User latitude for 50km radius location filtering (supports lat)',
              schema: { type: 'number' },
            },
            {
              name: 'longitude',
              in: 'query',
              description: 'User longitude for 50km radius location filtering (supports lng/lan)',
              schema: { type: 'number' },
            },
            {
              name: 'seed',
              in: 'query',
              description: 'Optional random seed for per-user consistent random pagination',
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': { description: 'Events retrieved successfully' },
            '401': { description: 'Unauthorized' },
          },
        },
      },

      '/api/events/admin': {
        get: {
          summary: 'Get paginated events for Admin (Filter by hostId, search by title/host, filter by category)',
          tags: ['Event'],
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
              description: 'Search events by title, description, placeName, or host name/email',
              schema: { type: 'string' },
            },
            {
              name: 'title',
              in: 'query',
              description: 'Filter/search by title specifically',
              schema: { type: 'string' },
            },
            {
              name: 'hostId',
              in: 'query',
              description: 'Filter events hostId wise',
              schema: { type: 'string' },
            },
            {
              name: 'categoryId',
              in: 'query',
              description: 'Filter events categorywise (main category or subcategory ID)',
              schema: { type: 'string' },
            },
            {
              name: 'subCategoryId',
              in: 'query',
              description: 'Filter events subcategorywise',
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': { description: 'Admin events retrieved successfully' },
            '401': { description: 'Not authorized' },
            '403': { description: 'Forbidden: Requires ADMIN role' },
          },
        },
      },

      '/api/events/{id}': {
        get: {
          summary: 'Get single event details by ID',
          tags: ['Event'],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Event ID',
            },
          ],
          responses: {
            '200': { description: 'Event details retrieved successfully' },
            '404': { description: 'Event not found' },
          },
        },
        patch: {
          summary: 'Update an event by ID (Host / Admin)',
          tags: ['Event'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Event ID',
            },
          ],
          requestBody: {
            required: false,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    categoryId: { type: 'string' },
                    title: { type: 'string' },
                    latitude: { type: 'number' },
                    longitude: { type: 'number' },
                    ageRestriction: { type: 'integer' },
                    placeName: { type: 'string' },
                    description: { type: 'string' },
                    startDate: { type: 'string', format: 'date-time' },
                    endDate: { type: 'string', format: 'date-time' },
                    ticketPrice: { type: 'number' },
                    images: { type: 'array', items: { type: 'string', format: 'binary' } },
                    artistImages: { type: 'array', items: { type: 'string', format: 'binary' } },
                    rewardImages: { type: 'array', items: { type: 'string', format: 'binary' } },
                    artistInfo: { type: 'string' },
                    rewards: { type: 'string' },
                  },
                },
              },
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    categoryId: { type: 'string' },
                    title: { type: 'string' },
                    latitude: { type: 'number' },
                    longitude: { type: 'number' },
                    ageRestriction: { type: 'integer' },
                    placeName: { type: 'string' },
                    description: { type: 'string' },
                    startDate: { type: 'string', format: 'date-time' },
                    endDate: { type: 'string', format: 'date-time' },
                    ticketPrice: { type: 'number' },
                    images: { type: 'array', items: { type: 'string' } },
                    artistInfo: { type: 'array', items: { type: 'object' } },
                    rewards: { type: 'array', items: { type: 'object' } },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Event updated successfully' },
            '400': { description: 'Validation error' },
            '401': { description: 'Not authorized' },
            '403': { description: 'Forbidden: Not authorized to edit this event' },
            '404': { description: 'Event not found' },
          },
        },
        delete: {
          summary: 'Delete an event by ID',
          tags: ['Event'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Event ID',
            },
          ],
          responses: {
            '200': { description: 'Event deleted successfully' },
            '401': { description: 'Not authorized' },
            '403': { description: 'Forbidden: Not authorized to delete this event' },
            '404': { description: 'Event not found' },
          },
        },
      },

    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Express): void => {
  app.get('/api-docs.json', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  app.get(['/api-docs', '/api-docs/'], (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>TeamStreak Promo API Documentation</title>
        <link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.18.2/swagger-ui.min.css" />
        <link rel="icon" type="image/png" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.18.2/favicon-32x32.png" />
        <style>
          html { box-sizing: border-box; overflow-y: scroll; }
          *, *:before, *:after { box-sizing: inherit; }
          body { margin: 0; background: #fafafa; }
          .swagger-ui .topbar { display: none; }
        </style>
      </head>
      <body>
        <div id="swagger-ui"></div>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.18.2/swagger-ui-bundle.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.18.2/swagger-ui-standalone-preset.js"></script>
        <script>
          window.onload = function() {
            const ui = SwaggerUIBundle({
              spec: ${JSON.stringify(swaggerSpec)},
              dom_id: '#swagger-ui',
              deepLinking: true,
              presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIStandalonePreset
              ],
              plugins: [
                SwaggerUIBundle.plugins.DownloadUrl
              ],
              layout: "StandaloneLayout",
              defaultModelsExpandDepth: -1
            });
            window.ui = ui;
          };
        </script>
      </body>
      </html>
    `);
  });
};
