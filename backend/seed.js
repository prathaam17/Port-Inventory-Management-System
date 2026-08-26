const bcrypt = require('bcryptjs');
const { 
  sequelize, 
  Role, 
  User, 
  Warehouse, 
  YardLocation, 
  Berth, 
  ContainerType, 
  SorTariffRule, 
  HolidayRegistry 
} = require('./models');

const seedDatabase = async () => {
  try {
    await sequelize.sync();
    console.log('Seeding Master Data, Roles, and System Users...');

    // 1. Roles
    const rolesData = [
      { name: 'Super Admin', description: 'Full system control and user administration' },
      { name: 'Port Operations Officer', description: 'Berth and vessel traffic ops' },
      { name: 'Warehouse Manager', description: 'Yard and transit shed storage' },
      { name: 'Customs Officer', description: 'Regulatory document inspection and holds' },
      { name: 'Shipping Agent', description: 'Manifest filing, delivery orders, and PDA' },
      { name: 'Finance', description: 'Tariff billing, invoices, and ledger' },
      { name: 'Management', description: 'Executive port performance analytics' }
    ];

    const createdRoles = {};
    for (const rData of rolesData) {
      const [role] = await Role.findOrCreate({
        where: { name: rData.name },
        defaults: rData
      });
      createdRoles[rData.name] = role;
    }

    // 2. Default System Users
    const hashedPassword = await bcrypt.hash('password123', 10);

    const usersData = [
      { 
        username: 'admin', 
        email: 'admin@mngprt.gov.in', 
        password: hashedPassword, 
        roleId: createdRoles['Super Admin'].id, 
        status: 'active', 
        pdaBalance: 0.00 
      },
      { 
        username: 'ops', 
        email: 'ops@mngprt.gov.in', 
        password: hashedPassword, 
        roleId: createdRoles['Port Operations Officer'].id, 
        status: 'active', 
        pdaBalance: 0.00 
      },
      { 
        username: 'warehouse', 
        email: 'warehouse@mngprt.gov.in', 
        password: hashedPassword, 
        roleId: createdRoles['Warehouse Manager'].id, 
        status: 'active', 
        pdaBalance: 0.00 
      },
      { 
        username: 'customs', 
        email: 'customs@icegate.gov.in', 
        password: hashedPassword, 
        roleId: createdRoles['Customs Officer'].id, 
        status: 'active', 
        pdaBalance: 0.00 
      },
      { 
        username: 'shipping', 
        email: 'agent@ssl-lines.com', 
        password: hashedPassword, 
        roleId: createdRoles['Shipping Agent'].id, 
        status: 'active', 
        pdaBalance: 250000.00 
      },
      { 
        username: 'finance', 
        email: 'finance@mngprt.gov.in', 
        password: hashedPassword, 
        roleId: createdRoles['Finance'].id, 
        status: 'active', 
        pdaBalance: 0.00 
      }
    ];

    for (const uData of usersData) {
      const existingUser = await User.findOne({ where: { username: uData.username } });
      if (existingUser) {
        await existingUser.update(uData);
      } else {
        await User.create(uData);
      }
    }

    // 3. Berths (17 Port Berths)
    const berthsData = [
      { id: 1, number: 'Berth No. 1 (B1) - General Cargo / Coastal', draftLimit: 7.0, capacity: 30000.0, status: 'Available' },
      { id: 2, number: 'Berth No. 2 (B2) - General Cargo / Break Bulk', draftLimit: 10.5, capacity: 45000.0, status: 'Available' },
      { id: 3, number: 'Berth No. 3 (B3) - General Cargo / Multi-Purpose', draftLimit: 10.3, capacity: 45000.0, status: 'Available' },
      { id: 4, number: 'Berth No. 4 (B4) - Liq. Ammonia / Phosphoric Acid', draftLimit: 9.5, capacity: 40000.0, status: 'Available' },
      { id: 5, number: 'Berth No. 5 (B5) - Bulk Cement / Edible Oil', draftLimit: 9.5, capacity: 40000.0, status: 'Available' },
      { id: 6, number: 'Berth No. 6 (B6) - General Cargo / Coastal Quay', draftLimit: 9.5, capacity: 40000.0, status: 'Available' },
      { id: 7, number: 'Berth No. 7 (B7) - General Cargo / Multi-Purpose', draftLimit: 9.5, capacity: 40000.0, status: 'Available' },
      { id: 8, number: 'Berth No. 8 (B8) - Iron Ore & Coal (KIOCL Jetty)', draftLimit: 12.5, capacity: 65000.0, status: 'Available' },
      { id: 9, number: 'Berth No. 9 (B9) - LPG & Chemical Jetty', draftLimit: 10.5, capacity: 50000.0, status: 'Available' },
      { id: 10, number: 'Berth No. 10 (B10) - POL Jetty 1 (Crude & Products)', draftLimit: 14.0, capacity: 85000.0, status: 'Available' },
      { id: 11, number: 'Berth No. 11 (B11) - POL Jetty 2 (POL & Chemicals)', draftLimit: 14.0, capacity: 85000.0, status: 'Available' },
      { id: 12, number: 'Berth No. 12 (B12) - POL / LPG / Edible Oil', draftLimit: 12.5, capacity: 70000.0, status: 'Available' },
      { id: 13, number: 'Berth No. 13 (B13) - POL Jetty 3 (Heavy POL)', draftLimit: 14.0, capacity: 90000.0, status: 'Available' },
      { id: 14, number: 'Berth No. 14 (B14) - JSD Container Terminal', draftLimit: 14.0, capacity: 120000.0, status: 'Available' },
      { id: 15, number: 'Berth No. 15 (B15) - UPCL Bulk Coal Handling', draftLimit: 14.0, capacity: 100000.0, status: 'Available' },
      { id: 16, number: 'Berth No. 16 (B16) - Chettinad Mechanized Coal', draftLimit: 14.0, capacity: 110000.0, status: 'Available' },
      { id: 17, number: 'SPM (Single Point Mooring) - Offshore VLCC Crude', draftLimit: 21.0, capacity: 300000.0, status: 'Available' }
    ];

    for (const bData of berthsData) {
      const [berth] = await Berth.findOrCreate({
        where: { number: bData.number },
        defaults: bData
      });
      await berth.update({ status: 'Available', draftLimit: bData.draftLimit, capacity: bData.capacity });
    }

    // 4. Warehouses & Storage Yards (All at 0% Occupancy)
    const warehousesData = [
      { id: 1, name: 'Wharf Transit Shed No. 1', type: 'Transit Shed', capacity: 15000.0, occupiedSpace: 0.0, availableSpace: 15000.0 },
      { id: 2, name: 'Wharf Transit Shed No. 2 (Overflow Shed)', type: 'Transit Shed', capacity: 12000.0, occupiedSpace: 0.0, availableSpace: 12000.0 },
      { id: 3, name: 'Covered Godown Complex (Godowns 29-34)', type: 'Covered Warehouse', capacity: 40000.0, occupiedSpace: 0.0, availableSpace: 40000.0 },
      { id: 4, name: 'JSD Container Stackyard & Backup Area (Berth 14)', type: 'Container Yard', capacity: 105000.0, occupiedSpace: 0.0, availableSpace: 105000.0 },
      { id: 5, name: 'Open Coal & Minerals Stackyard (Chettinad/UPCL)', type: 'Open Yard', capacity: 150000.0, occupiedSpace: 0.0, availableSpace: 150000.0 },
      { id: 6, name: 'Multi-Cargo Open Storage Yard (SJ Gate & Wharf)', type: 'Open Yard', capacity: 60000.0, occupiedSpace: 0.0, availableSpace: 60000.0 },
      { id: 7, name: 'MNGPRT Coastal Liquid POL & Chemical Tank Farm', type: 'Liquid Tank Farm', capacity: 120000.0, occupiedSpace: 0.0, availableSpace: 120000.0 },
      { id: 8, name: 'Reefer & Cold Chain Storage Complex', type: 'Cold Storage', capacity: 10000.0, occupiedSpace: 0.0, availableSpace: 10000.0 }
    ];

    const createdWarehouses = {};
    for (const wData of warehousesData) {
      const [wh] = await Warehouse.findOrCreate({
        where: { name: wData.name },
        defaults: wData
      });
      await wh.update({ occupiedSpace: 0.0, availableSpace: wData.capacity, capacity: wData.capacity, type: wData.type });
      createdWarehouses[wData.name] = wh;
    }

    // 5. Yard Locations (21 Coordinates, all 0 Occupancy)
    const yardLocationsData = [
      { warehouseId: createdWarehouses['Wharf Transit Shed No. 1'].id, zoneCode: 'TS1-SEC-A', capacity: 5000.0, occupiedSpace: 0.0 },
      { warehouseId: createdWarehouses['Wharf Transit Shed No. 1'].id, zoneCode: 'TS1-SEC-B', capacity: 5000.0, occupiedSpace: 0.0 },
      { warehouseId: createdWarehouses['Wharf Transit Shed No. 1'].id, zoneCode: 'TS1-SEC-C', capacity: 5000.0, occupiedSpace: 0.0 },
      { warehouseId: createdWarehouses['Wharf Transit Shed No. 2 (Overflow Shed)'].id, zoneCode: 'TS2-SEC-A', capacity: 6000.0, occupiedSpace: 0.0 },
      { warehouseId: createdWarehouses['Wharf Transit Shed No. 2 (Overflow Shed)'].id, zoneCode: 'TS2-SEC-B', capacity: 6000.0, occupiedSpace: 0.0 },
      { warehouseId: createdWarehouses['Covered Godown Complex (Godowns 29-34)'].id, zoneCode: 'GDN-29-30', capacity: 10000.0, occupiedSpace: 0.0 },
      { warehouseId: createdWarehouses['Covered Godown Complex (Godowns 29-34)'].id, zoneCode: 'GDN-31-32', capacity: 15000.0, occupiedSpace: 0.0 },
      { warehouseId: createdWarehouses['Covered Godown Complex (Godowns 29-34)'].id, zoneCode: 'GDN-33-34', capacity: 15000.0, occupiedSpace: 0.0 },
      { warehouseId: createdWarehouses['JSD Container Stackyard & Backup Area (Berth 14)'].id, zoneCode: 'CY-GRID-01', capacity: 35000.0, occupiedSpace: 0.0 },
      { warehouseId: createdWarehouses['JSD Container Stackyard & Backup Area (Berth 14)'].id, zoneCode: 'CY-GRID-02', capacity: 35000.0, occupiedSpace: 0.0 },
      { warehouseId: createdWarehouses['JSD Container Stackyard & Backup Area (Berth 14)'].id, zoneCode: 'CY-REEFER-R1', capacity: 15000.0, occupiedSpace: 0.0 },
      { warehouseId: createdWarehouses['JSD Container Stackyard & Backup Area (Berth 14)'].id, zoneCode: 'CY-EMPTY-E1', capacity: 20000.0, occupiedSpace: 0.0 },
      { warehouseId: createdWarehouses['Open Coal & Minerals Stackyard (Chettinad/UPCL)'].id, zoneCode: 'COAL-STACK-A', capacity: 75000.0, occupiedSpace: 0.0 },
      { warehouseId: createdWarehouses['Open Coal & Minerals Stackyard (Chettinad/UPCL)'].id, zoneCode: 'COAL-STACK-B', capacity: 75000.0, occupiedSpace: 0.0 },
      { warehouseId: createdWarehouses['Multi-Cargo Open Storage Yard (SJ Gate & Wharf)'].id, zoneCode: 'PLOT-ALPHA', capacity: 30000.0, occupiedSpace: 0.0 },
      { warehouseId: createdWarehouses['Multi-Cargo Open Storage Yard (SJ Gate & Wharf)'].id, zoneCode: 'PLOT-BETA', capacity: 30000.0, occupiedSpace: 0.0 },
      { warehouseId: createdWarehouses['MNGPRT Coastal Liquid POL & Chemical Tank Farm'].id, zoneCode: 'TANK-POL-T1', capacity: 40000.0, occupiedSpace: 0.0 },
      { warehouseId: createdWarehouses['MNGPRT Coastal Liquid POL & Chemical Tank Farm'].id, zoneCode: 'TANK-LPG-T2', capacity: 40000.0, occupiedSpace: 0.0 },
      { warehouseId: createdWarehouses['MNGPRT Coastal Liquid POL & Chemical Tank Farm'].id, zoneCode: 'TANK-CHEM-T3', capacity: 40000.0, occupiedSpace: 0.0 },
      { warehouseId: createdWarehouses['Reefer & Cold Chain Storage Complex'].id, zoneCode: 'REEFER-ZONE-01', capacity: 5000.0, occupiedSpace: 0.0 },
      { warehouseId: createdWarehouses['Reefer & Cold Chain Storage Complex'].id, zoneCode: 'REEFER-ZONE-02', capacity: 5000.0, occupiedSpace: 0.0 }
    ];

    for (const locData of yardLocationsData) {
      const [loc] = await YardLocation.findOrCreate({
        where: { warehouseId: locData.warehouseId, zoneCode: locData.zoneCode },
        defaults: locData
      });
      await loc.update({ occupiedSpace: 0.0, capacity: locData.capacity });
    }

    // 6. Container Types
    const containerTypesData = [
      { name: '20ft Standard Dry Container (20DV)', length: 20.0, height: 8.5, width: 8.0, maxWeight: 24.0 },
      { name: '40ft High Cube Container (40HC)', length: 40.0, height: 9.5, width: 8.0, maxWeight: 30.5 },
      { name: '40ft Refrigerated Container (40RF)', length: 40.0, height: 9.5, width: 8.0, maxWeight: 29.0 },
      { name: '20ft Open Top Container (20OT)', length: 20.0, height: 8.5, width: 8.0, maxWeight: 28.0 },
      { name: '40ft Flat Rack Container (40FR)', length: 40.0, height: 8.5, width: 8.0, maxWeight: 45.0 },
      { name: '20ft ISO Tank Container (20TK)', length: 20.0, height: 8.5, width: 8.0, maxWeight: 32.0 }
    ];

    for (const ctData of containerTypesData) {
      await ContainerType.findOrCreate({
        where: { name: ctData.name },
        defaults: ctData
      });
    }

    // 7. SOR Tariff Rules
    const sorRulesData = [
      {
        tradeType: 'Import',
        freeDaysWorking: 7,
        slab1Days: 7,
        slab1Rate: 5.05,
        slab2Days: 7,
        slab2Rate: 8.827,
        slab3Rate: 12.614,
        uomDefault: 'MTDA',
        remarks: 'MNGPRT Import SOR: 7 free working days. Days 1-7: ₹5.050, Days 8-14: ₹8.827, Day 15+: ₹12.614'
      },
      {
        cargoCategory: 'Export',
        tradeType: 'Foreign',
        freeDays: 21,
        tier1Days: 0,
        tier1Rate: 0.0,
        tier2Days: 0,
        tier2Rate: 0.0,
        tier3Rate: 5.050,
        demurrageMethod: 'TIERED',
        effectiveDate: new Date('2025-01-01'),
        remarks: 'MNGPRT Export SOR: 21 free working days. ₹5.050 per MTDA thereafter.'
      }
    ];

    for (const sData of sorRulesData) {
      await SorTariffRule.findOrCreate({
        where: { tradeType: sData.tradeType },
        defaults: sData
      });
    }

    // 8. Port Holidays
    const holidaysData = [
      { holidayDate: '2026-01-26', category: 'General Non-Working', description: 'Republic Day' },
      { holidayDate: '2026-05-01', category: 'Port Holiday', description: 'May Day / Labor Day' },
      { holidayDate: '2026-08-15', category: 'General Non-Working', description: 'Independence Day' },
      { holidayDate: '2026-10-02', category: 'Customs Holiday', description: 'Gandhi Jayanti' },
      { holidayDate: '2026-11-01', category: 'Port Holiday', description: 'Karnataka Rajyotsava' },
      { holidayDate: '2026-12-25', category: 'General Non-Working', description: 'Christmas Day' }
    ];

    for (const hData of holidaysData) {
      await HolidayRegistry.findOrCreate({
        where: { holidayDate: hData.holidayDate },
        defaults: hData
      });
    }

    console.log('✓ Master data, system roles, and seed users initialized cleanly.');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

if (require.main === module) {
  seedDatabase().then(() => {
    console.log('Seeding process finished.');
    process.exit(0);
  });
}

module.exports = seedDatabase;
