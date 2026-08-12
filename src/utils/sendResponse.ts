import type { Response } from 'express';

export interface ResponseOptions<T> {
  statusCode: number;
  success?: boolean;
  message?: string;
  data?: T;
}

export const sendResponse = <T>(res: Response, options: ResponseOptions<T>): void => {
  const { statusCode, success = statusCode >= 200 && statusCode < 300, message, data } = options;

  const responsePayload: Record<string, any> = {
    success,
  };

  if (message) {
    responsePayload.message = message;
  }

  if (data !== undefined) {
    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
      Object.assign(responsePayload, data);
    } else {
      responsePayload.data = data;
    }
  }

  res.status(statusCode).json(responsePayload);
};
