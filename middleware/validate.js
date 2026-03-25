/**
 * Input Validation Middleware
 * Validates request body, params, and queries against schemas
 */

/**
 * Validate request against a schema
 * @param {Object} schema - Validation schema object
 * @returns {Function} Express middleware
 */
function validate(schema) {
  return (req, res, next) => {
    const errors = {};

    // Validate body
    if (schema.body) {
      const bodyErrors = validateSchema(req.body, schema.body);
      if (bodyErrors.length > 0) {
        errors.body = bodyErrors;
      }
    }

    // Validate query
    if (schema.query) {
      const queryErrors = validateSchema(req.query, schema.query);
      if (queryErrors.length > 0) {
        errors.query = queryErrors;
      }
    }

    // Validate params
    if (schema.params) {
      const paramsErrors = validateSchema(req.params, schema.params);
      if (paramsErrors.length > 0) {
        errors.params = paramsErrors;
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors,
      });
    }

    next();
  };
}

/**
 * Validate data against schema rules
 * @param {Object} data - Data to validate
 * @param {Object} rules - Validation rules
 * @returns {Array} Array of error messages
 */
function validateSchema(data, rules) {
  const errors = [];

  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field];

    // Required check
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} is required`);
      continue;
    }

    // Skip validation if not required and empty
    if (!rule.required && (value === undefined || value === null || value === '')) {
      continue;
    }

    // Type check
    if (rule.type) {
      const actualType = typeof value;
      if (rule.type === 'array' && !Array.isArray(value)) {
        errors.push(`${field} must be an array`);
        continue;
      } else if (rule.type !== 'array' && actualType !== rule.type) {
        errors.push(`${field} must be a ${rule.type}`);
        continue;
      }
    }

    // String validations
    if (typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        errors.push(`${field} must be at least ${rule.minLength} characters`);
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push(`${field} must not exceed ${rule.maxLength} characters`);
      }
      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push(`${field} format is invalid`);
      }
      if (rule.enum && !rule.enum.includes(value)) {
        errors.push(`${field} must be one of: ${rule.enum.join(', ')}`);
      }
    }

    // Number validations
    if (typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        errors.push(`${field} must be at least ${rule.min}`);
      }
      if (rule.max !== undefined && value > rule.max) {
        errors.push(`${field} must not exceed ${rule.max}`);
      }
    }

    // Email validation
    if (rule.type === 'email') {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(value)) {
        errors.push(`${field} must be a valid email`);
      }
    }

    // URL validation
    if (rule.type === 'url') {
      try {
        new URL(value);
      } catch (e) {
        errors.push(`${field} must be a valid URL`);
      }
    }

    // Custom validator
    if (rule.custom) {
      const customError = rule.custom(value);
      if (customError) {
        errors.push(customError);
      }
    }
  }

  return errors;
}

module.exports = { validate };
