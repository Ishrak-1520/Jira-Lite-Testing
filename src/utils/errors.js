// =============================================================================
// Custom API Error Classes
// =============================================================================

class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'ApiError';
  }
}

class NotFoundError extends ApiError {
  constructor(resource = 'Resource') {
    super(404, `${resource} not found`);
    this.name = 'NotFoundError';
  }
}

class ValidationError extends ApiError {
  constructor(message, details = null) {
    super(400, message, details);
    this.name = 'ValidationError';
  }
}

class AuthenticationError extends ApiError {
  constructor(message = 'Authentication required') {
    super(401, message);
    this.name = 'AuthenticationError';
  }
}

class ForbiddenError extends ApiError {
  constructor(message = 'Insufficient permissions') {
    super(403, message);
    this.name = 'ForbiddenError';
  }
}

class ConflictError extends ApiError {
  constructor(message = 'Resource already exists') {
    super(409, message);
    this.name = 'ConflictError';
  }
}

module.exports = {
  ApiError,
  NotFoundError,
  ValidationError,
  AuthenticationError,
  ForbiddenError,
  ConflictError
};
