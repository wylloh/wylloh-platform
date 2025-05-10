import Joi from 'joi';

export const lendingValidation = {
  // Validation for registering a new lending request
  registerLending: Joi.object({
    contentId: Joi.string().required(),
    borrowerEmail: Joi.string().email().required(),
    duration: Joi.number().min(1).required(),
    price: Joi.number().min(0).required()
  }),

  // Validation for confirming a lending transaction
  confirmLending: Joi.object({
    contentId: Joi.string().required(),
    lendingId: Joi.string().required(),
    transactionHash: Joi.string().required(),
    blockNumber: Joi.number().required()
  }),

  // Validation for returning content
  returnContent: Joi.object({
    lendingId: Joi.string().required(),
    transactionHash: Joi.string().required(),
    blockNumber: Joi.number().required()
  }),

  // Validation for cancelling a lending
  cancelLending: Joi.object({
    lendingId: Joi.string().required(),
    transactionHash: Joi.string().required(),
    blockNumber: Joi.number().required()
  }),

  // Validation for recording payment
  paymentForLending: Joi.object({
    lendingId: Joi.string().required(),
    transactionHash: Joi.string().required(),
    blockNumber: Joi.number().required(),
    amount: Joi.number().min(0).required()
  })
}; 