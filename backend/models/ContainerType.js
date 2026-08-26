const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ContainerType = sequelize.define('ContainerType', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  length: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    defaultValue: 20.0
  },
  height: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    defaultValue: 8.5
  },
  width: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    defaultValue: 8.0
  },
  maxWeight: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    defaultValue: 24.0
  }
}, {
  timestamps: true
});

module.exports = ContainerType;
