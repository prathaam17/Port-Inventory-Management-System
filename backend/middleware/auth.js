const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');
require('dotenv').config();

if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL ERROR: JWT_SECRET environment variable must be explicitly set in production environment.');
  } else {
    console.warn('[SECURITY WARNING]: JWT_SECRET is not set in environment. Using environment configured key.');
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'mngprt_super_secret_key_2026';

const verifyToken = async (req, res, next) => {
  let token = null;
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
  } else if (req.query && req.query.token) {
    token = req.query.token;
  } else if (req.headers['x-access-token']) {
    token = req.headers['x-access-token'];
  }

  if (!token) {
    return res.status(403).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Validate database status in real-time
    const dbUser = await User.findByPk(decoded.id, { include: [Role] });
    if (!dbUser || dbUser.status !== 'active') {
      return res.status(403).json({ message: 'Access denied. Your account is deactivated or does not exist.' });
    }

    req.user = {
      id: dbUser.id,
      username: dbUser.username,
      email: dbUser.email,
      role: dbUser.Role ? dbUser.Role.name : 'User',
      pdaBalance: dbUser.pdaBalance
    };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

// Map role aliases for flexible matching (e.g. 'Finance' <-> 'Finance Officer')
const normalizeRole = (r) => {
  if (!r) return '';
  const lower = r.toLowerCase().trim();
  if (lower === 'finance' || lower === 'finance officer') return 'finance';
  return lower;
};

// Check if user has one of the allowed roles
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: 'Access denied. Role not found.' });
    }

    const userRoleNorm = normalizeRole(req.user.role);
    const allowedNorm = allowedRoles.map(normalizeRole);

    if (allowedNorm.includes(userRoleNorm)) {
      next();
    } else {
      return res.status(403).json({ 
        message: `Forbidden. This operation requires one of the following roles: ${allowedRoles.join(', ')}` 
      });
    }
  };
};

// Rate limiter middleware to prevent brute force attacks
const rateLimitMap = new Map();
const rateLimiter = (maxRequests = 10, windowMs = 15 * 60 * 1000) => {
  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const now = Date.now();
    const record = rateLimitMap.get(ip) || { count: 0, resetTime: now + windowMs };

    if (now > record.resetTime) {
      record.count = 0;
      record.resetTime = now + windowMs;
    }

    record.count += 1;
    rateLimitMap.set(ip, record);

    if (record.count > maxRequests) {
      return res.status(429).json({ 
        message: 'Too many login attempts from this IP address. Please try again after 15 minutes.' 
      });
    }
    next();
  };
};

module.exports = {
  verifyToken,
  checkRole,
  rateLimiter,
  JWT_SECRET
};
