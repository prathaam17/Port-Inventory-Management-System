const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Invoice = sequelize.define('Invoice', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    field: 'invoice_id'
  },
  cargoId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'cargo_id'
  },
  agentId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'agent_id'
  },
  wharfageFee: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    defaultValue: 0.0,
    field: 'wharfage_charges'
  },
  handlingFee: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    defaultValue: 0.0,
    field: 'handling_charges'
  },
  demurrageFee: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    defaultValue: 0.0,
    field: 'demurrage_charges'
  },
  totalAmount: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    defaultValue: 0.0,
    field: 'total_amount'
  },
  status: {
    type: DataTypes.STRING, // UNPAID, PENDING_VERIFICATION, PAID
    defaultValue: 'UNPAID',
    allowNull: false,
    field: 'payment_status'
  },
  paidAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'paid_at'
  },
  invoiceNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  storageFee: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    defaultValue: 0.0
  },
  penaltyFee: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    defaultValue: 0.0
  },
  cgst: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    defaultValue: 0.0
  },
  sgst: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    defaultValue: 0.0
  },
  igst: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    defaultValue: 0.0
  },
  penaltyInterest: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    defaultValue: 0.0
  },
  daysOverstay: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  roundedGrandTotal: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  payerAgentId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  issuedDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  timestamps: true,
  tableName: 'Invoices'
});

module.exports = Invoice;
