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
  '/api/payments/create-checkout-session': {
    post: {
      tags: ['Payments'],
      summary: 'Create Stripe Checkout Session for Event Ticket & Rewards Purchase',
      description:
        'Validates ticket availability across price categories and reward availability for an event, then creates a Stripe Checkout Session. Upon payment completion, user points are awarded (1 point per ticket), ticket orders are saved to eventOrder, and reward redemption orders are saved to order.',
      security: [
        {
          bearerAuth: [],
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['eventId'],
              properties: {
                eventId: {
                  type: 'string',
                  description: 'MongoDB ObjectId of the Event',
                  example: '66e500000000000000000001',
                },
                tickets: {
                  type: 'array',
                  description: 'List of ticket price categories and quantities to purchase',
                  items: {
                    type: 'object',
                    properties: {
                      priceCategoryId: {
                        type: 'string',
                        description: 'ID of the price category in event.priceCategories (optional for general ticket)',
                        example: '66e500000000000000000010',
                      },
                      quantity: {
                        type: 'integer',
                        description: 'Number of tickets for this price category',
                        example: 2,
                        default: 1,
                      },
                    },
                  },
                },
                rewards: {
                  type: 'array',
                  description: 'List of reward items and quantities to claim with ticket purchase',
                  items: {
                    type: 'object',
                    properties: {
                      rewardId: {
                        type: 'string',
                        description: 'ID of the reward subdocument in event.rewards',
                        example: '66e500000000000000000020',
                      },
                      quantity: {
                        type: 'integer',
                        description: 'Quantity of reward items',
                        example: 1,
                        default: 1,
                      },
                    },
                  },
                },
                successUrl: {
                  type: 'string',
                  description: 'URL to redirect after successful checkout',
                  example: 'https://yourfrontend.com/payment-success',
                },

                cancelUrl: {
                  type: 'string',
                  description: 'URL to redirect if checkout is cancelled',
                  example: 'https://yourfrontend.com/payment-cancel',
                },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Stripe checkout session created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  statusCode: { type: 'number', example: 200 },
                  message: { type: 'string', example: 'Stripe checkout session created successfully' },
                  data: {
                    type: 'object',
                    properties: {
                      sessionId: {
                        type: 'string',
                        example: 'cs_test_a1b2c3d4e5f6g7h8i9',
                      },
                      url: {
                        type: 'string',
                        example: 'https://checkout.stripe.com/c/pay/cs_test_a1b2c3d4e5f6g7h8i9',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '400': {
          description: 'Bad Request - Requested ticket or reward stock unavailable',
        },
        '401': {
          description: 'Unauthorized - Missing or invalid token',
        },
        '404': {
          description: 'Not Found - Event, price category, or reward item not found',
        },
      },
    },
  },
  '/api/payments/webhook': {
    post: {
      tags: ['Payments'],
      summary: 'Stripe Webhook Listener',
      description:
        'Public endpoint called by Stripe events (e.g., account.updated, checkout.session.completed). Validates stripe-signature header and updates account status or fulfills event ticket and reward orders.',
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
                        example: 'checkout.session.completed',
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
  '/api/payments/events/{eventId}/payout': {
    post: {
      tags: ['Payments'],
      summary: 'Trigger Payout for Completed Event',
      description:
        'Calculates total ticket revenue minus $0.99 platform fee per ticket sold and transfers net payout directly to host Stripe Connect Express account for an ended event.',
      security: [
        {
          bearerAuth: [],
        },
      ],
      parameters: [
        {
          name: 'eventId',
          in: 'path',
          required: true,
          description: 'MongoDB ObjectId of the ended Event',
          schema: {
            type: 'string',
            example: '66e500000000000000000001',
          },
        },
      ],
      responses: {
        '200': {
          description: 'Event payout processed successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  statusCode: { type: 'number', example: 200 },
                  message: { type: 'string', example: 'Event payout processed successfully' },
                  data: {
                    type: 'object',
                    properties: {
                      eventId: { type: 'string', example: '66e500000000000000000001' },
                      payoutStatus: { type: 'string', example: 'COMPLETED' },
                      totalOrders: { type: 'number', example: 5 },
                      totalTicketsSold: { type: 'number', example: 10 },
                      totalRevenue: { type: 'number', example: 500.0 },
                      platformFeeAmount: { type: 'number', example: 9.9 },
                      hostPayoutAmount: { type: 'number', example: 490.1 },
                      stripeTransferId: { type: 'string', example: 'tr_1OuX992eZvKYlo2C' },
                      paidOutAt: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
          },
        },
        '400': {
          description: 'Bad Request - Event has not ended or host has no connected Stripe account',
        },
        '401': {
          description: 'Unauthorized - Missing or invalid token',
        },
        '403': {
          description: 'Forbidden - User is not the event host or Admin',
        },
        '404': {
          description: 'Not Found - Event not found',
        },
      },
    },
  },
  '/api/payments/process-payouts': {
    post: {
      tags: ['Payments'],
      summary: 'Sweep and Trigger Payouts for All Completed Events (Admin Only)',
      description:
        'Admin endpoint to manually trigger batch payout processing for all completed events whose end dates have passed and payouts are pending/failed.',
      security: [
        {
          bearerAuth: [],
        },
      ],
      responses: {
        '200': {
          description: 'Completed event payouts sweep executed successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  statusCode: { type: 'number', example: 200 },
                  message: { type: 'string', example: 'Completed event payouts sweep executed successfully' },
                  data: {
                    type: 'object',
                    properties: {
                      processedCount: { type: 'number', example: 2 },
                      results: {
                        type: 'array',
                        items: { type: 'object' },
                      },
                      errors: {
                        type: 'array',
                        items: { type: 'object' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '401': {
          description: 'Unauthorized - Missing or invalid token',
        },
        '403': {
          description: 'Forbidden - Requires ADMIN role',
        },
      },
    },
  },
  '/api/payments/events/{eventId}/payout-status': {
    get: {
      tags: ['Payments'],
      summary: 'Get Event Payout Status & Breakdown',
      description:
        'Retrieves payout status, ticket sales summary, platform fee ($0.99/ticket), net host payout, transfer ID, and host Stripe account status for an event.',
      security: [
        {
          bearerAuth: [],
        },
      ],
      parameters: [
        {
          name: 'eventId',
          in: 'path',
          required: true,
          description: 'MongoDB ObjectId of the Event',
          schema: {
            type: 'string',
            example: '66e500000000000000000001',
          },
        },
      ],
      responses: {
        '200': {
          description: 'Event payout status retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  statusCode: { type: 'number', example: 200 },
                  message: { type: 'string', example: 'Event payout status retrieved successfully' },
                  data: {
                    type: 'object',
                    properties: {
                      eventId: { type: 'string', example: '66e500000000000000000001' },
                      eventTitle: { type: 'string', example: 'Summer Music Fest' },
                      endDate: { type: 'string', format: 'date-time' },
                      isEventEnded: { type: 'boolean', example: true },
                      payoutStatus: { type: 'string', example: 'COMPLETED' },
                      totalTicketsSold: { type: 'number', example: 10 },
                      totalRevenue: { type: 'number', example: 500.0 },
                      platformFeeAmount: { type: 'number', example: 9.9 },
                      hostPayoutAmount: { type: 'number', example: 490.1 },
                      stripeTransferId: { type: 'string', example: 'tr_1OuX992eZvKYlo2C' },
                      hostStripeAccountId: { type: 'string', example: 'acct_1OuX992eZvKYlo2C' },
                      isHostStripeVerified: { type: 'boolean', example: true },
                    },
                  },
                },
              },
            },
          },
        },
        '401': {
          description: 'Unauthorized - Missing or invalid token',
        },
        '403': {
          description: 'Forbidden - User is not the event host or Admin',
        },
        '404': {
          description: 'Not Found - Event not found',
        },
      },
    },
  },
};

