const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PDHold = sequelize.define('PDHold', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  agentId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  cargoId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  holdAmount: {
    type: DataTypes.DOUBLE,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING, // ACTIVE, RELEASED, SETTLED
    defaultValue: 'ACTIVE',
    allowNull: false
  }
}, {
  timestamps: true,
  tableName: 'PDHolds'
});

module.exports = PDHold;
