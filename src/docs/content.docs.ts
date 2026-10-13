export const contentDocs = {
  '/api/contents': {
    get: {
      summary: 'Get all static content and legal pages (CMS)',
      description: 'Public endpoint to fetch published static pages (e.g. Terms, Privacy Policy, About Us). Admin users can see all drafts and filter by status.',
      tags: ['Content & CMS'],
      parameters: [
        {
          name: 'page',
          in: 'query',
          description: 'Page number for pagination (default: 1)',
          schema: { type: 'integer', default: 1 },
        },
        {
          name: 'limit',
          in: 'query',
          description: 'Number of items per page (default: 20)',
          schema: { type: 'integer', default: 20 },
        },
        {
          name: 'search',
          in: 'query',
          description: 'Search pages by title, slug, or content keyword',
          schema: { type: 'string' },
        },
        {
          name: 'category',
          in: 'query',
          description: 'Filter by category (LEGAL, TERMS_AND_CONDITIONS, COMPANY, SUPPORT, GENERAL)',
          schema: { type: 'string', enum: ['LEGAL', 'TERMS_AND_CONDITIONS', 'COMPANY', 'SUPPORT', 'GENERAL'] },
        },
        {
          name: 'status',
          in: 'query',
          description: 'Filter by status (Admin only: PUBLISHED, DRAFT, ARCHIVED)',
          schema: { type: 'string', enum: ['PUBLISHED', 'DRAFT', 'ARCHIVED'] },
        },
      ],
      responses: {
        '200': {
          description: 'Static content pages retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  statusCode: { type: 'integer', example: 200 },
                  message: { type: 'string', example: 'Static content pages retrieved successfully' },
                  meta: {
                    type: 'object',
                    properties: {
                      page: { type: 'number', example: 1 },
                      limit: { type: 'number', example: 20 },
                      total: { type: 'number', example: 5 },
                      totalPage: { type: 'number', example: 1 },
                    },
                  },
                  data: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        _id: { type: 'string', example: '670bf3a8f10b7b1234567890' },
                        title: { type: 'string', example: 'Privacy Policy' },
                        slug: { type: 'string', example: 'privacy-policy' },
                        content: { type: 'string', example: '<h2>Privacy Policy</h2><p>Your privacy is important to us...</p>' },
                        contentType: { type: 'string', example: 'HTML' },
                        category: { type: 'string', example: 'LEGAL' },
                        status: { type: 'string', example: 'PUBLISHED' },
                        metaTitle: { type: 'string', example: 'Privacy Policy - TeamStreak Promo' },
                        metaDescription: { type: 'string', example: 'Read how TeamStreak Promo protects your data.' },
                        isSystemPage: { type: 'boolean', example: true },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
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
    post: {
      summary: 'Create a new static content / legal page',
      description: 'Admin endpoint to create a new page for CMS.',
      tags: ['Content & CMS'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['title', 'content'],
              properties: {
                title: { type: 'string', example: 'Privacy Policy' },
                slug: { type: 'string', example: 'privacy-policy', description: 'Auto-generated from title if omitted' },
                content: { type: 'string', example: '<p>Our privacy policy content...</p>' },
                contentType: { type: 'string', enum: ['HTML', 'MARKDOWN', 'TEXT'], default: 'HTML' },
                category: { type: 'string', enum: ['LEGAL', 'TERMS_AND_CONDITIONS', 'COMPANY', 'SUPPORT', 'GENERAL'], default: 'GENERAL' },
                status: { type: 'string', enum: ['PUBLISHED', 'DRAFT', 'ARCHIVED'], default: 'PUBLISHED' },
                metaTitle: { type: 'string', example: 'Privacy Policy - TeamStreak Promo' },
                metaDescription: { type: 'string', example: 'Privacy policy details and guidelines.' },
                isSystemPage: { type: 'boolean', default: false },
              },
            },
          },
        },
      },
      responses: {
        '201': { description: 'Static content page created successfully' },
        '400': { description: 'Validation error or duplicate slug' },
        '401': { description: 'Unauthorized' },
        '403': { description: 'Forbidden (Admin only)' },
      },
    },
  },
  '/api/contents/upsert/{slug}': {
    put: {
      summary: 'Upsert static content by slug',
      description: 'Admin endpoint that updates an existing static page if it exists or creates it if it does not exist.',
      tags: ['Content & CMS'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'slug',
          in: 'path',
          required: true,
          description: 'Unique URL slug identifier (e.g. privacy-policy, terms-and-conditions)',
          schema: { type: 'string', example: 'privacy-policy' },
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['title', 'content'],
              properties: {
                title: { type: 'string', example: 'Privacy Policy' },
                content: { type: 'string', example: '<h1>Privacy Policy</h1><p>Updated content...</p>' },
                contentType: { type: 'string', enum: ['HTML', 'MARKDOWN', 'TEXT'], default: 'HTML' },
                category: { type: 'string', enum: ['LEGAL', 'TERMS_AND_CONDITIONS', 'COMPANY', 'SUPPORT', 'GENERAL'], default: 'LEGAL' },
                status: { type: 'string', enum: ['PUBLISHED', 'DRAFT', 'ARCHIVED'], default: 'PUBLISHED' },
                metaTitle: { type: 'string', example: 'Privacy Policy - TeamStreak' },
                metaDescription: { type: 'string', example: 'Data privacy standards.' },
                isSystemPage: { type: 'boolean', default: false },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'Static content page updated successfully' },
        '201': { description: 'Static content page created successfully' },
        '400': { description: 'Invalid payload or validation error' },
        '401': { description: 'Unauthorized' },
        '403': { description: 'Forbidden (Admin only)' },
      },
    },
  },
  '/api/contents/{idOrSlug}': {
    get: {
      summary: 'Get single static content page by slug or ID',
      description: 'Public endpoint to view a published static page by its slug (e.g. `privacy-policy`) or ObjectId.',
      tags: ['Content & CMS'],
      parameters: [
        {
          name: 'idOrSlug',
          in: 'path',
          required: true,
          description: 'Unique slug (e.g. `privacy-policy`, `terms-of-service`) or MongoDB ObjectId',
          schema: { type: 'string', example: 'privacy-policy' },
        },
      ],
      responses: {
        '200': { description: 'Static content page retrieved successfully' },
        '404': { description: 'Page not found or not published' },
      },
    },
    patch: {
      summary: 'Update static content page by slug or ID',
      description: 'Admin endpoint to modify static content page details.',
      tags: ['Content & CMS'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'idOrSlug',
          in: 'path',
          required: true,
          description: 'Unique slug or MongoDB ObjectId',
          schema: { type: 'string', example: 'privacy-policy' },
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                title: { type: 'string', example: 'Updated Privacy Policy' },
                slug: { type: 'string', example: 'privacy-policy' },
                content: { type: 'string', example: '<p>Revised privacy terms...</p>' },
                contentType: { type: 'string', enum: ['HTML', 'MARKDOWN', 'TEXT'] },
                category: { type: 'string', enum: ['LEGAL', 'TERMS_AND_CONDITIONS', 'COMPANY', 'SUPPORT', 'GENERAL'] },
                status: { type: 'string', enum: ['PUBLISHED', 'DRAFT', 'ARCHIVED'] },
                metaTitle: { type: 'string' },
                metaDescription: { type: 'string' },
                isSystemPage: { type: 'boolean' },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'Static content page updated successfully' },
        '400': { description: 'Validation error or duplicate slug' },
        '404': { description: 'Page not found' },
      },
    },
    put: {
      summary: 'Full update of static content page by slug or ID',
      description: 'Admin endpoint to replace/update static content page details.',
      tags: ['Content & CMS'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'idOrSlug',
          in: 'path',
          required: true,
          schema: { type: 'string', example: 'privacy-policy' },
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                content: { type: 'string' },
                contentType: { type: 'string', enum: ['HTML', 'MARKDOWN', 'TEXT'] },
                category: { type: 'string', enum: ['LEGAL', 'TERMS_AND_CONDITIONS', 'COMPANY', 'SUPPORT', 'GENERAL'] },
                status: { type: 'string', enum: ['PUBLISHED', 'DRAFT', 'ARCHIVED'] },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'Static content page updated successfully' },
        '404': { description: 'Page not found' },
      },
    },
    delete: {
      summary: 'Delete static content page by slug or ID',
      description: 'Admin endpoint to remove a content page. System-critical pages are protected from accidental deletion.',
      tags: ['Content & CMS'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'idOrSlug',
          in: 'path',
          required: true,
          schema: { type: 'string', example: 'custom-promo-terms' },
        },
      ],
      responses: {
        '200': { description: 'Static content page deleted successfully' },
        '400': { description: 'Cannot delete system-critical page' },
        '404': { description: 'Page not found' },
      },
    },
  },
  '/api/contents/{idOrSlug}/status': {
    patch: {
      summary: 'Update publication status of a static content page',
      description: 'Admin endpoint to quickly toggle between PUBLISHED, DRAFT, and ARCHIVED.',
      tags: ['Content & CMS'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'idOrSlug',
          in: 'path',
          required: true,
          schema: { type: 'string', example: 'privacy-policy' },
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
                status: { type: 'string', enum: ['PUBLISHED', 'DRAFT', 'ARCHIVED'], example: 'PUBLISHED' },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'Status updated successfully' },
        '400': { description: 'Invalid status' },
        '404': { description: 'Page not found' },
      },
    },
  },
};
