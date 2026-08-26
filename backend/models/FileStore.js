const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const FileStore = sequelize.define('FileStore', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    field: 'file_id'
  },
  filename: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  originalname: {
    type: DataTypes.STRING,
    allowNull: false
  },
  mimetype: {
    type: DataTypes.STRING,
    allowNull: false
  },
  size: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  data: {
    type: DataTypes.BLOB('long'), // PostgreSQL BYTEA binary column
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'FileStores'
});

module.exports = FileStore;
