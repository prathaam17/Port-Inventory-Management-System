const express = require('express');
const router = express.Router();
const warehouseController = require('../controllers/warehouseController');
const { verifyToken, checkRole } = require('../middleware/auth');

// List of operational roles permitted to perform operations portal actions
const operationalRoles = [
  'Super Admin',
  'Warehouse Manager',
  'Port Operations Officer',
  'Customs Officer',
  'Shipping Agent',
  'Finance Officer',
  'Finance',
  'Management'
];

router.get('/', verifyToken, warehouseController.getWarehouses);

// Tally & Shift logging routes
router.get('/tally', verifyToken, checkRole(operationalRoles), warehouseController.getTallyLogs);
router.post('/tally', verifyToken, checkRole(operationalRoles), warehouseController.createTallyLog);
router.post('/tally/:id/adjust', verifyToken, checkRole(operationalRoles), warehouseController.adjustTallyLog);

// Internal Stock Movement & Split routes
router.post('/move', verifyToken, checkRole(operationalRoles), warehouseController.moveCargo);
router.post('/split', verifyToken, checkRole(operationalRoles), warehouseController.splitCargo);
router.get('/moves', verifyToken, checkRole(operationalRoles), warehouseController.getMoveLogs);

// Warehouse manager & operations officers report cargo damages
router.post('/damage', verifyToken, checkRole(operationalRoles), warehouseController.reportDamage);
router.get('/damaged/reports', verifyToken, checkRole(operationalRoles), warehouseController.getDamagedCargoReports);

// Yard allocation
router.post('/allocate', verifyToken, checkRole(operationalRoles), warehouseController.allocateYardLocation);

// Inventory Audit adjustment routes
router.post('/inventory/:id/adjust', verifyToken, checkRole(operationalRoles), warehouseController.adjustInventory);

router.get('/:id', verifyToken, warehouseController.getWarehouseById);

module.exports = router;
