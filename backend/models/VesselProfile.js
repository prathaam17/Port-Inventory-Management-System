const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const VesselProfile = sequelize.define('VesselProfile', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    field: 'vessel_id'
  },
  imoNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: 'imo_number'
  },
  vesselName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'vessel_name'
  },
  flag: {
    type: DataTypes.STRING,
    allowNull: false
  },
  vesselType: {
    type: DataTypes.STRING, // Container, Bulk, Liquid
    allowNull: false,
    field: 'vessel_type'
  },
  callSign: {
    type: DataTypes.STRING,
    allowNull: false
  },
  grossTonnage: {
    type: DataTypes.DOUBLE,
    defaultValue: 0.0
  },
  netTonnage: {
    type: DataTypes.DOUBLE,
    defaultValue: 0.0
  },
  lengthOverall: {
    type: DataTypes.DOUBLE,
    defaultValue: 0.0,
    field: 'loa'
  },
  beam: {
    type: DataTypes.DOUBLE,
    defaultValue: 0.0
  },
  draft: {
    type: DataTypes.DOUBLE,
    defaultValue: 0.0,
    field: 'max_draft'
  },
  ownerOperator: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  timestamps: true,
  tableName: 'Vessels'
});

module.exports = VesselProfile;
