/**
 * Middleware wrapper to eliminate try-catch blocks inside controllers
 * Automatically forwards any thrown error to the global error handler
 * @param {Function} fn - Async controller route handler function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
