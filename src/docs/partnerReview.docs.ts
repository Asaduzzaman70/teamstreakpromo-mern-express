export const partnerReviewDocs = {
  '/api/partner-reviews': {
    post: {
      summary: 'Submit a review for a redeemed business partner product [Role: USER]',
      description:
        '**Authorized Roles**: `USER` only.\n\nAllows a user with `USER` role who has claimed and redeemed a marketplace product at a Business Partner store to submit a review. Includes star rating (1-5), experience sentiment (POSITIVE / NEGATIVE), chip feedback tags, and optional written feedback.',
      tags: ['Business Partner Reviews'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['productId', 'rating', 'experience'],
              properties: {
                productId: {
                  type: 'string',
                  example: '66a1b2c3d4e5f67890123456',
                  description: 'MongoDB ObjectId of the marketplace product',
                },
                orderId: {
                  type: 'string',
                  example: '66b2c3d4e5f6789012345678',
                  description: 'Optional specific redeemed order ID',
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
                  example: [
                    'Quality Product',
                    'Professional Service',
                    'Fast & Efficient',
                    'Easy to Redeem',
                  ],
                  description: 'Selected feedback tags / chips',
                },
                feedback: {
                  type: 'string',
                  maxLength: 300,
                  example: 'The staff was friendly and the product was handed over immediately upon scanning the QR code.',
                  description: 'Optional written review (maximum 300 characters)',
                },
              },
            },
          },
        },
      },
      responses: {
        '201': {
          description: 'Business partner review submitted successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  statusCode: { type: 'number', example: 201 },
                  message: {
                    type: 'string',
                    example: 'Business partner review submitted successfully',
                  },
                  data: {
                    type: 'object',
                    properties: {
                      _id: { type: 'string', example: '66e1f2a3b4c5d6e7f8a90123' },
                      rating: { type: 'number', example: 5 },
                      experience: { type: 'string', example: 'POSITIVE' },
                      tags: {
                        type: 'array',
                        items: { type: 'string' },
                        example: ['Quality Product', 'Professional Service', 'Easy to Redeem'],
                      },
                      feedback: {
                        type: 'string',
                        example: 'The staff was friendly and the product was handed over immediately.',
                      },
                      createdAt: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
          },
        },
        '400': {
          description: 'Validation error, product not redeemed, or already reviewed',
        },
        '403': {
          description: 'Forbidden: caller role is not USER or product has not been claimed/redeemed',
        },
        '404': {
          description: 'Product not found',
        },
      },
    },
  },
  '/api/partner-reviews/check-eligibility/{productId}': {
    get: {
      summary: 'Check if authenticated user can review a product/partner [Role: USER]',
      description:
        '**Authorized Roles**: `USER` only.\n\nVerifies if the logged-in user claimed the product, whether its status is REDEEMED, and whether they already submitted a review.',
      tags: ['Business Partner Reviews'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'productId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Marketplace Product ObjectId',
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
                  message: { type: 'string', example: 'Partner review eligibility checked' },
                  data: {
                    type: 'object',
                    properties: {
                      canReview: { type: 'boolean', example: true },
                      message: {
                        type: 'string',
                        example: 'You are eligible to review this business partner and product',
                      },
                      isClaimed: { type: 'boolean', example: true },
                      isRedeemed: { type: 'boolean', example: true },
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
          description: 'Product not found',
        },
      },
    },
  },
  '/api/partner-reviews/my-reviews': {
    get: {
      summary: 'Get all partner reviews written by current user [Role: USER]',
      description:
        '**Authorized Roles**: `USER` only.\n\nReturns all reviews submitted by the authenticated user for business partner products.',
      tags: ['Business Partner Reviews'],
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
          description: 'My partner reviews retrieved successfully',
        },
        '403': {
          description: 'Forbidden: caller role is not USER',
        },
      },
    },
  },
  '/api/partner-reviews/product/{productId}': {
    get: {
      summary: 'Get all reviews for a product [Public]',
      description:
        '**Authorized Roles**: `Public` (No token required).\n\nRetrieves paginated reviews for a specific marketplace product along with average rating, star breakdown (1 to 5), and popular tags.',
      tags: ['Business Partner Reviews'],
      parameters: [
        {
          name: 'productId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Marketplace Product ObjectId',
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
          description: 'Product reviews and metrics retrieved successfully',
        },
      },
    },
  },
  '/api/partner-reviews/partner/{partnerId}': {
    get: {
      summary: 'Get all reviews for a business partner [Public]',
      description:
        '**Authorized Roles**: `Public` (No token required).\n\nRetrieves paginated reviews across all products offered by a business partner, with overall partner rating metrics.',
      tags: ['Business Partner Reviews'],
      parameters: [
        {
          name: 'partnerId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Business Partner User ObjectId',
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
          description: 'Partner reviews and metrics retrieved successfully',
        },
      },
    },
  },
  '/api/partner-reviews/{id}': {
    get: {
      summary: 'Get a single partner review by ID [Public]',
      description:
        '**Authorized Roles**: `Public` (No token required).\n\nRetrieves partner review details including author, product, and partner.',
      tags: ['Business Partner Reviews'],
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
      summary: 'Delete a partner review [Role: Author (USER) or ADMIN]',
      description:
        '**Authorized Roles**: Author of the review (`USER`) or `ADMIN`.\n\nAllows the review author or an ADMIN to delete a review and automatically recalculates the business partner overall rating.',
      tags: ['Business Partner Reviews'],
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
