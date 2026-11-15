import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodType } from 'zod';
import { AppError } from '../utils/app-error';

export const validate = (schema: ZodType) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map((err) => `${err.path.join('.')}: ${err.message}`).join(', ');
        return next(new AppError(`Validaciona greska: ${errorMessages}`, 400, 'VALIDATION_ERROR'));
      }
      return next(error);
    }
  };
};
