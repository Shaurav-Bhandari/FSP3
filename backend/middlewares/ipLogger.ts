import { Request, Response, NextFunction } from 'express';

export const addIpAddress = (req: Request, _: Response, next: NextFunction) => {
  req.ip = (req.headers['x-forwarded-for'] as string) || req.connection.remoteAddress || '';
  next();
};
