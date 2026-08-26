const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const InventoryAdjustmentLog = sequelize.define('InventoryAdjustmentLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  dischargedInventoryLogId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  adjustedWeight: {
    type: DataTypes.DOUBLE,
    allowNull: false
  },
  adjustedCount: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  authorizedBySupervisorId: {
    type: DataTypes.UUID,
    allowNull: false
  }
}, {
  timestamps: true,
  tableName: 'Inventory_Adjustment_Logs'
});

module.exports = InventoryAdjustmentLog;
