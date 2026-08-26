const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const CustomsClearance = sequelize.define('CustomsClearance', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    field: 'clearance_id'
  },
  cargoId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'cargo_id'
  },
  billOfEntryNo: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    field: 'bill_of_entry'
  },
  inspectionType: {
    type: DataTypes.STRING, // GREEN_CHANNEL, SCANNING, PHYSICAL_STRIP
    allowNull: true,
    defaultValue: 'GREEN_CHANNEL',
    field: 'inspection_type'
  },
  officerId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'customs_officer_id'
  },
  oocStatus: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'ooc_status'
  },
  clearanceTimestamp: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'clearance_timestamp'
  },
  documentUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  customsBrokerId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  inspectionReportId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  dateCleared: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING, // Pending, Approved, Rejected, On Hold
    defaultValue: 'Pending',
    allowNull: false
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  inspectionScheduledAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'CustomsClearances'
});

module.exports = CustomsClearance;
