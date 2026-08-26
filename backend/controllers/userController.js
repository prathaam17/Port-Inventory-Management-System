const bcrypt = require('bcryptjs');
const { User, Role } = require('../models');
const { logActivity } = require('../utils/logger');

// Get all users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      include: [{ model: Role }],
      attributes: { exclude: ['password'] }
    });
    return res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Create a new user
exports.createUser = async (req, res) => {
  const { username, email, password, roleId } = req.body;

  try {
    if (!username || !email || !password || !roleId) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const { validateField } = require('../middleware/validator');
    const emailErr = validateField('email', email, { required: true, format: 'email', label: 'Email' });
    if (emailErr) return res.status(400).json({ message: emailErr });

    const passErr = validateField('password', password, { required: true, minLength: 6, label: 'Password' });
    if (passErr) return res.status(400).json({ message: passErr });

    // Validate foreign key roleId exists
    const parsedRoleId = parseInt(roleId);
    if (isNaN(parsedRoleId)) {
      return res.status(400).json({ message: 'Role ID must be a valid integer.' });
    }
    const roleObj = await Role.findByPk(parsedRoleId);
    if (!roleObj) {
      return res.status(400).json({ message: `Role with ID ${roleId} does not exist.` });
    }

    // Check if user already exists
    const existing = await User.findOne({ where: { username } });
    if (existing) {
      return res.status(400).json({ message: 'Username is already taken.' });
    }

    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email is already in use.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      email,
      password: passwordHash,
      roleId: parsedRoleId,
      status: 'active'
    });

    const createdUser = await User.findByPk(user.id, {
      include: [{ model: Role }],
      attributes: { exclude: ['password'] }
    });

    await logActivity(
      req,
      'USER_CREATION',
      `Created user account: ${username} with role ${createdUser && createdUser.Role ? createdUser.Role.name : 'User'}.`
    );

    return res.status(201).json({
      message: 'User created successfully.',
      user: createdUser
    });
  } catch (error) {
    console.error('Create user error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Update user details (Role and Status)
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { roleId, status } = req.body;

  try {
    const user = await User.findByPk(id, { include: [{ model: Role }] });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (roleId !== undefined) {
      const parsedRoleId = parseInt(roleId);
      if (isNaN(parsedRoleId)) {
        return res.status(400).json({ message: 'Role ID must be a valid integer.' });
      }
      const roleObj = await Role.findByPk(parsedRoleId);
      if (!roleObj) {
        return res.status(400).json({ message: `Role with ID ${roleId} does not exist.` });
      }
      user.roleId = parsedRoleId;
    }

    if (status !== undefined) {
      const allowedStatuses = ['active', 'inactive'];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ message: `Status must be one of: ${allowedStatuses.join(', ')}.` });
      }
      user.status = status;
    }

    await user.save();

    const updatedUser = await User.findByPk(user.id, {
      include: [{ model: Role }],
      attributes: { exclude: ['password'] }
    });

    await logActivity(
      req,
      'USER_MODIFICATION',
      `Updated user ${user.username}. Role: ${updatedUser && updatedUser.Role ? updatedUser.Role.name : 'User'}, Status: ${updatedUser.status}.`
    );

    return res.json({
      message: 'User updated successfully.',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Delete user account
exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.username === 'admin') {
      return res.status(400).json({ message: 'Default Super Admin account cannot be deleted.' });
    }

    await user.destroy();

    await logActivity(
      req,
      'USER_DELETION',
      `Deleted user account: ${user.username}.`
    );

    return res.json({ message: 'User deleted successfully.' });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Get list of all roles
exports.getRoles = async (req, res) => {
  try {
    const roles = await Role.findAll();
    return res.json(roles);
  } catch (error) {
    console.error('Get roles error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};
