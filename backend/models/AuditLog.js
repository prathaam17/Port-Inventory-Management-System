const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false
  },
  affectedTable: {
    type: DataTypes.STRING,
    allowNull: true
  },
  details: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  updatedAt: false // Audit logs only record creation, no updates needed
});

module.exports = AuditLog;
