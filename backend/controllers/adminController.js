const { sequelize, Cargo, Invoice, CustomsClearance, VesselCall, VesselProfile, StowagePlan, VesselFalDeclaration, DischargedInventoryLog } = require('../models');

// Controller to clear all operational data (for testing/reset purposes)
exports.clearAllData = async (req, res) => {
  try {
    // Disable FK constraints temporarily (PostgreSQL)
    await sequelize.query('SET session_replication_role = replica;');
    // Truncate tables related to shipping operations using actual model table names
    const tables = [
      Cargo.tableName,
      Invoice.tableName,
      CustomsClearance.tableName,
      VesselCall.tableName,
      VesselProfile.tableName,
      DischargedInventoryLog.tableName,
      StowagePlan ? StowagePlan.tableName : 'StowagePlans',
      VesselFalDeclaration ? VesselFalDeclaration.tableName : 'VesselFalDeclarations'
    ];
    for (const table of tables) {
      if (table) {
        await sequelize.query(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE;`);
      }
    }
    // Re‑enable constraints
    await sequelize.query('SET session_replication_role = origin;');
    return res.json({ message: 'All shipping data cleared.' });
  } catch (err) {
    console.error('Error clearing data:', err);
    return res.status(500).json({ message: 'Failed to clear data.' });
  }
};
