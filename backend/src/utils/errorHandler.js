// Standardized error handling utilities

/**
 * Standard error response format
 */
export class ApiError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'ApiError';
  }
}

/**
 * Create a standardized error response
 * @param {Response} res - Express response object
 * @param {Error|ApiError} error - Error to handle
 */
export function sendErrorResponse(res, error) {
  // Log the error for debugging
  console.error('Error:', error);

  // Determine status code
  const statusCode = error.statusCode || 500;
  
  // Create standardized error response
  const errorResponse = {
    error: {
      message: error.message || 'Internal server error',
      type: error.name || 'Error',
      ...(error.details && { details: error.details }),
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    },
    timestamp: new Date().toISOString()
  };

  res.status(statusCode).json(errorResponse);
}

/**
 * Async error handler wrapper
 * @param {Function} fn - Async function to wrap
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Common error messages
 */
export const ErrorMessages = {
  // Validation errors
  INVALID_INPUT: 'Invalid input provided',
  MISSING_REQUIRED_FIELD: 'Required field is missing',
  INVALID_EMAIL: 'Invalid email address',
  INVALID_DATE: 'Invalid date format',
  
  // Resource errors
  NOT_FOUND: 'Resource not found',
  ALREADY_EXISTS: 'Resource already exists',
  
  // Permission errors
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  
  // Database errors
  DATABASE_ERROR: 'Database operation failed',
  TRANSACTION_FAILED: 'Transaction could not be completed',
  
  // File errors
  FILE_UPLOAD_FAILED: 'File upload failed',
  FILE_NOT_FOUND: 'File not found',
  INVALID_FILE_TYPE: 'Invalid file type',
  
  // Rate limiting
  TOO_MANY_REQUESTS: 'Too many requests, please try again later'
};

/**
 * Create validation error with field details
 * @param {string} message - Error message
 * @param {object} fields - Field validation errors
 */
export function validationError(message, fields) {
  return new ApiError(message, 400, { fields });
}

/**
 * Create not found error
 * @param {string} resource - Resource type
 */
export function notFoundError(resource = 'Resource') {
  return new ApiError(`${resource} not found`, 404);
}

/**
 * Create unauthorized error
 * @param {string} message - Optional custom message
 */
export function unauthorizedError(message = 'Unauthorized access') {
  return new ApiError(message, 401);
}

/**
 * Create forbidden error
 * @param {string} message - Optional custom message
 */
export function forbiddenError(message = 'Access forbidden') {
  return new ApiError(message, 403);
}

/**
 * Create conflict error
 * @param {string} message - Error message
 */
export function conflictError(message) {
  return new ApiError(message, 409);
}

/**
 * Create server error
 * @param {string} message - Optional custom message
 */
export function serverError(message = 'Internal server error') {
  return new ApiError(message, 500);
}