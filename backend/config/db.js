const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

const backendEnvPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath });
} else {
  dotenv.config();
}

// Exclusive PostgreSQL Connection
const sequelize = new Sequelize(
  process.env.DB_NAME || 'port_inventory',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

module.exports = sequelize;
