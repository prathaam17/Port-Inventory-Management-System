const { Warehouse, YardLocation, Cargo, Inventory, VesselCall, DischargedInventoryLog, InventoryAdjustmentLog, User, InternalMoveLog, StowagePlan, ContainerOperationLog, ReeferLog } = require('../models');
const { logActivity } = require('../utils/logger');

// Get all warehouses with yard locations
exports.getWarehouses = async (req, res) => {
  try {
    const warehouses = await Warehouse.findAll({
      include: [{ model: YardLocation }]
    });
    return res.json(warehouses);
  } catch (error) {
    console.error('Get warehouses error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Get single warehouse by ID
exports.getWarehouseById = async (req, res) => {
  const { id } = req.params;
  try {
    const warehouse = await Warehouse.findByPk(id, {
      include: [
        { model: YardLocation },
        { 
          model: Cargo,
          where: { status: 'Allocated' },
          include: [{ model: Inventory }],
          required: false
        }
      ]
    });

    if (!warehouse) {
      return res.status(404).json({ message: 'Warehouse not found.' });
    }

    return res.json(warehouse);
  } catch (error) {
    console.error('Get warehouse details error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Mark cargo as damaged
exports.reportDamage = async (req, res) => {
  const { cargoId, remarks } = req.body;

  try {
    const cargo = await Cargo.findOne({ where: { cargoId } });
    if (!cargo) {
      return res.status(404).json({ message: 'Cargo not found.' });
    }

    cargo.isDamaged = true;
    cargo.damageRemarks = remarks;
    await cargo.save();

    await logActivity(
      req,
      'CARGO_DAMAGE_REPORT',
      `Flagged cargo ${cargo.cargoId} as damaged. Remarks: ${remarks}`,
      'Warehouse Manager',
      `Damage reported on Cargo ${cargo.cargoId}: ${remarks}`
    );

    return res.json({ message: 'Cargo flagged as damaged successfully.', cargo });
  } catch (error) {
    console.error('Report damage error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Get all damaged cargo records
exports.getDamagedCargoReports = async (req, res) => {
  try {
    const damagedCargoes = await Cargo.findAll({
      where: { isDamaged: true },
      include: [{ model: Warehouse }]
    });

    return res.json(damagedCargoes);
  } catch (error) {
    console.error('Get damaged cargo error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Fetch tally logs
exports.getTallyLogs = async (req, res) => {
  const { vcn } = req.query;
  try {
    const filter = vcn ? { vcn } : {};
    const logs = await DischargedInventoryLog.findAll({
      where: filter,
      include: [
        { model: InventoryAdjustmentLog },
        { model: User, as: 'clerk', attributes: ['id', 'username', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    return res.json(logs);
  } catch (error) {
    console.error('Get tally logs error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Create a shift tally record
exports.createTallyLog = async (req, res) => {
  const { 
    vcn, billOfLading, shiftId, actualUnloadedWeight, dischargedCount, cargoConditionRemarks,
    tallySheetId, craneEquipmentId, operatorId, discrepancyType, soundnessCondition,
    timeDischargeStarted, timeDischargeCompleted
  } = req.body;

  try {
    if (!vcn || !billOfLading || !shiftId || actualUnloadedWeight === undefined) {
      return res.status(400).json({ message: 'VCN, Bill of Lading, Shift ID, and Unloaded Weight are required.' });
    }

    if (parseFloat(actualUnloadedWeight) <= 0) {
      return res.status(400).json({ message: 'Actual Unloaded Weight must be positive.' });
    }

    // Verify vessel call status
    let vessel = await VesselCall.findOne({ where: { vcn } });
    if (!vessel) {
      // Auto-create to support direct tallies without separate voyage registry
      vessel = await VesselCall.create({
        vcn,
        vesselName: vcn.replace('VCN-', ''),
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

    // Ensure discharge is always allowed
    vessel.isDischargeAllowed = true;

    // Verify cargo matches BL
    const cargo = await Cargo.findOne({ where: { billOfLading, vesselName: vessel.vesselName } });
    if (!cargo) {
      return res.status(404).json({ message: `Cargo consignment with Bill of Lading ${billOfLading} was not found on the manifest for vessel ${vessel.vesselName}.` });
    }

    // Generate tallySheetId if not provided
    const resolvedTallyId = tallySheetId || `TLY-MNGPRT-${Date.now().toString().slice(-4)}-${Math.floor(100 + Math.random() * 900)}`;

    // Create the tally record (immutable)
    const log = await DischargedInventoryLog.create({
      vcn,
      billOfLading,
      shiftId,
      tallyClerkId: req.user.id,
      actualUnloadedWeight: parseFloat(actualUnloadedWeight),
      dischargedCount: dischargedCount ? parseInt(dischargedCount) : null,
      cargoConditionRemarks,
      tallySheetId: resolvedTallyId,
      craneEquipmentId,
      operatorId,
      discrepancyType: discrepancyType || 'None',
      soundnessCondition: soundnessCondition || 'Sound',
      timeDischargeStarted: timeDischargeStarted ? new Date(timeDischargeStarted) : null,
      timeDischargeCompleted: timeDischargeCompleted ? new Date(timeDischargeCompleted) : null
    });

    // Update cargo status to Unloaded if it was Manifest Uploaded
    if (cargo.status === 'Manifest Uploaded') {
      cargo.status = 'Unloaded';
    }
    
    // Auto flag damage if remarks indicate damage or soundnessCondition is Damaged
    if ((soundnessCondition && soundnessCondition.toLowerCase() === 'damaged') || (cargoConditionRemarks && (
      cargoConditionRemarks.toLowerCase().includes('damaged') || 
      cargoConditionRemarks.toLowerCase().includes('torn') || 
      cargoConditionRemarks.toLowerCase().includes('moisture') || 
      cargoConditionRemarks.toLowerCase().includes('wet')
    ))) {
      cargo.isDamaged = true;
      cargo.damageRemarks = (cargo.damageRemarks ? cargo.damageRemarks + ' | ' : '') + `[Shift Tally: ${shiftId}]: ` + (cargoConditionRemarks || `Soundness condition reported as ${soundnessCondition}`);
    }
    await cargo.save();

    // Mark corresponding StowagePlan cells as discharged
    await StowagePlan.update(
      { discharged: true, dischargeTime: new Date() },
      { where: { vcn, billOfLading } }
    );

    await logActivity(
      req,
      'TALLY_RECORDED',
      `Tally Clerk logged shift discharge: ${actualUnloadedWeight} Tons for BL ${billOfLading} (VCN: ${vcn}) during ${shiftId}. Remarks: ${cargoConditionRemarks || 'Good'}`
    );

    return res.status(201).json({
      message: 'Discharge tally record logged successfully. Record is now immutable.',
      log
    });
  } catch (error) {
    console.error('Create tally log error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Create a tally adjustment log (Authorized by supervisor)
exports.adjustTallyLog = async (req, res) => {
  const { id } = req.params;
  const { adjustedWeight, adjustedCount, reason } = req.body;

  try {
    if (adjustedWeight === undefined || !reason) {
      return res.status(400).json({ message: 'Adjusted Weight and justification reason are required.' });
    }

    if (parseFloat(adjustedWeight) < 0) {
      return res.status(400).json({ message: 'Adjusted Weight cannot be negative.' });
    }

    const tallyLog = await DischargedInventoryLog.findByPk(id);
    if (!tallyLog) {
      return res.status(404).json({ message: 'Discharged tally log record not found.' });
    }

    const originalWeight = tallyLog.actualUnloadedWeight;
    const originalCount = tallyLog.dischargedCount;

    // Create adjustment log
    const adjustment = await InventoryAdjustmentLog.create({
      dischargedInventoryLogId: tallyLog.id,
      adjustedWeight: parseFloat(adjustedWeight),
      adjustedCount: adjustedCount ? parseInt(adjustedCount) : null,
      reason,
      authorizedBySupervisorId: req.user.id
    });

    // Update the tally log
    tallyLog.actualUnloadedWeight = parseFloat(adjustedWeight);
    if (adjustedCount !== undefined) {
      tallyLog.dischargedCount = adjustedCount ? parseInt(adjustedCount) : null;
    }
    await tallyLog.save();

    // Adjust cargo if cargo status is Unloaded or Allocated
    const vessel = await VesselCall.findOne({ where: { vcn: tallyLog.vcn } });
    if (vessel) {
      const cargo = await Cargo.findOne({ where: { billOfLading: tallyLog.billOfLading, vesselName: vessel.vesselName } });
      if (cargo) {
        // Adjust the weight difference on the cargo record if it is still active
        const weightDiff = parseFloat(adjustedWeight) - originalWeight;
        if (cargo.status === 'Unloaded' || cargo.status === 'Allocated') {
          // Adjust cargo weight
          cargo.weight = Math.max(0, cargo.weight + weightDiff);
          await cargo.save();

          // Adjust active inventory if warehouse allocated
          const inventory = await Inventory.findOne({ where: { cargoId: cargo.id } });
          if (inventory) {
            inventory.weight = Math.max(0, inventory.weight + weightDiff);
            await inventory.save();
          }
        }
      }
    }

    await logActivity(
      req,
      'TALLY_ADJUSTED',
      `Yard Supervisor authorized adjustment on Tally Log ID ${tallyLog.id}. Weight changed from ${originalWeight} Tons to ${adjustedWeight} Tons. Reason: ${reason}`
    );

    return res.json({
      message: 'Tally adjustment successfully logged and applied.',
      log: tallyLog,
      adjustment
    });
  } catch (error) {
    console.error('Adjust tally log error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

const isUUID = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

const findCargoByIdOrCode = async (identifier, options = {}) => {
  if (!identifier) return null;
  const strId = String(identifier);
  if (isUUID(strId)) {
    const cargo = await Cargo.findByPk(strId, options);
    if (cargo) return cargo;
  }
  return await Cargo.findOne({ where: { cargoId: strId }, ...options });
};

const findWarehouseByIdOrName = async (identifier, options = {}) => {
  if (!identifier) return null;
  const numId = parseInt(identifier);
  if (!isNaN(numId) && String(numId) === String(identifier).trim()) {
    const wh = await Warehouse.findByPk(numId, options);
    if (wh) return wh;
  }
  return await Warehouse.findOne({ where: { name: String(identifier).trim() }, ...options });
};

const findYardLocationByIdOrCode = async (identifier, options = {}) => {
  if (!identifier) return null;
  const numId = parseInt(identifier);
  if (!isNaN(numId) && String(numId) === String(identifier).trim()) {
    const loc = await YardLocation.findByPk(numId, options);
    if (loc) return loc;
  }
  return await YardLocation.findOne({ where: { zoneCode: String(identifier).trim() }, ...options });
};

// POST /api/warehouses/move
exports.moveCargo = async (req, res) => {
  const { cargoId, forkliftStackerId, sourceWarehouseId, destinationWarehouseId, sourceYardLocationId, destinationYardLocationId, transferredWeight } = req.body;

  try {
    if (!cargoId || !destinationWarehouseId || !transferredWeight) {
      return res.status(400).json({ message: 'Cargo ID, Destination Warehouse, and Transferred Weight are required.' });
    }

    const weightToMove = parseFloat(transferredWeight);
    if (isNaN(weightToMove) || weightToMove <= 0) {
      return res.status(400).json({ message: 'Transferred weight must be a valid positive number.' });
    }

    // Verify Cargo (handles both UUID and cargoId string)
    const cargo = await findCargoByIdOrCode(cargoId);
    if (!cargo) {
      return res.status(404).json({ message: `Cargo consignment ${cargoId} not found.` });
    }

    // Resolve destination warehouse (handles both integer ID and name string)
    const destWh = await findWarehouseByIdOrName(destinationWarehouseId);
    if (!destWh) {
      return res.status(404).json({ message: `Destination warehouse (${destinationWarehouseId}) not found.` });
    }

    // Resolve source warehouse (handles integer ID, name string, or auto-deriving from cargo/inventory)
    let sourceWh = await findWarehouseByIdOrName(sourceWarehouseId);
    if (!sourceWh && cargo.warehouseId) {
      sourceWh = await Warehouse.findByPk(cargo.warehouseId);
    }

    // Find active inventory at source
    let inventory = null;
    if (sourceWh) {
      const sourceYardLoc = await findYardLocationByIdOrCode(sourceYardLocationId);
      inventory = await Inventory.findOne({
        where: {
          cargoId: cargo.id,
          warehouseId: sourceWh.id,
          ...(sourceYardLoc ? { yardLocationId: sourceYardLoc.id } : {})
        }
      });
    }

    // Fallback: If no inventory found for sourceWh, check any active inventory for cargo
    if (!inventory) {
      inventory = await Inventory.findOne({ where: { cargoId: cargo.id } });
      if (inventory) {
        sourceWh = await Warehouse.findByPk(inventory.warehouseId);
      }
    }

    if (!sourceWh) {
      return res.status(400).json({ message: 'Source warehouse could not be determined for this cargo.' });
    }

    // Verify capacity at destination
    if (destWh.availableSpace < weightToMove) {
      return res.status(400).json({ message: `Insufficient capacity in destination warehouse ${destWh.name}. Available: ${destWh.availableSpace} Tons.` });
    }

    // Verify Yard Locations if provided
    const sourceLoc = await findYardLocationByIdOrCode(sourceYardLocationId) || (inventory && inventory.yardLocationId ? await YardLocation.findByPk(inventory.yardLocationId) : null);
    const destLoc = await findYardLocationByIdOrCode(destinationYardLocationId);

    if (destinationYardLocationId && !destLoc) {
      return res.status(404).json({ message: `Destination Yard Location (${destinationYardLocationId}) not found.` });
    }

    if (destLoc && (destLoc.capacity - destLoc.occupiedSpace < weightToMove)) {
      return res.status(400).json({ message: `Insufficient capacity in destination yard slot ${destLoc.zoneCode}.` });
    }

    // If inventory doesn't exist yet, create base inventory entry for cargo
    if (!inventory) {
      inventory = await Inventory.create({
        cargoId: cargo.id,
        warehouseId: sourceWh.id,
        yardLocationId: sourceLoc ? sourceLoc.id : null,
        quantity: cargo.quantity || 1,
        weight: cargo.weight || weightToMove,
        storageDate: new Date(),
        lastMovedAt: new Date()
      });
    }

    if (inventory.weight < weightToMove) {
      return res.status(400).json({ message: `Insufficient weight of this cargo at the source location. Available: ${inventory.weight} Tons.` });
    }

    // Update inventory weights
    inventory.weight -= weightToMove;
    inventory.lastMovedAt = new Date();
    if (inventory.weight <= 0.01) {
      await inventory.destroy();
    } else {
      await inventory.save();
    }

    // Add/Update inventory at destination
    let destInventory = await Inventory.findOne({
      where: {
        cargoId: cargo.id,
        warehouseId: destWh.id,
        yardLocationId: destLoc ? destLoc.id : null
      }
    });

    if (destInventory) {
      destInventory.weight += weightToMove;
      destInventory.lastMovedAt = new Date();
      await destInventory.save();
    } else {
      const uniqueLedgerId = `LEDGER-MNGPRT-${Date.now().toString().slice(-4)}-${Math.floor(100 + Math.random() * 900)}`;
      await Inventory.create({
        ledgerId: uniqueLedgerId,
        cargoId: cargo.id,
        warehouseId: destWh.id,
        yardLocationId: destLoc ? destLoc.id : null,
        quantity: 1,
        weight: weightToMove,
        storageDate: new Date(),
        lastMovedAt: new Date()
      });
    }

    // Adjust warehouse space
    sourceWh.occupiedSpace = Math.max(0, sourceWh.occupiedSpace - weightToMove);
    sourceWh.availableSpace = Math.min(sourceWh.capacity, sourceWh.availableSpace + weightToMove);
    await sourceWh.save();

    destWh.occupiedSpace += weightToMove;
    destWh.availableSpace = Math.max(0, destWh.availableSpace - weightToMove);
    await destWh.save();

    // Adjust yard location space
    if (sourceLoc) {
      sourceLoc.occupiedSpace = Math.max(0, sourceLoc.occupiedSpace - weightToMove);
      await sourceLoc.save();
    }
    if (destLoc) {
      destLoc.occupiedSpace += weightToMove;
      await destLoc.save();
    }

    // Update Cargo's primary warehouse pointer if it is completely moved
    const remainingInventory = await Inventory.findAll({ where: { cargoId: cargo.id } });
    if (remainingInventory.length === 1) {
      cargo.warehouseId = remainingInventory[0].warehouseId;
      await cargo.save();
    }

    // Generate Move Ticket ID
    const moveTicketId = `MOVE-MNGPRT-${Date.now().toString().slice(-4)}-${Math.floor(100 + Math.random() * 900)}`;

    const moveLog = await InternalMoveLog.create({
      moveTicketId,
      cargoId: cargo.id,
      forkliftStackerId,
      sourceWarehouseId: sourceWh.id,
      destinationWarehouseId: destWh.id,
      sourceYardLocationId: sourceLoc ? sourceLoc.id : null,
      destinationYardLocationId: destLoc ? destLoc.id : null,
      transferredWeight: weightToMove,
      timestamp: new Date()
    });

    await logActivity(
      req,
      'INTERNAL_YARD_TRANSFER',
      `Transferred ${weightToMove} Tons of Cargo ${cargo.cargoId} from ${sourceWh.name} to ${destWh.name}. Stacker ID: ${forkliftStackerId || 'N/A'}. Move Ticket: ${moveTicketId}`
    );

    return res.status(201).json({
      message: 'Internal yard transfer successfully logged and stock balanced.',
      moveLog
    });

  } catch (error) {
    console.error('Internal yard transfer error stack:', error.stack || error);
    return res.status(500).json({ message: error.message || 'Internal Server Error.' });
  }
};

// GET /api/warehouses/moves
exports.getMoveLogs = async (req, res) => {
  try {
    const moves = await InternalMoveLog.findAll({
      include: [
        { model: Cargo },
        { model: Warehouse, as: 'sourceWarehouse' },
        { model: Warehouse, as: 'destinationWarehouse' },
        { model: YardLocation, as: 'sourceYardLocation' },
        { model: YardLocation, as: 'destinationYardLocation' }
      ],
      order: [['createdAt', 'DESC']]
    });
    return res.json(moves);
  } catch (error) {
    console.error('Get move logs error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Stuffing / De-stuffing controller methods
exports.deStuffContainer = async (req, res) => {
  const { cargoId, containerNo, weight, warehouseId, yardLocationId, remarks } = req.body;
  try {
    if (!cargoId || !weight) {
      return res.status(400).json({ message: 'Cargo ID and Weight are required.' });
    }

    let cargo = await Cargo.findByPk(cargoId);
    if (!cargo) {
      cargo = await Cargo.findOne({ where: { cargoId } });
    }
    if (!cargo) return res.status(404).json({ message: 'Cargo not found.' });

    let resolvedWhId = warehouseId || cargo.warehouseId;
    if (!resolvedWhId) {
      const firstWh = await Warehouse.findOne();
      resolvedWhId = firstWh ? firstWh.id : 1;
    }

    const wh = await Warehouse.findByPk(resolvedWhId);
    if (!wh) return res.status(404).json({ message: 'Warehouse not found.' });

    const resolvedContainerNo = containerNo || cargo.containerNo || 'DESTUFF-AUTO';
    const opWeight = parseFloat(weight);

    let yardLoc = null;
    if (yardLocationId) {
      yardLoc = await YardLocation.findByPk(yardLocationId);
    }

    // Create container operation log
    const log = await ContainerOperationLog.create({
      cargoId: cargo.id,
      operationType: 'DE_STUFFING',
      containerNo: resolvedContainerNo,
      weight: opWeight,
      warehouseId: parseInt(wh.id),
      yardLocationId: yardLoc ? parseInt(yardLoc.id) : null,
      remarks: remarks || 'Container de-stuffing logged',
      loggedBy: req.user.id
    });

    // Update warehouse capacity
    wh.occupiedSpace += opWeight;
    wh.availableSpace = Math.max(0, wh.availableSpace - opWeight);
    await wh.save();

    if (yardLoc) {
      yardLoc.occupiedSpace += opWeight;
      await yardLoc.save();
    }

    // Create or update inventory
    let inv = await Inventory.findOne({
      where: { cargoId: cargo.id }
    });

    if (inv) {
      inv.weight += opWeight;
      await inv.save();
    } else {
      const ledgerId = `LEDGER-MNGPRT-${Date.now().toString().slice(-4)}-${Math.floor(100 + Math.random() * 900)}`;
      await Inventory.create({
        ledgerId,
        cargoId: cargo.id,
        warehouseId: wh.id,
        yardLocationId: yardLoc ? yardLoc.id : null,
        weight: opWeight,
        quantity: 1,
        storageDate: new Date()
      });
    }

    // Update cargo type and location
    cargo.cargoType = 'Break Bulk';
    cargo.warehouseId = wh.id;
    await cargo.save();

    await logActivity(req, 'CONTAINER_DESTUFFED', `De-stuffed container ${resolvedContainerNo} of cargo ${cargo.cargoId} at ${wh.name}. Weight: ${opWeight} Tons.`);

    return res.status(201).json({ message: 'Container successfully de-stuffed.', log });
  } catch (error) {
    console.error('De-stuff container error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

exports.stuffContainer = async (req, res) => {
  const { cargoId, containerNo, weight, warehouseId, yardLocationId, remarks } = req.body;
  try {
    if (!cargoId || !containerNo || !weight) {
      return res.status(400).json({ message: 'Cargo ID, Container No, and Weight are required.' });
    }

    let cargo = await Cargo.findByPk(cargoId);
    if (!cargo) {
      cargo = await Cargo.findOne({ where: { cargoId } });
    }
    if (!cargo) return res.status(404).json({ message: 'Cargo not found.' });

    let resolvedWhId = warehouseId || cargo.warehouseId;
    if (!resolvedWhId) {
      const firstWh = await Warehouse.findOne();
      resolvedWhId = firstWh ? firstWh.id : 1;
    }

    const wh = await Warehouse.findByPk(resolvedWhId);
    if (!wh) return res.status(404).json({ message: 'Warehouse not found.' });

    let yardLoc = null;
    if (yardLocationId) {
      yardLoc = await YardLocation.findByPk(yardLocationId);
    }

    const opWeight = parseFloat(weight);

    // Verify or auto-create inventory
    let inv = await Inventory.findOne({
      where: { cargoId: cargo.id }
    });

    if (!inv) {
      inv = await Inventory.create({
        cargoId: cargo.id,
        warehouseId: wh.id,
        weight: cargo.weight || opWeight,
        quantity: cargo.quantity || 1
      });
    }

    // Create container operation log
    const log = await ContainerOperationLog.create({
      cargoId: cargo.id,
      operationType: 'STUFFING',
      containerNo,
      weight: opWeight,
      warehouseId: parseInt(wh.id),
      yardLocationId: yardLoc ? parseInt(yardLoc.id) : null,
      remarks: remarks || 'Container stuffing logged',
      loggedBy: req.user.id
    });

    // Deduct warehouse capacity
    wh.occupiedSpace = Math.max(0, wh.occupiedSpace - opWeight);
    wh.availableSpace = Math.min(wh.capacity, wh.availableSpace + opWeight);
    await wh.save();

    if (yardLoc) {
      yardLoc.occupiedSpace = Math.max(0, yardLoc.occupiedSpace - opWeight);
      await yardLoc.save();
    }

    // Deduct inventory
    inv.weight = Math.max(0, inv.weight - opWeight);
    await inv.save();

    // Update cargo type and containerNo
    cargo.cargoType = 'Container';
    cargo.containerNo = containerNo;
    await cargo.save();

    await logActivity(req, 'CONTAINER_STUFFED', `Stuffed cargo ${cargo.cargoId} into container ${containerNo} at ${wh.name}. Weight: ${opWeight} Tons.`);

    return res.status(201).json({ message: 'Container successfully stuffed.', log });
  } catch (error) {
    console.error('Stuff container error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

exports.getContainerOperations = async (req, res) => {
  try {
    const logs = await ContainerOperationLog.findAll({
      include: [{ model: Cargo }, { model: Warehouse }],
      order: [['createdAt', 'DESC']]
    });
    return res.json(logs);
  } catch (error) {
    console.error('Get container operations error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

exports.allocateYardLocation = async (req, res) => {
  const { cargoId, warehouseId, yardLocationId, weight } = req.body;
  try {
    if (!cargoId || !warehouseId || !weight) {
      return res.status(400).json({ message: 'Cargo ID, Warehouse ID, and Weight are required.' });
    }

    const cargo = await Cargo.findByPk(cargoId);
    if (!cargo) return res.status(404).json({ message: 'Cargo not found.' });

    const wh = await Warehouse.findByPk(warehouseId);
    if (!wh) return res.status(404).json({ message: 'Warehouse not found.' });

    let yardLoc = null;
    if (yardLocationId) {
      yardLoc = await YardLocation.findByPk(yardLocationId);
      if (!yardLoc) return res.status(404).json({ message: 'Yard coordinate location not found.' });
    }

    const opWeight = parseFloat(weight);
    if (wh.availableSpace < opWeight) {
      return res.status(400).json({ message: `Insufficient capacity in warehouse. Available: ${wh.availableSpace} Tons.` });
    }

    // Update warehouse capacity
    wh.occupiedSpace += opWeight;
    wh.availableSpace = Math.max(0, wh.availableSpace - opWeight);
    await wh.save();

    if (yardLoc) {
      yardLoc.occupiedSpace += opWeight;
      await yardLoc.save();
    }

    // Create inventory ledger record
    const ledgerId = `LEDGER-MNGPRT-${Date.now().toString().slice(-4)}-${Math.floor(100 + Math.random() * 900)}`;
    await Inventory.create({
      ledgerId,
      cargoId: cargo.id,
      warehouseId: parseInt(warehouseId),
      yardLocationId: yardLocationId ? parseInt(yardLocationId) : null,
      weight: opWeight,
      quantity: 1,
      storageDate: new Date()
    });

    // Update cargo status & location
    cargo.status = 'Allocated';
    cargo.warehouseId = parseInt(warehouseId);
    await cargo.save();

    // Create an initial move log for traceability
    const moveTicketId = `MOVE-MNGPRT-${Date.now().toString().slice(-4)}-${Math.floor(100 + Math.random() * 900)}`;
    await InternalMoveLog.create({
      moveTicketId,
      cargoId: cargo.id,
      sourceWarehouseId: parseInt(warehouseId),
      destinationWarehouseId: parseInt(warehouseId),
      sourceYardLocationId: yardLocationId ? parseInt(yardLocationId) : null,
      destinationYardLocationId: yardLocationId ? parseInt(yardLocationId) : null,
      transferredWeight: opWeight,
      timestamp: new Date()
    });

    await logActivity(req, 'CARGO_YARD_ALLOCATED', `Allocated Cargo ${cargo.cargoId} to ${wh.name} (Zone: ${yardLoc ? yardLoc.zoneCode : 'Bulk Area'})`);

    return res.status(201).json({ message: 'Cargo successfully allocated to yard plot coordinate.', cargo });
  } catch (error) {
    console.error('Allocate yard location error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Adjust Inventory weight (Stock Auditing)
exports.adjustInventory = async (req, res) => {
  const { id } = req.params;
  const { adjustedWeight, reason } = req.body;

  try {
    if (adjustedWeight === undefined || parseFloat(adjustedWeight) < 0 || !reason) {
      return res.status(400).json({ message: 'Valid adjusted weight and reasoning justification are required.' });
    }

    const inventory = await Inventory.findByPk(id, { include: [Cargo, Warehouse, YardLocation] });
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory record not found.' });
    }

    const originalWeight = inventory.weight;
    const weightDiff = parseFloat(adjustedWeight) - originalWeight;

    // 1. Update Inventory Ledger
    inventory.weight = parseFloat(adjustedWeight);
    if (parseFloat(adjustedWeight) <= 0.05) {
      await inventory.destroy();
    } else {
      await inventory.save();
    }

    // 2. Adjust Cargo weight
    if (inventory.Cargo) {
      inventory.Cargo.weight = Math.max(0, inventory.Cargo.weight + weightDiff);
      if (parseFloat(adjustedWeight) <= 0.05) {
        inventory.Cargo.status = 'Dispatched';
      }
      await inventory.Cargo.save();
    }

    // 3. Adjust Warehouse Capacity
    if (inventory.Warehouse) {
      inventory.Warehouse.occupiedSpace = Math.max(0, inventory.Warehouse.occupiedSpace + weightDiff);
      inventory.Warehouse.availableSpace = Math.min(inventory.Warehouse.capacity, inventory.Warehouse.availableSpace - weightDiff);
      await inventory.Warehouse.save();
    }

    // 4. Adjust Yard occupied space
    if (inventory.YardLocation) {
      inventory.YardLocation.occupiedSpace = Math.max(0, inventory.YardLocation.occupiedSpace + weightDiff);
      await inventory.YardLocation.save();
    }

    // 5. Create Log Entry in InventoryAdjustmentLog
    await InventoryAdjustmentLog.create({
      dischargedInventoryLogId: null,
      adjustedWeight: parseFloat(adjustedWeight),
      reason: `[Stock Audit]: ${reason} (Original: ${originalWeight} Tons, Diff: ${weightDiff} Tons)`,
      authorizedBySupervisorId: req.user.id
    });

    await logActivity(
      req,
      'INVENTORY_AUDIT_ADJUSTMENT',
      `Audit Adjustment on Inventory LEDGER ID: ${inventory.ledgerId || inventory.id}. Weight changed from ${originalWeight} Tons to ${adjustedWeight} Tons. Reason: ${reason}`
    );

    return res.json({
      message: 'Audited inventory weight adjusted successfully and capacity balanced.',
      originalWeight,
      adjustedWeight,
      weightDiff
    });
  } catch (error) {
    console.error('Adjust inventory stock error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Get all Reefer logs (optionally filtered by containerNo)
exports.getReeferLogs = async (req, res) => {
  const { containerNo } = req.query;
  try {
    const filter = containerNo ? { containerNo } : {};
    const logs = await ReeferLog.findAll({
      where: filter,
      order: [['loggedAt', 'ASC']]
    });
    return res.json(logs);
  } catch (error) {
    console.error('Get reefer logs error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Log a new Reefer temperature entry
exports.logReeferTemperature = async (req, res) => {
  const { containerNo, temperatureCelsius, humidityPercent, powerStatus, remarks } = req.body;

  try {
    if (!containerNo || temperatureCelsius === undefined) {
      return res.status(400).json({ message: 'Container Number and Temperature reading are required.' });
    }

    const log = await ReeferLog.create({
      containerNo,
      temperatureCelsius: parseFloat(temperatureCelsius),
      humidityPercent: humidityPercent ? parseFloat(humidityPercent) : null,
      powerStatus: powerStatus || 'Plugged',
      remarks,
      loggedAt: new Date()
    });

    await logActivity(
      req,
      'REEFER_TEMPERATURE_LOGGED',
      `Logged temperature check for Reefer ${containerNo}: ${temperatureCelsius}°C. Status: ${powerStatus}`
    );

    return res.status(201).json({
      message: 'Reefer temperature and power status log saved successfully.',
      log
    });
  } catch (error) {
    console.error('Log reefer temperature error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Split cargo consignment into sub-lots
exports.splitCargo = async (req, res) => {
  const { cargoId, splitWeight, targetWarehouseId, targetYardLocationId, remarks } = req.body;

  try {
    const numericWeight = parseFloat(splitWeight);
    if (!cargoId || isNaN(numericWeight) || numericWeight <= 0) {
      return res.status(400).json({ message: 'Cargo ID and positive split weight are required.' });
    }

    const parentCargo = await findCargoByIdOrCode(cargoId);
    if (!parentCargo) {
      return res.status(404).json({ message: 'Parent cargo consignment not found.' });
    }

    if (numericWeight >= parentCargo.weight) {
      return res.status(400).json({ 
        message: `Split weight (${numericWeight} MT) must be strictly less than current cargo weight (${parentCargo.weight} MT).` 
      });
    }

    // Deduct weight from parent cargo
    parentCargo.weight = parseFloat((parentCargo.weight - numericWeight).toFixed(3));
    await parentCargo.save();

    // Create unique split cargo ID
    const splitCount = await Cargo.count({ where: { billOfLading: parentCargo.billOfLading } });
    const newCargoId = `${parentCargo.cargoId}-S${splitCount}`;

    // Create child split cargo
    const childCargo = await Cargo.create({
      cargoId: newCargoId,
      vesselId: parentCargo.vesselId,
      vesselName: parentCargo.vesselName,
      manifestNumber: parentCargo.manifestNumber,
      billOfLading: parentCargo.billOfLading,
      consignee: parentCargo.consignee,
      cargoType: parentCargo.cargoType,
      containerType: parentCargo.containerType,
      containerNo: parentCargo.containerNo ? `${parentCargo.containerNo}-S` : null,
      weight: numericWeight,
      quantity: Math.max(1, Math.floor(parentCargo.quantity * (numericWeight / (parentCargo.weight + numericWeight)))),
      status: parentCargo.status,
      warehouseId: targetWarehouseId || parentCargo.warehouseId,
      yardSlot: parentCargo.yardSlot,
      tradeType: parentCargo.tradeType,
      customsHoldStatus: parentCargo.customsHoldStatus,
      financeClearanceStatus: parentCargo.financeClearanceStatus,
      isDamaged: parentCargo.isDamaged,
      damageRemarks: parentCargo.damageRemarks ? `Split Lot: ${remarks || ''} | ${parentCargo.damageRemarks}` : remarks
    });

    // Update parent inventory
    const parentInventory = await Inventory.findOne({ where: { cargoId: parentCargo.id } });
    if (parentInventory) {
      parentInventory.weight = parentCargo.weight;
      await parentInventory.save();
    }

    // Create inventory for child cargo if target warehouse specified
    if (targetWarehouseId) {
      const destWh = await findWarehouseByIdOrName(targetWarehouseId);
      if (destWh) {
        await Inventory.create({
          cargoId: childCargo.id,
          warehouseId: destWh.id,
          weight: numericWeight,
          quantity: childCargo.quantity,
          status: 'STORED'
        });
        destWh.occupiedCapacity = (destWh.occupiedCapacity || 0) + numericWeight;
        await destWh.save();
      }
    }

    await logActivity(
      req,
      'CARGO_SPLIT',
      `Split ${numericWeight} MT from ${parentCargo.cargoId}. New split consignment created: ${childCargo.cargoId}. Parent remaining: ${parentCargo.weight} MT.`
    );

    return res.status(201).json({
      message: 'Cargo consignment split successfully.',
      parentCargo,
      splitCargo: childCargo
    });
  } catch (error) {
    console.error('Split cargo error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};
