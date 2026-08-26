const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    field: 'user_id'
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'active' // active, inactive
  },
  department: {
    type: DataTypes.STRING,
    allowNull: true
  },
  pdaBalance: {
    type: DataTypes.DOUBLE,
    defaultValue: 0.0
  }
}, {
  timestamps: true
});

module.exports = User;
