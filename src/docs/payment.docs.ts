export const paymentDocs = {
  '/api/payments/create-connect-account': {
    post: {
      tags: ['Payments'],
      summary: 'Create Stripe Connect Account & Generate Onboarding Link',
      description:
        'Creates a Stripe Connect Express account for the authenticated host/business (if not already created), associates it with the host BusinessProfile, and generates a Stripe-hosted onboarding/verification link for linking bank accounts and identity verification.',
      security: [
        {
          bearerAuth: [],
        },
      ],
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                refreshUrl: {
                  type: 'string',
                  description: 'URL to redirect to if the onboarding link expires or user refreshes',
                  example: 'https://yourfrontend.com/host/stripe/refresh',
                },
                returnUrl: {
                  type: 'string',
                  description: 'URL to redirect to after user completes Stripe onboarding flow',
                  example: 'https://yourfrontend.com/host/stripe/return',
                },
                country: {
                  type: 'string',
                  description: 'Two-letter ISO country code',
                  example: 'US',
                  default: 'US',
                },
                businessType: {
                  type: 'string',
                  enum: ['individual', 'company'],
                  description: 'Type of business entity',
                  example: 'individual',
                },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Stripe onboarding link generated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true,
                  },
                  statusCode: {
                    type: 'number',
                    example: 200,
                  },
                  message: {
                    type: 'string',
                    example: 'Stripe onboarding link generated successfully',
                  },
                  data: {
                    type: 'object',
                    properties: {
                      stripeAccountId: {
                        type: 'string',
                        example: 'acct_1OuX992eZvKYlo2C',
                      },
                      url: {
                        type: 'string',
                        example: 'https://connect.stripe.com/setup/s/acct_1OuX992eZvKYlo2C/...',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '401': {
          description: 'Unauthorized - Invalid or missing token',
        },
        '403': {
          description: 'Forbidden - Only HOST and BUSINESS roles can create a connect account',
        },
        '404': {
          description: 'Not Found - Business profile not found for host',
        },
        '500': {
          description: 'Internal Server Error',
        },
      },
    },
  },
  '/api/payments/account-status': {
    get: {
      tags: ['Payments'],
      summary: 'Get Host Stripe Connect Account Status',
      description:
        'Retrieves current Stripe Connect verification and payout capability status for the authenticated host, synchronizing with Stripe in real time.',
      security: [
        {
          bearerAuth: [],
        },
      ],
      responses: {
        '200': {
          description: 'Stripe account status retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true,
                  },
                  statusCode: {
                    type: 'number',
                    example: 200,
                  },
                  message: {
                    type: 'string',
                    example: 'Stripe account status retrieved successfully',
                  },
                  data: {
                    type: 'object',
                    properties: {
                      stripeAccountId: {
                        type: 'string',
                        example: 'acct_1OuX992eZvKYlo2C',
                      },
                      isStripeConnected: {
                        type: 'boolean',
                        example: true,
                      },
                      isStripeVerified: {
                        type: 'boolean',
                        example: true,
                      },
                      stripeAccountStatus: {
                        type: 'string',
                        enum: ['UNLINKED', 'PENDING', 'ACTIVE', 'RESTRICTED', 'INACTIVE'],
                        example: 'ACTIVE',
                      },
                      stripePayoutsEnabled: {
                        type: 'boolean',
                        example: true,
                      },
                      stripeChargesEnabled: {
                        type: 'boolean',
                        example: true,
                      },
                      stripeDetailsSubmitted: {
                        type: 'boolean',
                        example: true,
                      },
                      requirements: {
                        type: 'object',
                        properties: {
                          currentlyDue: {
                            type: 'array',
                            items: { type: 'string' },
                          },
                          eventuallyDue: {
                            type: 'array',
                            items: { type: 'string' },
                          },
                          pastDue: {
                            type: 'array',
                            items: { type: 'string' },
                          },
                          pendingVerification: {
                            type: 'array',
                            items: { type: 'string' },
                          },
                          disabledReason: {
                            type: 'string',
                            nullable: true,
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
        '401': {
          description: 'Unauthorized - Invalid or missing token',
        },
        '403': {
          description: 'Forbidden - Only HOST and BUSINESS roles can access account status',
        },
        '404': {
          description: 'Not Found - Business profile not found',
        },
      },
    },
  },
  '/api/payments/create-login-link': {
    post: {
      tags: ['Payments'],
      summary: 'Generate Stripe Express Dashboard Login Link',
      description:
        'Creates a single-use login link for the host to view their Stripe Express Dashboard to manage bank accounts, payouts, and tax details.',
      security: [
        {
          bearerAuth: [],
        },
      ],
      responses: {
        '200': {
          description: 'Stripe dashboard login link created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true,
                  },
                  statusCode: {
                    type: 'number',
                    example: 200,
                  },
                  message: {
                    type: 'string',
                    example: 'Stripe dashboard login link created successfully',
                  },
                  data: {
                    type: 'object',
                    properties: {
                      url: {
                        type: 'string',
                        example: 'https://connect.stripe.com/express/acct_1OuX992eZvKYlo2C/...',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '400': {
          description: 'Bad Request - Host does not have a connected Stripe account',
        },
        '401': {
          description: 'Unauthorized - Invalid or missing token',
        },
        '403': {
          description: 'Forbidden',
        },
        '404': {
          description: 'Not Found - Business profile not found',
        },
      },
    },
  },
  '/api/payments/webhook': {
    post: {
      tags: ['Payments'],
      summary: 'Stripe Webhook Listener',
      description:
        'Public endpoint called by Stripe events (e.g., account.updated). Validates stripe-signature header and updates the host BusinessProfile verification and payout status in MongoDB.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              description: 'Raw Stripe Event Payload',
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Webhook processed successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true,
                  },
                  statusCode: {
                    type: 'number',
                    example: 200,
                  },
                  message: {
                    type: 'string',
                    example: 'Stripe webhook received and processed successfully',
                  },
                  data: {
                    type: 'object',
                    properties: {
                      received: {
                        type: 'boolean',
                        example: true,
                      },
                      eventType: {
                        type: 'string',
                        example: 'account.updated',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '400': {
          description: 'Bad Request - Signature verification failed or invalid payload',
        },
      },
    },
  },
};
