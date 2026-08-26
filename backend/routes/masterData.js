const express = require('express');
const router = express.Router();
const masterDataController = require('../controllers/masterDataController');
const { verifyToken, checkRole } = require('../middleware/auth');

router.use(verifyToken);

// --- BERTHS ---
router.get('/berths', masterDataController.getBerths);
router.post('/berths', checkRole(['Super Admin']), masterDataController.createBerth);
router.put('/berths/:id', checkRole(['Super Admin']), masterDataController.updateBerth);
router.delete('/berths/:id', checkRole(['Super Admin']), masterDataController.deleteBerth);

// --- CONTAINER TYPES ---
router.get('/container-types', masterDataController.getContainerTypes);
router.post('/container-types', checkRole(['Super Admin']), masterDataController.createContainerType);
router.put('/container-types/:id', checkRole(['Super Admin']), masterDataController.updateContainerType);
router.delete('/container-types/:id', checkRole(['Super Admin']), masterDataController.deleteContainerType);

// --- YARD PLOTS (WAREHOUSES) ---
router.post('/warehouses', checkRole(['Super Admin']), masterDataController.createWarehouse);
router.put('/warehouses/:id', checkRole(['Super Admin']), masterDataController.updateWarehouse);
router.delete('/warehouses/:id', checkRole(['Super Admin']), masterDataController.deleteWarehouse);

// --- YARD PLOT COORDINATES (YARD LOCATIONS) ---
router.post('/yard-locations', checkRole(['Super Admin']), masterDataController.createYardLocation);
router.put('/yard-locations/:id', checkRole(['Super Admin']), masterDataController.updateYardLocation);
router.delete('/yard-locations/:id', checkRole(['Super Admin']), masterDataController.deleteYardLocation);

// --- SOR TARIFF RULES ---
router.get('/sor-rules', masterDataController.getSorTariffRules);
router.put('/sor-rules/:id', checkRole(['Super Admin', 'Finance']), masterDataController.updateSorTariffRule);

// --- HOLIDAY CALENDAR REGISTRY ---
router.get('/holidays', masterDataController.getHolidays);
router.post('/holidays', checkRole(['Super Admin', 'Finance']), masterDataController.createHoliday);
router.delete('/holidays/:id', checkRole(['Super Admin', 'Finance']), masterDataController.deleteHoliday);

module.exports = router;
