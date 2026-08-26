const { Cargo, CustomsClearance, Warehouse, YardLocation, Inventory, Notification, Invoice, VesselCall, sequelize } = require('../models');
const { logActivity } = require('../utils/logger');
const { saveFileToPostgres } = require('../utils/fileStorage');
const { Op } = require('sequelize');

// Get all cargo with filtering, searching, and pagination
exports.getCargoes = async (req, res) => {
  const { search, type, status, page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  const whereClause = {};

  if (search) {
    const likeOp = Op.iLike || Op.like;
    whereClause[Op.or] = [
      { cargoId: { [likeOp]: `%${search}%` } },
      { consignee: { [likeOp]: `%${search}%` } }
    ];
  }

  if (type) {
    whereClause.cargoType = type;
  }

  if (status) {
    whereClause.status = status;
  }

  try {
    const { count, rows } = await Cargo.findAndCountAll({
      where: whereClause,
      include: [{ model: Warehouse }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    return res.json({
      cargoes: rows,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Get cargo error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Get single cargo details
exports.getCargoById = async (req, res) => {
  const { id } = req.params;

  try {
    const cargo = await Cargo.findByPk(id, {
      include: [
        { model: Warehouse },
        { model: CustomsClearance },
        {
          model: Inventory,
          include: [Warehouse, YardLocation]
        }
      ]
    });

    if (!cargo) {
      return res.status(404).json({ message: 'Cargo not found.' });
    }

    return res.json(cargo);
  } catch (error) {
    console.error('Get cargo details error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Upload Cargo Manifest (Creates new cargo records)
exports.uploadManifest = async (req, res) => {
  const { 
    cargoId, manifestNumber, vesselName, cargoType, quantity, weight, consignee, 
    containerNo, destination, tradeType, originType, commodityType, billOfLading, shippingBill, digitalSignature,
    sealNumber, volume, shipper, notifyParty, billOfEntryNo, customsBrokerId, hazmatClass, isDamaged, damageRemarks
  } = req.body;
  const file = req.file;

  try {
    if (!cargoId || !cargoType || quantity === undefined || weight === undefined || !consignee) {
      return res.status(400).json({ message: 'All cargo details are required.' });
    }

    const parsedWeight = parseFloat(weight);
    const parsedQuantity = parseFloat(quantity);

    if (isNaN(parsedWeight) || parsedWeight <= 0 || isNaN(parsedQuantity) || parsedQuantity <= 0) {
      return res.status(400).json({ message: 'Cargo weight and quantity must be valid positive numbers greater than 0.' });
    }

    // Check if cargoId already exists
    const existing = await Cargo.findOne({ where: { cargoId } });
    if (existing) {
      return res.status(400).json({ message: `Cargo ID ${cargoId} already exists in manifest database.` });
    }

    // Auto-create/approve hidden VesselCall for database integrity
    const finalVesselName = vesselName || 'Generic Vessel';
    let vessel = await VesselCall.findOne({ where: { vesselName: finalVesselName } });
    if (!vessel) {
      const generatedVcn = `VCN-${finalVesselName.replace(/\s+/g, '-').toUpperCase()}-${Date.now().toString().slice(-4)}`;
      vessel = await VesselCall.create({
        vcn: generatedVcn,
        vesselName: finalVesselName,
        flag: 'India',
        vesselType: 'Container',
        eta: new Date(),
        berthSpecification: 'Berth 1',
        status: 'BERTHED',
        isDischargeAllowed: true,
        vesselDuesSettled: true,
        pilotageStatus: 'Approved',
        tugStatus: 'Approved',
        berthingStatus: 'Approved',
        userId: req.user.id
      });
    }

    // Create Cargo
    const cargo = await Cargo.create({
      cargoId,
      manifestNumber,
      vesselName: finalVesselName,
      cargoType,
      quantity: Math.round(parsedQuantity),
      weight: parsedWeight,
      consignee,
      status: 'Manifest Uploaded',
      containerNo,
      destination,
      tradeType: tradeType || 'Import',
      originType: originType || 'Foreign',
      commodityType: commodityType || 'General',
      billOfLading,
      shippingBill,
      digitalSignature,
      sealNumber,
      volume: volume ? parseFloat(volume) : null,
      shipper,
      notifyParty,
      billOfEntryNo,
      customsBrokerId,
      hazmatClass,
      isDamaged: isDamaged === 'true' || isDamaged === true,
      damageRemarks,
      entryTime: new Date()
    });

    let storedDocumentUrl = 'manifest_attached.pdf';
    if (file) {
      storedDocumentUrl = await saveFileToPostgres(file, 'manifest');
    }

    // Create pending customs clearance
    await CustomsClearance.create({
      cargoId: cargo.id,
      documentUrl: storedDocumentUrl,
      status: 'Pending',
      remarks: 'Cargo manifest uploaded. Awaiting document verification.'
    });

    // Trigger Notification for Port Operations & Customs
    await logActivity(
      req,
      'MANIFEST_UPLOAD',
      `Manifest uploaded for Cargo: ${cargoId}. Container: ${containerNo || 'N/A'}. Trade: ${tradeType || 'Import'}.`,
      'Port Operations Officer',
      `New cargo ${cargoId} is registered. Ready for unloading.`
    );

    return res.status(201).json({
      message: 'Manifest uploaded successfully.',
      cargo
    });
  } catch (error) {
    console.error('Manifest upload error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Unload Cargo from Ship
exports.unloadCargo = async (req, res) => {
  const { id } = req.params;
  const { unloadingEquipment } = req.body;

  try {
    const cargo = await Cargo.findByPk(id);
    if (!cargo) {
      return res.status(404).json({ message: 'Cargo not found.' });
    }

    if (!['Manifest Uploaded', 'MANIFESTED', 'Unloaded'].includes(cargo.status)) {
      return res.status(400).json({ message: `Cannot unload cargo with status ${cargo.status}. Cargo is already staged or dispatched.` });
    }

    // Update Status
    cargo.status = 'Unloaded';
    if (unloadingEquipment) {
      cargo.unloadingEquipment = unloadingEquipment;
    }
    await cargo.save();

    await logActivity(
      req,
      'CARGO_UNLOAD',
      `Cargo ${cargo.cargoId} unloaded using ${unloadingEquipment || 'default equipment'}.`,
      'Warehouse Manager',
      `Cargo ${cargo.cargoId} is unloaded using ${unloadingEquipment || 'default equipment'}. Space allocation required.`
    );

    return res.json({ message: 'Cargo unloaded successfully.', cargo });
  } catch (error) {
    console.error('Unload cargo error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Assign Warehouse / Yard Location
exports.assignWarehouse = async (req, res) => {
  const { id } = req.params;
  const { warehouseId, yardLocationId, binCode, rowNum, colNum, tierNum } = req.body;

  const t = await sequelize.transaction();

  try {
    const cargo = await Cargo.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!cargo) {
      await t.rollback();
      return res.status(404).json({ message: 'Cargo not found.' });
    }

    if (['GATE_OUT', 'Dispatched'].includes(cargo.status)) {
      await t.rollback();
      return res.status(400).json({ message: `Cannot allocate storage for already evacuated cargo.` });
    }

    const warehouse = await Warehouse.findByPk(warehouseId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!warehouse) {
      await t.rollback();
      return res.status(404).json({ message: 'Warehouse not found.' });
    }

    if (warehouse.availableSpace < cargo.weight) {
      await t.rollback();
      return res.status(400).json({ message: 'Insufficient capacity in selected warehouse.' });
    }

    let yardLoc = null;
    if (yardLocationId) {
      yardLoc = await YardLocation.findByPk(yardLocationId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!yardLoc) {
        await t.rollback();
        return res.status(404).json({ message: 'Yard location not found.' });
      }
      if (yardLoc.capacity - yardLoc.occupiedSpace < cargo.weight) {
        await t.rollback();
        return res.status(400).json({ message: 'Insufficient capacity in selected Yard zone.' });
      }
    }

    // If re-allocating from another warehouse, refund previous space
    if (cargo.warehouseId && cargo.warehouseId !== parseInt(warehouseId)) {
      const prevWh = await Warehouse.findByPk(cargo.warehouseId, { transaction: t });
      if (prevWh) {
        prevWh.occupiedSpace = Math.max(0, prevWh.occupiedSpace - cargo.weight);
        prevWh.availableSpace = Math.min(prevWh.capacity, prevWh.availableSpace + cargo.weight);
        await prevWh.save({ transaction: t });
      }
    }

    // Update cargo allocation
    cargo.warehouseId = warehouseId;
    if (binCode) {
      cargo.binCode = binCode;
    }
    if (!['RELEASE_READY', 'Customs Approved', 'CUSTOMS_HOLD'].includes(cargo.status)) {
      cargo.status = 'YARD_STAGED';
    }
    await cargo.save({ transaction: t });

    // Deduct warehouse space
    warehouse.occupiedSpace += cargo.weight;
    warehouse.availableSpace -= cargo.weight;
    await warehouse.save({ transaction: t });

    // Deduct yard location space
    if (yardLoc) {
      yardLoc.occupiedSpace += cargo.weight;
      await yardLoc.save({ transaction: t });
    }

    // Create Inventory Entry
    await Inventory.create({
      cargoId: cargo.id,
      warehouseId: warehouseId,
      yardLocationId: yardLocationId || null,
      quantity: cargo.quantity,
      weight: cargo.weight,
      rowNum: rowNum ? parseInt(rowNum) : null,
      colNum: colNum ? parseInt(colNum) : null,
      tierNum: tierNum ? parseInt(tierNum) : null,
      lastMovedAt: new Date()
    }, { transaction: t });

    await t.commit();

    await logActivity(
      req,
      'STORAGE_ALLOCATION',
      `Allocated Cargo ${cargo.cargoId} to ${warehouse.name} ${yardLoc ? `zone ${yardLoc.zoneCode}` : ''} ${binCode ? `position ${binCode}` : ''}`,
      'Customs Officer',
      `Cargo ${cargo.cargoId} is allocated to storage. Ready for Customs verification.`
    );

    return res.json({ message: 'Warehouse allocated and inventory recorded.', cargo });
  } catch (error) {
    await t.rollback();
    console.error('Assign warehouse error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Bulk Cargo Manifest Upload (creates multiple cargo + customs clearance records)
exports.uploadBulkManifest = async (req, res) => {
  const { vesselName, tradeType, consignee, containers } = req.body;

  try {
    if (!vesselName || !consignee || !containers || !Array.isArray(containers) || containers.length === 0) {
      return res.status(400).json({ message: 'Vessel name, consignee, and container list are required.' });
    }

    // Auto-create/approve hidden VesselCall for database integrity
    const finalVesselName = vesselName || 'Generic Vessel';
    let vessel = await VesselCall.findOne({ where: { vesselName: finalVesselName } });
    if (!vessel) {
      const generatedVcn = `VCN-${finalVesselName.replace(/\s+/g, '-').toUpperCase()}-${Date.now().toString().slice(-4)}`;
      vessel = await VesselCall.create({
        vcn: generatedVcn,
        vesselName: finalVesselName,
        flag: 'India',
        vesselType: 'Container',
        eta: new Date(),
        berthSpecification: 'Berth 1',
        status: 'BERTHED',
        isDischargeAllowed: true,
        vesselDuesSettled: true,
        pilotageStatus: 'Approved',
        tugStatus: 'Approved',
        berthingStatus: 'Approved',
        userId: req.user.id
      });
    }

    const createdCargoes = [];

    for (const item of containers) {
      const { 
        containerNo, cargoType, weight, destination, billOfLading, shippingBill, digitalSignature,
        sealNumber, volume, shipper, notifyParty, billOfEntryNo, customsBrokerId
      } = item;

      if (!containerNo || !cargoType || !weight || parseFloat(weight) <= 0) {
        continue; // skip incomplete or invalid rows with non-positive weight
      }

      // Generate a unique Cargo ID for each
      const uniqueId = `CRG-MNGPRT-${Date.now().toString().slice(-4)}-${Math.floor(100 + Math.random() * 900)}`;

      const cargo = await Cargo.create({
        cargoId: uniqueId,
        vesselName,
        cargoType,
        quantity: 1,
        weight: parseFloat(weight),
        consignee,
        status: 'Manifest Uploaded',
        containerNo,
        destination,
        tradeType: tradeType || 'Import',
        billOfLading: billOfLading || `BL-${Date.now().toString().slice(-4)}`,
        shippingBill,
        digitalSignature,
        sealNumber,
        volume: volume ? parseFloat(volume) : null,
        shipper,
        notifyParty,
        billOfEntryNo,
        customsBrokerId,
        entryTime: new Date()
      });

      await CustomsClearance.create({
        cargoId: cargo.id,
        documentUrl: 'bulk_manifest_attached.pdf',
        status: 'Pending',
        remarks: 'Bulk cargo manifest entry. Awaiting verification.'
      });

      createdCargoes.push(cargo);
    }

    await logActivity(
      req,
      'BULK_MANIFEST_UPLOAD',
      `Uploaded bulk manifest for Vessel: ${vesselName} containing ${createdCargoes.length} containers.`,
      'Port Operations Officer',
      `Bulk manifest processed for vessel ${vesselName}.`
    );

    return res.status(201).json({
      message: `Bulk manifest uploaded successfully. Created ${createdCargoes.length} cargo logs.`,
      cargoes: createdCargoes
    });
  } catch (error) {
    console.error('Bulk manifest upload error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Generate Delivery Order (DO) after customs clearance & billing invoice is paid
exports.generateDeliveryOrder = async (req, res) => {
  const { id } = req.params;

  try {
    const cargo = await Cargo.findByPk(id, {
      include: [{ model: CustomsClearance }]
    });

    if (!cargo) {
      return res.status(404).json({ message: 'Cargo consignment not found.' });
    }

    // Verify customs cleared & check for Emergency Customs Seizure
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

    if (!['RELEASE_READY', 'Customs Approved', 'YARD_STAGED', 'Allocated'].includes(cargo.status) && cargo.customsHoldStatus !== 'RELEASED') {
      return res.status(400).json({ message: `Cannot generate Delivery Order. Cargo status is ${cargo.status}. Customs release is required.` });
    }

    // Verify billing payment completed
    const invoice = await Invoice.findOne({ where: { cargoId: cargo.id } });
    if (!invoice || !['PAID', 'Paid'].includes(invoice.status)) {
      return res.status(400).json({ message: `Settle outstanding invoice ${invoice ? invoice.invoiceNumber : 'N/A'} to generate Delivery Order.` });
    }

    // Generate DO Number and set status to RELEASE_READY / Dispatched
    const deliveryOrderNo = `DO-MNGPRT-${cargo.cargoId}-${Date.now().toString().slice(-4)}`;
    cargo.deliveryOrderNo = deliveryOrderNo;
    cargo.status = 'RELEASE_READY';
    cargo.financeClearanceStatus = 'RELEASED';
    await cargo.save();

    // Clear yard inventory & free warehouse space once EDO is provided
    if (cargo.warehouseId) {
      const warehouse = await Warehouse.findByPk(cargo.warehouseId);
      if (warehouse) {
        warehouse.occupiedCapacity = Math.max(0, (warehouse.occupiedCapacity || 0) - (cargo.weight || 0));
        await warehouse.save();
      }
    }
    await Inventory.destroy({ where: { cargoId: cargo.id } });

    await logActivity(
      req,
      'DELIVERY_ORDER_GENERATED',
      `Issued Delivery Order: ${deliveryOrderNo} for Cargo consignment: ${cargo.cargoId}.`,
      'Shipping Agent',
      `Delivery Order ${deliveryOrderNo} generated. Ready for gate exit.`
    );

    return res.json({
      message: `Delivery Order generated successfully.`,
      deliveryOrderNo,
      cargo
    });
  } catch (error) {
    console.error('Delivery order generation error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Admin Override of Customs/Finance holds
exports.adminOverride = async (req, res) => {
  const { cargoId, reason } = req.body;

  try {
    if (!cargoId) {
      return res.status(400).json({ message: 'Cargo ID is required.' });
    }

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({ message: 'A detailed justification (at least 10 characters) is required for admin overrides.' });
    }

    const cargo = await Cargo.findOne({ where: { cargoId } });
    if (!cargo) {
      return res.status(404).json({ message: 'Cargo not found.' });
    }

    // Bypass holds
    cargo.customsHoldStatus = 'RELEASED';
    cargo.financeClearanceStatus = 'RELEASED';
    if (cargo.status === 'Manifest Uploaded' || cargo.status === 'Unloaded' || cargo.status === 'Allocated') {
      cargo.status = 'Customs Approved'; // advance status to enable e-DO
    }
    if (!cargo.deliveryOrderNo) {
      cargo.deliveryOrderNo = `DO-MNGPRT-${cargo.cargoId}-${Date.now().toString().slice(-4)}`;
    }
    await cargo.save();

    await logActivity(
      req,
      'ADMIN_OVERRIDE',
      `Super Admin bypassed Customs & Finance holds for cargo: ${cargoId}. Reason: ${reason}`
    );

    return res.json({ 
      message: `System holds bypassed successfully. Cargo ${cargoId} is now cleared for e-DO generation.`,
      cargo 
    });
  } catch (error) {
    console.error('Admin override error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

exports.updateCargo = async (req, res) => {
  const { id } = req.params;
  const { 
    manifestNumber, cargoId, billOfLading, cargoDescription, 
    commodityType, originType, cargoType, shipper, notifyParty, 
    consignee, quantity, weight, volume, sealNumber, containerNo, 
    hazmatClass, isDamaged, damageRemarks, destination
  } = req.body;

  try {
    const cargo = await Cargo.findByPk(id);
    if (!cargo) {
      return res.status(404).json({ message: 'Cargo consignment not found.' });
    }

    if (weight !== undefined && parseFloat(weight) <= 0) {
      return res.status(400).json({ message: 'Cargo weight must be a positive number greater than 0.' });
    }

    if (quantity !== undefined && parseInt(quantity) <= 0) {
      return res.status(400).json({ message: 'Cargo quantity must be a positive number greater than 0.' });
    }

    if (billOfLading && billOfLading !== cargo.billOfLading) {
      const existing = await Cargo.findOne({ where: { billOfLading } });
      if (existing) {
        return res.status(400).json({ message: `Bill of Lading ${billOfLading} already exists.` });
      }
    }

    if (cargoId && cargoId !== cargo.cargoId) {
      const existing = await Cargo.findOne({ where: { cargoId } });
      if (existing) {
        return res.status(400).json({ message: `Cargo ID ${cargoId} already exists.` });
      }
    }

    await cargo.update({
      manifestNumber: manifestNumber !== undefined ? manifestNumber : cargo.manifestNumber,
      cargoId: cargoId || cargo.cargoId,
      billOfLading: billOfLading || cargo.billOfLading,
      cargoDescription: cargoDescription !== undefined ? cargoDescription : cargo.cargoDescription,
      commodityType: commodityType || cargo.commodityType,
      originType: originType || cargo.originType,
      cargoType: cargoType || cargo.cargoType,
      shipper: shipper !== undefined ? shipper : cargo.shipper,
      notifyParty: notifyParty !== undefined ? notifyParty : cargo.notifyParty,
      consignee: consignee || cargo.consignee,
      quantity: quantity !== undefined ? parseInt(quantity) : cargo.quantity,
      weight: weight !== undefined ? parseFloat(weight) : cargo.weight,
      volume: volume !== undefined ? parseFloat(volume) : cargo.volume,
      sealNumber: sealNumber !== undefined ? sealNumber : cargo.sealNumber,
      containerNo: containerNo !== undefined ? containerNo : cargo.containerNo,
      hazmatClass: hazmatClass !== undefined ? hazmatClass : cargo.hazmatClass,
      isDamaged: isDamaged !== undefined ? !!isDamaged : cargo.isDamaged,
      damageRemarks: damageRemarks !== undefined ? damageRemarks : cargo.damageRemarks,
      destination: destination !== undefined ? destination : cargo.destination
    });

    await logActivity(req, 'CARGO_UPDATED', `Cargo updated: ${cargo.cargoId} (BL: ${cargo.billOfLading})`);
    return res.json(cargo);
  } catch (error) {
    console.error('Error updating cargo:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

exports.deleteCargo = async (req, res) => {
  const { id } = req.params;
  try {
    const cargo = await Cargo.findByPk(id);
    if (!cargo) {
      return res.status(404).json({ message: 'Cargo consignment not found.' });
    }

    // Release allocated warehouse space if currently assigned
    if (cargo.warehouseId) {
      const warehouse = await Warehouse.findByPk(cargo.warehouseId);
      if (warehouse) {
        warehouse.occupiedSpace = Math.max(0, warehouse.occupiedSpace - cargo.weight);
        warehouse.availableSpace = Math.min(warehouse.capacity, warehouse.availableSpace + cargo.weight);
        await warehouse.save();
      }
    }

    // Clean up dependent child records to prevent foreign key errors
    await CustomsClearance.destroy({ where: { cargoId: cargo.id } });
    await Inventory.destroy({ where: { cargoId: cargo.id } });
    await Invoice.destroy({ where: { cargoId: cargo.id } });

    await cargo.destroy();
    await logActivity(req, 'CARGO_DELETED', `Deleted cargo manifest entry: ${cargo.cargoId}`);
    return res.json({ message: 'Cargo manifest entry successfully deleted.' });
  } catch (error) {
    console.error('Error deleting cargo:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Dispatch cargo consignment and decrement warehouse inventory
exports.dispatchCargo = async (req, res) => {
  const { id } = req.params;

  try {
    const cargo = await Cargo.findByPk(id, {
      include: [
        { model: Warehouse },
        { model: CustomsClearance },
        { model: Invoice }
      ]
    });

    if (!cargo) {
      return res.status(404).json({ message: 'Cargo consignment not found.' });
    }

    // 1. Verify invoice status
    const paidInvoice = await Invoice.findOne({ where: { cargoId: cargo.id, status: 'Paid' } });
    if (!paidInvoice && cargo.status !== 'Dispatched') {
      return res.status(400).json({ 
        message: 'Dispatch Restricted: Outstanding invoices found. Storage charges and handling fees must be paid before dispatch.' 
      });
    }

    // 2. Verify customs status (Recorded status: Cleared / RELEASED / Customs Approved)
    const customs = await CustomsClearance.findOne({ where: { cargoId: cargo.id } });
    const isCustomsCleared = cargo.customsHoldStatus === 'RELEASED' || 
                             cargo.status === 'Customs Approved' || 
                             (customs && (customs.status === 'Approved' || customs.status === 'Cleared'));

    if (!isCustomsCleared) {
      return res.status(400).json({ 
        message: 'Dispatch Restricted: Customs clearance status is currently Pending or on Hold.' 
      });
    }

    // 3. Update cargo status
    cargo.status = 'Dispatched';
    cargo.exitTime = new Date();
    await cargo.save();

    // 4. Automatically decrement warehouse occupied capacity & inventory
    if (cargo.warehouseId) {
      const warehouse = await Warehouse.findByPk(cargo.warehouseId);
      if (warehouse) {
        warehouse.occupiedCapacity = Math.max(0, (warehouse.occupiedCapacity || 0) - cargo.weight);
        await warehouse.save();
      }
    }

    const inventory = await Inventory.findOne({ where: { cargoId: cargo.id } });
    if (inventory) {
      inventory.status = 'DISPATCHED';
      inventory.quantity = 0;
      await inventory.save();
    }

    const releasePassNo = `REL-MNGPRT-${Date.now().toString().slice(-6)}`;

    await logActivity(
      req,
      'CARGO_DISPATCHED',
      `Cargo ${cargo.cargoId} (${cargo.weight} MT) released & dispatched. Release Pass No: ${releasePassNo}. Consignee: ${cargo.consignee}`
    );

    return res.json({
      message: 'Cargo dispatch verified and completed successfully. Warehouse inventory released.',
      releasePassNumber: releasePassNo,
      cargo
    });
  } catch (error) {
    console.error('Dispatch cargo error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

