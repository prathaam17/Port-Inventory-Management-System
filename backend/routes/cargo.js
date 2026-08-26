const express = require('express');
const router = express.Router();
const cargoController = require('../controllers/cargoController');
const { verifyToken, checkRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { createValidator } = require('../middleware/validator');

const uploadManifestSchema = {
  cargoId: { required: true, type: 'string', minLength: 2, maxLength: 50, label: 'Cargo ID' },
  cargoType: { required: true, type: 'string', enum: ['Container', 'Bulk', 'Break Bulk', 'Liquid', 'Hazardous', 'General Cargo'], label: 'Cargo Type' },
  quantity: { required: true, type: 'number', min: 1, label: 'Quantity' },
  weight: { required: true, type: 'number', min: 0.01, label: 'Weight (MT)' },
  consignee: { required: true, type: 'string', minLength: 2, label: 'Consignee Name' }
};

router.get('/', verifyToken, cargoController.getCargoes);
router.get('/:id', verifyToken, cargoController.getCargoById);

// Shipping Agent or Admin uploads manifest
router.post('/manifest', verifyToken, checkRole(['Shipping Agent', 'Super Admin']), upload.single('manifest'), createValidator(uploadManifestSchema), cargoController.uploadManifest);

// Bulk manifest upload
router.post('/bulk-manifest', verifyToken, checkRole(['Shipping Agent', 'Super Admin']), cargoController.uploadBulkManifest);

// Edit manifest item
router.put('/:id', verifyToken, checkRole(['Shipping Agent', 'Super Admin']), cargoController.updateCargo);

// Delete manifest item
router.delete('/:id', verifyToken, checkRole(['Shipping Agent', 'Super Admin']), cargoController.deleteCargo);

// Generate Delivery Order
router.post('/:id/delivery-order', verifyToken, checkRole(['Shipping Agent', 'Super Admin']), cargoController.generateDeliveryOrder);

// Port Ops Officer unloads cargo
router.put('/:id/unload', verifyToken, checkRole(['Port Operations Officer', 'Super Admin']), cargoController.unloadCargo);

// Warehouse Manager allocates space
router.put('/:id/allocate', verifyToken, checkRole(['Warehouse Manager', 'Super Admin']), cargoController.assignWarehouse);

// Dispatch cargo consignment and decrement warehouse stock
router.post('/:id/dispatch', verifyToken, checkRole(['Warehouse Manager', 'Port Operations Officer', 'Super Admin']), cargoController.dispatchCargo);

// Super Admin overrides holds
router.post('/override', verifyToken, checkRole(['Super Admin']), cargoController.adminOverride);

module.exports = router;
