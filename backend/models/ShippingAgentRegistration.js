const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ShippingAgentRegistration = sequelize.define('ShippingAgentRegistration', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    field: 'registration_uuid'
  },
  registrationId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Pending Verification' // Pending Verification, Approved, Rejected
  },
  rejectionRemarks: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Section 1: Company Profile Info
  companyName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  companyRegNo: {
    type: DataTypes.STRING,
    allowNull: true
  },
  companyType: {
    type: DataTypes.STRING,
    allowNull: true
  },
  panNumber: {
    type: DataTypes.STRING,
    allowNull: false
  },
  gstin: {
    type: DataTypes.STRING,
    allowNull: false
  },
  licenseNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  licenseExpiry: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  // Section 2: Authorized Representative
  representativeName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  representativeDesignation: {
    type: DataTypes.STRING,
    allowNull: false
  },
  representativeMobile: {
    type: DataTypes.STRING,
    allowNull: false
  },
  representativeEmail: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // Section 3: Registered Office Address
  addressLine1: {
    type: DataTypes.STRING,
    allowNull: true
  },
  addressLine2: {
    type: DataTypes.STRING,
    allowNull: true
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true
  },
  state: {
    type: DataTypes.STRING,
    allowNull: true
  },
  pinCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Section 4: Account Credentials
  username: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // Section 5: Mandatory Document Uploads
  docCompanyReg: {
    type: DataTypes.STRING,
    allowNull: true
  },
  docPan: {
    type: DataTypes.STRING,
    allowNull: true
  },
  docGst: {
    type: DataTypes.STRING,
    allowNull: true
  },
  docLicense: {
    type: DataTypes.STRING,
    allowNull: true
  },
  docAuthLetter: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Declaration Checkbox
  isCertified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true,
  tableName: 'shipping_agent_registrations'
});

module.exports = ShippingAgentRegistration;
