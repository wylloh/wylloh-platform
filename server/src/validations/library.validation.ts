import Joi from 'joi';

export const libraryValidation = {
  // Get a library by ID
  getLibrary: {
    params: Joi.object({
      libraryId: Joi.string().required()
    })
  },
  
  // Create a new library
  createLibrary: {
    body: Joi.object({
      name: Joi.string().required().min(1).max(100),
      description: Joi.string().allow('').max(500),
      isPublic: Joi.boolean().default(true)
    })
  },
  
  // Update a library
  updateLibrary: {
    params: Joi.object({
      libraryId: Joi.string().required()
    }),
    body: Joi.object({
      name: Joi.string().min(1).max(100),
      description: Joi.string().allow('').max(500),
      isPublic: Joi.boolean()
    }).min(1) // At least one field must be provided
  },
  
  // Delete a library
  deleteLibrary: {
    params: Joi.object({
      libraryId: Joi.string().required()
    })
  },
  
  // Get all items in a library
  getLibraryItems: {
    params: Joi.object({
      libraryId: Joi.string().required()
    })
  },
  
  // Add an item to a library
  addItemToLibrary: {
    params: Joi.object({
      libraryId: Joi.string().required()
    }),
    body: Joi.object({
      contentId: Joi.string().required(),
      purchasePrice: Joi.number().min(0).default(0),
      currentValue: Joi.number().min(0),
      licenseType: Joi.string().valid('perpetual', 'limited', 'personal'),
      licenseExpiry: Joi.date().iso().allow(null)
    })
  },
  
  // Remove an item from a library
  removeItemFromLibrary: {
    params: Joi.object({
      libraryId: Joi.string().required(),
      contentId: Joi.string().required()
    })
  },
  
  // Update an item in a library
  updateItemInLibrary: {
    params: Joi.object({
      libraryId: Joi.string().required(),
      contentId: Joi.string().required()
    }),
    body: Joi.object({
      currentValue: Joi.number().min(0),
      licenseType: Joi.string().valid('perpetual', 'limited', 'personal'),
      licenseExpiry: Joi.date().iso().allow(null),
      isLent: Joi.boolean(),
      lentTo: Joi.string().when('isLent', {
        is: true,
        then: Joi.required(),
        otherwise: Joi.allow(null, '')
      })
    }).min(1) // At least one field must be provided
  },

  getLibraryContent: {
    params: Joi.object({
      libraryId: Joi.string().required(),
    }),
  },

  addContent: {
    params: Joi.object({
      libraryId: Joi.string().required(),
    }),
    body: Joi.object({
      contentId: Joi.string().required(),
      purchasePrice: Joi.number().min(0).required(),
      licenseType: Joi.string().valid('personal', 'commercial').required(),
    }),
  },

  lendContent: {
    params: Joi.object({
      libraryId: Joi.string().required(),
      contentId: Joi.string().required(),
    }),
    body: Joi.object({
      email: Joi.string().email().required(),
      duration: Joi.number().min(1).max(30).required(),
    }),
  },

  returnContent: {
    params: Joi.object({
      libraryId: Joi.string().required(),
      contentId: Joi.string().required(),
    }),
  },

  updateContentValue: {
    params: Joi.object({
      libraryId: Joi.string().required(),
      contentId: Joi.string().required(),
    }),
    body: Joi.object({
      newValue: Joi.number().min(0).required(),
    }),
  },
};

export default libraryValidation; 