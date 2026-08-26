const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');
const { JWT_SECRET } = require('../middleware/auth');
const { logActivity } = require('../utils/logger');

const { Op } = require('sequelize');

// Login User
exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).json({ message: 'Email/Username and password are required.' });
    }

    const user = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email: username }]
      },
      include: [{ model: Role }]
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ message: 'Your account is deactivated. Contact the administrator.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const tokenPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.Role ? user.Role.name : 'User',
      pdaBalance: user.pdaBalance
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '8h' });

    // Log the success login
    await logActivity({ user: tokenPayload }, 'USER_LOGIN', `User ${username} logged in successfully.`);

    return res.json({
      token,
      user: tokenPayload
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Get current user details
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Role }]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.Role ? user.Role.name : 'User',
      status: user.status,
      pdaBalance: user.pdaBalance
    });
  } catch (error) {
    console.error('Get user details error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};
