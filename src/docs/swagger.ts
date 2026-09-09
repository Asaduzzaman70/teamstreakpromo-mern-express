import swaggerJsdoc from 'swagger-jsdoc';
import type { Express, Request, Response } from 'express';
import config from '../config/config.js';
import { authDocs } from './auth.docs.js';
import { categoryDocs } from './category.docs.js';
import { eventDocs } from './event.docs.js';
import { employeeDocs } from './employee.docs.js';
import { paymentDocs } from './payment.docs.js';
import { rewardCategoryDocs } from './rewardCategory.docs.js';
import { rewardSubCategoryDocs } from './rewardSubCategory.docs.js';
import { marketplaceDocs } from './marketplace.docs.js';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TeamStreak Promo API',
      version: '1.0.0',
      description: 'REST API documentation for TeamStreak Promo application built with Express and TypeScript.',
    },
    servers: [
      {
        url: config.serverUrl,
        description: 'Production server',
      },
      {
        url: `http://localhost:${config.port}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer <token>',
        },
      },
    },
    paths: {
      ...authDocs,
      ...categoryDocs,
      ...eventDocs,
      ...employeeDocs,
      ...paymentDocs,
      ...rewardCategoryDocs,
      ...rewardSubCategoryDocs,
      ...marketplaceDocs,
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Express): void => {
  app.get('/api-docs.json', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  app.get(['/api-docs', '/api-docs/'], (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>TeamStreak Promo API Documentation</title>
        <link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.18.2/swagger-ui.min.css" />
        <link rel="icon" type="image/png" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.18.2/favicon-32x32.png" />
        <style>
          html { box-sizing: border-box; overflow-y: scroll; }
          *, *:before, *:after { box-sizing: inherit; }
          body { margin: 0; background: #fafafa; }
          .swagger-ui .topbar { display: none; }
        </style>
      </head>
      <body>
        <div id="swagger-ui"></div>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.18.2/swagger-ui-bundle.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.18.2/swagger-ui-standalone-preset.js"></script>
        <script>
          window.onload = function() {
            const ui = SwaggerUIBundle({
              spec: ${JSON.stringify(swaggerSpec)},
              dom_id: '#swagger-ui',
              deepLinking: true,
              presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIStandalonePreset
              ],
              plugins: [
                SwaggerUIBundle.plugins.DownloadUrl
              ],
              layout: "StandaloneLayout",
              defaultModelsExpandDepth: -1,
              docExpansion: "none"
            });
            window.ui = ui;
          };
        </script>
      </body>
      </html>
    `);
  });
};
