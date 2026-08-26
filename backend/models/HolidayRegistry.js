const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const HolidayRegistry = sequelize.define('HolidayRegistry', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  holidayDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    unique: true
  },
  category: {
    type: DataTypes.ENUM('Port Holiday', 'Customs Holiday', 'General Non-Working'),
    allowNull: false,
    defaultValue: 'Port Holiday'
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'HolidayRegistry'
});

module.exports = HolidayRegistry;
