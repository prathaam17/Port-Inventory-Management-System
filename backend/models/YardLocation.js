const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const YardLocation = sequelize.define('YardLocation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  zoneCode: {
    type: DataTypes.STRING, // e.g. Zone-A, Bay-3, Rack-12
    allowNull: false
  },
  row: {
    type: DataTypes.STRING,
    allowNull: true
  },
  column: {
    type: DataTypes.STRING,
    allowNull: true
  },
  tier: {
    type: DataTypes.STRING,
    allowNull: true
  },
  slot: {
    type: DataTypes.STRING,
    allowNull: true
  },
  capacity: {
    type: DataTypes.DOUBLE,
    allowNull: false
  },
  occupiedSpace: {
    type: DataTypes.DOUBLE,
    defaultValue: 0.0
  }
}, {
  timestamps: true
});

module.exports = YardLocation;
