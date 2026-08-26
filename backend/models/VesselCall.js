const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const VesselCall = sequelize.define('VesselCall', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    field: 'allocation_id'
  },
  vcn: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  vesselName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  flag: {
    type: DataTypes.STRING,
    allowNull: false
  },
  vesselType: {
    type: DataTypes.STRING, // Bulk, Liquid, Container
    allowNull: false
  },
  eta: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'eta'
  },
  etd: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'etd'
  },
  actualArrival: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'actual_arrival'
  },
  actualDeparture: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'actual_departure'
  },
  berthSpecification: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'berth_number'
  },
  vesselProfileId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'vessel_id'
  },
  voyageNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  loa: {
    type: DataTypes.DOUBLE,
    allowNull: true
  },
  beam: {
    type: DataTypes.DOUBLE,
    allowNull: true
  },
  draft: {
    type: DataTypes.DOUBLE,
    allowNull: true
  },
  grt: {
    type: DataTypes.DOUBLE,
    allowNull: true
  },
  pilotageStatus: {
    type: DataTypes.STRING,
    defaultValue: 'Pending'
  },
  tugStatus: {
    type: DataTypes.STRING,
    defaultValue: 'Pending'
  },
  berthingStatus: {
    type: DataTypes.STRING,
    defaultValue: 'Pending'
  },
  bunkeringService: {
    type: DataTypes.STRING,
    defaultValue: 'Not Requested'
  },
  waterService: {
    type: DataTypes.STRING,
    defaultValue: 'Not Requested'
  },
  wasteService: {
    type: DataTypes.STRING,
    defaultValue: 'Not Requested'
  },
  status: {
    type: DataTypes.STRING, // PRE_ADVICE, BERTHED, SAILED
    defaultValue: 'PRE_ADVICE',
    field: 'status'
  },
  proformaDues: {
    type: DataTypes.DOUBLE,
    defaultValue: 0.0
  },
  phoClearance: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  immigrationClearance: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  customsClearance: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isDischargeAllowed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  vesselDuesSettled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'vessel_dues_settled'
  }
}, {
  timestamps: true,
  tableName: 'BerthAllocations',
  indexes: [
    {
      unique: false,
      fields: ['vcn', 'vesselName']
    }
  ]
});

module.exports = VesselCall;
