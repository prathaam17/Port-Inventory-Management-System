const express = require('express');
const router = express.Router();
const shippingController = require('../controllers/shippingController');
const { verifyToken, checkRole } = require('../middleware/auth');
const { createValidator } = require('../middleware/validator');

// All shipping routes require a logged-in user
router.use(verifyToken);

const pdaDepositSchema = {
  amount: { required: true, type: 'number', min: 1, max: 100000000, label: 'Deposit Amount' }
};

const vesselCallSchema = {
  vesselName: { required: true, type: 'string', minLength: 2, maxLength: 100, label: 'Vessel Name' },
  flag: { required: true, type: 'string', minLength: 2, label: 'Flag State' },
  vesselType: { required: true, type: 'string', label: 'Vessel Type' },
  eta: { required: true, type: 'date', label: 'ETA Date' },
  berthSpecification: { required: true, type: 'string', label: 'Berth Specification' }
};

// PDA routes
router.get('/pda', checkRole(['Shipping Agent', 'Super Admin']), shippingController.getPdaBalance);
router.post('/pda/deposit', checkRole(['Shipping Agent', 'Super Admin']), createValidator(pdaDepositSchema), shippingController.depositPda);

// Vessel Profile routes
router.get('/profiles', checkRole(['Shipping Agent', 'Super Admin']), shippingController.getVesselProfiles);
router.post('/profiles', checkRole(['Shipping Agent', 'Super Admin']), shippingController.createVesselProfile);
router.put('/profiles/:id', checkRole(['Shipping Agent', 'Super Admin']), shippingController.updateVesselProfile);
router.delete('/profiles/:id', checkRole(['Shipping Agent', 'Super Admin']), shippingController.deleteVesselProfile);

// Vessel Call routes
router.get('/vessel-calls', checkRole(['Shipping Agent', 'Port Operations Officer', 'Super Admin', 'Warehouse Manager']), shippingController.getVesselCalls);
router.post('/vessel-calls', checkRole(['Shipping Agent', 'Port Operations Officer', 'Super Admin']), createValidator(vesselCallSchema), shippingController.requestVesselCall);
router.put('/vessel-calls/:id', checkRole(['Shipping Agent', 'Port Operations Officer', 'Super Admin']), shippingController.updateVesselCall);
router.delete('/vessel-calls/:id', checkRole(['Shipping Agent', 'Port Operations Officer', 'Super Admin']), shippingController.deleteVesselCall);
router.post('/vessel-calls/:vcn/clearances', checkRole(['Shipping Agent', 'Super Admin']), shippingController.uploadClearances);
router.get('/vessel-calls/:vcn/tally', checkRole(['Shipping Agent', 'Port Operations Officer', 'Super Admin', 'Warehouse Manager']), shippingController.getVesselTally);

// Vessel FAL & Stowage routes
router.get('/vessel-calls/:vcn/fal', checkRole(['Shipping Agent', 'Port Operations Officer', 'Super Admin', 'Warehouse Manager']), shippingController.getFalDeclarations);
router.post('/vessel-calls/:vcn/fal', checkRole(['Shipping Agent', 'Super Admin']), shippingController.submitFalDeclaration);
router.get('/vessel-calls/:vcn/stowage', checkRole(['Shipping Agent', 'Port Operations Officer', 'Super Admin', 'Warehouse Manager']), shippingController.getStowagePlan);
router.post('/vessel-calls/:vcn/stowage', checkRole(['Shipping Agent', 'Super Admin']), shippingController.updateStowagePlan);

// Statement of Facts & Services routes
router.get('/vessel-calls/:vcn/sof', checkRole(['Shipping Agent', 'Port Operations Officer', 'Super Admin', 'Warehouse Manager']), shippingController.getStatementOfFacts);
router.post('/vessel-calls/:vcn/sof', checkRole(['Port Operations Officer', 'Super Admin']), shippingController.createStatementOfFact);
router.post('/vessel-calls/:vcn/services', checkRole(['Shipping Agent', 'Port Operations Officer', 'Super Admin']), shippingController.updateVesselServices);

// Operations approvals
router.post('/vessel-calls/:vcn/approve-clearance', checkRole(['Port Operations Officer', 'Super Admin']), shippingController.approveMarineClearance);
router.post('/vessel-calls/:vcn/finalize', checkRole(['Port Operations Officer', 'Super Admin']), shippingController.finalizeVesselCall);
router.post('/vessel-calls/:vcn/settle-dues', checkRole(['Shipping Agent', 'Super Admin']), shippingController.settleVesselDues);

// e-DO routes
router.post('/e-do', checkRole(['Shipping Agent', 'Super Admin']), shippingController.issueDO);

module.exports = router;
