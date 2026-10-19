export const reviewDocs = {
  '/api/reviews': {
    post: {
      summary: 'Submit a review for a completed event [Role: USER]',
      description:
        '**Authorized Roles**: `USER` only.\n\nAllows a registered user with `USER` role who has purchased tickets and completed the event to submit a host review. Includes star rating (1-5), experience sentiment (POSITIVE / NEGATIVE), chip feedback tags, and optional written feedback.',
      tags: ['Reviews'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['eventId', 'rating', 'experience'],
              properties: {
                eventId: {
                  type: 'string',
                  example: '66a1b2c3d4e5f67890123456',
                  description: 'MongoDB ObjectId of the event',
                },
                rating: {
                  type: 'integer',
                  minimum: 1,
                  maximum: 5,
                  example: 5,
                  description: 'Rating from 1 to 5 stars',
                },
                experience: {
                  type: 'string',
                  enum: ['POSITIVE', 'NEGATIVE'],
                  example: 'POSITIVE',
                  description: 'Overall experience sentiment (Positive 👍 or Negative 👎)',
                },
                tags: {
                  type: 'array',
                  items: { type: 'string' },
                  example: ['Well Organized', 'Great Atmosphere', 'Smooth Event'],
                  description: 'Selected feedback tags / chips',
                },
                feedback: {
                  type: 'string',
                  maxLength: 300,
                  example: 'Amazing experience! Sound system was top tier and crowd was super energetic.',
                  description: 'Optional written review (maximum 300 characters)',
                },
              },
            },
          },
        },
      },
      responses: {
        '201': {
          description: 'Review submitted successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  statusCode: { type: 'number', example: 201 },
                  message: { type: 'string', example: 'Review submitted successfully' },
                  data: {
                    type: 'object',
                    properties: {
                      _id: { type: 'string', example: '66d1e2f3a4b5c6d7e8f90123' },
                      rating: { type: 'number', example: 5 },
                      experience: { type: 'string', example: 'POSITIVE' },
                      tags: {
                        type: 'array',
                        items: { type: 'string' },
                        example: ['Well Organized', 'Great Atmosphere'],
                      },
                      feedback: { type: 'string', example: 'Amazing experience!' },
                      createdAt: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
          },
        },
        '400': {
          description: 'Validation error, event not completed, or already reviewed',
        },
        '403': {
          description: 'Forbidden: caller role is not USER or user has not booked tickets for this event',
        },
        '404': {
          description: 'Event not found',
        },
      },
    },
  },
  '/api/reviews/check-eligibility/{eventId}': {
    get: {
      summary: 'Check if authenticated user can review an event [Role: USER]',
      description:
        '**Authorized Roles**: `USER` only.\n\nVerifies if the logged-in user with `USER` role booked tickets for the event, whether the event has completed, and whether they already submitted a review. Returns actionable boolean flags for frontend UI display.',
      tags: ['Reviews'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'eventId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Event ObjectId',
        },
      ],
      responses: {
        '200': {
          description: 'Eligibility status returned',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  statusCode: { type: 'number', example: 200 },
                  message: { type: 'string', example: 'Review eligibility checked' },
                  data: {
                    type: 'object',
                    properties: {
                      canReview: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'You are eligible to review this event' },
                      isBooked: { type: 'boolean', example: true },
                      isCompleted: { type: 'boolean', example: true },
                      hasReviewed: { type: 'boolean', example: false },
                    },
                  },
                },
              },
            },
          },
        },
        '403': {
          description: 'Forbidden: caller role is not USER',
        },
        '404': {
          description: 'Event not found',
        },
      },
    },
  },
  '/api/reviews/my-reviews': {
    get: {
      summary: 'Get all reviews written by current user [Role: USER]',
      description:
        '**Authorized Roles**: `USER` only.\n\nReturns all reviews submitted by the authenticated user with populated event and host details.',
      tags: ['Reviews'],
      security: [{ bearerAuth: [] }],
      parameters: [
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
          description: 'My reviews retrieved successfully',
        },
        '403': {
          description: 'Forbidden: caller role is not USER',
        },
      },
    },
  },
  '/api/reviews/event/{eventId}': {
    get: {
      summary: 'Get all reviews for an event [Public]',
      description:
        '**Authorized Roles**: `Public` (No token required).\n\nRetrieves paginated reviews for a specific event along with average rating, star breakdown (1 to 5), and popular tags.',
      tags: ['Reviews'],
      parameters: [
        {
          name: 'eventId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Event ObjectId',
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
        {
          name: 'experience',
          in: 'query',
          schema: { type: 'string', enum: ['POSITIVE', 'NEGATIVE'] },
        },
        {
          name: 'rating',
          in: 'query',
          schema: { type: 'integer', minimum: 1, maximum: 5 },
        },
      ],
      responses: {
        '200': {
          description: 'Event reviews and metrics retrieved successfully',
        },
      },
    },
  },
  '/api/reviews/host/{hostId}': {
    get: {
      summary: 'Get all reviews for a host [Public]',
      description:
        '**Authorized Roles**: `Public` (No token required).\n\nRetrieves paginated reviews across all events organized by a host, with overall host rating metrics.',
      tags: ['Reviews'],
      parameters: [
        {
          name: 'hostId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Host User ObjectId',
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
          description: 'Host reviews and metrics retrieved successfully',
        },
      },
    },
  },
  '/api/reviews/{id}': {
    get: {
      summary: 'Get a single review by ID [Public]',
      description:
        '**Authorized Roles**: `Public` (No token required).\n\nRetrieves review details including author, event, and host.',
      tags: ['Reviews'],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
        },
      ],
      responses: {
        '200': {
          description: 'Review retrieved successfully',
        },
        '404': {
          description: 'Review not found',
        },
      },
    },
    delete: {
      summary: 'Delete a review [Role: Author (USER) or ADMIN]',
      description:
        '**Authorized Roles**: Author of the review (`USER`) or `ADMIN`.\n\nAllows the review author or an ADMIN to delete a review and automatically recalculates the host overall rating.',
      tags: ['Reviews'],
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
        '200': {
          description: 'Review deleted successfully',
        },
        '403': {
          description: 'Forbidden: not authorized to delete this review',
        },
        '404': {
          description: 'Review not found',
        },
      },
    },
  },
};
