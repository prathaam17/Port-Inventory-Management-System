const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const InternalMoveLog = sequelize.define('InternalMoveLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  moveTicketId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  forkliftStackerId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  transferredWeight: {
    type: DataTypes.DOUBLE,
    allowNull: false
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true,
  tableName: 'Internal_Move_Logs'
});

module.exports = InternalMoveLog;
