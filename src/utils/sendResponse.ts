import type { Response } from 'express';

export interface IMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPage?: number;
  [key: string]: any;
}

export interface ResponseOptions<T> {
  statusCode: number;
  success?: boolean;
  message?: string;
  meta?: IMeta;
  data?: T;
}

/**
 * Standardized API response helper.
 * Standard response structure:
 * {
 *   success: boolean,
 *   statusCode: number,
 *   message?: string,
 *   meta?: { page, limit, total, totalPage },
 *   data?: T
 * }
 */
export const sendResponse = <T>(res: Response, options: ResponseOptions<T>): void => {
  const {
    statusCode,
    success = statusCode >= 200 && statusCode < 300,
    message,
    meta,
    data,
  } = options;

  const responsePayload: Record<string, any> = {
    success,
    statusCode,
  };

  if (message) {
    responsePayload.message = message;
  }

  if (meta !== undefined) {
    responsePayload.meta = meta;
  }

  if (data !== undefined) {
    responsePayload.data = data;
  }

  res.status(statusCode).json(responsePayload);
};
