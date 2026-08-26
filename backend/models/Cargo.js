const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Cargo = sequelize.define('Cargo', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    field: 'cargo_id'
  },
  cargoId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  vesselId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'vessel_id'
  },
  manifestNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'manifest_number'
  },
  vesselName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  sealNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  volume: {
    type: DataTypes.DOUBLE,
    allowNull: true
  },
  shipper: {
    type: DataTypes.STRING,
    allowNull: true
  },
  notifyParty: {
    type: DataTypes.STRING,
    allowNull: true
  },
  cargoType: {
    type: DataTypes.STRING, // Container, Bulk, Liquid, Break Bulk
    allowNull: false,
    field: 'cargo_type'
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  weight: {
    type: DataTypes.DOUBLE, // Weight in metric tons
    allowNull: false,
    field: 'weight_mats'
  },
  hazmatClass: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'hazardous_class'
  },
  status: {
    type: DataTypes.STRING, // MANIFESTED, YARD_STAGED, CUSTOMS_HOLD, RELEASE_READY, GATE_OUT
    allowNull: false,
    defaultValue: 'MANIFESTED',
    field: 'current_status'
  },
  consignee: {
    type: DataTypes.STRING,
    allowNull: false
  },
  isDamaged: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  damageRemarks: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  unloadingEquipment: {
    type: DataTypes.STRING,
    allowNull: true
  },
  binCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  containerNo: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    field: 'identifier_code'
  },
  destination: {
    type: DataTypes.STRING,
    allowNull: true
  },
  entryTime: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW
  },
  dischargeCompletionDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  uomType: {
    type: DataTypes.ENUM('MTDA', 'CMDA', 'UTDA'),
    allowNull: false,
    defaultValue: 'MTDA'
  },
  uomQuantity: {
    type: DataTypes.DOUBLE,
    allowNull: true
  },
  isGovernmentDetained: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  governmentHoldReason: {
    type: DataTypes.STRING,
    allowNull: true
  },
  shutOutStatus: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  billOfLading: {
    type: DataTypes.STRING,
    allowNull: true
  },
  tradeType: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Import'
  },
  shippingBill: {
    type: DataTypes.STRING,
    allowNull: true
  },
  deliveryOrderNo: {
    type: DataTypes.STRING,
    allowNull: true
  },
  customsHoldStatus: {
    type: DataTypes.STRING,
    defaultValue: 'LOCKED' // LOCKED, RELEASED, SEIZED
  },
  financeClearanceStatus: {
    type: DataTypes.STRING,
    defaultValue: 'LOCKED' // LOCKED, RELEASED
  },
  oocRefNo: {
    type: DataTypes.STRING,
    allowNull: true
  },
  oocDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  digitalSignature: {
    type: DataTypes.STRING,
    allowNull: true
  },
  entryTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  exitTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cifValue: {
    type: DataTypes.DOUBLE,
    allowNull: true
  },
  fobValue: {
    type: DataTypes.DOUBLE,
    allowNull: true
  },
  coastalGoodsValue: {
    type: DataTypes.DOUBLE,
    allowNull: true
  },
  originType: {
    type: DataTypes.STRING,
    defaultValue: 'Foreign',
    allowNull: false
  },
  commodityType: {
    type: DataTypes.STRING,
    defaultValue: 'General',
    allowNull: false
  },
  containerLength: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  isUsdDenominated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  exchangeRate: {
    type: DataTypes.DOUBLE,
    allowNull: true
  },
  exchangeRateDate: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'CargoItems',
  indexes: [
    {
      unique: false,
      fields: ['billOfLading', 'vesselName']
    }
  ]
});

module.exports = Cargo;
