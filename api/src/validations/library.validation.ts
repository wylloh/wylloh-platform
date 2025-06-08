import Joi from 'joi';

// Library validation schemas
export const createLibrarySchema = Joi.object({
  name: Joi.string().required().min(1).max(100).trim(),
  description: Joi.string().optional().max(500).trim(),
  isPublic: Joi.boolean().optional().default(false),
  tags: Joi.array().items(Joi.string().trim()).optional(),
  contentIds: Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/)).optional()
});

export const updateLibrarySchema = Joi.object({
  name: Joi.string().optional().min(1).max(100).trim(),
  description: Joi.string().optional().max(500).trim(),
  isPublic: Joi.boolean().optional(),
  tags: Joi.array().items(Joi.string().trim()).optional()
});

export const addContentToLibrarySchema = Joi.object({
  contentIds: Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/)).required().min(1)
});

export const removeContentFromLibrarySchema = Joi.object({
  contentIds: Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/)).required().min(1)
});

export const getLibrariesSchema = Joi.object({
  userId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
  isPublic: Joi.boolean().optional(),
  limit: Joi.number().integer().min(1).max(100).optional().default(20),
  offset: Joi.number().integer().min(0).optional().default(0),
  search: Joi.string().optional().max(100).trim(),
  tags: Joi.array().items(Joi.string().trim()).optional()
});

export const libraryIdSchema = Joi.object({
  libraryId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
});

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
  }),

  getLibrary: Joi.object({
    libraryId: Joi.string().required().pattern(/^[0-9a-fA-F]{24}$/)
  }),

  getLibraryContent: Joi.object({
    libraryId: Joi.string().required().pattern(/^[0-9a-fA-F]{24}$/),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  }),

  addContent: Joi.object({
    libraryId: Joi.string().required().pattern(/^[0-9a-fA-F]{24}$/),
    contentId: Joi.string().required().pattern(/^[0-9a-fA-F]{24}$/),
    notes: Joi.string().allow('').max(500)
  }),

  lendContent: Joi.object({
    libraryId: Joi.string().required().pattern(/^[0-9a-fA-F]{24}$/),
    contentId: Joi.string().required().pattern(/^[0-9a-fA-F]{24}$/),
    borrowerAddress: Joi.string().required(),
    duration: Joi.number().integer().min(1).max(365).required()
  }),

  returnContent: Joi.object({
    libraryId: Joi.string().required().pattern(/^[0-9a-fA-F]{24}$/),
    contentId: Joi.string().required().pattern(/^[0-9a-fA-F]{24}$/)
  }),

  updateContentValue: Joi.object({
    libraryId: Joi.string().required().pattern(/^[0-9a-fA-F]{24}$/),
    contentId: Joi.string().required().pattern(/^[0-9a-fA-F]{24}$/),
    value: Joi.number().min(0).required()
  })
};

export default libraryValidation; 