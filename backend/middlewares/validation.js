import { AppError } from './errorHandler.js';

/**
 * Express middleware to validate request payload against a Zod schema
 * @param {z.Schema} schema - Zod schema validation rules
 * @returns {Function} Express middleware function
 */
const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    const errors = error.errors || [];
    const errorMessages = errors.map((err) => `${err.path.join('.')}: ${err.message}`);
    next(new AppError('Validation Error', 400, errorMessages.length > 0 ? errorMessages : [error.message]));
  }
};

export default validate;
