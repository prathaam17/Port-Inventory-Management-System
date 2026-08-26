const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SorTariffRule = sequelize.define('SorTariffRule', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tradeType: {
    type: DataTypes.ENUM('Import', 'Export'),
    allowNull: false,
    defaultValue: 'Import'
  },
  freeDaysWorking: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 7
  },
  slab1Days: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 7
  },
  slab1Rate: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 5.050
  },
  slab2Days: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 7
  },
  slab2Rate: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 8.827
  },
  slab3Rate: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 12.614
  },
  uomDefault: {
    type: DataTypes.ENUM('MTDA', 'CMDA', 'UTDA'),
    allowNull: false,
    defaultValue: 'MTDA'
  },
  remarks: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

module.exports = SorTariffRule;
