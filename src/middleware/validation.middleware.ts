import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import logger from '../utils/logger';

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        logger.warn('Validation failed', {
          path: req.path,
          method: req.method,
          errors,
        });
        
        res.status(400).json({
          error: {
            message: 'Validation failed',
            status: 400,
            code: 'VALIDATION_ERROR',
            details: errors,
          },
        });
      } else {
        logger.error('Unexpected validation error', { error });
        next(error);
      }
    }
  };
};
