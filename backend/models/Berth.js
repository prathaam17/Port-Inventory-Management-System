const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Berth = sequelize.define('Berth', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  number: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  draftLimit: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    defaultValue: 10.0
  },
  capacity: {
    type: DataTypes.DOUBLE,
    allowNull: true,
    defaultValue: 50000.0
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Available' // Available, Occupied, Under Maintenance
  }
}, {
  timestamps: true
});

module.exports = Berth;
