export const hostAnalyticsDocs = {
  '/api/host-analytics': {
    get: {
      tags: ['Host Analytics'],
      summary: 'Get Complete Host Analytics',
      description:
        'Retrieves the full dashboard analytics for the authenticated host from their Bearer token, including summary cards (total revenue, tickets sold, events count), revenue chart data, and ticket sales chart data. No host ID required.',
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
          description: 'Global fallback time range if specific chart ranges are not provided',
        },
        {
          in: 'query',
          name: 'revenueRange',
          schema: {
            type: 'string',
            enum: ['week', 'month', 'year', 'last6months', 'last30days', 'last7days'],
            default: 'year',
          },
          description: 'Time range for revenue chart (e.g. week, month, year)',
        },
        {
          in: 'query',
          name: 'ticketRange',
          schema: {
            type: 'string',
            enum: ['week', 'month', 'year', 'last6months', 'last30days', 'last7days'],
            default: 'month',
          },
          description: 'Time range for ticket sales chart (e.g. week, month, year)',
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
          schema: { type: 'integer', minimum: 1, maximum: 12, example: 4 },
          description: 'Target month 1-12 (defaults to current month if month range)',
        },
        {
          in: 'query',
          name: 'eventId',
          schema: { type: 'string', example: '66e520000000000000000001' },
          description: 'Optional filter analytics to a specific event of the host',
        },
      ],
      responses: {
        '200': {
          description: 'Host analytics retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  statusCode: { type: 'number', example: 200 },
                  message: { type: 'string', example: 'Host analytics retrieved successfully' },
                  data: {
                    type: 'object',
                    properties: {
                      overview: {
                        type: 'object',
                        properties: {
                          totalRevenue: { type: 'number', example: 12450 },
                          totalTicketsSold: { type: 'number', example: 12450 },
                          totalEvents: { type: 'number', example: 8 },
                          totalOrders: { type: 'number', example: 142 },
                        },
                      },
                      revenueChart: {
                        type: 'object',
                        properties: {
                          range: { type: 'string', example: 'year' },
                          year: { type: 'number', example: 2026 },
                          totalRevenue: { type: 'number', example: 12450 },
                          data: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                label: { type: 'string', example: 'Apr' },
                                date: { type: 'string', example: '2026-04-01' },
                                revenue: { type: 'number', example: 500 },
                                ordersCount: { type: 'number', example: 12 },
                              },
                            },
                          },
                        },
                      },
                      ticketSalesChart: {
                        type: 'object',
                        properties: {
                          range: { type: 'string', example: 'month' },
                          year: { type: 'number', example: 2026 },
                          month: { type: 'number', example: 5 },
                          totalTicketsSold: { type: 'number', example: 12450 },
                          data: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                label: { type: 'string', example: 'May' },
                                date: { type: 'string', example: '2026-05-01' },
                                ticketsSold: { type: 'number', example: 300 },
                                ordersCount: { type: 'number', example: 15 },
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

  '/api/host-analytics/overview': {
    get: {
      tags: ['Host Analytics'],
      summary: 'Get Host Overview Summary Cards',
      description:
        'Returns total revenue, total tickets sold, total events, and total orders for the authenticated host from token.',
      security: [
        {
          bearerAuth: [],
        },
      ],
      parameters: [
        {
          in: 'query',
          name: 'eventId',
          schema: { type: 'string', example: '66e520000000000000000001' },
          description: 'Optional filter overview to a specific event',
        },
      ],
      responses: {
        '200': {
          description: 'Host overview statistics retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  statusCode: { type: 'number', example: 200 },
                  message: { type: 'string', example: 'Host overview statistics retrieved successfully' },
                  data: {
                    type: 'object',
                    properties: {
                      totalRevenue: { type: 'number', example: 12450 },
                      totalTicketsSold: { type: 'number', example: 12450 },
                      totalEvents: { type: 'number', example: 8 },
                      totalOrders: { type: 'number', example: 142 },
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

  '/api/host-analytics/revenue': {
    get: {
      tags: ['Host Analytics'],
      summary: 'Get Host Revenue Chart Data',
      description:
        'Returns time-bucketed revenue data (week, month, year, etc.) for host bar/line charts directly using the host Bearer token.',
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
          schema: { type: 'integer', minimum: 1, maximum: 12, example: 4 },
          description: 'Target month',
        },
        {
          in: 'query',
          name: 'eventId',
          schema: { type: 'string', example: '66e520000000000000000001' },
          description: 'Optional filter revenue to a specific event',
        },
      ],
      responses: {
        '200': {
          description: 'Host revenue chart data retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  statusCode: { type: 'number', example: 200 },
                  message: { type: 'string', example: 'Host revenue chart data retrieved successfully' },
                  data: {
                    type: 'object',
                    properties: {
                      range: { type: 'string', example: 'year' },
                      year: { type: 'number', example: 2026 },
                      totalRevenue: { type: 'number', example: 12450 },
                      data: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            label: { type: 'string', example: 'Apr' },
                            date: { type: 'string', example: '2026-04-01' },
                            revenue: { type: 'number', example: 500 },
                            ordersCount: { type: 'number', example: 12 },
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

  '/api/host-analytics/ticket-sales': {
    get: {
      tags: ['Host Analytics'],
      summary: 'Get Host Ticket Sales Chart Data',
      description:
        'Returns time-bucketed ticket sales volume data (week, month, year, etc.) for host line/bar charts directly using host Bearer token.',
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
            default: 'month',
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
          name: 'eventId',
          schema: { type: 'string', example: '66e520000000000000000001' },
          description: 'Optional filter ticket sales to a specific event',
        },
      ],
      responses: {
        '200': {
          description: 'Host ticket sales chart data retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  statusCode: { type: 'number', example: 200 },
                  message: { type: 'string', example: 'Host ticket sales chart data retrieved successfully' },
                  data: {
                    type: 'object',
                    properties: {
                      range: { type: 'string', example: 'month' },
                      year: { type: 'number', example: 2026 },
                      month: { type: 'number', example: 5 },
                      totalTicketsSold: { type: 'number', example: 12450 },
                      data: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            label: { type: 'string', example: 'May' },
                            date: { type: 'string', example: '2026-05-01' },
                            ticketsSold: { type: 'number', example: 300 },
                            ordersCount: { type: 'number', example: 15 },
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
