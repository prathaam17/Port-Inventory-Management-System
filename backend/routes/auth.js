const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const { createValidator } = require('../middleware/validator');

const loginAttempts = new Map();

const loginRateLimiter = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown_ip';
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 10;

  const record = loginAttempts.get(ip) || { count: 0, resetTime: now + windowMs };

  if (now > record.resetTime) {
    record.count = 0;
    record.resetTime = now + windowMs;
  }

  if (record.count >= maxAttempts) {
    return res.status(429).json({
      message: 'Too many failed login attempts. Please try again after 15 minutes.'
    });
  }

  record.count += 1;
  loginAttempts.set(ip, record);
  next();
};

const loginSchema = {
  username: { required: true, type: 'string', minLength: 2, maxLength: 100, label: 'Email or Username' },
  password: { required: true, type: 'string', minLength: 1, maxLength: 128, label: 'Password' }
};

router.post('/login', loginRateLimiter, createValidator(loginSchema), authController.login);
router.get('/me', verifyToken, authController.getCurrentUser);

module.exports = router;
