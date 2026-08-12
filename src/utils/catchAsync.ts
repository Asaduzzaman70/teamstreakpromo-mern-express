import type { Request, Response, NextFunction } from 'express';

export type AsyncRequestHandler = (
  req: Request | any,
  res: Response,
  next: NextFunction
) => Promise<any>;

export const catchAsync = (fn: AsyncRequestHandler) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch((err) => next(err));
  };
};
