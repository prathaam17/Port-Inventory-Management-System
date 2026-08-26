const express = require('express');
const router = express.Router();
const pythonLedgerController = require('../controllers/pythonLedgerController');
const { verifyToken, checkRole } = require('../middleware/auth');

// Health status of Python PIMS microservice
router.get('/health', verifyToken, pythonLedgerController.getPimsHealth);

// Trigger demurrage check
router.post('/demurrage-check', verifyToken, checkRole(['Finance', 'Finance Officer', 'Super Admin']), pythonLedgerController.triggerDemurrageCheck);

// Log discharge tally in Python microservice
router.post('/discharge-tally/:vcn', verifyToken, checkRole(['Port Operations Officer', 'Super Admin']), pythonLedgerController.dischargeTally);

// Process gate evacuation
router.post('/gate-evacuate', verifyToken, checkRole(['Gate Officer', 'Super Admin']), pythonLedgerController.gateEvacuation);

// Retrieve Python microservice audit logs
router.get('/audit-logs', verifyToken, checkRole(['Super Admin']), pythonLedgerController.getAuditLogs);

module.exports = router;
