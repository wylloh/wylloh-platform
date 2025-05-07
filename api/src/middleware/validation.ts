import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validateRequest = (schema: {
  params?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  body?: Joi.ObjectSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const validationOptions = {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: true,
    };

    const { error } = Joi.object({
      params: schema.params || Joi.object(),
      query: schema.query || Joi.object(),
      body: schema.body || Joi.object(),
    }).validate(
      {
        params: req.params,
        query: req.query,
        body: req.body,
      },
      validationOptions
    );

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(', ');
      return res.status(400).json({ error: errorMessage });
    }

    next();
  };
}; 