// =============================================================================
// Request Validation Middleware
// =============================================================================

const { ValidationError } = require('../utils/errors');

/**
 * Validate that required fields exist in req.body.
 * @param {string[]} fields - Array of required field names
 */
function requireFields(...fields) {
  return (req, res, next) => {
    const missing = fields.filter(f => {
      const val = req.body[f];
      return val === undefined || val === null || (typeof val === 'string' && val.trim() === '');
    });

    if (missing.length > 0) {
      return next(new ValidationError(
        `Missing required fields: ${missing.join(', ')}`,
        { missing }
      ));
    }
    next();
  };
}

/**
 * Validate that a field's value is one of the allowed values.
 * Only validates if the field is present.
 */
function validateEnum(field, allowedValues) {
  return (req, res, next) => {
    const value = req.body[field];
    if (value !== undefined && !allowedValues.includes(value)) {
      return next(new ValidationError(
        `Invalid value for '${field}'. Allowed: ${allowedValues.join(', ')}`,
        { field, value, allowed: allowedValues }
      ));
    }
    next();
  };
}

/**
 * Validate string length constraints.
 */
function validateLength(field, min, max) {
  return (req, res, next) => {
    const value = req.body[field];
    if (value !== undefined && typeof value === 'string') {
      if (value.length < min || value.length > max) {
        return next(new ValidationError(
          `'${field}' must be between ${min} and ${max} characters`,
          { field, length: value.length, min, max }
        ));
      }
    }
    next();
  };
}

/**
 * Sanitize string fields — trim whitespace.
 */
function sanitizeBody(...fields) {
  return (req, res, next) => {
    for (const field of fields) {
      if (typeof req.body[field] === 'string') {
        req.body[field] = req.body[field].trim();
      }
    }
    next();
  };
}

/**
 * Validate that string fields contain only safe characters (alphanumeric, spaces, basic punctuation)
 * explicitly rejecting HTML tags, XSS scripts, or type discrepancies like arrays masquerading as strings.
 */
function validateSafeText(...fields) {
  return (req, res, next) => {
    for (const field of fields) {
      const value = req.body[field];
      if (value !== undefined && value !== null && value !== '') {
        if (typeof value !== 'string') {
          return next(new ValidationError(`'${field}' must be a text string`, { field }));
        }
        // Strict allowlist: alphanumeric, space, hyphens, underscores, dots, commas, generic punctuation.
        // Rejects <, >, =, ", ', &, and other dangerous injection vectors.
        const safeRegex = /^[\w\s\-_.,!?@#$%^*()]+$/;
        if (!safeRegex.test(value)) {
          return next(new ValidationError(`'${field}' contains invalid special characters or potential HTML injection.`, { field }));
        }
      }
    }
    next();
  };
}

module.exports = {
  requireFields,
  validateEnum,
  validateLength,
  sanitizeBody,
  validateSafeText
};
