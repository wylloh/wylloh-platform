import Joi from 'joi';

export const libraryAnalyticsValidation = {
  getAnalytics: {
    params: Joi.object({
      libraryId: Joi.string().required(),
    }),
  },

  updateValue: {
    params: Joi.object({
      libraryId: Joi.string().required(),
    }),
    body: Joi.object({
      newValue: Joi.number().min(0).required(),
    }),
  },

  trackLending: {
    params: Joi.object({
      libraryId: Joi.string().required(),
    }),
    body: Joi.object({
      duration: Joi.number().min(1).required(),
      revenue: Joi.number().min(0).required(),
    }),
  },

  trackEngagement: {
    params: Joi.object({
      libraryId: Joi.string().required(),
    }),
    body: Joi.object({
      viewDuration: Joi.number().min(0).required(),
      isUniqueViewer: Joi.boolean().required(),
    }),
  },

  getValueTrends: {
    params: Joi.object({
      libraryId: Joi.string().required(),
    }),
    query: Joi.object({
      period: Joi.string().valid('7d', '30d', '1y').default('30d'),
    }),
  },
}; 