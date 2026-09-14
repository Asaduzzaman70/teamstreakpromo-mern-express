export const eventDocs = {
  '/api/events': {
    post: {
      summary: 'Create a new event',
      tags: ['Event'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['subCategoryId', 'title', 'latitude', 'longitude', 'placeName', 'description', 'startDate', 'endDate'],
              properties: {
                subCategoryId: { type: 'string', example: '65c8f1e29a8f3b0012345678', description: 'Subcategory ObjectId (must have parentCategory)' },
                title: { type: 'string', example: 'Summer Music Festival 2026' },
                latitude: { type: 'number', example: 40.7128 },
                longitude: { type: 'number', example: -74.006 },
                ageRestriction: { type: 'integer', example: 18 },
                placeName: { type: 'string', example: 'Central Park Arena' },
                description: { type: 'string', example: 'Annual summer live concert and music festival.' },
                startDate: { type: 'string', format: 'date-time', example: '2026-09-01T18:00:00.000Z' },
                endDate: { type: 'string', format: 'date-time', example: '2026-09-01T23:00:00.000Z' },
                priceCategories: { type: 'string', example: '[{"name":"VIP","stock":20,"price":200},{"name":"General","stock":80,"price":50}]', description: 'JSON array string of price categories (up to 10 max). Each has name, stock, and price.' },


                images: { type: 'array', items: { type: 'string', format: 'binary' }, description: 'Event main image files upload' },
                artistImages: { type: 'array', items: { type: 'string', format: 'binary' }, description: 'Artist profile image files upload (mapped 1-to-1 with artistInfo index)' },
                rewardImages: { type: 'array', items: { type: 'string', format: 'binary' }, description: 'Reward image files upload (all rewards)' },
                rewardImages_0: { type: 'array', items: { type: 'string', format: 'binary' }, description: 'Multiple binary image files upload for Reward 0' },
                rewardImages_1: { type: 'array', items: { type: 'string', format: 'binary' }, description: 'Multiple binary image files upload for Reward 1' },
                artistInfo: { type: 'string', example: '[{"name":"DJ Alex","role":"Headliner","socialMediaLinks":{"instagram":"https://instagram.com/djalex","spotify":"https://spotify.com/artist/123"}}]' },
                rewards: { type: 'string', example: '[{"title":"VIP Pass Badge","description":"Free VIP area access badge","pointsRequired":150,"stock":50}]', description: 'JSON array string of rewards. Host uploads binary image files in rewardImages_0, rewardImages_1, etc.' },
              },
            },
          },
          'application/json': {
            schema: {
              type: 'object',
              required: ['subCategoryId', 'title', 'latitude', 'longitude', 'placeName', 'description', 'startDate', 'endDate'],
              properties: {
                subCategoryId: { type: 'string', example: '65c8f1e29a8f3b0012345678', description: 'Subcategory ObjectId (must have parentCategory)' },
                title: { type: 'string', example: 'Summer Music Festival 2026' },
                latitude: { type: 'number', example: 40.7128 },
                longitude: { type: 'number', example: -74.006 },
                ageRestriction: { type: 'integer', example: 18 },
                placeName: { type: 'string', example: 'Central Park Arena' },
                description: { type: 'string', example: 'Annual summer live concert and music festival.' },
                startDate: { type: 'string', format: 'date-time', example: '2026-09-01T18:00:00.000Z' },
                endDate: { type: 'string', format: 'date-time', example: '2026-09-01T23:00:00.000Z' },
                priceCategories: {


                  type: 'array',
                  description: 'Up to 10 price categories',
                  items: {
                    type: 'object',
                    properties: {
                      _id: { type: 'string', example: '65c8f1e29a8f3b0012345679' },
                      name: { type: 'string', example: 'VIP' },
                      stock: { type: 'integer', example: 20 },
                      price: { type: 'number', example: 200 },
                    },
                  },
                },
                images: { type: 'array', items: { type: 'string' } },
                artistInfo: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string', example: 'DJ Alex' },
                      role: { type: 'string', example: 'Headliner' },
                      image: { type: 'string', example: 'https://example.com/artist.jpg' },
                      socialMediaLinks: {
                        type: 'object',
                        additionalProperties: { type: 'string' },
                        example: {
                          instagram: 'https://instagram.com/djalex',
                          spotify: 'https://spotify.com/artist/123',
                        },
                      },
                    },
                  },
                },
                rewards: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      _id: { type: 'string', example: '65c8f1e29a8f3b001234567a' },
                      title: { type: 'string', example: 'VIP Pass Badge' },
                      description: { type: 'string', example: 'Free VIP area access badge' },
                      pointsRequired: { type: 'integer', example: 150 },
                      stock: { type: 'integer', example: 50 },
                      images: { type: 'array', items: { type: 'string' }, example: ['https://example.com/reward1.jpg', 'https://example.com/reward2.jpg'] },
                    },
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        '201': { description: 'Event created successfully' },
        '400': { description: 'Validation error or invalid input' },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Category not found' },
      },
    },
    get: {
      summary: 'Get all active events (For all users - USER, HOST, BUSINESS, ADMIN)',
      tags: ['Event'],
      security: [{ bearerAuth: [] }],
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
          description: 'Number of items per page (default: 10, max: 20)',
          schema: { type: 'integer', default: 10, maximum: 20 },
        },
        {
          name: 'search',
          in: 'query',
          description: 'Search events by title, description, or placeName',
          schema: { type: 'string' },
        },
        {
          name: 'subCategoryId',
          in: 'query',
          description: 'Filter events by subcategory ID',
          schema: { type: 'string' },
        },
        {
          name: 'categoryId',
          in: 'query',
          description: 'Filter events by category ID',
          schema: { type: 'string' },
        },
        {
          name: 'hostId',
          in: 'query',
          description: 'Filter events by host user ID',
          schema: { type: 'string' },
        },
        {
          name: 'latitude',
          in: 'query',
          description: 'User latitude for 50km radius location filtering (supports lat)',
          schema: { type: 'number' },
        },
        {
          name: 'longitude',
          in: 'query',
          description: 'User longitude for 50km radius location filtering (supports lng/lan)',
          schema: { type: 'number' },
        },
        {
          name: 'seed',
          in: 'query',
          description: 'Optional random seed for per-user consistent random pagination',
          schema: { type: 'string' },
        },
        {
          name: 'date',
          in: 'query',
          description: 'Filter events by single date ("2026-08-12"), multiple specific dates ("2026-08-12,2026-08-14,2026-08-20"), or date ranges ("2026-08-12 to 2026-08-14", "2026-08-12 - 2026-08-14")',
          schema: { type: 'string' },
        },
        {
          name: 'minPrice',
          in: 'query',
          description: 'Filter events with ticket price greater than or equal to this amount',
          schema: { type: 'number' },
        },
        {
          name: 'maxPrice',
          in: 'query',
          description: 'Filter events with ticket price less than or equal to this amount',
          schema: { type: 'number' },
        },
        {
          name: 'ticketAvailability',
          in: 'query',
          description: 'Filter events by ticket category availability (AVAILABLE: category stock > 0, SOLD_OUT: category stock = 0, FEW_LEFT: category stock <= 10)',
          schema: {
            type: 'string',
            enum: ['AVAILABLE', 'SOLD_OUT', 'FEW_LEFT'],
          },
        },

        {
          name: 'rewardsAvailable',
          in: 'query',
          description: 'Filter events with rewards available (true) or without rewards (false)',
          schema: { type: 'boolean' },
        },
      ],
      responses: {
        '200': { description: 'Events retrieved successfully' },
        '401': { description: 'Unauthorized' },
      },
    },
  },
  '/api/events/admin': {
    get: {
      summary: 'Get paginated events for Admin (Filter by hostId, search by title/host, filter by category)',
      tags: ['Event'],
      security: [{ bearerAuth: [] }],
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
          description: 'Number of items per page (default: 10)',
          schema: { type: 'integer', default: 10 },
        },
        {
          name: 'search',
          in: 'query',
          description: 'Search events by title, description, placeName, or host name/email',
          schema: { type: 'string' },
        },
        {
          name: 'title',
          in: 'query',
          description: 'Filter/search by title specifically',
          schema: { type: 'string' },
        },
        {
          name: 'hostId',
          in: 'query',
          description: 'Filter events hostId wise',
          schema: { type: 'string' },
        },
        {
          name: 'categoryId',
          in: 'query',
          description: 'Filter events categorywise (main category or subcategory ID)',
          schema: { type: 'string' },
        },
        {
          name: 'subCategoryId',
          in: 'query',
          description: 'Filter events subcategorywise',
          schema: { type: 'string' },
        },
        {
          name: 'date',
          in: 'query',
          description: 'Filter events by single date ("2026-08-12"), multiple specific dates ("2026-08-12,2026-08-14,2026-08-20"), or date ranges ("2026-08-12 to 2026-08-14")',
          schema: { type: 'string' },
        },
        {
          name: 'minPrice',
          in: 'query',
          description: 'Filter events with ticket price greater than or equal to this amount',
          schema: { type: 'number' },
        },
        {
          name: 'maxPrice',
          in: 'query',
          description: 'Filter events with ticket price less than or equal to this amount',
          schema: { type: 'number' },
        },
        {
          name: 'ticketAvailability',
          in: 'query',
          description: 'Filter events by ticket category availability (AVAILABLE: category stock > 0, SOLD_OUT: category stock = 0, FEW_LEFT: category stock <= 10)',
          schema: {
            type: 'string',
            enum: ['AVAILABLE', 'SOLD_OUT', 'FEW_LEFT'],
          },
        },

        {
          name: 'rewardsAvailable',
          in: 'query',
          description: 'Filter events with rewards available (true) or without rewards (false)',
          schema: { type: 'boolean' },
        },
      ],
      responses: {
        '200': { description: 'Admin events retrieved successfully' },
        '401': { description: 'Not authorized' },
        '403': { description: 'Forbidden: Requires ADMIN role' },
      },
    },
  },
  '/api/events/{id}': {
    get: {
      summary: 'Get single event details by ID',
      tags: ['Event'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Event ID',
        },
      ],
      responses: {
        '200': { description: 'Event details retrieved successfully' },
        '404': { description: 'Event not found' },
      },
    },
    patch: {
      summary: 'Update an event by ID (Host / Admin)',
      description: `Update an existing event by ID (supports multipart/form-data).

### Frontend Image Update Instructions (Flutter / Mobile / Web):

#### 1. Main Event Images (\`images\`)
- **To keep existing images**: Send existing image URL string(s) in form-data text fields (e.g. \`images\`: \`"https://example.com/main1.jpg"\`).
- **To add new image files**: Attach binary image file(s) to form-data field \`images\`.
- **To delete an image**: Omit that image URL string from the form-data fields.

#### 2. Artist Profile Images (\`artistInfo\` & \`artistImages\`)
- **To keep existing artist image**: Keep \`image: "https://example.com/artist1.jpg"\` in the \`artistInfo\` JSON string item.
- **To update artist image**: Attach binary image file to form-data field \`artistImages\` matching the artist index order.

#### 3. Event Reward Images (\`rewards\` & \`rewardImages_0\`, \`rewardImages_1\`)
- **To keep existing reward images**: Keep existing image URL string(s) in the reward's \`images\` JSON array: \`[{"title": "VIP Pass", "images": ["https://example.com/reward1.jpg"]}]\`.
- **To add new reward image files**: Attach binary image file(s) to form-data field \`rewardImages_0\` (for Reward 0), \`rewardImages_1\` (for Reward 1), etc.

#### Sample Form-Data Field Inputs:
- **Text Field \`images\`**: \`"https://example.com/existing_main1.jpg"\`
- **File Field \`images\`**: \`[Binary Image File for Main Event]\`
- **Text Field \`artistInfo\`**: \`[{"name": "DJ Alex", "role": "Headliner", "image": "https://example.com/existing_artist1.jpg"}]\`
- **File Field \`artistImages\`**: \`[Binary Profile Image File for Artist 0]\`
- **Text Field \`rewards\`**: \`[{"title": "VIP Pass", "pointsRequired": 150, "stock": 50, "images": ["https://example.com/existing_reward1.jpg"]}]\`
- **File Field \`rewardImages_0\`**: \`[Binary Image File for Reward 0]\``,
      tags: ['Event'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Event ID',
        },
      ],
      requestBody: {
        required: false,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
                categoryId: { type: 'string' },
                title: { type: 'string' },
                latitude: { type: 'number' },
                longitude: { type: 'number' },
                ageRestriction: { type: 'integer' },
                placeName: { type: 'string' },
                description: { type: 'string' },
                startDate: { type: 'string', format: 'date-time' },
                endDate: { type: 'string', format: 'date-time' },
                images: { type: 'array', items: { type: 'string', format: 'binary' }, description: 'Event main image files upload' },
                artistImages: { type: 'array', items: { type: 'string', format: 'binary' }, description: 'Artist profile image files upload (mapped 1-to-1 with artistInfo index)' },
                rewardImages: { type: 'array', items: { type: 'string', format: 'binary' }, description: 'Reward image files upload (all rewards)' },
                rewardImages_0: { type: 'array', items: { type: 'string', format: 'binary' }, description: 'Multiple binary image files upload for Reward 0' },
                rewardImages_1: { type: 'array', items: { type: 'string', format: 'binary' }, description: 'Multiple binary image files upload for Reward 1' },
                artistInfo: { type: 'string' },
                rewards: { type: 'string', example: '[{"title":"VIP Pass Badge","description":"Free VIP area access badge","pointsRequired":150,"stock":50}]', description: 'JSON array string of rewards. Host uploads binary image files in rewardImages_0, rewardImages_1, etc.' },
              },
            },
          },
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                categoryId: { type: 'string' },
                title: { type: 'string' },
                latitude: { type: 'number' },
                longitude: { type: 'number' },
                ageRestriction: { type: 'integer' },
                placeName: { type: 'string' },
                description: { type: 'string' },
                startDate: { type: 'string', format: 'date-time' },
                endDate: { type: 'string', format: 'date-time' },
                images: { type: 'array', items: { type: 'string' } },


                artistInfo: { type: 'array', items: { type: 'object' } },
                rewards: { type: 'array', items: { type: 'object' } },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'Event updated successfully' },
        '400': { description: 'Validation error' },
        '401': { description: 'Not authorized' },
        '403': { description: 'Forbidden: Not authorized to edit this event' },
        '404': { description: 'Event not found' },
      },
    },
    delete: {
      summary: 'Delete an event by ID',
      tags: ['Event'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Event ID',
        },
      ],
      responses: {
        '200': { description: 'Event deleted successfully' },
        '401': { description: 'Not authorized' },
        '403': { description: 'Forbidden: Not authorized to delete this event' },
        '404': { description: 'Event not found' },
      },
    },
  },
};
