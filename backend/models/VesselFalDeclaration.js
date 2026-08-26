const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const VesselFalDeclaration = sequelize.define('VesselFalDeclaration', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  vcn: {
    type: DataTypes.STRING,
    allowNull: false
  },
  formType: {
    type: DataTypes.STRING, // FAL1, FAL2, FAL3, FAL4, FAL5, FAL6, FAL7
    allowNull: false
  },
  formData: {
    type: DataTypes.TEXT, // Stringified JSON
    allowNull: false
  },
  status: {
    type: DataTypes.STRING, // Submitted, Approved
    defaultValue: 'Submitted'
  }
}, {
  timestamps: true
});

module.exports = VesselFalDeclaration;
