const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const DischargedInventoryLog = sequelize.define('DischargedInventoryLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  vcn: {
    type: DataTypes.STRING,
    allowNull: false
  },
  tallySheetId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  billOfLading: {
    type: DataTypes.STRING,
    allowNull: false
  },
  shiftId: {
    type: DataTypes.STRING,
    allowNull: false // e.g. "Shift 1", "Shift 2", "Shift 3" or "Shift A", "Shift B", "Shift C"
  },
  tallyClerkId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  actualUnloadedWeight: {
    type: DataTypes.DOUBLE,
    allowNull: false
  },
  dischargedCount: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  craneEquipmentId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  operatorId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  discrepancyType: {
    type: DataTypes.STRING,
    defaultValue: 'None'
  },
  soundnessCondition: {
    type: DataTypes.STRING,
    defaultValue: 'Sound'
  },
  timeDischargeStarted: {
    type: DataTypes.DATE,
    allowNull: true
  },
  timeDischargeCompleted: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cargoConditionRemarks: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'Discharged_Inventory_Logs'
});

module.exports = DischargedInventoryLog;
