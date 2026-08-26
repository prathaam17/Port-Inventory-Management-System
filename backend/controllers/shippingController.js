const { User, VesselCall, Cargo, Invoice, Warehouse, Inventory, sequelize, VesselProfile, VesselFalDeclaration, StowagePlan, StatementOfFact, Notification, Berth } = require('../models');
const { Op } = require('sequelize');
const crypto = require('crypto');
const { logActivity } = require('../utils/logger');

// Fetch PDA balance
exports.getPdaBalance = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    return res.json({ pdaBalance: user.pdaBalance });
  } catch (error) {
    console.error('Error fetching PDA balance:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Deposit funds to PDA (atomic transaction)
exports.depositPda = async (req, res) => {
  const { amount } = req.body;
  const t = await sequelize.transaction();
  try {
    if (!amount || parseFloat(amount) <= 0) {
      await t.rollback();
      return res.status(400).json({ message: 'Please specify a positive deposit amount.' });
    }
    const user = await User.findByPk(req.user.id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!user) {
      await t.rollback();
      return res.status(404).json({ message: 'User not found.' });
    }

    const newBalance = user.pdaBalance + parseFloat(amount);
    await user.update({ pdaBalance: newBalance }, { transaction: t });

    await t.commit();

    await logActivity(req, 'PDA_DEPOSIT', `Deposited ₹${amount} to PDA. New Balance: ₹${newBalance}`);
    return res.json({ message: 'Deposit successful.', pdaBalance: newBalance });
  } catch (error) {
    await t.rollback();
    console.error('Error depositing to PDA:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Fetch Vessel Calls (filtered for agent, all calls for internal roles)
exports.getVesselCalls = async (req, res) => {
  try {
    const filter = req.user.role === 'Shipping Agent' ? { userId: req.user.id } : {};
    const calls = await VesselCall.findAll({
      where: filter,
      order: [['createdAt', 'DESC']]
    });
    return res.json(calls);
  } catch (error) {
    console.error('Error fetching vessel calls:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Approve Marine Clearance (Port Traffic Clerk toggles isDischargeAllowed)
exports.approveMarineClearance = async (req, res) => {
  const { vcn } = req.params;
  try {
    const vessel = await VesselCall.findOne({ where: { vcn } });
    if (!vessel) {
      return res.status(404).json({ message: 'Vessel Call not found.' });
    }

    // Verify FAL forms submitted
    const falCount = await VesselFalDeclaration.count({ where: { vcn } });
    if (falCount < 7) {
      return res.status(400).json({ 
        message: `FAL Declarations Missing. The shipping agent must submit all 7 mandatory IMO FAL forms before clearances can be approved. Currently submitted: ${falCount}/7.` 
      });
    }

    await vessel.update({
      phoClearance: true,
      immigrationClearance: true,
      customsClearance: true,
      isDischargeAllowed: true,
      status: 'BERTHED'
    });

    await Notification.create({
      title: 'Storage Reserved (VCN: ' + vcn + ')',
      message: `Vessel ${vessel.vesselName} is now BERTHED. Automatically reserved storage capacity in closest proximity blocks.`,
      roleTarget: 'All'
    });

    await logActivity(req, 'MARINE_DOCUMENTS_APPROVED', `Port Operations Clerk approved marine clearances (PHO, Immigration, Customs Inward) for ${vessel.vesselName} (${vcn}). System flag isDischargeAllowed set to TRUE.`);

    return res.json({
      message: 'Marine documents approved. Discharge is now legally allowed.',
      vesselCall: vessel
    });
  } catch (error) {
    console.error('Error approving clearances:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Finalize Vessel Turnaround (Sign-off vessel departure)
exports.finalizeVesselCall = async (req, res) => {
  const { vcn } = req.params;
  const { propertyDamageReported, remarks } = req.body;

  try {
    const vessel = await VesselCall.findOne({ where: { vcn } });
    if (!vessel) {
      return res.status(404).json({ message: 'Vessel Call not found.' });
    }

    await vessel.update({ status: 'SAILED' });

    const auditDetail = `Finalized Vessel Turnaround & Clearance for ${vessel.vesselName} (${vcn}). Property Damage: ${propertyDamageReported ? 'YES' : 'NO'}. Remarks: ${remarks || 'None'}`;
    await logActivity(req, 'VESSEL_TURNAROUND_FINALIZED', auditDetail);

    return res.json({
      message: 'Vessel turnaround finalized and departure cleared successfully.',
      vesselCall: vessel
    });
  } catch (error) {
    console.error('Error finalising vessel turnaround:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Settle remaining vessel related activities dues (SOR ledger settlement)
exports.settleVesselDues = async (req, res) => {
  const { vcn } = req.params;

  try {
    const vessel = await VesselCall.findOne({ where: { vcn } });
    if (!vessel) {
      return res.status(404).json({ message: 'Vessel Call not found.' });
    }

    if (vessel.vesselDuesSettled) {
      return res.status(400).json({ message: 'Vessel dues are already settled.' });
    }

    await vessel.update({ vesselDuesSettled: true });
    
    await logActivity(req, 'VESSEL_DUES_SETTLED', `Vessel dues settled for ${vessel.vesselName} (VCN: ${vcn}).`);
    
    return res.json({
      message: 'Vessel dues successfully paid and settled.',
      vesselCall: vessel,
      pdaBalance: 0
    });
  } catch (error) {
    console.error('Error settling vessel dues:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Request VCN (Voyage Registration)
exports.requestVesselCall = async (req, res) => {
  const { vesselName, flag, vesselType, eta, berthSpecification, vesselProfileId, voyageNumber, loa, beam, draft, grt } = req.body;

  try {
    if (!vesselName || !flag || !vesselType || !eta || !berthSpecification) {
      return res.status(400).json({ message: 'All fields (Vessel Name, Flag, Type, ETA, Berth Specifications) are required.' });
    }

    let profile = null;
    if (vesselProfileId) {
      profile = await VesselProfile.findByPk(vesselProfileId);
    }

    const finalDraft = draft ? parseFloat(draft) : (profile ? parseFloat(profile.draft) : 0);
    
    // Dynamically fetch Berth from Database
    const { Op } = require('sequelize');
    const berth = await Berth.findOne({
      where: {
        [Op.or]: [
          { number: berthSpecification },
          { number: { [Op.iLike]: `%${berthSpecification}%` } }
        ]
      }
    });
    const maxSafeDraft = berth ? parseFloat(berth.draftLimit) : 14.0;

    if (finalDraft > maxSafeDraft) {
      return res.status(400).json({
        message: `Safety Block: Vessel draft of ${finalDraft}m exceeds the low-tide safe draft limit of ${maxSafeDraft}m at the selected berth (${berthSpecification}).`
      });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    // Estimate proforma dues based on type
    let estimatedDues = 500000; // default for Container
    if (vesselType === 'Bulk') estimatedDues = 1000000;
    if (vesselType === 'Liquid') estimatedDues = 800000;

    // Generate VCN (Vessel Call Number)
    const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase();
    const vcn = `VCN-2026-${randomHex}`;

    const newCall = await VesselCall.create({
      vcn,
      vesselName,
      flag,
      vesselType,
      eta,
      berthSpecification,
      proformaDues: estimatedDues,
      status: 'Awaiting Arrival',
      userId: user.id,
      vesselProfileId: vesselProfileId || null,
      voyageNumber: voyageNumber || `VOY-2026-${vcn.slice(-4)}`,
      loa: loa ? parseFloat(loa) : (profile ? parseFloat(profile.lengthOverall) : null),
      beam: beam ? parseFloat(beam) : (profile ? parseFloat(profile.beam) : null),
      draft: draft ? parseFloat(draft) : (profile ? parseFloat(profile.draft) : null),
      grt: grt ? parseFloat(grt) : (profile ? parseFloat(profile.grossTonnage) : null)
    });

    await logActivity(req, 'VCN_REQUESTED', `Voyage registered for ${vesselName} (VCN: ${vcn}). Estimated dues: ₹${estimatedDues}.`);

    return res.status(201).json({
      message: 'Vessel Call successfully registered and VCN issued.',
      vesselCall: newCall,
      pdaBalance: user.pdaBalance
    });
  } catch (error) {
    console.error('Error requesting vessel call:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Upload Post-Berthing Legal Clearance approvals (PHO, Immigration, Customs Inward)
exports.uploadClearances = async (req, res) => {
  const { vcn } = req.params;
  const { phoClearance, immigrationClearance, customsClearance } = req.body;

  try {
    const vessel = await VesselCall.findOne({ where: { vcn, userId: req.user.id } });
    if (!vessel) {
      return res.status(404).json({ message: 'Vessel Call not found or access denied.' });
    }

    // Verify FAL forms submitted
    const falCount = await VesselFalDeclaration.count({ where: { vcn } });
    if (falCount < 7) {
      return res.status(400).json({ 
        message: `FAL Declarations Missing. You must submit all 7 mandatory IMO FAL forms before requesting clearance approvals. Currently submitted: ${falCount}/7.` 
      });
    }

    const updates = {};
    if (phoClearance !== undefined) updates.phoClearance = !!phoClearance;
    if (immigrationClearance !== undefined) updates.immigrationClearance = !!immigrationClearance;
    if (customsClearance !== undefined) updates.customsClearance = !!customsClearance;
    if (req.body.isDischargeAllowed !== undefined) updates.isDischargeAllowed = !!req.body.isDischargeAllowed;

    // If clearances are uploaded, we can transition status to "BERTHED"
    if (updates.phoClearance && updates.immigrationClearance && updates.customsClearance) {
      updates.status = 'BERTHED';
      await Notification.create({
        title: 'Storage Reserved (VCN: ' + vcn + ')',
        message: `Vessel ${vessel.vesselName} is now BERTHED. Automatically reserved storage capacity in closest proximity blocks.`,
        roleTarget: 'All'
      });
    }

    await vessel.update(updates);

    await logActivity(req, 'CLEARANCE_UPLOADED', `Uploaded legal clearances for ${vessel.vesselName} (${vcn}). Current status: ${vessel.status}`);

    return res.json({
      message: 'Clearances successfully uploaded and updated.',
      vesselCall: vessel
    });
  } catch (error) {
    console.error('Error uploading clearances:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Fetch live discharge tally counts for a vessel name
exports.getVesselTally = async (req, res) => {
  const { vcn } = req.params;

  try {
    const vessel = await VesselCall.findOne({ where: { vcn, userId: req.user.id } });
    if (!vessel) {
      return res.status(404).json({ message: 'Vessel Call not found.' });
    }

    // Query cargo matching this vesselName
    const cargoes = await Cargo.findAll({
      where: { vesselName: vessel.vesselName }
    });

    let manifestedWeight = 0;
    let physicallyUnloadedWeight = 0;
    let containerManifestedCount = 0;
    let containerUnloadedCount = 0;
    let hasDamagedCargo = false;
    const damageReports = [];

    cargoes.forEach(c => {
      manifestedWeight += c.weight;
      if (c.cargoType === 'Container') {
        containerManifestedCount++;
      }

      if (['Unloaded', 'Allocated', 'Customs Hold', 'Customs Approved', 'Gate Pass Generated', 'Dispatched'].includes(c.status)) {
        physicallyUnloadedWeight += c.weight;
        if (c.cargoType === 'Container') {
          containerUnloadedCount++;
        }
      }

      if (c.isDamaged) {
        hasDamagedCargo = true;
        damageReports.push({
          cargoId: c.cargoId,
          remarks: c.damageRemarks || 'General Damage logged by Yard Inspector.'
        });
      }
    });

    return res.json({
      vesselName: vessel.vesselName,
      vcn: vessel.vcn,
      vesselStatus: vessel.status,
      manifestedWeight,
      physicallyUnloadedWeight,
      containerManifestedCount,
      containerUnloadedCount,
      hasDamagedCargo,
      damageReports,
      cargoes
    });
  } catch (error) {
    console.error('Error getting vessel discharge tally:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// e-DO (Electronic Delivery Order) Issuance
exports.issueDO = async (req, res) => {
  const { billOfLading } = req.body;

  try {
    if (!billOfLading) {
      return res.status(400).json({ message: 'Bill of Lading number is required.' });
    }

    // Find cargo matching BL
    const cargo = await Cargo.findOne({ where: { billOfLading } });
    if (!cargo) {
      return res.status(404).json({ message: 'No cargo found with the provided Bill of Lading.' });
    }

    if (cargo.customsHoldStatus === 'SEIZED' || cargo.status === 'Customs Hold') {
      return res.status(400).json({
        message: `Clearance Blocked: Emergency Customs Seizure in Progress for Cargo ${cargo.cargoId}. e-DO cannot be generated while under seizure hold.`
      });
    }

    if (cargo.customsHoldStatus === 'LOCKED') {
      return res.status(400).json({
        message: `Clearance Blocked: Cargo has an active Customs hold (${cargo.customsHoldStatus}). It must be customs-cleared before issuing a Delivery Order.`
      });
    }

    // Check if cargo already has a DO
    if (cargo.deliveryOrderNo) {
      return res.status(400).json({ 
        message: `Delivery Order already issued for this shipment. DO No: ${cargo.deliveryOrderNo}` 
      });
    }

    // Validation: Importer must have paid all related storage/port billing invoices
    const invoices = await Invoice.findAll({ where: { cargoId: cargo.id } });
    const outstandingInvoices = invoices.filter(inv => inv.status !== 'Paid');

    if (outstandingInvoices.length > 0) {
      const outstandingSum = outstandingInvoices.reduce((sum, current) => sum + current.totalAmount, 0);
      return res.status(400).json({
        message: `Clearance Blocked: There are outstanding port storage fees of ₹${outstandingSum.toLocaleString()} that must be settled by the consignee/importer before issuing the Delivery Order.`
      });
    }

    // Generate cryptographic token reference for the DO
    // Update cargo: generate DO number, set status to Dispatched and record exit time
    await cargo.update({
      deliveryOrderNo: cryptographicToken,
      status: 'Dispatched',
      exitTime: new Date()
    });

    // Clear yard inventory & free warehouse space once e-DO is provided
    if (cargo.warehouseId) {
      const warehouse = await Warehouse.findByPk(cargo.warehouseId);
      if (warehouse) {
        warehouse.occupiedCapacity = Math.max(0, (warehouse.occupiedCapacity || 0) - (cargo.weight || 0));
        await warehouse.save();
      }
    }
    await Inventory.destroy({ where: { cargoId: cargo.id } });

    await logActivity(req, 'DO_ISSUED', `Electronic Delivery Order generated for BL: ${billOfLading}. DO Token: ${cryptographicToken}`);

    return res.json({
      message: 'Electronic Delivery Order (e-DO) successfully generated and cryptographic token issued.',
      deliveryOrderNo: cryptographicToken,
      cargoId: cargo.cargoId,
      consignee: cargo.consignee,
      weight: cargo.weight
    });
  } catch (error) {
    console.error('Error issuing e-DO:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Vessel Profile management
exports.getVesselProfiles = async (req, res) => {
  try {
    const filter = req.user.role === 'Shipping Agent' ? { userId: req.user.id } : {};
    const profiles = await VesselProfile.findAll({
      where: filter,
      order: [['vesselName', 'ASC']]
    });
    return res.json(profiles);
  } catch (error) {
    console.error('Error fetching vessel profiles:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

exports.createVesselProfile = async (req, res) => {
  const { 
    imoNumber, vesselName, flag, vesselType, callSign, 
    grossTonnage, netTonnage, lengthOverall, beam, draft, ownerOperator 
  } = req.body;

  try {
    if (!imoNumber || !vesselName || !flag || !vesselType || !callSign || !ownerOperator) {
      return res.status(400).json({ message: 'IMO, name, flag, type, call sign, and owner are required.' });
    }

    const existing = await VesselProfile.findOne({ where: { imoNumber } });
    if (existing) {
      return res.status(400).json({ message: `Vessel with IMO ${imoNumber} already exists.` });
    }

    const profile = await VesselProfile.create({
      imoNumber,
      vesselName,
      flag,
      vesselType,
      callSign,
      grossTonnage: parseFloat(grossTonnage) || 0.0,
      netTonnage: parseFloat(netTonnage) || 0.0,
      lengthOverall: parseFloat(lengthOverall) || 0.0,
      beam: parseFloat(beam) || 0.0,
      draft: parseFloat(draft) || 0.0,
      ownerOperator,
      userId: req.user.id
    });

    await logActivity(req, 'VESSEL_PROFILE_CREATED', `Vessel profile registered: ${vesselName} (IMO: ${imoNumber})`);
    return res.status(201).json(profile);
  } catch (error) {
    console.error('Error creating vessel profile:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// FAL Declarations management
exports.getFalDeclarations = async (req, res) => {
  const { vcn } = req.params;
  try {
    const declarations = await VesselFalDeclaration.findAll({
      where: { vcn }
    });
    return res.json(declarations);
  } catch (error) {
    console.error('Error fetching FAL declarations:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

exports.submitFalDeclaration = async (req, res) => {
  const { vcn } = req.params;
  const { formType, formData } = req.body;

  try {
    if (!formType || !formData) {
      return res.status(400).json({ message: 'formType and formData are required.' });
    }

    const [declaration, created] = await VesselFalDeclaration.findOrCreate({
      where: { vcn, formType },
      defaults: {
        formData: typeof formData === 'string' ? formData : JSON.stringify(formData),
        status: 'Submitted'
      }
    });

    if (!created) {
      await declaration.update({
        formData: typeof formData === 'string' ? formData : JSON.stringify(formData),
        status: 'Submitted'
      });
    }

    await logActivity(req, 'FAL_DECLARATION_SUBMITTED', `Submitted FAL Form ${formType} for voyage ${vcn}`);
    return res.json({
      message: `FAL Form ${formType} submitted successfully.`,
      declaration
    });
  } catch (error) {
    console.error('Error submitting FAL declaration:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Stowage plan management
exports.getStowagePlan = async (req, res) => {
  const { vcn } = req.params;
  try {
    const plan = await StowagePlan.findAll({
      where: { vcn },
      order: [['bay', 'ASC'], ['row', 'ASC'], ['tier', 'ASC']]
    });
    return res.json(plan);
  } catch (error) {
    console.error('Error fetching stowage plan:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

exports.updateStowagePlan = async (req, res) => {
  const { vcn } = req.params;
  const { stowageCells } = req.body;

  try {
    if (!stowageCells || !Array.isArray(stowageCells)) {
      return res.status(400).json({ message: 'stowageCells array is required.' });
    }

    await StowagePlan.destroy({ where: { vcn } });
    
    const records = stowageCells.map(cell => ({
      vcn,
      containerNo: cell.containerNo,
      billOfLading: cell.billOfLading,
      bay: cell.bay,
      row: cell.row,
      tier: cell.tier,
      hazmatClass: cell.hazmatClass || 'None',
      weight: parseFloat(cell.weight) || 20.0,
      discharged: !!cell.discharged,
      dischargeTime: cell.dischargeTime || null
    }));

    const plan = await StowagePlan.bulkCreate(records);
    await logActivity(req, 'STOWAGE_PLAN_UPDATED', `Stowage plan updated with ${records.length} cells for voyage ${vcn}`);
    return res.json({ message: 'Stowage plan successfully updated.', plan });
  } catch (error) {
    console.error('Error updating stowage plan:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Statement of Facts management
exports.getStatementOfFacts = async (req, res) => {
  const { vcn } = req.params;
  try {
    const events = await StatementOfFact.findAll({
      where: { vcn },
      order: [['eventTimestamp', 'ASC']]
    });
    return res.json(events);
  } catch (error) {
    console.error('Error fetching Statement of Facts:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

exports.createStatementOfFact = async (req, res) => {
  const { vcn } = req.params;
  const { eventTimestamp, eventType, remarks } = req.body;
  try {
    if (!eventTimestamp || !eventType) {
      return res.status(400).json({ message: 'eventTimestamp and eventType are required.' });
    }
    const event = await StatementOfFact.create({
      vcn,
      eventTimestamp,
      eventType,
      remarks
    });
    await logActivity(req, 'SOF_EVENT_LOGGED', `Logged event "${eventType}" for voyage ${vcn}`);
    return res.status(201).json(event);
  } catch (error) {
    console.error('Error creating Statement of Fact event:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Vessel Services & Stay approvals
exports.updateVesselServices = async (req, res) => {
  const { vcn } = req.params;
  const { pilotageStatus, tugStatus, berthingStatus, bunkeringService, waterService, wasteService, berthSpecification } = req.body;
  try {
    const vessel = await VesselCall.findOne({ where: { vcn } });
    if (!vessel) {
      return res.status(404).json({ message: 'Vessel Call not found.' });
    }

    if (berthingStatus === 'Approved' || berthingStatus === 'Allocated') {
      const finalDraft = vessel.draft || 0;
      const targetBerthName = berthSpecification || vessel.berthSpecification;
      const { Op } = require('sequelize');
      const berth = await Berth.findOne({
        where: {
          [Op.or]: [
            { number: targetBerthName },
            { number: { [Op.iLike]: `%${targetBerthName}%` } }
          ]
        }
      });
      const maxSafeDraft = berth ? parseFloat(berth.draftLimit) : 14.0;
      if (finalDraft > maxSafeDraft) {
        return res.status(400).json({
          message: `Safety Block: Cannot approve berthing. Vessel draft of ${finalDraft}m exceeds low-tide safe draft limit of ${maxSafeDraft}m at Berth ${targetBerthName}.`
        });
      }
    }

    const updates = {};
    if (pilotageStatus !== undefined) updates.pilotageStatus = pilotageStatus;
    if (tugStatus !== undefined) updates.tugStatus = tugStatus;
    if (berthingStatus !== undefined) updates.berthingStatus = berthingStatus;
    if (bunkeringService !== undefined) updates.bunkeringService = bunkeringService;
    if (waterService !== undefined) updates.waterService = waterService;
    if (wasteService !== undefined) updates.wasteService = wasteService;
    if (berthSpecification !== undefined) {
      const finalDraft = vessel.draft || 0;
      const { Op } = require('sequelize');
      const berth = await Berth.findOne({
        where: {
          [Op.or]: [
            { number: berthSpecification },
            { number: { [Op.iLike]: `%${berthSpecification}%` } }
          ]
        }
      });
      const maxSafeDraft = berth ? parseFloat(berth.draftLimit) : 14.0;
      if (finalDraft > maxSafeDraft) {
        return res.status(400).json({
          message: `Safety Block: Cannot assign berth. Vessel draft of ${finalDraft}m exceeds low-tide safe draft limit of ${maxSafeDraft}m at Berth ${berthSpecification}.`
        });
      }
      updates.berthSpecification = berthSpecification;
    }

    await vessel.update(updates);
    await logActivity(req, 'VESSEL_SERVICES_UPDATED', `Updated services/approvals for voyage ${vcn}`);
    return res.json({ message: 'Vessel services successfully updated.', vesselCall: vessel });
  } catch (error) {
    console.error('Error updating vessel services:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

exports.updateVesselProfile = async (req, res) => {
  const { id } = req.params;
  const { 
    imoNumber, vesselName, flag, vesselType, callSign, 
    grossTonnage, netTonnage, lengthOverall, beam, draft, ownerOperator 
  } = req.body;

  try {
    const profile = await VesselProfile.findByPk(id);
    if (!profile) {
      return res.status(404).json({ message: 'Vessel profile not found.' });
    }

    if (imoNumber && imoNumber !== profile.imoNumber) {
      const existing = await VesselProfile.findOne({ where: { imoNumber } });
      if (existing) {
        return res.status(400).json({ message: `Vessel with IMO ${imoNumber} already exists.` });
      }
    }

    await profile.update({
      imoNumber: imoNumber || profile.imoNumber,
      vesselName: vesselName || profile.vesselName,
      flag: flag || profile.flag,
      vesselType: vesselType || profile.vesselType,
      callSign: callSign || profile.callSign,
      grossTonnage: grossTonnage !== undefined ? parseFloat(grossTonnage) : profile.grossTonnage,
      netTonnage: netTonnage !== undefined ? parseFloat(netTonnage) : profile.netTonnage,
      lengthOverall: lengthOverall !== undefined ? parseFloat(lengthOverall) : profile.lengthOverall,
      beam: beam !== undefined ? parseFloat(beam) : profile.beam,
      draft: draft !== undefined ? parseFloat(draft) : profile.draft,
      ownerOperator: ownerOperator || profile.ownerOperator
    });

    await logActivity(req, 'VESSEL_PROFILE_UPDATED', `Vessel profile updated: ${profile.vesselName} (IMO: ${profile.imoNumber})`);
    return res.json(profile);
  } catch (error) {
    console.error('Error updating vessel profile:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

exports.deleteVesselProfile = async (req, res) => {
  const { id } = req.params;
  try {
    const profile = await VesselProfile.findByPk(id);
    if (!profile) {
      return res.status(404).json({ message: 'Vessel profile not found.' });
    }

    await profile.destroy();
    await logActivity(req, 'VESSEL_PROFILE_DELETED', `Deleted vessel profile: ${profile.vesselName}`);
    return res.json({ message: 'Vessel profile successfully deleted.' });
  } catch (error) {
    console.error('Error deleting vessel profile:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

exports.updateVesselCall = async (req, res) => {
  const { id } = req.params;
  const { 
    vesselName, flag, vesselType, eta, etd, berthSpecification, 
    voyageNumber, loa, beam, draft, grt, status
  } = req.body;

  try {
    const vessel = await VesselCall.findByPk(id);
    if (!vessel) {
      return res.status(404).json({ message: 'Vessel Call not found.' });
    }

    await vessel.update({
      vesselName: vesselName || vessel.vesselName,
      flag: flag || vessel.flag,
      vesselType: vesselType || vessel.vesselType,
      eta: eta || vessel.eta,
      etd: etd !== undefined ? etd : vessel.etd,
      berthSpecification: berthSpecification || vessel.berthSpecification,
      voyageNumber: voyageNumber !== undefined ? voyageNumber : vessel.voyageNumber,
      loa: loa !== undefined ? parseFloat(loa) : vessel.loa,
      beam: beam !== undefined ? parseFloat(beam) : vessel.beam,
      draft: draft !== undefined ? parseFloat(draft) : vessel.draft,
      grt: grt !== undefined ? parseFloat(grt) : vessel.grt,
      status: status || vessel.status
    });

    await logActivity(req, 'VESSEL_CALL_UPDATED', `Voyage call updated: ${vessel.vesselName} (VCN: ${vessel.vcn})`);
    return res.json(vessel);
  } catch (error) {
    console.error('Error updating vessel call:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

exports.deleteVesselCall = async (req, res) => {
  const { id } = req.params;
  const t = await sequelize.transaction();
  try {
    const vessel = await VesselCall.findByPk(id, { transaction: t });
    if (!vessel) {
      await t.rollback();
      return res.status(404).json({ message: 'Vessel Call not found.' });
    }

    // Clean up dependent child records to prevent foreign key errors
    await StowagePlan.destroy({ where: { vcn: vessel.vcn }, transaction: t });
    await StatementOfFact.destroy({ where: { vcn: vessel.vcn }, transaction: t });
    await VesselFalDeclaration.destroy({ where: { vcn: vessel.vcn }, transaction: t });

    await vessel.destroy({ transaction: t });

    await t.commit();

    await logActivity(req, 'VESSEL_CALL_DELETED', `Deleted voyage call: ${vessel.vesselName} (VCN: ${vessel.vcn})`);
    return res.json({ message: 'Vessel Call successfully deleted.' });
  } catch (error) {
    await t.rollback();
    console.error('Error deleting vessel call:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};



