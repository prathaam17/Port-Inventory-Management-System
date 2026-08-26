const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Inventory = sequelize.define('Inventory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    field: 'inventory_id'
  },
  cargoId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'cargo_id'
  },
  storageType: {
    type: DataTypes.STRING, // OPEN_YARD, COVERED_WAREHOUSE, COLD_STORAGE
    allowNull: true,
    field: 'storage_type'
  },
  zoneBlock: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'zone_block'
  },
  rowNum: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'row_num'
  },
  colNum: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'col_num'
  },
  tierNum: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'tier_num'
  },
  entryTimestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'entry_timestamp'
  },
  exitTimestamp: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'exit_timestamp'
  },
  ledgerId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  storageDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  hazmatClass: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'None'
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  weight: {
    type: DataTypes.DOUBLE,
    allowNull: false
  },
  lastMovedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true,
  tableName: 'YardInventory'
});

module.exports = Inventory;
