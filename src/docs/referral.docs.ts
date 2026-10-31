export const referralDocs = {
  '/api/referrals/my-points': {
    get: {
      tags: ['Referrals & Host Points'],
      summary: 'Get all host point balances for authenticated user',
      description:
        'Retrieves all host-scoped loyalty point balances for the authenticated user. Points earned under a specific host can only be redeemed for rewards created by that same host.',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'User host points retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  statusCode: { type: 'integer', example: 200 },
                  success: { type: 'boolean', example: true },
                  message: {
                    type: 'string',
                    example: 'User host points retrieved successfully',
                  },
                  data: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        hostId: { type: 'string', example: '66fa3b5b1a8c9e0012345678' },
                        hostName: { type: 'string', example: 'Summer Music Fest LLC' },
                        businessName: { type: 'string', example: 'Summer Music Fest LLC' },
                        points: { type: 'integer', example: 5 },
                        totalEarned: { type: 'integer', example: 10 },
                        totalSpent: { type: 'integer', example: 5 },
                        updatedAt: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized — missing or invalid token' },
      },
    },
  },
  '/api/referrals/my-referrals': {
    get: {
      tags: ['Referrals & Host Points'],
      summary: 'Get referral history for authenticated user',
      description:
        'Retrieves list of successful referral purchases where the authenticated user was the referrer. Both referrer and buyer received 1 host-scoped point upon purchase.',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'User referral history retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  statusCode: { type: 'integer', example: 200 },
                  success: { type: 'boolean', example: true },
                  message: {
                    type: 'string',
                    example: 'User referral history retrieved successfully',
                  },
                  data: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        _id: { type: 'string', example: '66fa4c7b1a8c9e0012345679' },
                        referee: {
                          type: 'object',
                          properties: {
                            _id: { type: 'string' },
                            name: { type: 'string', example: 'Jane Doe' },
                            email: { type: 'string', example: 'jane@example.com' },
                          },
                        },
                        eventId: {
                          type: 'object',
                          properties: {
                            _id: { type: 'string' },
                            title: { type: 'string', example: 'Neon Nights Rave 2026' },
                          },
                        },
                        pointsAwarded: { type: 'integer', example: 1 },
                        status: { type: 'string', example: 'COMPLETED' },
                        createdAt: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
      },
    },
  },
  '/api/referrals/event/{eventId}': {
    get: {
      tags: ['Referrals & Host Points'],
      summary: 'Get event referral link and host point balance',
      description:
        'Retrieves the authenticated user’s unique referral code, shareable link for this event, and current points balance with this event’s host.',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'eventId',
          in: 'path',
          required: true,
          schema: { type: 'string', example: '66fa3b5b1a8c9e0012345678' },
          description: 'MongoDB ObjectId of the event',
        },
      ],
      responses: {
        200: {
          description: 'Event referral details retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  statusCode: { type: 'integer', example: 200 },
                  success: { type: 'boolean', example: true },
                  message: {
                    type: 'string',
                    example: 'Event referral link and host points retrieved successfully',
                  },
                  data: {
                    type: 'object',
                    properties: {
                      eventId: { type: 'string', example: '66fa3b5b1a8c9e0012345678' },
                      referralCode: { type: 'string', example: 'A8B2C3D4' },
                      referralLink: {
                        type: 'string',
                        example: '/events/66fa3b5b1a8c9e0012345678?ref=A8B2C3D4',
                      },
                      hostId: { type: 'string', example: '66fa111b1a8c9e0012345678' },
                      currentHostPoints: { type: 'integer', example: 3 },
                    },
                  },
                },
              },
            },
          },
        },
        404: { description: 'Event not found' },
        401: { description: 'Unauthorized' },
      },
    },
  },
};

