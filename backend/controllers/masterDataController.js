const { Berth, ContainerType, Warehouse, YardLocation, SorTariffRule, HolidayRegistry } = require('../models');
const { logActivity } = require('../utils/logger');

// --- BERTHS ---
exports.getBerths = async (req, res) => {
  try {
    const berths = await Berth.findAll();
    return res.json(berths);
  } catch (error) {
    console.error('Error fetching berths:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

exports.createBerth = async (req, res) => {
  const { number, draftLimit, capacity, status } = req.body;
  try {
    if (!number || draftLimit === undefined) {
      return res.status(400).json({ message: 'Berth Number and Draft Limit are required.' });
    }
    const existing = await Berth.findOne({ where: { number } });
    if (existing) {
      return res.status(400).json({ message: `Berth ${number} already exists.` });
    }
    const berth = await Berth.create({ number, draftLimit: parseFloat(draftLimit), capacity: capacity ? parseFloat(capacity) : 50000.0, status: status || 'Available' });
    await logActivity(req, 'BERTH_CREATED', `Created new berth: ${number} with draft limit: ${draftLimit}m.`);
    return res.status(201).json(berth);
  } catch (error) {
    console.error('Error creating berth:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

exports.updateBerth = async (req, res) => {
  const { id } = req.params;
  const { number, draftLimit, capacity, status } = req.body;
  try {
    const berth = await Berth.findByPk(id);
    if (!berth) return res.status(404).json({ message: 'Berth not found.' });

    if (number) berth.number = number;
    if (draftLimit !== undefined) berth.draftLimit = parseFloat(draftLimit);
    if (capacity !== undefined) berth.capacity = parseFloat(capacity);
    if (status) berth.status = status;

    await berth.save();
    await logActivity(req, 'BERTH_UPDATED', `Updated berth ${berth.number}. Status: ${berth.status}, Draft Limit: ${berth.draftLimit}m.`);
    return res.json(berth);
  } catch (error) {
    console.error('Error updating berth:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

exports.deleteBerth = async (req, res) => {
  const { id } = req.params;
  try {
    const berth = await Berth.findByPk(id);
    if (!berth) return res.status(404).json({ message: 'Berth not found.' });
    await berth.destroy();
    await logActivity(req, 'BERTH_DELETED', `Deleted berth: ${berth.number}.`);
    return res.json({ message: 'Berth deleted successfully.' });
  } catch (error) {
    console.error('Error deleting berth:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// --- CONTAINER TYPES ---
exports.getContainerTypes = async (req, res) => {
  try {
    const types = await ContainerType.findAll();
    return res.json(types);
  } catch (error) {
    console.error('Error fetching container types:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

exports.createContainerType = async (req, res) => {
  const { name, length, height, width, maxWeight } = req.body;
  try {
    if (!name || length === undefined || height === undefined || width === undefined || maxWeight === undefined) {
      return res.status(400).json({ message: 'Name, Length, Height, Width, and Max Weight are required.' });
    }
    const existing = await ContainerType.findOne({ where: { name } });
    if (existing) {
      return res.status(400).json({ message: `Container type ${name} already exists.` });
    }
    const type = await ContainerType.create({ name, length: parseFloat(length), height: parseFloat(height), width: parseFloat(width), maxWeight: parseFloat(maxWeight) });
    await logActivity(req, 'CONTAINER_TYPE_CREATED', `Created new container type: ${name}.`);
    return res.status(201).json(type);
  } catch (error) {
    console.error('Error creating container type:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

exports.updateContainerType = async (req, res) => {
  const { id } = req.params;
  const { name, length, height, width, maxWeight } = req.body;
  try {
    const type = await ContainerType.findByPk(id);
    if (!type) return res.status(404).json({ message: 'Container type not found.' });

    if (name) type.name = name;
    if (length !== undefined) type.length = parseFloat(length);
    if (height !== undefined) type.height = parseFloat(height);
    if (width !== undefined) type.width = parseFloat(width);
    if (maxWeight !== undefined) type.maxWeight = parseFloat(maxWeight);

    await type.save();
    await logActivity(req, 'CONTAINER_TYPE_UPDATED', `Updated container type: ${type.name}.`);
    return res.json(type);
  } catch (error) {
    console.error('Error updating container type:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

exports.deleteContainerType = async (req, res) => {
  const { id } = req.params;
  try {
    const type = await ContainerType.findByPk(id);
    if (!type) return res.status(404).json({ message: 'Container type not found.' });
    await type.destroy();
    await logActivity(req, 'CONTAINER_TYPE_DELETED', `Deleted container type: ${type.name}.`);
    return res.json({ message: 'Container type deleted successfully.' });
  } catch (error) {
    console.error('Error deleting container type:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// --- YARD PLOTS (WAREHOUSES) ---
exports.createWarehouse = async (req, res) => {
  const { name, type, capacity } = req.body;
  try {
    if (!name || !type || capacity === undefined) {
      return res.status(400).json({ message: 'Name, Type, and Capacity are required.' });
    }
    const wh = await Warehouse.create({ name, type, capacity: parseFloat(capacity), occupiedSpace: 0.0, availableSpace: parseFloat(capacity) });
    await logActivity(req, 'WAREHOUSE_CREATED', `Created new storage yard plot: ${name} (${type}).`);
    return res.status(201).json(wh);
  } catch (error) {
    console.error('Error creating warehouse:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

exports.updateWarehouse = async (req, res) => {
  const { id } = req.params;
  const { name, type, capacity } = req.body;
  try {
    const wh = await Warehouse.findByPk(id);
    if (!wh) return res.status(404).json({ message: 'Warehouse not found.' });

    if (name) wh.name = name;
    if (type) wh.type = type;
    if (capacity !== undefined) {
      const diff = parseFloat(capacity) - wh.capacity;
      wh.capacity = parseFloat(capacity);
      wh.availableSpace = Math.max(0, wh.availableSpace + diff);
    }
    await wh.save();
    await logActivity(req, 'WAREHOUSE_UPDATED', `Updated storage yard plot: ${wh.name}.`);
    return res.json(wh);
  } catch (error) {
    console.error('Error updating warehouse:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

exports.deleteWarehouse = async (req, res) => {
  const { id } = req.params;
  try {
    const wh = await Warehouse.findByPk(id);
    if (!wh) return res.status(404).json({ message: 'Warehouse not found.' });
    await wh.destroy();
    await logActivity(req, 'WAREHOUSE_DELETED', `Deleted storage yard plot: ${wh.name}.`);
    return res.json({ message: 'Warehouse deleted successfully.' });
  } catch (error) {
    console.error('Error deleting warehouse:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// --- YARD PLOT COORDINATES (YARD LOCATIONS) ---
exports.createYardLocation = async (req, res) => {
  const { warehouseId, zoneCode, capacity, row, column, tier, slot } = req.body;
  try {
    if (!warehouseId || !zoneCode || capacity === undefined) {
      return res.status(400).json({ message: 'Warehouse ID, Zone Code, and Capacity are required.' });
    }
    const loc = await YardLocation.create({
      warehouseId: parseInt(warehouseId),
      zoneCode,
      capacity: parseFloat(capacity),
      occupiedSpace: 0.0,
      row,
      column,
      tier,
      slot
    });
    await logActivity(req, 'YARD_LOCATION_CREATED', `Created new yard plot coordinate: ${zoneCode} for warehouse ID ${warehouseId}.`);
    return res.status(201).json(loc);
  } catch (error) {
    console.error('Error creating yard location:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

exports.updateYardLocation = async (req, res) => {
  const { id } = req.params;
  const { zoneCode, capacity, row, column, tier, slot } = req.body;
  try {
    const loc = await YardLocation.findByPk(id);
    if (!loc) return res.status(404).json({ message: 'Yard coordinate not found.' });

    if (zoneCode) loc.zoneCode = zoneCode;
    if (capacity !== undefined) loc.capacity = parseFloat(capacity);
    if (row) loc.row = row;
    if (column) loc.column = column;
    if (tier) loc.tier = tier;
    if (slot) loc.slot = slot;

    await loc.save();
    await logActivity(req, 'YARD_LOCATION_UPDATED', `Updated yard coordinate: ${loc.zoneCode}.`);
    return res.json(loc);
  } catch (error) {
    console.error('Error updating yard location:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

exports.deleteYardLocation = async (req, res) => {
  const { id } = req.params;
  try {
    const loc = await YardLocation.findByPk(id);
    if (!loc) return res.status(404).json({ message: 'Yard coordinate not found.' });
    await loc.destroy();
    await logActivity(req, 'YARD_LOCATION_DELETED', `Deleted yard coordinate: ${loc.zoneCode}.`);
    return res.json({ message: 'Yard coordinate deleted successfully.' });
  } catch (error) {
    console.error('Error deleting yard location:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// --- SOR TARIFF RULES ---
exports.getSorTariffRules = async (req, res) => {
  try {
    const rules = await SorTariffRule.findAll();
    return res.json(rules);
  } catch (error) {
    console.error('Error fetching SOR rules:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

exports.updateSorTariffRule = async (req, res) => {
  const { id } = req.params;
  const { freeDaysWorking, slab1Rate, slab2Rate, slab3Rate, uomDefault, remarks } = req.body;
  try {
    const rule = await SorTariffRule.findByPk(id);
    if (!rule) return res.status(404).json({ message: 'SOR Tariff Rule not found.' });

    if (freeDaysWorking !== undefined) rule.freeDaysWorking = parseInt(freeDaysWorking);
    if (slab1Rate !== undefined) rule.slab1Rate = parseFloat(slab1Rate);
    if (slab2Rate !== undefined) rule.slab2Rate = parseFloat(slab2Rate);
    if (slab3Rate !== undefined) rule.slab3Rate = parseFloat(slab3Rate);
    if (uomDefault) rule.uomDefault = uomDefault;
    if (remarks !== undefined) rule.remarks = remarks;

    await rule.save();
    await logActivity(req, 'SOR_RULE_UPDATED', `Updated SOR tariff rules for ${rule.tradeType}.`);
    return res.json(rule);
  } catch (error) {
    console.error('Error updating SOR rule:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// --- HOLIDAY REGISTRY ---
exports.getHolidays = async (req, res) => {
  try {
    const holidays = await HolidayRegistry.findAll({ order: [['holidayDate', 'ASC']] });
    return res.json(holidays);
  } catch (error) {
    console.error('Error fetching holidays:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

exports.createHoliday = async (req, res) => {
  const { holidayDate, category, description } = req.body;
  try {
    if (!holidayDate) return res.status(400).json({ message: 'Holiday Date is required.' });
    const existing = await HolidayRegistry.findOne({ where: { holidayDate } });
    if (existing) return res.status(400).json({ message: 'Holiday date already registered.' });

    const holiday = await HolidayRegistry.create({
      holidayDate,
      category: category || 'Port Holiday',
      description
    });
    await logActivity(req, 'HOLIDAY_CREATED', `Added holiday on ${holidayDate} (${category || 'Port Holiday'}).`);
    return res.status(201).json(holiday);
  } catch (error) {
    console.error('Error creating holiday:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

exports.deleteHoliday = async (req, res) => {
  const { id } = req.params;
  try {
    const holiday = await HolidayRegistry.findByPk(id);
    if (!holiday) return res.status(404).json({ message: 'Holiday not found.' });
    await holiday.destroy();
    await logActivity(req, 'HOLIDAY_DELETED', `Deleted holiday ID ${id}.`);
    return res.json({ message: 'Holiday deleted successfully.' });
  } catch (error) {
    console.error('Error deleting holiday:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};
