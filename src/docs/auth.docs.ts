export const authDocs = {
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
                phoneNumber: { type: 'string', example: '+1234567890' },
                profileImage: { type: 'string', format: 'binary', description: 'User Profile Image file upload' },
                password: { type: 'string', example: 'password123' },
                confirmPassword: { type: 'string', example: 'password123' },
                role: { type: 'string', enum: ['USER', 'HOST', 'BUSINESS'], example: 'HOST', default: 'USER' },
                isAgeOver18: { type: 'boolean', example: true },
                agreesToTerms: { type: 'boolean', example: true },
                businessName: { type: 'string', example: 'Acme Corp', description: 'Required for HOST/BUSINESS' },
                businessDescription: { type: 'string', example: 'Event management & hosting', description: 'Required for HOST/BUSINESS' },
                einNumber: { type: 'string', example: '12-3456789', description: 'EIN Number (Provide either einNumber OR both businessLicenseFrontImage and businessLicenseBackImage)' },
                location: { type: 'string', example: 'New York, NY', description: 'Required for HOST/BUSINESS' },
                govtIdFrontImage: { type: 'string', format: 'binary', description: 'Govt ID Front Image (Required file upload for HOST/BUSINESS)' },
                govtIdBackImage: { type: 'string', format: 'binary', description: 'Govt ID Back Image (Required file upload for HOST/BUSINESS)' },
                businessLicenseFrontImage: { type: 'string', format: 'binary', description: 'Business License Front Image (Required if einNumber is not provided)' },
                businessLicenseBackImage: { type: 'string', format: 'binary', description: 'Business License Back Image (Required if einNumber is not provided)' },
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
                phoneNumber: { type: 'string', example: '+1234567890' },
                profileImage: { type: 'string', example: 'https://example.com/profile.jpg' },
                password: { type: 'string', example: 'password123' },
                confirmPassword: { type: 'string', example: 'password123' },
                role: { type: 'string', enum: ['USER', 'HOST', 'BUSINESS'], example: 'USER', default: 'USER' },
                isAgeOver18: { type: 'boolean', example: true },
                agreesToTerms: { type: 'boolean', example: true },
                businessProfile: {
                  type: 'object',
                  description: 'Required if role is HOST or BUSINESS. Provide either einNumber OR both businessLicenseFrontImage and businessLicenseBackImage.',
                  required: [
                    'businessName',
                    'businessDescription',
                    'location',
                    'govtIdFrontImage',
                    'govtIdBackImage',
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
                      phoneNumber: { type: 'string', example: '+1234567890' },
                      profileImage: { type: 'string', example: 'https://example.com/profile.jpg' },
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
                      phoneNumber: { type: 'string', example: '+1234567890' },
                      profileImage: { type: 'string', example: 'https://example.com/profile.jpg' },
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
                      profileImage: { type: 'string', example: 'https://example.com/profile.jpg' },
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
      summary: 'Update currently authenticated user profile (name, email, phoneNumber, profileImage, businessName, businessDescription, location)',
      tags: ['Authentication'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'John Doe Updated' },
                email: { type: 'string', example: 'johnnew@example.com' },
                phoneNumber: { type: 'string', example: '+1234567890' },
                profileImage: { type: 'string', format: 'binary', description: 'New profile image file upload' },
                businessName: { type: 'string', example: 'Apex Events LLC', description: 'Allowed for HOST and BUSINESS roles' },
                businessDescription: { type: 'string', example: 'Event management company', description: 'Allowed for HOST and BUSINESS roles' },
                location: { type: 'string', example: 'New York, NY', description: 'Allowed for HOST and BUSINESS roles' },
              },
            },
          },
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'John Doe Updated' },
                email: { type: 'string', example: 'johnnew@example.com' },
                phoneNumber: { type: 'string', example: '+1234567890' },
                profileImage: { type: 'string', example: 'https://example.com/profile.jpg' },
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
      summary: 'Update user profile (name, email, phoneNumber, profileImage, businessName, businessDescription, location)',
      tags: ['Authentication'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'John Doe Updated' },
                email: { type: 'string', example: 'johnnew@example.com' },
                phoneNumber: { type: 'string', example: '+1234567890' },
                profileImage: { type: 'string', format: 'binary', description: 'New profile image file upload' },
                businessName: { type: 'string', example: 'Apex Events LLC', description: 'Allowed for HOST and BUSINESS roles' },
                businessDescription: { type: 'string', example: 'Event management company', description: 'Allowed for HOST and BUSINESS roles' },
                location: { type: 'string', example: 'New York, NY', description: 'Allowed for HOST and BUSINESS roles' },
              },
            },
          },
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'John Doe Updated' },
                email: { type: 'string', example: 'johnnew@example.com' },
                phoneNumber: { type: 'string', example: '+1234567890' },
                profileImage: { type: 'string', example: 'https://example.com/profile.jpg' },
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
};
