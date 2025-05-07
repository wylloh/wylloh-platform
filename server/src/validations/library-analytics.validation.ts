import Joi from 'joi';

export const libraryAnalyticsValidation = {
  getAnalytics: Joi.object({
    params: Joi.object({
      libraryId: Joi.string().required()
    })
  }),

  updateValue: Joi.object({
    params: Joi.object({
      libraryId: Joi.string().required()
    }),
    body: Joi.object({
      newValue: Joi.number().required().min(0)
    })
  }),

  trackLending: Joi.object({
    params: Joi.object({
      libraryId: Joi.string().required()
    }),
    body: Joi.object({
      duration: Joi.number().required().min(1),
      revenue: Joi.number().required().min(0)
    })
  }),

  trackEngagement: Joi.object({
    params: Joi.object({
      libraryId: Joi.string().required()
    }),
    body: Joi.object({
      viewDuration: Joi.number().required().min(0),
      isUniqueViewer: Joi.boolean().required()
    })
  }),

  getValueTrends: Joi.object({
    params: Joi.object({
      libraryId: Joi.string().required()
    }),
    query: Joi.object({
      period: Joi.string().valid('7d', '30d', '1y').default('30d')
    })
  })
}; 