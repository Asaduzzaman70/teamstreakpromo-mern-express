export const customerSupportDocs = {
  '/api/customer-support/tickets': {
    post: {
      summary: 'Submit a new customer support ticket',
      description: 'Allows authenticated users (USER, HOST, BUSINESS, ADMIN) to submit an issue or problem details to customer care. Automatically assigns a unique Ticket ID (e.g., MOT3203920212), sets status to UNDER_REVIEW, and creates initial message thread.',
      tags: ['Customer Support'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['title', 'description'],
              properties: {
                title: {
                  type: 'string',
                  example: 'The event ended earlier than expected.',
                  description: 'Short headline of the issue',
                },
                description: {
                  type: 'string',
                  example:
                    'The event concluded before we reached the last activity. It was disappointing to miss out on the final moments of the Neon Nights: Glow Rave Extravaganza.',
                  description: 'Detailed description of the problem',
                },
                priority: {
                  type: 'string',
                  enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
                  example: 'MEDIUM',
                  default: 'MEDIUM',
                },
              },
            },
          },
        },
      },
      responses: {
        '201': {
          description: 'Support ticket submitted successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  statusCode: { type: 'number', example: 201 },
                  message: { type: 'string', example: 'Support ticket submitted successfully' },
                  data: {
                    type: 'object',
                    properties: {
                      _id: { type: 'string', example: '66a1b2c3d4e5f67890123456' },
                      ticketId: { type: 'string', example: 'MOT3203920212' },
                      title: { type: 'string', example: 'The event ended earlier than expected.' },
                      description: { type: 'string', example: 'The event concluded before we reached the last activity...' },
                      status: { type: 'string', enum: ['UNDER_REVIEW', 'SOLVED', 'CLOSED'], example: 'UNDER_REVIEW' },
                      statusLabel: { type: 'string', example: 'Under review' },
                      statusBadge: {
                        type: 'object',
                        properties: {
                          text: { type: 'string', example: 'Under review' },
                          color: { type: 'string', example: '#F59E0B' },
                          dotColor: { type: 'string', example: 'amber' },
                        },
                      },
                      priority: { type: 'string', example: 'MEDIUM' },
                      totalMessages: { type: 'integer', example: 1 },
                      createdAt: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
          },
        },
        '400': { description: 'Validation error' },
        '401': { description: 'Unauthorized' },
      },
    },
  },
  '/api/customer-support/my-tickets': {
    get: {
      summary: 'Get current user\'s support tickets ("My Support" screen)',
      description: 'Returns all customer care tickets submitted by the authenticated user with formatted status badges (Under review / Solved / Closed), last message preview, and pagination.',
      tags: ['Customer Support'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'status',
          in: 'query',
          required: false,
          schema: { type: 'string', enum: ['UNDER_REVIEW', 'SOLVED', 'CLOSED', 'Under review', 'Solved', 'Closed', 'all'] },
          description: 'Filter tickets by status',
        },
        {
          name: 'search',
          in: 'query',
          required: false,
          schema: { type: 'string' },
          description: 'Search keyword in title, description, or ticketId',
        },
        {
          name: 'page',
          in: 'query',
          required: false,
          schema: { type: 'integer', default: 1 },
        },
        {
          name: 'limit',
          in: 'query',
          required: false,
          schema: { type: 'integer', default: 10 },
        },
      ],
      responses: {
        '200': {
          description: 'My support tickets retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  statusCode: { type: 'number', example: 200 },
                  message: { type: 'string', example: 'My support tickets retrieved successfully' },
                  meta: {
                    type: 'object',
                    properties: {
                      page: { type: 'integer', example: 1 },
                      limit: { type: 'integer', example: 10 },
                      total: { type: 'integer', example: 4 },
                      totalPage: { type: 'integer', example: 1 },
                    },
                  },
                  data: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        _id: { type: 'string', example: '66a1b2c3d4e5f67890123456' },
                        ticketId: { type: 'string', example: 'MOT3203920212' },
                        title: { type: 'string', example: 'The event ended earlier than expected.' },
                        description: { type: 'string', example: 'The event concluded before we reached the last activity...' },
                        status: { type: 'string', enum: ['UNDER_REVIEW', 'SOLVED', 'CLOSED'], example: 'UNDER_REVIEW' },
                        statusLabel: { type: 'string', example: 'Under review' },
                        statusBadge: {
                          type: 'object',
                          properties: {
                            text: { type: 'string', example: 'Under review' },
                            color: { type: 'string', example: '#F59E0B' },
                            dotColor: { type: 'string', example: 'amber' },
                          },
                        },
                        priority: { type: 'string', example: 'MEDIUM' },
                        totalMessages: { type: 'integer', example: 2 },
                        lastMessage: {
                          type: 'object',
                          properties: {
                            message: { type: 'string', example: 'Customer Support team is looking into this issue.' },
                            senderName: { type: 'string', example: 'Customer Support' },
                            senderRole: { type: 'string', example: 'ADMIN' },
                            senderType: { type: 'string', example: 'SUPPORT' },
                            isSupportReply: { type: 'boolean', example: true },
                            isMyMessage: { type: 'boolean', example: false },
                            alignment: { type: 'string', example: 'left' },
                            formattedTime: { type: 'string', example: '11:42 AM' },
                            formattedDate: { type: 'string', example: 'Oct 13, 2026' },
                            timeAgo: { type: 'string', example: '5m ago' },
                            createdAt: { type: 'string', format: 'date-time' },
                          },
                        },
                        createdAt: { type: 'string', format: 'date-time' },
                        lastMessageAt: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '401': { description: 'Unauthorized' },
      },
    },
  },
  '/api/customer-support/tickets/{id}': {
    get: {
      summary: 'Get single support ticket details and conversation thread',
      description: 'Fetches the ticket and the full back-and-forth chat conversation with developer-friendly helper fields (isMyMessage, alignment, formattedTime, timeAgo).',
      tags: ['Customer Support'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Ticket MongoDB ID or Ticket ID (e.g. MOT3203920212)',
        },
      ],
      responses: {
        '200': {
          description: 'Support ticket retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  statusCode: { type: 'number', example: 200 },
                  message: { type: 'string', example: 'Support ticket retrieved successfully' },
                  data: {
                    type: 'object',
                    properties: {
                      _id: { type: 'string', example: '66a1b2c3d4e5f67890123456' },
                      ticketId: { type: 'string', example: 'MOT3203920212' },
                      title: { type: 'string', example: 'The event ended earlier than expected.' },
                      description: { type: 'string', example: 'The event concluded...' },
                      status: { type: 'string', enum: ['UNDER_REVIEW', 'SOLVED', 'CLOSED'], example: 'UNDER_REVIEW' },
                      statusLabel: { type: 'string', example: 'Under review' },
                      statusBadge: {
                        type: 'object',
                        properties: {
                          text: { type: 'string', example: 'Under review' },
                          color: { type: 'string', example: '#F59E0B' },
                          dotColor: { type: 'string', example: 'amber' },
                        },
                      },
                      priority: { type: 'string', example: 'MEDIUM' },
                      totalMessages: { type: 'integer', example: 3 },
                      user: {
                        type: 'object',
                        properties: {
                          _id: { type: 'string' },
                          name: { type: 'string', example: 'John Doe' },
                          email: { type: 'string', example: 'john@example.com' },
                          role: { type: 'string', example: 'USER' },
                        },
                      },
                      messages: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            _id: { type: 'string' },
                            senderId: { type: 'string' },
                            senderName: { type: 'string', example: 'Customer Support' },
                            senderRole: { type: 'string', example: 'ADMIN' },
                            senderType: { type: 'string', example: 'SUPPORT' },
                            isSupportReply: { type: 'boolean', example: true },
                            isMyMessage: { type: 'boolean', example: false },
                            alignment: { type: 'string', enum: ['left', 'right'], example: 'left' },
                            avatar: { type: 'string', example: '' },
                            message: { type: 'string', example: 'We are looking into this issue right away.' },
                            formattedTime: { type: 'string', example: '11:42 AM' },
                            formattedDate: { type: 'string', example: 'Oct 13, 2026' },
                            timeAgo: { type: 'string', example: '2m ago' },
                            createdAt: { type: 'string', format: 'date-time' },
                          },
                        },
                      },
                      createdAt: { type: 'string', format: 'date-time' },
                      lastMessageAt: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
          },
        },
        '403': { description: 'Forbidden: Cannot access another user\'s ticket' },
        '404': { description: 'Support ticket not found' },
      },
    },
  },
  '/api/customer-support/tickets/{id}/messages': {
    get: {
      summary: 'Get conversation messages only for a support ticket',
      description: 'Returns the full list of messages formatted for direct rendering into chat bubbles (alignment, isMyMessage, formattedTime, timeAgo).',
      tags: ['Customer Support'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Ticket MongoDB ID or Ticket ID (e.g. MOT3203920212)',
        },
      ],
      responses: {
        '200': {
          description: 'Ticket messages retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  statusCode: { type: 'number', example: 200 },
                  message: { type: 'string', example: 'Ticket messages retrieved successfully' },
                  data: {
                    type: 'object',
                    properties: {
                      ticketId: { type: 'string', example: 'MOT3203920212' },
                      status: { type: 'string', example: 'UNDER_REVIEW' },
                      statusLabel: { type: 'string', example: 'Under review' },
                      totalMessages: { type: 'integer', example: 3 },
                      messages: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            _id: { type: 'string' },
                            senderId: { type: 'string' },
                            senderName: { type: 'string', example: 'Customer Support' },
                            senderType: { type: 'string', example: 'SUPPORT' },
                            isMyMessage: { type: 'boolean', example: false },
                            alignment: { type: 'string', example: 'left' },
                            message: { type: 'string', example: 'We are reviewing your inquiry.' },
                            formattedTime: { type: 'string', example: '11:42 AM' },
                            timeAgo: { type: 'string', example: 'Just now' },
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
        '403': { description: 'Forbidden' },
        '404': { description: 'Support ticket not found' },
      },
    },
    post: {
      summary: 'Send a message or reply in a support ticket chat thread',
      description: 'Appends a message to the conversation. Returns the sentMessage directly formatted with isMyMessage, alignment, formattedTime for instant UI append.',
      tags: ['Customer Support'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Ticket MongoDB ID or Ticket ID (e.g. MOT3203920212)',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['message'],
              properties: {
                message: {
                  type: 'string',
                  example: 'I have an additional question regarding the refund timeline.',
                },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Message sent successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  statusCode: { type: 'number', example: 200 },
                  message: { type: 'string', example: 'Message sent successfully' },
                  data: {
                    type: 'object',
                    properties: {
                      sentMessage: {
                        type: 'object',
                        properties: {
                          _id: { type: 'string' },
                          senderId: { type: 'string' },
                          senderName: { type: 'string', example: 'John Doe' },
                          senderType: { type: 'string', example: 'USER' },
                          isMyMessage: { type: 'boolean', example: true },
                          alignment: { type: 'string', example: 'right' },
                          message: { type: 'string', example: 'I have an additional question...' },
                          formattedTime: { type: 'string', example: '11:45 AM' },
                          timeAgo: { type: 'string', example: 'Just now' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '403': { description: 'Forbidden' },
        '404': { description: 'Support ticket not found' },
      },
    },
  },
  '/api/customer-support/admin/tickets': {
    get: {
      summary: 'Admin: Get all customer support tickets',
      description: 'Admin endpoint to review and manage all incoming support tickets across the platform.',
      tags: ['Customer Support'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'status',
          in: 'query',
          schema: { type: 'string', enum: ['UNDER_REVIEW', 'SOLVED', 'CLOSED', 'Under review', 'Solved', 'Closed', 'all'] },
        },
        {
          name: 'userRole',
          in: 'query',
          schema: { type: 'string', enum: ['USER', 'HOST', 'BUSINESS', 'all'] },
        },
        {
          name: 'search',
          in: 'query',
          schema: { type: 'string' },
        },
        {
          name: 'page',
          in: 'query',
          schema: { type: 'integer', default: 1 },
        },
        {
          name: 'limit',
          in: 'query',
          schema: { type: 'integer', default: 10 },
        },
      ],
      responses: {
        '200': {
          description: 'All customer support tickets retrieved successfully',
        },
        '401': { description: 'Unauthorized' },
        '403': { description: 'Forbidden: Admins only' },
      },
    },
  },
  '/api/customer-support/admin/tickets/{id}/status': {
    patch: {
      summary: 'Admin: Update customer support ticket status',
      description: 'Update status of a ticket to UNDER_REVIEW, SOLVED, or CLOSED.',
      tags: ['Customer Support'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Ticket MongoDB ID or Ticket ID (e.g. MOT3203920212)',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['status'],
              properties: {
                status: {
                  type: 'string',
                  enum: ['UNDER_REVIEW', 'SOLVED', 'CLOSED', 'Under review', 'Solved', 'Closed'],
                  example: 'SOLVED',
                },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Support ticket status updated successfully',
        },
        '401': { description: 'Unauthorized' },
        '403': { description: 'Forbidden: Admins only' },
        '404': { description: 'Support ticket not found' },
      },
    },
  },
};
