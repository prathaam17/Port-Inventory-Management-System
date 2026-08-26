/**
 * Sanitizes input values (strings, arrays, object properties) by:
 * 1. Trimming leading/trailing whitespace
 * 2. Escaping HTML control characters to prevent Stored & Reflected XSS attacks
 * 3. Handling nested objects and arrays recursively
 */
function escapeString(str) {
  if (typeof str !== 'string') return str;
  const trimmed = str.trim();
  return trimmed
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

function sanitizeInput(data) {
  if (data === null || data === undefined) {
    return data;
  }
  if (typeof data === 'string') {
    return escapeString(data);
  }
  if (Array.isArray(data)) {
    return data.map(item => sanitizeInput(item));
  }
  if (typeof data === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  return data;
}

/**
 * Express middleware to automatically sanitize req.body, req.query, and req.params.
 */
function sanitizeMiddleware(req, res, next) {
  if (req.body) {
    req.body = sanitizeInput(req.body);
  }
  if (req.query) {
    req.query = sanitizeInput(req.query);
  }
  if (req.params) {
    req.params = sanitizeInput(req.params);
  }
  next();
}

module.exports = { sanitizeInput, escapeString, sanitizeMiddleware };
