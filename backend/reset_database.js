const fs = require('fs');
const path = require('path');
const { sequelize, User } = require('./models');
const seedDatabase = require('./seed');

async function resetAllData() {
  console.log('==================================================');
  console.log('  STARTING SYSTEM DATA PURGE & FACTORY RESET');
  console.log('==================================================\n');

  try {
    await sequelize.authenticate();
    console.log('1. Database connection verified.');

    // Disable foreign key checks for PostgreSQL session to perform clean truncate
    await sequelize.query('SET session_replication_role = replica;');

    // All transactional & operational tables to purge
    const transactionalTables = [
      'CargoItems',
      'YardInventory',
      'CustomsClearances',
      'Invoices',
      'Payments',
      'AuditLogs',
      'Notifications',
      'FileStores',
      'BerthAllocations',
      'Internal_Move_Logs',
      'Discharged_Inventory_Logs',
      'Inventory_Adjustment_Logs',
      'ContainerOperationLogs',
      'PDHolds',
      'ReeferLogs',
      'StatementOfFacts',
      'StowagePlans',
      'VesselFalDeclarations',
      'Vessels',
      'shipping_agent_registrations',
      // Python FastAPI tables if existing
      'bulk_cargo',
      'container_cargo',
      'yard_slots',
      'gate_passes',
      'vessel_calls',
      'audit_logs'
    ];

    console.log('2. Truncating transactional & operational tables...');
    for (const tbl of transactionalTables) {
      try {
        const [check] = await sequelize.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = '${tbl}'
        `);
        if (check.length > 0) {
          await sequelize.query(`TRUNCATE TABLE "${tbl}" RESTART IDENTITY CASCADE;`);
          console.log(`   ✓ Truncated table: "${tbl}"`);
        }
      } catch (err) {
        console.warn(`   ! Note on table ${tbl}: ${err.message}`);
      }
    }

    // Re-enable replication role
    await sequelize.query('SET session_replication_role = origin;');

    // 3. Clean up non-default user accounts
    console.log('\n3. Cleaning up custom user accounts...');
    const defaultUsernames = ['admin', 'ops', 'warehouse', 'customs', 'shipping', 'finance'];
    const [deletedUsers] = await sequelize.query(`
      DELETE FROM "Users" 
      WHERE username NOT IN (${defaultUsernames.map(u => `'${u}'`).join(', ')})
    `);
    console.log(`   ✓ Non-default users removed.`);

    // 4. Run master seeder to reset capacities, berths, roles, and default users
    console.log('\n4. Re-initializing master datasets & default accounts...');
    await seedDatabase();

    // 5. Clean disk uploads directory
    console.log('\n5. Cleaning uploads directory...');
    const uploadsDir = path.join(__dirname, 'uploads');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      for (const f of files) {
        if (f !== '.gitkeep') {
          fs.unlinkSync(path.join(uploadsDir, f));
          console.log(`   ✓ Removed upload file: ${f}`);
        }
      }
    }
    console.log('   ✓ Uploads storage clean.');

    // 6. Verification Summary
    console.log('\n==================================================');
    console.log('  VERIFICATION & HEALTH CHECK');
    console.log('==================================================');

    const [tableCounts] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    for (const t of tableCounts) {
      try {
        const [cnt] = await sequelize.query(`SELECT COUNT(*) as count FROM "${t.table_name}"`);
        console.log(`  • ${t.table_name.padEnd(30)}: ${cnt[0].count} records`);
      } catch (e) {
        // ignore
      }
    }

    console.log('\n✓ System successfully restored to fresh "newly built" state!');
    console.log('==================================================\n');

  } catch (error) {
    console.error('Fatal error during reset:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

resetAllData();
