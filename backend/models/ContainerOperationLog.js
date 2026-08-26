const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ContainerOperationLog = sequelize.define('ContainerOperationLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  cargoId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  operationType: {
    type: DataTypes.STRING, // STUFFING, DE_STUFFING
    allowNull: false
  },
  containerNo: {
    type: DataTypes.STRING,
    allowNull: false
  },
  weight: {
    type: DataTypes.DOUBLE,
    allowNull: false
  },
  warehouseId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  loggedBy: {
    type: DataTypes.UUID,
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = ContainerOperationLog;
