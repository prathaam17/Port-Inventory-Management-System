const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const StowagePlan = sequelize.define('StowagePlan', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  vcn: {
    type: DataTypes.STRING,
    allowNull: false
  },
  containerNo: {
    type: DataTypes.STRING,
    allowNull: false
  },
  billOfLading: {
    type: DataTypes.STRING,
    allowNull: false
  },
  bay: {
    type: DataTypes.STRING, // e.g. '01', '03'
    allowNull: false
  },
  row: {
    type: DataTypes.STRING, // e.g. '02', '04'
    allowNull: false
  },
  tier: {
    type: DataTypes.STRING, // e.g. '02', '04'
    allowNull: false
  },
  hazmatClass: {
    type: DataTypes.STRING,
    defaultValue: 'None'
  },
  weight: {
    type: DataTypes.DOUBLE,
    allowNull: false
  },
  discharged: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  dischargeTime: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = StowagePlan;
