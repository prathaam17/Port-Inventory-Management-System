/**
 * Centralized Validation Helper and Middleware for Express Backend.
 */

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;
const PINCODE_REGEX = /^\d{6}$/;
const ISO_CONTAINER_REGEX = /^[A-Z]{4}\d{7}$/;
const VCN_REGEX = /^VCN-\d{4}-[A-Z0-9]+$/i;

/**
 * Validates a single field against rule options.
 * Returns null if valid, or an error message string if invalid.
 */
function validateField(fieldName, value, rules = {}) {
  const label = rules.label || fieldName;

  // 1. Required Check
  if (rules.required) {
    if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
      return `${label} is required.`;
    }
  }

  // If value is missing and not required, skip further checks
  if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
    return null;
  }

  // 2. Data Type Check
  if (rules.type) {
    if (rules.type === 'string' && typeof value !== 'string') {
      return `${label} must be a text string.`;
    }
    if (rules.type === 'number') {
      const num = Number(value);
      if (isNaN(num)) {
        return `${label} must be a valid number.`;
      }
    }
    if (rules.type === 'integer') {
      const num = Number(value);
      if (isNaN(num) || !Number.isInteger(num)) {
        return `${label} must be an integer.`;
      }
    }
    if (rules.type === 'boolean') {
      if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
        return `${label} must be a boolean value.`;
      }
    }
    if (rules.type === 'date') {
      const d = new Date(value);
      if (isNaN(d.getTime())) {
        return `${label} must be a valid date format.`;
      }
    }
  }

  // 3. String Length Constraints
  if (typeof value === 'string') {
    if (rules.minLength !== undefined && value.length < rules.minLength) {
      return `${label} must be at least ${rules.minLength} characters long.`;
    }
    if (rules.maxLength !== undefined && value.length > rules.maxLength) {
      return `${label} cannot exceed ${rules.maxLength} characters.`;
    }
  }

  // 4. Numeric Range Constraints
  if (rules.type === 'number' || rules.type === 'integer' || typeof value === 'number') {
    const numVal = Number(value);
    if (rules.min !== undefined && numVal < rules.min) {
      return `${label} must be at least ${rules.min}.`;
    }
    if (rules.max !== undefined && numVal > rules.max) {
      return `${label} cannot exceed ${rules.max}.`;
    }
  }

  // 5. Format & Pattern Checks
  if (rules.format) {
    const strVal = String(value).toUpperCase();
    if (rules.format === 'email' && !EMAIL_REGEX.test(String(value))) {
      return `Invalid ${label} format (e.g. user@domain.com).`;
    }
    if (rules.format === 'pan' && !PAN_REGEX.test(strVal)) {
      return `${label} must be a valid 10-character PAN number (e.g. ABCDE1234F).`;
    }
    if (rules.format === 'gstin' && !GSTIN_REGEX.test(strVal)) {
      return `${label} must be a valid 15-character GSTIN number.`;
    }
    if (rules.format === 'phone' && !PHONE_REGEX.test(String(value))) {
      return `${label} must be a valid 10-digit mobile number starting with 6-9.`;
    }
    if (rules.format === 'pincode' && !PINCODE_REGEX.test(String(value))) {
      return `${label} must be a valid 6-digit PIN code.`;
    }
    if (rules.format === 'iso_container' && !ISO_CONTAINER_REGEX.test(strVal)) {
      return `${label} must follow standard ISO container format (4 letters + 7 numbers, e.g. MSKU1234567).`;
    }
  }

  // Custom Pattern Regex
  if (rules.pattern && !rules.pattern.test(String(value))) {
    return `${label} format is invalid.`;
  }

  // 6. Enum / Allowed Values
  if (rules.enum && Array.isArray(rules.enum)) {
    if (!rules.enum.includes(value)) {
      return `${label} must be one of the following: ${rules.enum.join(', ')}.`;
    }
  }

  return null;
}

/**
 * Middleware factory for validating request parameters/body against a schema object.
 * Schema structure: { fieldName: { required: true, type: 'string', minLength: 3, ... } }
 */
function createValidator(schema, location = 'body') {
  return (req, res, next) => {
    const data = req[location] || {};
    const errors = [];

    for (const [field, rules] of Object.entries(schema)) {
      const errorMsg = validateField(field, data[field], rules);
      if (errorMsg) {
        errors.push({ field, message: errorMsg });
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        message: errors[0].message, // First user-friendly error
        errors
      });
    }

    next();
  };
}

module.exports = {
  validateField,
  createValidator,
  EMAIL_REGEX,
  PAN_REGEX,
  GSTIN_REGEX,
  PHONE_REGEX,
  PINCODE_REGEX,
  ISO_CONTAINER_REGEX,
  VCN_REGEX
};
