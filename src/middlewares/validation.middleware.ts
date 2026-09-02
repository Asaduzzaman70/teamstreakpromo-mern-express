import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { AppError } from '../utils/AppError.js';

export interface RequestValidationSchema {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Middleware to validate request data (body, query, params) against Zod schema(s).
 * Accepts either a single Zod schema (validated against req.body)
 * or an object containing body, query, and/or params schemas.
 */
export const validateRequest = (
  schema: ZodSchema | RequestValidationSchema
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if ('safeParseAsync' in schema || 'parseAsync' in schema) {
        // Direct Zod schema for req.body
        const parsedBody = await (schema as ZodSchema).parseAsync(req.body);
        req.body = parsedBody;
      } else {
        const schemaObj = schema as RequestValidationSchema;
        if (schemaObj.body) {
          req.body = await schemaObj.body.parseAsync(req.body);
        }
        if (schemaObj.query) {
          req.query = (await schemaObj.query.parseAsync(req.query)) as any;
        }
        if (schemaObj.params) {
          req.params = (await schemaObj.params.parseAsync(req.params)) as any;
        }
      }
      next();
    } catch (error: any) {
      if (error?.name === 'ZodError' || error?.issues) {
        const firstIssue = error.issues?.[0];
        const message = firstIssue?.message || 'Validation error';
        return next(new AppError(message, 400));
      }
      return next(error);
    }
  };
};
