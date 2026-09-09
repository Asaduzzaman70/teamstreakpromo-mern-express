export const paymentDocs = {
  '/api/payments/create-checkout-session': {
    post: {
      tags: ['Payments'],
      summary: 'Create a Stripe Checkout Session',
      description: 'Creates a Stripe Checkout Session with the specified amount, currency, and redirect URLs.',
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
              required: ['amount'],
              properties: {
                amount: {
                  type: 'number',
                  description: 'The amount to be charged (e.g., 50.00)',
                  example: 50.00,
                },
                currency: {
                  type: 'string',
                  description: 'The currency code (e.g., usd)',
                  example: 'usd',
                  default: 'usd',
                },
                successUrl: {
                  type: 'string',
                  description: 'The URL to redirect to on successful payment',
                  example: 'https://yourfrontend.com/success',
                },
                cancelUrl: {
                  type: 'string',
                  description: 'The URL to redirect to if payment is cancelled',
                  example: 'https://yourfrontend.com/cancel',
                },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Payment Checkout Session created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true,
                  },
                  message: {
                    type: 'string',
                    example: 'Payment Checkout Session created successfully',
                  },
                  data: {
                    type: 'object',
                    properties: {
                      sessionId: {
                        type: 'string',
                        example: 'cs_test_a1b2c3...',
                      },
                      url: {
                        type: 'string',
                        example: 'https://checkout.stripe.com/c/pay/cs_test_a1b2c3...',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '400': {
          description: 'Bad Request - Missing amount',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false,
                  },
                  message: {
                    type: 'string',
                    example: 'Amount is required',
                  },
                },
              },
            },
          },
        },
        '500': {
          description: 'Internal Server Error',
        },
      },
    },
  },
};
