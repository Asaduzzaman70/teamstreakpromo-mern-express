export const businessPartnerAnalyticsDocs = {
  '/api/business-partner-analytics': {
    get: {
      tags: ['Business Partner Analytics'],
      summary: 'Get Complete Business Partner Analytics',
      description:
        'Retrieves the full dashboard analytics for the authenticated business partner from their Bearer token, including summary cards (Total Claims, Store Visits, Total Rewards) and the Reward Sell chart data. No ID parameter is required.',
      security: [
        {
          bearerAuth: [],
        },
      ],
      parameters: [
        {
          in: 'query',
          name: 'range',
          schema: {
            type: 'string',
            enum: ['week', 'month', 'year', 'last6months', 'last30days', 'last7days'],
            default: 'year',
          },
          description: 'Time bucket resolution for Reward Sell chart (e.g. week, month, year)',
        },
        {
          in: 'query',
          name: 'year',
          schema: { type: 'integer', example: 2026 },
          description: 'Target year (defaults to current year)',
        },
        {
          in: 'query',
          name: 'month',
          schema: { type: 'integer', minimum: 1, maximum: 12, example: 5 },
          description: 'Target month 1-12 (defaults to current month if month range)',
        },
        {
          in: 'query',
          name: 'itemId',
          schema: { type: 'string', example: '66e520000000000000000001' },
          description: 'Optional filter analytics to a specific marketplace reward item',
        },
      ],
      responses: {
        '200': {
          description: 'Business partner analytics retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  statusCode: { type: 'number', example: 200 },
                  message: { type: 'string', example: 'Business partner analytics retrieved successfully' },
                  data: {
                    type: 'object',
                    properties: {
                      overview: {
                        type: 'object',
                        properties: {
                          totalClaims: { type: 'number', example: 12450 },
                          storeVisits: { type: 'number', example: 12450 },
                          totalRewards: { type: 'number', example: 15 },
                          activeRewards: { type: 'number', example: 12 },
                          totalClaimOrders: { type: 'number', example: 3820 },
                        },
                      },
                      rewardSellChart: {
                        type: 'object',
                        properties: {
                          range: { type: 'string', example: 'year' },
                          year: { type: 'number', example: 2026 },
                          totalSells: { type: 'number', example: 12450 },
                          totalStoreVisits: { type: 'number', example: 12450 },
                          data: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                label: { type: 'string', example: 'May' },
                                date: { type: 'string', example: '2026-05-01' },
                                sells: { type: 'number', example: 300 },
                                claimsCount: { type: 'number', example: 45 },
                                storeVisits: { type: 'number', example: 280 },
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
        },
      },
    },
  },

  '/api/business-partner-analytics/overview': {
    get: {
      tags: ['Business Partner Analytics'],
      summary: 'Get Business Partner Overview Summary Cards',
      description:
        'Returns summary metrics cards (Total Claims, Store Visits, Total Rewards, Active Rewards) for the authenticated business partner.',
      security: [
        {
          bearerAuth: [],
        },
      ],
      parameters: [
        {
          in: 'query',
          name: 'itemId',
          schema: { type: 'string', example: '66e520000000000000000001' },
          description: 'Optional filter overview to a specific marketplace reward item',
        },
      ],
      responses: {
        '200': {
          description: 'Business partner overview statistics retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  statusCode: { type: 'number', example: 200 },
                  message: {
                    type: 'string',
                    example: 'Business partner overview statistics retrieved successfully',
                  },
                  data: {
                    type: 'object',
                    properties: {
                      totalClaims: { type: 'number', example: 12450 },
                      storeVisits: { type: 'number', example: 12450 },
                      totalRewards: { type: 'number', example: 15 },
                      activeRewards: { type: 'number', example: 12 },
                      totalClaimOrders: { type: 'number', example: 3820 },
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

  '/api/business-partner-analytics/reward-sells': {
    get: {
      tags: ['Business Partner Analytics'],
      summary: 'Get Reward Sell Chart Data',
      description:
        'Returns time-bucketed reward sells and redemption velocity data (week, month, year, etc.) for business partner line/bar charts directly using their Bearer token.',
      security: [
        {
          bearerAuth: [],
        },
      ],
      parameters: [
        {
          in: 'query',
          name: 'range',
          schema: {
            type: 'string',
            enum: ['week', 'month', 'year', 'last6months', 'last30days', 'last7days'],
            default: 'week',
          },
          description: 'Time bucket resolution',
        },
        {
          in: 'query',
          name: 'year',
          schema: { type: 'integer', example: 2026 },
          description: 'Target year',
        },
        {
          in: 'query',
          name: 'month',
          schema: { type: 'integer', minimum: 1, maximum: 12, example: 5 },
          description: 'Target month',
        },
        {
          in: 'query',
          name: 'itemId',
          schema: { type: 'string', example: '66e520000000000000000001' },
          description: 'Optional filter reward sells to a specific marketplace reward item',
        },
      ],
      responses: {
        '200': {
          description: 'Reward sell chart data retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  statusCode: { type: 'number', example: 200 },
                  message: { type: 'string', example: 'Reward sell chart data retrieved successfully' },
                  data: {
                    type: 'object',
                    properties: {
                      range: { type: 'string', example: 'week' },
                      year: { type: 'number', example: 2026 },
                      totalSells: { type: 'number', example: 12450 },
                      totalStoreVisits: { type: 'number', example: 12450 },
                      data: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            label: { type: 'string', example: 'May' },
                            date: { type: 'string', example: '2026-05-01' },
                            sells: { type: 'number', example: 300 },
                            claimsCount: { type: 'number', example: 45 },
                            storeVisits: { type: 'number', example: 280 },
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
    },
  },
};
