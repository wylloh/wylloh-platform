import Joi from 'joi';

export const libraryValidation = {
  createLibrary: Joi.object({
    name: Joi.string().required().min(1).max(255),
    description: Joi.string().allow('').max(1000),
    isPublic: Joi.boolean().default(false),
    tags: Joi.array().items(Joi.string()).default([])
  }),

  updateLibrary: Joi.object({
    name: Joi.string().min(1).max(255),
    description: Joi.string().allow('').max(1000),
    isPublic: Joi.boolean(),
    tags: Joi.array().items(Joi.string())
  }),

  addToLibrary: Joi.object({
    contentId: Joi.string().required().pattern(/^[0-9a-fA-F]{24}$/),
    notes: Joi.string().allow('').max(500)
  }),

  removeFromLibrary: Joi.object({
    contentId: Joi.string().required().pattern(/^[0-9a-fA-F]{24}$/)
  }),

  getLibraries: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    search: Joi.string().allow('').max(100),
    sortBy: Joi.string().valid('name', 'createdAt', 'updatedAt').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
    isPublic: Joi.boolean()
  })
};

export default libraryValidation; 