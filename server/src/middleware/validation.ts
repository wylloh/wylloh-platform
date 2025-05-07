import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

interface ValidationSchema {
  params?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  body?: Joi.ObjectSchema;
}

export const validateRequest = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const validationOptions = {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: true,
    };

    const validationPromises: Promise<any>[] = [];

    if (schema.params) {
      validationPromises.push(
        schema.params.validateAsync(req.params, validationOptions)
      );
    }

    if (schema.query) {
      validationPromises.push(
        schema.query.validateAsync(req.query, validationOptions)
      );
    }

    if (schema.body) {
      validationPromises.push(
        schema.body.validateAsync(req.body, validationOptions)
      );
    }

    Promise.all(validationPromises)
      .then(() => {
        next();
      })
      .catch((err) => {
        const errors = err.details.map((detail: Joi.ValidationErrorItem) => ({
          message: detail.message,
          path: detail.path,
        }));

        res.status(400).json({
          message: 'Validation error',
          errors,
        });
      });
  };
}; 