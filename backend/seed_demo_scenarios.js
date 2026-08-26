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
  HolidayRegistry,
  Cargo,
  Inventory,
  CustomsClearance,
  Invoice,
  Payment,
  AuditLog,
  Notification,
  VesselCall,
  VesselProfile,
  VesselFalDeclaration,
  StowagePlan,
  StatementOfFact,
  DischargedInventoryLog,
  InternalMoveLog,
  ContainerOperationLog,
  ReeferLog,
  PDHold,
  ShippingAgentRegistration,
  FileStore
} = require('./models');
const seedDatabase = require('./seed');

// PDF binary generator helper for mock documents
const makePdfBuffer = (docTitle, docRef, details) => {
  const dateStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const streamData = `BT
/F1 18 Tf
50 720 Td
(PORT INVENTORY MANAGEMENT SYSTEM) Tj
/F2 10 Tf
0 -18 Td
(Government of India Autonomous Port Trust - Panambur, Mangaluru, Karnataka 575010) Tj
0 -12 Td
(Digital Seaport Operations Document & Official Cargo Record) Tj
0 -30 Td
/F1 13 Tf
(DOCUMENT CERTIFICATE: ${docTitle.toUpperCase()}) Tj
/F2 10 Tf
0 -22 Td
(File Reference: ${docRef}) Tj
0 -16 Td
(System Verification Status: DIGITALLY VERIFIED & APPROVED) Tj
0 -16 Td
(Timestamp: ${dateStr}) Tj
0 -16 Td
(Summary: ${details}) Tj
0 -35 Td
/F1 10 Tf
(*** OFFICIAL ELECTRONIC DOCUMENT - CERTIFIED SECURE PORT RECORD ***) Tj
ET`;

  const streamLen = Buffer.byteLength(streamData);
  const pdfBody = `%PDF-1.4
1 0 obj
<< /Title (${docTitle}) /Author (Port Inventory Management System) /Creator (Port Inventory Management System) >>
endobj
2 0 obj
<< /Type /Catalog /Pages 3 0 R >>
endobj
3 0 obj
<< /Type /Pages /Kids [4 0 R] /Count 1 >>
endobj
4 0 obj
<< /Type /Page /Parent 3 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 7 0 R >>
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>
endobj
6 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
7 0 obj
<< /Length ${streamLen} >>
stream
${streamData}
endstream
endobj
xref
0 8
0000000000 65535 f 
0000000009 00000 n 
0000000115 00000 n 
0000000164 00000 n 
0000000223 00000 n 
0000000350 00000 n 
0000000424 00000 n 
0000000493 00000 n 
trailer
<< /Size 8 /Root 2 0 R /Info 1 0 R >>
startxref
${493 + streamLen + 50}
%%EOF`;

  return Buffer.from(pdfBody);
};

async function seedComprehensiveDemoData() {
  console.log('==================================================');
  console.log('  SEEDING COMPREHENSIVE PRESENTATION DEMO DATA');
  console.log('==================================================\n');

  try {
    await sequelize.authenticate();
    console.log('1. Database connected.');

    // Clean transactional tables before re-seeding for idempotency
    await sequelize.query('SET session_replication_role = replica;');
    const tablesToClean = [
      'CargoItems', 'YardInventory', 'CustomsClearances', 'Invoices', 'Payments',
      'AuditLogs', 'Notifications', 'FileStores', 'BerthAllocations', 'Internal_Move_Logs',
      'Discharged_Inventory_Logs', 'Inventory_Adjustment_Logs', 'ContainerOperationLogs',
      'PDHolds', 'ReeferLogs', 'StatementOfFacts', 'StowagePlans', 'VesselFalDeclarations',
      'Vessels', 'shipping_agent_registrations'
    ];
    for (const tbl of tablesToClean) {
      try {
        await sequelize.query(`TRUNCATE TABLE "${tbl}" RESTART IDENTITY CASCADE;`);
      } catch (e) { /* ignore */ }
    }
    await sequelize.query('SET session_replication_role = origin;');

    // Ensure Master Data & Roles are initialized
    await seedDatabase();

    // Fetch existing users and warehouses
    const adminUser = await User.findOne({ where: { username: 'admin' } });
    const opsUser = await User.findOne({ where: { username: 'ops' } });
    const warehouseUser = await User.findOne({ where: { username: 'warehouse' } });
    const customsUser = await User.findOne({ where: { username: 'customs' } });
    const shippingUser = await User.findOne({ where: { username: 'shipping' } });
    const financeUser = await User.findOne({ where: { username: 'finance' } });

    const warehouses = await Warehouse.findAll();
    const whMap = {};
    warehouses.forEach(w => { whMap[w.name] = w; });

    const yardLocations = await YardLocation.findAll();
    const locMap = {};
    yardLocations.forEach(l => { locMap[l.zoneCode] = l; });

    // ----------------------------------------------------
    // MODULE 1: SHIPPING AGENT REGISTRATIONS (3 Scenarios)
    // ----------------------------------------------------
    console.log('2. Seeding Shipping Agent Registrations (Pending, Approved, Rejected)...');
    
    // Hash password for registered accounts
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Scenario 1: PENDING Verification (Waiting for admin review)
    await ShippingAgentRegistration.findOrCreate({
      where: { registrationId: 'REG-2026-8801' },
      defaults: {
        registrationId: 'REG-2026-8801',
        status: 'Pending Verification',
        rejectionRemarks: null,
        companyName: 'Apex Ocean Carriers & Logistics India Ltd',
        companyRegNo: 'U63090KA2021PTC145620',
        companyType: 'Private Limited',
        panNumber: 'AAACA8899K',
        gstin: '29AAACA8899K1Z5',
        licenseNumber: 'MNGPRT-CHA-2026-094',
        licenseExpiry: '2028-12-31',
        representativeName: 'Capt. Vikramaditya Nair',
        representativeDesignation: 'Managing Director & Principal Broker',
        representativeMobile: '+91 98450 12345',
        representativeEmail: 'vikram.nair@apex-ocean.in',
        addressLine1: 'Harbor Gate Tower, 4th Floor, Marine Drive',
        city: 'Mangaluru',
        state: 'Karnataka',
        pinCode: '575001',
        username: 'apex_shipping',
        email: 'ops@apex-ocean.in',
        password: hashedPassword,
        docCompanyReg: 'reg_apex_certificate.pdf',
        docPan: 'pan_apex_card.pdf',
        docGst: 'gst_apex_reg.pdf',
        docLicense: 'license_customs_broker.pdf',
        docAuthLetter: 'board_resolution_auth.pdf',
        isCertified: true
      }
    });

    // Scenario 2: APPROVED Registration
    await ShippingAgentRegistration.findOrCreate({
      where: { registrationId: 'REG-2026-8802' },
      defaults: {
        registrationId: 'REG-2026-8802',
        status: 'Approved',
        rejectionRemarks: null,
        companyName: 'South India Maritime Agencies Pvt Ltd',
        companyRegNo: 'U74120KA2018PTC112345',
        companyType: 'Private Limited',
        panNumber: 'AABCS5544J',
        gstin: '29AABCS5544J1Z8',
        licenseNumber: 'MNGPRT-CHA-2024-031',
        licenseExpiry: '2027-06-30',
        representativeName: 'Rajeshwari Rao',
        representativeDesignation: 'Chief Logistics Officer',
        representativeMobile: '+91 94481 98765',
        representativeEmail: 'rajeshwari@simaritime.com',
        addressLine1: 'Port View Commercial Center, Panambur',
        city: 'Mangaluru',
        state: 'Karnataka',
        pinCode: '575010',
        username: 'south_india_maritime',
        email: 'agency@simaritime.com',
        password: hashedPassword,
        docCompanyReg: 'reg_sim_cert.pdf',
        docPan: 'pan_sim_card.pdf',
        docGst: 'gst_sim_cert.pdf',
        docLicense: 'license_sim_nmpa.pdf',
        docAuthLetter: 'auth_letter_sim.pdf',
        isCertified: true
      }
    });

    // Scenario 3: REJECTED Registration (Shows rejection remarks / compliance audit)
    await ShippingAgentRegistration.findOrCreate({
      where: { registrationId: 'REG-2026-8803' },
      defaults: {
        registrationId: 'REG-2026-8803',
        status: 'Rejected',
        rejectionRemarks: 'Customs Broker License expired on 31-Dec-2025 and GSTIN mismatch with ICEGATE master registry. KYC rejected per MNGPRT Port Reg. 4(B).',
        companyName: 'Blue Wave Coastal Transporters & Forwarders',
        companyRegNo: 'U60200KL2020PTC063211',
        companyType: 'Partnership Firm',
        panNumber: 'AACFB3322D',
        gstin: '32AACFB3322D1Z2',
        licenseNumber: 'MNGPRT-CHA-2021-012',
        licenseExpiry: '2025-12-31',
        representativeName: 'Arun Kurup',
        representativeDesignation: 'Partner',
        representativeMobile: '+91 97460 54321',
        representativeEmail: 'arun@bluewavelogistics.co.in',
        addressLine1: 'Wharf Road, Bunder',
        city: 'Mangaluru',
        state: 'Karnataka',
        pinCode: '575001',
        username: 'bluewave_ops',
        email: 'contact@bluewavelogistics.co.in',
        password: hashedPassword,
        docCompanyReg: 'reg_bluewave.pdf',
        docPan: 'pan_bluewave.pdf',
        docGst: 'gst_bluewave.pdf',
        docLicense: 'license_expired_doc.pdf',
        docAuthLetter: 'partner_auth.pdf',
        isCertified: true
      }
    });

    // ----------------------------------------------------
    // MODULE 2: VESSEL PROFILES & CALLS (5 Scenarios)
    // ----------------------------------------------------
    console.log('3. Seeding Vessels, Berthing, and Maritime Calls...');

    // Vessel Profile 1: Container Vessel
    const [vpVoyager] = await VesselProfile.findOrCreate({
      where: { imoNumber: 'IMO9812345' },
      defaults: {
        imoNumber: 'IMO9812345',
        vesselName: 'MV Ocean Voyager',
        flag: 'Panama',
        vesselType: 'Container',
        callSign: '3EBC9',
        grossTonnage: 42500,
        netTonnage: 23800,
        lengthOverall: 260.5,
        beam: 32.2,
        draft: 12.8,
        ownerOperator: 'Maersk Line / Ocean Network Express',
        userId: shippingUser.id
      }
    });

    // Vessel Profile 2: Bulk Carrier
    const [vpPioneer] = await VesselProfile.findOrCreate({
      where: { imoNumber: 'IMO9745612' },
      defaults: {
        imoNumber: 'IMO9745612',
        vesselName: 'MV Mangalore Pioneer',
        flag: 'India',
        vesselType: 'Bulk',
        callSign: 'AWXY4',
        grossTonnage: 58000,
        netTonnage: 34500,
        lengthOverall: 225.0,
        beam: 32.26,
        draft: 13.5,
        ownerOperator: 'Great Eastern Shipping Ltd',
        userId: shippingUser.id
      }
    });

    // Vessel Profile 3: Tanker
    const [vpHorizon] = await VesselProfile.findOrCreate({
      where: { imoNumber: 'IMO9632187' },
      defaults: {
        imoNumber: 'IMO9632187',
        vesselName: 'MT Gulf Horizon',
        flag: 'Liberia',
        vesselType: 'Liquid',
        callSign: 'A8QK3',
        grossTonnage: 65000,
        netTonnage: 39000,
        lengthOverall: 245.0,
        beam: 42.0,
        draft: 13.8,
        ownerOperator: 'Gulf Marine Tankers FZE',
        userId: shippingUser.id
      }
    });

    // Vessel Profile 4: Pre-Arrival Container
    const [vpPearl] = await VesselProfile.findOrCreate({
      where: { imoNumber: 'IMO9856120' },
      defaults: {
        imoNumber: 'IMO9856120',
        vesselName: 'MV Arabian Pearl',
        flag: 'Singapore',
        vesselType: 'Container',
        callSign: '9V8812',
        grossTonnage: 38000,
        netTonnage: 21000,
        lengthOverall: 220.0,
        beam: 30.5,
        draft: 11.5,
        ownerOperator: 'Pacific International Lines (PIL)',
        userId: shippingUser.id
      }
    });

    // Vessel Profile 5: Sailed Break Bulk
    const [vpStar] = await VesselProfile.findOrCreate({
      where: { imoNumber: 'IMO9541209' },
      defaults: {
        imoNumber: 'IMO9541209',
        vesselName: 'MV Western Star',
        flag: 'Cyprus',
        vesselType: 'Break Bulk',
        callSign: '5BKL2',
        grossTonnage: 28000,
        netTonnage: 16000,
        lengthOverall: 180.0,
        beam: 28.0,
        draft: 9.8,
        ownerOperator: 'Spliethoff Heavy Lift BV',
        userId: shippingUser.id
      }
    });

    // Now seed Vessel Calls with diverse statuses
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
    const tomorrow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    // Call 1: BERTHED (Container Terminal B14)
    const [callVoyager] = await VesselCall.findOrCreate({
      where: { vcn: 'VCN-2026-0101' },
      defaults: {
        vcn: 'VCN-2026-0101',
        vesselName: 'MV Ocean Voyager',
        flag: 'Panama',
        vesselType: 'Container',
        eta: oneDayAgo,
        etd: tomorrow,
        actualArrival: oneDayAgo,
        berthSpecification: 'Berth No. 14 (B14) - JSD Container Terminal',
        vesselProfileId: vpVoyager.id,
        voyageNumber: 'VOY-9921',
        loa: 260.5,
        beam: 32.2,
        draft: 12.8,
        grt: 42500,
        pilotageStatus: 'Completed',
        tugStatus: 'Completed',
        berthingStatus: 'Berthed',
        bunkeringService: 'Requested',
        waterService: 'Completed',
        wasteService: 'Completed',
        status: 'BERTHED',
        proformaDues: 345000.0,
        phoClearance: true,
        immigrationClearance: true,
        customsClearance: true,
        isDischargeAllowed: true,
        vesselDuesSettled: true,
        userId: shippingUser.id
      }
    });

    // Call 2: BERTHED (Coal Berth B8)
    const [callPioneer] = await VesselCall.findOrCreate({
      where: { vcn: 'VCN-2026-0102' },
      defaults: {
        vcn: 'VCN-2026-0102',
        vesselName: 'MV Mangalore Pioneer',
        flag: 'India',
        vesselType: 'Bulk',
        eta: oneDayAgo,
        etd: threeDaysLater,
        actualArrival: oneDayAgo,
        berthSpecification: 'Berth No. 8 (B8) - Iron Ore & Coal (KIOCL Jetty)',
        vesselProfileId: vpPioneer.id,
        voyageNumber: 'VOY-4402',
        loa: 225.0,
        beam: 32.26,
        draft: 13.5,
        grt: 58000,
        pilotageStatus: 'Completed',
        tugStatus: 'Completed',
        berthingStatus: 'Berthed',
        bunkeringService: 'Completed',
        waterService: 'Requested',
        wasteService: 'Not Requested',
        status: 'BERTHED',
        proformaDues: 412000.0,
        phoClearance: true,
        immigrationClearance: true,
        customsClearance: true,
        isDischargeAllowed: true,
        vesselDuesSettled: true,
        userId: shippingUser.id
      }
    });

    // Call 3: BERTHED (POL Jetty 10)
    const [callHorizon] = await VesselCall.findOrCreate({
      where: { vcn: 'VCN-2026-0103' },
      defaults: {
        vcn: 'VCN-2026-0103',
        vesselName: 'MT Gulf Horizon',
        flag: 'Liberia',
        vesselType: 'Liquid',
        eta: oneDayAgo,
        etd: tomorrow,
        actualArrival: oneDayAgo,
        berthSpecification: 'Berth No. 10 (B10) - POL Jetty 1 (Crude & Products)',
        vesselProfileId: vpHorizon.id,
        voyageNumber: 'VOY-1205',
        loa: 245.0,
        beam: 42.0,
        draft: 13.8,
        grt: 65000,
        pilotageStatus: 'Completed',
        tugStatus: 'Completed',
        berthingStatus: 'Berthed',
        status: 'BERTHED',
        proformaDues: 520000.0,
        phoClearance: true,
        immigrationClearance: true,
        customsClearance: true,
        isDischargeAllowed: true,
        vesselDuesSettled: true,
        userId: shippingUser.id
      }
    });

    // Call 4: PRE_ADVICE (Expected Arrival Tomorrow)
    const [callPearl] = await VesselCall.findOrCreate({
      where: { vcn: 'VCN-2026-0104' },
      defaults: {
        vcn: 'VCN-2026-0104',
        vesselName: 'MV Arabian Pearl',
        flag: 'Singapore',
        vesselType: 'Container',
        eta: tomorrow,
        etd: threeDaysLater,
        berthSpecification: 'Berth No. 14 (B14) - JSD Container Terminal',
        vesselProfileId: vpPearl.id,
        voyageNumber: 'VOY-3310',
        loa: 220.0,
        beam: 30.5,
        draft: 11.5,
        grt: 38000,
        pilotageStatus: 'Scheduled',
        tugStatus: 'Scheduled',
        berthingStatus: 'Pending',
        status: 'PRE_ADVICE',
        proformaDues: 290000.0,
        phoClearance: false,
        immigrationClearance: false,
        customsClearance: false,
        isDischargeAllowed: false,
        vesselDuesSettled: false,
        userId: shippingUser.id
      }
    });

    // Call 5: SAILED (Historical Completed Call)
    const [callStar] = await VesselCall.findOrCreate({
      where: { vcn: 'VCN-2026-0100' },
      defaults: {
        vcn: 'VCN-2026-0100',
        vesselName: 'MV Western Star',
        flag: 'Cyprus',
        vesselType: 'Break Bulk',
        eta: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        etd: twoDaysAgo,
        actualArrival: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        actualDeparture: twoDaysAgo,
        berthSpecification: 'Berth No. 2 (B2) - General Cargo / Break Bulk',
        vesselProfileId: vpStar.id,
        voyageNumber: 'VOY-8812',
        loa: 180.0,
        beam: 28.0,
        draft: 9.8,
        grt: 28000,
        pilotageStatus: 'Completed',
        tugStatus: 'Completed',
        berthingStatus: 'Departed',
        status: 'SAILED',
        proformaDues: 195000.0,
        phoClearance: true,
        immigrationClearance: true,
        customsClearance: true,
        isDischargeAllowed: true,
        vesselDuesSettled: true,
        userId: shippingUser.id
      }
    });

    // Update Berth Statuses to reflect occupied berths
    await Berth.update({ status: 'Occupied' }, { where: { number: 'Berth No. 14 (B14) - JSD Container Terminal' } });
    await Berth.update({ status: 'Occupied' }, { where: { number: 'Berth No. 8 (B8) - Iron Ore & Coal (KIOCL Jetty)' } });
    await Berth.update({ status: 'Occupied' }, { where: { number: 'Berth No. 10 (B10) - POL Jetty 1 (Crude & Products)' } });

    // Seed Statements of Fact (SOF) Events for MV Ocean Voyager
    await StatementOfFact.bulkCreate([
      { vcn: 'VCN-2026-0101', eventTimestamp: new Date(oneDayAgo.getTime() - 4 * 3600000), eventType: 'Pilot Boarded', remarks: 'Pilot Capt. D’Souza boarded at Outer Anchorage Fairway Buoy.' },
      { vcn: 'VCN-2026-0101', eventTimestamp: new Date(oneDayAgo.getTime() - 2 * 3600000), eventType: 'First Line Ashore', remarks: 'Tugs Nandi and Netravati assisted. First line secured on Berth 14 bollard 12.' },
      { vcn: 'VCN-2026-0101', eventTimestamp: new Date(oneDayAgo.getTime() - 1 * 3600000), eventType: 'All Fast & Customs Cleared', remarks: 'All mooring lines made fast. Port Health & Customs boarding completed.' },
      { vcn: 'VCN-2026-0101', eventTimestamp: oneDayAgo, eventType: 'Commenced Discharge', remarks: 'Quay Cranes QC-01 & QC-02 commenced twin-lift container discharge.' }
    ], { ignoreDuplicates: true });

    // Seed FAL Declarations (FAL 1 to FAL 7)
    const falForms = [
      { formType: 'FAL1', formData: JSON.stringify({ nameOfShip: 'MV Ocean Voyager', portOfArrival: 'New Mangalore (INIXY1)', masterName: 'Capt. Henrik Lindqvist', grossTonnage: 42500, crewCount: 22 }) },
      { formType: 'FAL2', formData: JSON.stringify({ manifestNo: 'MAN-2026-0991', totalContainers: 450, totalTEU: 720, totalWeightMT: 9800.5 }) },
      { formType: 'FAL3', formData: JSON.stringify({ storesDescription: 'Fuel Oil: 850 MT, Diesel: 120 MT, Fresh Water: 240 MT' }) },
      { formType: 'FAL4', formData: JSON.stringify({ crewEffectsCount: 22, declareCurrency: 'USD 45,000, EUR 12,000' }) },
      { formType: 'FAL5', formData: JSON.stringify({ totalCrew: 22, allSeamanBooksValid: true, yellowFeverCertificates: 'Verified 100%' }) },
      { formType: 'FAL6', formData: JSON.stringify({ passengerCount: 0, supercargoCount: 0 }) },
      { formType: 'FAL7', formData: JSON.stringify({ imdgClass: 'Class 3 (Flammable Liquids), Class 8 (Corrosive)', dangerousCargoManifestNo: 'DG-2026-041' }) }
    ];

    for (const f of falForms) {
      await VesselFalDeclaration.findOrCreate({
        where: { vcn: 'VCN-2026-0101', formType: f.formType },
        defaults: { vcn: 'VCN-2026-0101', formType: f.formType, formData: f.formData, status: 'Approved' }
      });
    }

    // Seed Stowage Plan for MV Ocean Voyager
    await StowagePlan.bulkCreate([
      { vcn: 'VCN-2026-0101', containerNo: 'TGHU1092834', billOfLading: 'BL-MNGPRT-2026-001', bay: '01', row: '02', tier: '04', hazmatClass: 'None', weight: 24.5, discharged: true, dischargeTime: oneDayAgo },
      { vcn: 'VCN-2026-0101', containerNo: 'MSCU7823419', billOfLading: 'BL-MNGPRT-2026-002', bay: '01', row: '04', tier: '04', hazmatClass: 'None', weight: 28.2, discharged: true, dischargeTime: oneDayAgo },
      { vcn: 'VCN-2026-0101', containerNo: 'CMAU9120485', billOfLading: 'BL-MNGPRT-2026-003', bay: '03', row: '02', tier: '02', hazmatClass: 'None', weight: 26.0, discharged: true, dischargeTime: oneDayAgo },
      { vcn: 'VCN-2026-0101', containerNo: 'HLXU6549210', billOfLading: 'BL-MNGPRT-2026-009', bay: '03', row: '06', tier: '06', hazmatClass: 'None', weight: 22.0, discharged: true, dischargeTime: oneDayAgo }
    ], { ignoreDuplicates: true });

    // ----------------------------------------------------
    // MODULE 3: CARGO ITEMS & MANIFESTS (10 Diverse Scenarios)
    // ----------------------------------------------------
    console.log('4. Seeding Diverse Cargo Items, Yard Staging, and Manifest Records...');

    const ts1Wh = whMap['Wharf Transit Shed No. 1'];
    const ts2Wh = whMap['Wharf Transit Shed No. 2 (Overflow Shed)'];
    const jsdCyWh = whMap['JSD Container Stackyard & Backup Area (Berth 14)'];
    const coalWh = whMap['Open Coal & Minerals Stackyard (Chettinad/UPCL)'];
    const multiWh = whMap['Multi-Cargo Open Storage Yard (SJ Gate & Wharf)'];
    const tankWh = whMap['MNGPRT Coastal Liquid POL & Chemical Tank Farm'];
    const reeferWh = whMap['Reefer & Cold Chain Storage Complex'];

    // Cargo 1: Container - Electronics & IT Peripherals
    const [c1] = await Cargo.findOrCreate({
      where: { cargoId: 'CRG-2026-001' },
      defaults: {
        cargoId: 'CRG-2026-001',
        vesselName: 'MV Ocean Voyager',
        manifestNumber: 'MAN-2026-0991',
        billOfLading: 'BL-MNGPRT-2026-001',
        containerNo: 'MSCU1204859',
        sealNumber: 'SEAL-MSC-90211',
        cargoType: 'Container',
        quantity: 1,
        weight: 24.5,
        uomType: 'MTDA',
        uomQuantity: 24.5,
        consignee: 'Optimus Electronics India Pvt Ltd',
        shipper: 'Samsung Electronics Co Ltd (Busan, South Korea)',
        notifyParty: 'Optimus Supply Chain Mangalore SEZ',
        hazmatClass: 'None',
        status: 'Allocated',
        customsHoldStatus: 'RELEASED',
        financeClearanceStatus: 'LOCKED', // Unpaid invoice demo
        oocRefNo: 'OOC-INIXY1-2026-9901',
        oocDate: oneDayAgo,
        tradeType: 'Import',
        warehouseId: jsdCyWh.id,
        binCode: 'CY-GRID-01',
        cifValue: 8500000.0,
        fobValue: 8100000.0,
        commodityType: 'Consumer Electronics'
      }
    });

    // Cargo 2: Container - Auto Parts (Under Customs Inspection Hold)
    const [c2] = await Cargo.findOrCreate({
      where: { cargoId: 'CRG-2026-002' },
      defaults: {
        cargoId: 'CRG-2026-002',
        vesselName: 'MV Ocean Voyager',
        manifestNumber: 'MAN-2026-0991',
        billOfLading: 'BL-MNGPRT-2026-002',
        containerNo: 'MSCU7823419',
        sealNumber: 'SEAL-MSC-44910',
        cargoType: 'Container',
        quantity: 1,
        weight: 28.2,
        uomType: 'MTDA',
        uomQuantity: 28.2,
        consignee: 'Mahindra & Mahindra Logistics Ltd',
        shipper: 'Denso Automotive Corp (Nagoya, Japan)',
        notifyParty: 'Mahindra Auto Assembly Plant Hubli',
        hazmatClass: 'None',
        status: 'Allocated',
        customsHoldStatus: 'LOCKED',
        governmentHoldReason: 'Valuation & Tariff Classification Audit under Customs Act Sec. 17',
        financeClearanceStatus: 'LOCKED',
        tradeType: 'Import',
        warehouseId: jsdCyWh.id,
        binCode: 'CY-GRID-02',
        cifValue: 6200000.0,
        fobValue: 5900000.0,
        commodityType: 'Automotive Components'
      }
    });

    // Cargo 3: Container - Marine Reefer Frozen Seafood (Reefer Cold Chain Monitoring)
    const [c3] = await Cargo.findOrCreate({
      where: { cargoId: 'CRG-2026-003' },
      defaults: {
        cargoId: 'CRG-2026-003',
        vesselName: 'MV Ocean Voyager',
        manifestNumber: 'MAN-2026-0991',
        billOfLading: 'BL-MNGPRT-2026-003',
        containerNo: 'CMAU9120485',
        sealNumber: 'SEAL-CMA-77123',
        cargoType: 'Container',
        quantity: 1,
        weight: 26.0,
        uomType: 'MTDA',
        uomQuantity: 26.0,
        consignee: 'Mangaluru Coastal Seafoods Export Corp',
        shipper: 'Norway Salmon Fisheries AS (Bergen)',
        notifyParty: 'Coastal Cold Chain Logistics Baikampady',
        hazmatClass: 'None',
        status: 'Allocated',
        customsHoldStatus: 'RELEASED',
        financeClearanceStatus: 'LOCKED',
        oocRefNo: 'OOC-INIXY1-2026-8842',
        oocDate: oneDayAgo,
        tradeType: 'Import',
        warehouseId: reeferWh.id,
        binCode: 'REEFER-ZONE-01',
        cifValue: 12000000.0,
        fobValue: 11500000.0,
        commodityType: 'Frozen Atlantic Salmon & Seafood'
      }
    });

    // Cargo 4: Bulk - Indonesian Steam Coal (High Tonnage Bulk Discharging)
    const [c4] = await Cargo.findOrCreate({
      where: { cargoId: 'CRG-2026-004' },
      defaults: {
        cargoId: 'CRG-2026-004',
        vesselName: 'MV Mangalore Pioneer',
        manifestNumber: 'MAN-2026-0440',
        billOfLading: 'BL-MNGPRT-2026-004',
        cargoType: 'Bulk',
        quantity: 1,
        weight: 35000.0,
        uomType: 'MTDA',
        uomQuantity: 35000.0,
        consignee: 'Udupi Power Corporation Ltd (UPCL)',
        shipper: 'PT Adaro Energy (Kalimantan, Indonesia)',
        notifyParty: 'UPCL Thermal Power Plant Padubidri',
        hazmatClass: 'None',
        status: 'Allocated',
        customsHoldStatus: 'RELEASED',
        financeClearanceStatus: 'LOCKED',
        oocRefNo: 'OOC-INIXY1-2026-7731',
        oocDate: oneDayAgo,
        tradeType: 'Import',
        warehouseId: coalWh.id,
        binCode: 'COAL-STACK-A',
        cifValue: 185000000.0,
        fobValue: 172000000.0,
        commodityType: 'Non-Coking Steam Coal'
      }
    });

    // Cargo 5: Bulk - Raw Cashew Nuts (Fully Paid, Cleared & Ready for Delivery / Gate-Out)
    const [c5] = await Cargo.findOrCreate({
      where: { cargoId: 'CRG-2026-005' },
      defaults: {
        cargoId: 'CRG-2026-005',
        vesselName: 'MV Mangalore Pioneer',
        manifestNumber: 'MAN-2026-0440',
        billOfLading: 'BL-MNGPRT-2026-005',
        cargoType: 'Bulk',
        quantity: 15000, // 15,000 jute bags
        weight: 1200.0,
        uomType: 'MTDA',
        uomQuantity: 1200.0,
        consignee: 'Kudla Agro Processing & Exports Hub',
        shipper: 'Abidjan Cocoa & Cashew Exporters (Ivory Coast)',
        notifyParty: 'Mangalore Cashew Manufacturers Association',
        hazmatClass: 'None',
        status: 'Customs Approved', // Ready for Delivery demo
        customsHoldStatus: 'RELEASED',
        financeClearanceStatus: 'RELEASED', // Fully paid invoice demo
        deliveryOrderNo: 'DO-2026-4412',
        oocRefNo: 'OOC-INIXY1-2026-6620',
        oocDate: twoDaysAgo,
        tradeType: 'Import',
        warehouseId: ts1Wh.id,
        binCode: 'TS1-SEC-A',
        cifValue: 14500000.0,
        fobValue: 13800000.0,
        commodityType: 'Raw Cashew Nuts in Shell'
      }
    });

    // Cargo 6: Liquid - Industrial Chemicals / Methanol
    const [c6] = await Cargo.findOrCreate({
      where: { cargoId: 'CRG-2026-006' },
      defaults: {
        cargoId: 'CRG-2026-006',
        vesselName: 'MT Gulf Horizon',
        manifestNumber: 'MAN-2026-0120',
        billOfLading: 'BL-MNGPRT-2026-006',
        cargoType: 'Liquid',
        quantity: 1,
        weight: 4500.0,
        uomType: 'MTDA',
        uomQuantity: 4500.0,
        consignee: 'Mangalore Chemicals & Fertilizers (MCF)',
        shipper: 'SABIC Petrochemicals (Jubail, Saudi Arabia)',
        notifyParty: 'MCF Panambur Complex',
        hazmatClass: 'Class 3 (Flammable Liquid)',
        status: 'Allocated',
        customsHoldStatus: 'RELEASED',
        financeClearanceStatus: 'LOCKED',
        oocRefNo: 'OOC-INIXY1-2026-5510',
        oocDate: oneDayAgo,
        tradeType: 'Import',
        warehouseId: tankWh.id,
        binCode: 'TANK-CHEM-T3',
        cifValue: 24000000.0,
        fobValue: 22800000.0,
        commodityType: 'Anhydrous Liquid Ammonia / Chemicals'
      }
    });

    // Cargo 7: Break Bulk - Windmill Heavy Turbine Blades (Overdue Demurrage Scenario)
    const [c7] = await Cargo.findOrCreate({
      where: { cargoId: 'CRG-2026-007' },
      defaults: {
        cargoId: 'CRG-2026-007',
        vesselName: 'MV Western Star',
        manifestNumber: 'MAN-2026-0881',
        billOfLading: 'BL-MNGPRT-2026-007',
        cargoType: 'Break Bulk',
        quantity: 12, // 12 giant rotor blades
        weight: 450.0,
        uomType: 'MTDA',
        uomQuantity: 450.0,
        consignee: 'Renew Power Clean Energy Ltd',
        shipper: 'Vestas Wind Systems (Aarhus, Denmark)',
        notifyParty: 'Renew Power Windfarm Project Chitradurga',
        hazmatClass: 'None',
        status: 'Allocated',
        customsHoldStatus: 'RELEASED',
        financeClearanceStatus: 'LOCKED',
        oocRefNo: 'OOC-INIXY1-2026-4401',
        oocDate: new Date(now.getTime() - 16 * 24 * 60 * 60 * 1000), // Overstaying 16 days!
        entryTime: new Date(now.getTime() - 16 * 24 * 60 * 60 * 1000),
        tradeType: 'Import',
        warehouseId: multiWh.id,
        binCode: 'PLOT-ALPHA',
        cifValue: 38000000.0,
        fobValue: 36500000.0,
        commodityType: 'Wind Turbine Blades & Heavy Machinery'
      }
    });

    // Cargo 8: Break Bulk - Finished Steel Coils (Gate Out Evacuated History)
    const [c8] = await Cargo.findOrCreate({
      where: { cargoId: 'CRG-2026-008' },
      defaults: {
        cargoId: 'CRG-2026-008',
        vesselName: 'MV Western Star',
        manifestNumber: 'MAN-2026-0881',
        billOfLading: 'BL-MNGPRT-2026-008',
        cargoType: 'Break Bulk',
        quantity: 45,
        weight: 850.0,
        uomType: 'MTDA',
        uomQuantity: 850.0,
        consignee: 'JSD Steel Processing Center',
        shipper: 'Nippon Steel Corp (Yokohama, Japan)',
        notifyParty: 'JSD Toranagallu Plant Bellary',
        hazmatClass: 'None',
        status: 'Customs Approved',
        customsHoldStatus: 'RELEASED',
        financeClearanceStatus: 'RELEASED',
        oocRefNo: 'OOC-INIXY1-2026-3310',
        oocDate: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
        deliveryOrderNo: 'DO-2026-3399',
        exitTime: oneDayAgo,
        tradeType: 'Import',
        warehouseId: ts2Wh.id,
        binCode: 'TS2-SEC-A',
        cifValue: 54000000.0,
        fobValue: 51000000.0,
        commodityType: 'Hot Rolled Steel Coils'
      }
    });

    // Cargo 9: Container - Damaged Heavy Machine Castings (Damaged Goods / Joint Survey Scenario)
    const [c9] = await Cargo.findOrCreate({
      where: { cargoId: 'CRG-2026-009' },
      defaults: {
        cargoId: 'CRG-2026-009',
        vesselName: 'MV Ocean Voyager',
        manifestNumber: 'MAN-2026-0991',
        billOfLading: 'BL-MNGPRT-2026-009',
        containerNo: 'HLXU6549210',
        sealNumber: 'SEAL-HLAG-99312',
        cargoType: 'Container',
        quantity: 1,
        weight: 22.0,
        uomType: 'MTDA',
        uomQuantity: 22.0,
        consignee: 'Karnataka Heavy Industries & Precision Forgings',
        shipper: 'Schuler Presses GmbH (Göppingen, Germany)',
        notifyParty: 'Karnataka Heavy Industries Baikampady Industrial Area',
        hazmatClass: 'None',
        status: 'Allocated',
        isDamaged: true, // Damaged scenario demo
        damageRemarks: 'Corner casting deformed with structural dent on top rail during crane discharge; joint insurance survey requested by surveyor Capt. M. Kamath.',
        customsHoldStatus: 'SEIZED', // Emergency Customs Seizure & Blocked e-DO Demo
        governmentHoldReason: 'Undeclared hazardous electronic scrap components detected inside machine housings without Ministry of Environment import authorization. Seized under Customs Act Sec. 111(d).',
        financeClearanceStatus: 'LOCKED',
        deliveryOrderNo: 'DO-MNGPRT-2026-9909-REVOKED',
        oocRefNo: 'OOC-INIXY1-2026-2211',
        oocDate: oneDayAgo,
        tradeType: 'Import',
        warehouseId: ts2Wh.id,
        binCode: 'TS2-SEC-A',
        cifValue: 7800000.0,
        fobValue: 7400000.0,
        commodityType: 'Heavy Industrial Press Castings'
      }
    });

    // Cargo 10: Container - Pre-Arrival Manifested on MV Arabian Pearl
    const [c10] = await Cargo.findOrCreate({
      where: { cargoId: 'CRG-2026-010' },
      defaults: {
        cargoId: 'CRG-2026-010',
        vesselName: 'MV Arabian Pearl',
        manifestNumber: 'MAN-2026-0331',
        billOfLading: 'BL-MNGPRT-2026-010',
        containerNo: 'TRHU3341902',
        sealNumber: 'SEAL-PIL-11029',
        cargoType: 'Container',
        quantity: 1,
        weight: 25.4,
        uomType: 'MTDA',
        uomQuantity: 25.4,
        consignee: 'Deccan Fine Chemicals India Pvt Ltd',
        shipper: 'BASF SE (Ludwigshafen, Germany)',
        notifyParty: 'Deccan Chemical Plant Mangaluru SEZ',
        hazmatClass: 'Class 8 (Corrosive)',
        status: 'Manifest Uploaded', // Pre-Arrival Manifest demo ready to Unload
        customsHoldStatus: 'LOCKED',
        financeClearanceStatus: 'LOCKED',
        tradeType: 'Import',
        cifValue: 9200000.0,
        fobValue: 8800000.0,
        commodityType: 'Organic Specialty Solvents & Intermediates'
      }
    });

    // ----------------------------------------------------
    // MODULE 4: YARD INVENTORY & WAREHOUSE OCCUPANCY
    // ----------------------------------------------------
    console.log('5. Mapping Yard Inventory and Updating Warehouse Occupancy...');

    // Populate Yard Inventory records with explicit warehouseId and yardLocationId
    await Inventory.bulkCreate([
      { cargoId: c1.id, warehouseId: jsdCyWh.id, yardLocationId: locMap['CY-GRID-01'] ? locMap['CY-GRID-01'].id : null, storageType: 'CONTAINER_YARD', zoneBlock: 'CY-GRID-01', rowNum: 1, colNum: 2, tierNum: 3, storageDate: oneDayAgo, weight: 24.5, quantity: 1, hazmatClass: 'None' },
      { cargoId: c2.id, warehouseId: jsdCyWh.id, yardLocationId: locMap['CY-GRID-02'] ? locMap['CY-GRID-02'].id : null, storageType: 'CONTAINER_YARD', zoneBlock: 'CY-GRID-02', rowNum: 2, colNum: 4, tierNum: 2, storageDate: oneDayAgo, weight: 28.2, quantity: 1, hazmatClass: 'None' },
      { cargoId: c3.id, warehouseId: reeferWh.id, yardLocationId: locMap['REEFER-ZONE-01'] ? locMap['REEFER-ZONE-01'].id : null, storageType: 'COLD_STORAGE', zoneBlock: 'REEFER-ZONE-01', rowNum: 1, colNum: 1, tierNum: 1, storageDate: oneDayAgo, weight: 26.0, quantity: 1, hazmatClass: 'None' },
      { cargoId: c4.id, warehouseId: coalWh.id, yardLocationId: locMap['COAL-STACK-A'] ? locMap['COAL-STACK-A'].id : null, storageType: 'OPEN_YARD', zoneBlock: 'COAL-STACK-A', storageDate: oneDayAgo, weight: 35000.0, quantity: 1, hazmatClass: 'None' },
      { cargoId: c5.id, warehouseId: ts1Wh.id, yardLocationId: locMap['TS1-SEC-A'] ? locMap['TS1-SEC-A'].id : null, storageType: 'COVERED_WAREHOUSE', zoneBlock: 'TS1-SEC-A', storageDate: twoDaysAgo, weight: 1200.0, quantity: 15000, hazmatClass: 'None' },
      { cargoId: c6.id, warehouseId: tankWh.id, yardLocationId: locMap['TANK-CHEM-T3'] ? locMap['TANK-CHEM-T3'].id : null, storageType: 'LIQUID_TANK', zoneBlock: 'TANK-CHEM-T3', storageDate: oneDayAgo, weight: 4500.0, quantity: 1, hazmatClass: 'Class 3' },
      { cargoId: c7.id, warehouseId: multiWh.id, yardLocationId: locMap['PLOT-ALPHA'] ? locMap['PLOT-ALPHA'].id : null, storageType: 'OPEN_YARD', zoneBlock: 'PLOT-ALPHA', storageDate: new Date(now.getTime() - 16 * 24 * 60 * 60 * 1000), weight: 450.0, quantity: 12, hazmatClass: 'None' },
      { cargoId: c9.id, warehouseId: ts2Wh.id, yardLocationId: locMap['TS2-SEC-A'] ? locMap['TS2-SEC-A'].id : null, storageType: 'TRANSIT_SHED', zoneBlock: 'TS2-SEC-A', storageDate: oneDayAgo, weight: 22.0, quantity: 1, hazmatClass: 'None' }
    ], { ignoreDuplicates: true });

    // Update Warehouse Occupancy calculations
    await ts1Wh.update({ occupiedSpace: 1200.0, availableSpace: ts1Wh.capacity - 1200.0 });
    await ts2Wh.update({ occupiedSpace: 22.0, availableSpace: ts2Wh.capacity - 22.0 });
    await jsdCyWh.update({ occupiedSpace: 52.7, availableSpace: jsdCyWh.capacity - 52.7 });
    await coalWh.update({ occupiedSpace: 35000.0, availableSpace: coalWh.capacity - 35000.0 });
    await multiWh.update({ occupiedSpace: 450.0, availableSpace: multiWh.capacity - 450.0 });
    await tankWh.update({ occupiedSpace: 4500.0, availableSpace: tankWh.capacity - 4500.0 });
    await reeferWh.update({ occupiedSpace: 26.0, availableSpace: reeferWh.capacity - 26.0 });

    // Reefer temperature log for Marine Frozen Seafood (Cargo 3)
    await ReeferLog.create({
      containerNo: 'CMAU9120485',
      temperatureCelsius: -18.5,
      humidityPercent: 88.0,
      powerStatus: 'Plugged',
      remarks: 'Primary reefer compressor running optimal; setpoint -20°C maintained per cold chain standard.',
      loggedAt: new Date()
    });

    // Internal Move Log (Relocation from Wharf to Container Grid)
    await InternalMoveLog.create({
      moveTicketId: 'MOV-2026-0012',
      cargoId: c1.id,
      sourceWarehouseId: ts1Wh.id,
      destinationWarehouseId: jsdCyWh.id,
      sourceYardLocationId: locMap['TS1-SEC-A'] ? locMap['TS1-SEC-A'].id : null,
      destinationYardLocationId: locMap['CY-GRID-01'] ? locMap['CY-GRID-01'].id : null,
      forkliftStackerId: 'REACH-STACKER-RS04',
      transferredWeight: 24.5,
      timestamp: oneDayAgo
    });

    // Container Operation Log (De-stuffing & Inspection)
    await ContainerOperationLog.create({
      cargoId: c9.id,
      operationType: 'DE_STUFFING',
      containerNo: 'HLXU6549210',
      weight: 22.0,
      warehouseId: ts2Wh.id,
      remarks: 'De-stuffed under surveyor supervision; mechanical damage logged for insurance claim.',
      timestamp: oneDayAgo,
      loggedBy: warehouseUser.id
    });

    // Discharged Tally Log
    await DischargedInventoryLog.create({
      vcn: 'VCN-2026-0101',
      tallySheetId: 'TALLY-2026-0811',
      billOfLading: 'BL-MNGPRT-2026-001',
      shiftId: 'Shift A (06:00 - 14:00)',
      tallyClerkId: opsUser.id,
      actualUnloadedWeight: 24.5,
      dischargedCount: 1,
      craneEquipmentId: 'QUAY-CRANE-QC01',
      operatorId: 'Suresh Shetty (Operator #104)',
      discrepancyType: 'None',
      soundnessCondition: 'Sound',
      timeDischargeStarted: new Date(oneDayAgo.getTime() - 2 * 3600000),
      timeDischargeCompleted: oneDayAgo,
      cargoConditionRemarks: 'Container landed on flatbed trailer in sound condition with seal intact.'
    });

    // ----------------------------------------------------
    // MODULE 5: CUSTOMS CLEARANCES (4 Diverse Scenarios)
    // ----------------------------------------------------
    console.log('6. Seeding Customs Clearance Requests (Approved, Pending, On Hold, Rejected)...');

    // Scenario 1: APPROVED (RMS Green Channel / Out of Charge Issued)
    await CustomsClearance.findOrCreate({
      where: { billOfEntryNo: 'BE-INIXY1-2026-90412' },
      defaults: {
        cargoId: c1.id,
        billOfEntryNo: 'BE-INIXY1-2026-90412',
        inspectionType: 'GREEN_CHANNEL',
        officerId: customsUser.id,
        oocStatus: true,
        clearanceTimestamp: oneDayAgo,
        documentUrl: 'customs_ooc_cert.pdf',
        customsBrokerId: 'CHA-2026-094 (Apex Maritime)',
        inspectionReportId: 'RMS-AUTO-CLEARED-0891',
        dateCleared: oneDayAgo,
        status: 'Approved',
        remarks: 'ICEGATE automated Risk Management System (RMS) green channel clearance granted. Customs duty ₹1,420,000 paid via ICEGATE portal. Out of Charge issued.'
      }
    });

    // Scenario 2: PENDING (Physical Examination Scheduled)
    await CustomsClearance.findOrCreate({
      where: { billOfEntryNo: 'BE-INIXY1-2026-90554' },
      defaults: {
        cargoId: c2.id,
        billOfEntryNo: 'BE-INIXY1-2026-90554',
        inspectionType: 'PHYSICAL_STRIP',
        officerId: customsUser.id,
        oocStatus: false,
        documentUrl: 'bill_of_entry_auto.pdf',
        customsBrokerId: 'CHA-2024-031 (South India Maritime)',
        inspectionReportId: 'EXAM-ORDER-2026-302',
        status: 'Pending',
        remarks: 'Appraising officer marked for 100% physical de-stuffing examination and invoice valuation cross-check at Examination Shed B.',
        inspectionScheduledAt: tomorrow
      }
    });

    // Scenario 3: ON HOLD (Scanning Anomaly / Lab Phytosanitary Test)
    await CustomsClearance.findOrCreate({
      where: { billOfEntryNo: 'BE-INIXY1-2026-90610' },
      defaults: {
        cargoId: c3.id,
        billOfEntryNo: 'BE-INIXY1-2026-90610',
        inspectionType: 'SCANNING',
        officerId: customsUser.id,
        oocStatus: false,
        documentUrl: 'phytosanitary_cert.pdf',
        customsBrokerId: 'CHA-2026-094 (Apex Maritime)',
        status: 'On Hold',
        remarks: 'Container drive-through X-ray scanner flagged density variation. FSSAI food safety lab testing sample collected; provisional hold maintained pending test report.'
      }
    });

    // Scenario 4: REJECTED (Contraband / Restricted Goods Detained)
    await CustomsClearance.findOrCreate({
      where: { billOfEntryNo: 'BE-INIXY1-2026-90108' },
      defaults: {
        cargoId: c9.id,
        billOfEntryNo: 'BE-INIXY1-2026-90108',
        inspectionType: 'PHYSICAL_STRIP',
        officerId: customsUser.id,
        oocStatus: false,
        documentUrl: 'detention_memo.pdf',
        customsBrokerId: 'CHA-2021-012 (Blue Wave)',
        inspectionReportId: 'DETENTION-MEMO-2026-019',
        status: 'Rejected',
        remarks: 'Undeclared hazardous electronic scrap components detected inside machine housings without Ministry of Environment import authorization. Seized under Customs Act Sec. 111(d).'
      }
    });

    // ----------------------------------------------------
    // MODULE 6: BILLING, INVOICES & PAYMENTS (4 Scenarios)
    // ----------------------------------------------------
    console.log('7. Seeding Invoices, Demurrage Charges, and Payment Transactions...');

    // Invoice 1: PAID (Cashew Cargo C5 - Settle via Shipping Agent PDA)
    const [inv1] = await Invoice.findOrCreate({
      where: { invoiceNumber: 'INV-2026-001' },
      defaults: {
        invoiceNumber: 'INV-2026-001',
        cargoId: c5.id,
        agentId: shippingUser.id,
        payerAgentId: shippingUser.id,
        wharfageFee: 48000.0,
        handlingFee: 24000.0,
        storageFee: 12000.0,
        demurrageFee: 0.0,
        penaltyFee: 0.0,
        cgst: 3780.0,
        sgst: 3780.0,
        igst: 0.0,
        totalAmount: 91560.0,
        roundedGrandTotal: 91560,
        status: 'PAID', // Paid scenario
        issuedDate: twoDaysAgo,
        dueDate: tomorrow,
        paidAt: oneDayAgo,
        daysOverstay: 0
      }
    });

    await Payment.findOrCreate({
      where: { transactionRef: 'TXN-PDA-2026-0812' },
      defaults: {
        invoiceId: inv1.id,
        amountPaid: 91560.0,
        paymentMethod: 'PDA Ledger (Personal Deposit Account)',
        transactionRef: 'TXN-PDA-2026-0812',
        paymentDate: oneDayAgo
      }
    });

    // Invoice 2: UNPAID (Electronics Cargo C1 - Current Storage Charges)
    const [inv2] = await Invoice.findOrCreate({
      where: { invoiceNumber: 'INV-2026-002' },
      defaults: {
        invoiceNumber: 'INV-2026-002',
        cargoId: c1.id,
        agentId: shippingUser.id,
        payerAgentId: shippingUser.id,
        wharfageFee: 22500.0,
        handlingFee: 12000.0,
        storageFee: 8500.0,
        demurrageFee: 0.0,
        penaltyFee: 0.0,
        cgst: 1935.0,
        sgst: 1935.0,
        igst: 0.0,
        totalAmount: 46870.0,
        roundedGrandTotal: 46870,
        status: 'UNPAID', // Unpaid scenario
        issuedDate: oneDayAgo,
        dueDate: threeDaysLater,
        daysOverstay: 0
      }
    });

    // Invoice 3: OVERDUE WITH DEMURRAGE (Wind Turbine Cargo C7 - 16 Days Overstay)
    const [inv3] = await Invoice.findOrCreate({
      where: { invoiceNumber: 'INV-2026-003' },
      defaults: {
        invoiceNumber: 'INV-2026-003',
        cargoId: c7.id,
        agentId: shippingUser.id,
        payerAgentId: shippingUser.id,
        wharfageFee: 45000.0,
        handlingFee: 35000.0,
        storageFee: 22680.0,
        demurrageFee: 56763.0, // High demurrage penalty beyond free days
        penaltyFee: 5000.0,
        cgst: 7400.0,
        sgst: 7400.0,
        igst: 0.0,
        totalAmount: 179243.0,
        roundedGrandTotal: 179243,
        status: 'UNPAID', // Overdue Demurrage scenario
        issuedDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        dueDate: oneDayAgo,
        daysOverstay: 8
      }
    });

    // Invoice 4: PENDING VERIFICATION (Reefer Cargo C3 - Bank NEFT Awaiting Approval)
    const [inv4] = await Invoice.findOrCreate({
      where: { invoiceNumber: 'INV-2026-004' },
      defaults: {
        invoiceNumber: 'INV-2026-004',
        cargoId: c3.id,
        agentId: shippingUser.id,
        payerAgentId: shippingUser.id,
        wharfageFee: 26000.0,
        handlingFee: 15000.0,
        storageFee: 18000.0, // Reefer power plugging charge
        demurrageFee: 0.0,
        penaltyFee: 0.0,
        cgst: 2655.0,
        sgst: 2655.0,
        igst: 0.0,
        totalAmount: 64310.0,
        roundedGrandTotal: 64310,
        status: 'PENDING_VERIFICATION', // Bank NEFT pending review scenario
        issuedDate: oneDayAgo,
        dueDate: threeDaysLater,
        daysOverstay: 0
      }
    });

    await Payment.findOrCreate({
      where: { transactionRef: 'UTR-HDFC-9912048571' },
      defaults: {
        invoiceId: inv4.id,
        amountPaid: 64310.0,
        paymentMethod: 'Bank NEFT / RTGS Transfer',
        transactionRef: 'UTR-HDFC-9912048571',
        paymentDate: now
      }
    });

    // Active PD Hold against shipping user for high-risk cargo
    await PDHold.findOrCreate({
      where: { agentId: shippingUser.id, cargoId: c2.id },
      defaults: {
        agentId: shippingUser.id,
        cargoId: c2.id,
        holdAmount: 50000.0,
        status: 'ACTIVE'
      }
    });

    // Update Shipping Agent PDA Balance to realistic positive balance
    await shippingUser.update({ pdaBalance: 158440.0 }); // 250,000 - 91,560 = 158,440

    // ----------------------------------------------------
    // MODULE 7: AUDIT LOGS & LIVE NOTIFICATIONS
    // ----------------------------------------------------
    console.log('8. Seeding System Audit Trail and Real-Time Notifications...');

    // Audit Logs
    const auditLogsData = [
      { username: 'ops', role: 'Port Operations Officer', action: 'VESSEL_BERTHED', affectedTable: 'BerthAllocations', details: 'Allotted Berth No. 14 (JSD Container Terminal) to MV Ocean Voyager (VCN-2026-0101). Draft checked: 12.8m.' },
      { username: 'customs', role: 'Customs Officer', action: 'CUSTOMS_OOC_ISSUED', affectedTable: 'CustomsClearances', details: 'Granted Out of Charge clearance for BE-INIXY1-2026-90412 (Optimus Electronics). Duty verified.' },
      { username: 'customs', role: 'Customs Officer', action: 'CUSTOMS_HOLD_APPLIED', affectedTable: 'CustomsClearances', details: 'Applied statutory hold on BE-INIXY1-2026-90554 (Mahindra Auto Parts) for 100% physical examination.' },
      { username: 'finance', role: 'Finance', action: 'INVOICE_SETTLED_PDA', affectedTable: 'Invoices', details: 'Settled invoice INV-2026-001 (₹91,560.00) via Shipping Agent PDA ledger deduction.' },
      { username: 'warehouse', role: 'Warehouse Manager', action: 'YARD_INTERNAL_MOVE', affectedTable: 'Internal_Move_Logs', details: 'Relocated Container TGHU1092834 from Transit Shed 1 to JSD Stackyard Grid 01 using Stacker RS-04.' },
      { username: 'ops', role: 'Port Operations Officer', action: 'TALLY_DISCHARGE_LOGGED', affectedTable: 'Discharged_Inventory_Logs', details: 'Completed tally discharge shift for MV Ocean Voyager (QC-01: 24.5 MT electronics).' },
      { username: 'admin', role: 'Super Admin', action: 'AGENT_REGISTRATION_AUDIT', affectedTable: 'shipping_agent_registrations', details: 'Verified KYC and approved license for South India Maritime Agencies (REG-2026-8802).' },
      { username: 'admin', role: 'Super Admin', action: 'AGENT_REGISTRATION_REJECTED', affectedTable: 'shipping_agent_registrations', details: 'Rejected registration REG-2026-8803 (Blue Wave Logistics) due to expired Customs Broker License.' },
      { username: 'warehouse', role: 'Warehouse Manager', action: 'REEFER_COLD_CHAIN_CHECK', affectedTable: 'ReeferLogs', details: 'Logged reefer temperature for CMAU9120485: -18.5°C plugged to socket R1-04.' },
      { username: 'warehouse', role: 'Warehouse Manager', action: 'DELIVERY_ORDER_RELEASED', affectedTable: 'CargoItems', details: 'Verified Delivery Order DO-2026-4412 and authorized cargo exit release for Cashews (CRG-2026-005).' }
    ];

    for (const al of auditLogsData) {
      await AuditLog.create(al);
    }

    // Live Notifications for different roles
    const notificationsData = [
      { title: 'New Vessel Pre-Advice Arriving Tomorrow', message: 'MV Arabian Pearl (VCN-2026-0104) filed pre-advice with 450 containers. Berth 14 reservation queued.', roleTarget: 'Port Operations Officer', isRead: false },
      { title: 'Customs Examination Order Issued', message: 'Container MSCU7823419 placed under physical inspection hold. De-stuffing requested at Shed B.', roleTarget: 'Customs Officer', isRead: false },
      { title: 'NEFT Payment Verification Pending', message: 'Shipping agent uploaded UTR-HDFC-9912048571 for Invoice INV-2026-004 (₹64,310). Awaiting finance reconciliation.', roleTarget: 'Finance', isRead: false },
      { title: 'Demurrage Threshold Exceeded Warning', message: 'Cargo CRG-2026-007 (Windmill Turbines) has exceeded 7 free storage days. Daily penalty ₹5.050/MTDA accruing.', roleTarget: 'Shipping Agent', isRead: false },
      { title: 'KYC Verification Pending for New Agent', message: 'Apex Ocean Carriers India Ltd (REG-2026-8801) submitted agency registration documents for admin review.', roleTarget: 'Super Admin', isRead: false },
      { title: 'Delivery Order DO-2026-4412 Released', message: 'All customs and finance clearances approved for Cashew Cargo CRG-2026-005. Ready for evacuation.', roleTarget: 'All', isRead: true }
    ];

    for (const notif of notificationsData) {
      await Notification.create(notif);
    }

    // ----------------------------------------------------
    // MODULE 8: REALISTIC DIGITAL PDF DOCUMENTS IN FILESTORE
    // ----------------------------------------------------
    console.log('9. Generating Official Digital PDFs into FileStore & Disk...');

    const pdfDocs = [
      { filename: 'customs_ooc_cert.pdf', title: 'Customs Out of Charge Certificate', ref: 'OOC-INIXY1-2026-9901', details: 'ICEGATE RMS Digital Cargo Out of Charge Release Order' },
      { filename: 'coal_bill_of_lading.pdf', title: 'Ocean Bill of Lading', ref: 'BL-MNGPRT-2026-004', details: 'Non-Coking Steam Coal 35,000 MT Consigned to UPCL' },
      { filename: 'bill_of_entry_auto.pdf', title: 'Customs Bill of Entry', ref: 'BE-INIXY1-2026-90554', details: 'Auto Components under Physical Inspection Hold' },
      { filename: 'phytosanitary_cert.pdf', title: 'Food Safety & Phytosanitary Certificate', ref: 'FSSAI-MNGPRT-2026-041', details: 'Atlantic Seafood Import Lab Sampling Record' },
      { filename: 'delivery_order_do4412.pdf', title: 'Official Port Delivery Order', ref: 'DO-2026-4412', details: 'Port Exit Release Pass for Raw Cashew Nut Bags' },
      { filename: 'reg_apex_certificate.pdf', title: 'Shipping Agency KYC Certificate', ref: 'REG-2026-8801', details: 'Certificate of Incorporation & MNGPRT Port License Application' }
    ];

    for (const doc of pdfDocs) {
      const pdfBuffer = makePdfBuffer(doc.title, doc.ref, doc.details);
      await FileStore.findOrCreate({
        where: { filename: doc.filename },
        defaults: {
          filename: doc.filename,
          originalname: doc.filename,
          mimetype: 'application/pdf',
          size: pdfBuffer.length,
          data: pdfBuffer,
          category: 'Official Port Document'
        }
      });
    }

    console.log('\n==================================================');
    console.log('  DEMO SCENARIOS SEEDING COMPLETED SUCCESSFULLY!');
    console.log('==================================================\n');

  } catch (error) {
    console.error('Fatal error during scenario seeding:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

if (require.main === module) {
  seedComprehensiveDemoData();
}

module.exports = seedComprehensiveDemoData;
