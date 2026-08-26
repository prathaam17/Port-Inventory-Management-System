const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ReeferLog = sequelize.define('ReeferLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  containerNo: {
    type: DataTypes.STRING,
    allowNull: false
  },
  temperatureCelsius: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  humidityPercent: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  powerStatus: {
    type: DataTypes.ENUM('Plugged', 'Unplugged'),
    defaultValue: 'Plugged'
  },
  remarks: {
    type: DataTypes.STRING,
    allowNull: true
  },
  loggedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true
});

module.exports = ReeferLog;
