const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const StatementOfFact = sequelize.define('StatementOfFact', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  vcn: {
    type: DataTypes.STRING,
    allowNull: false
  },
  eventTimestamp: {
    type: DataTypes.DATE,
    allowNull: false
  },
  eventType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = StatementOfFact;
