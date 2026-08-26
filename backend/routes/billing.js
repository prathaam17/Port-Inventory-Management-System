const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');
const { verifyToken, checkRole } = require('../middleware/auth');

const operationalRoles = ['Super Admin', 'Finance', 'Finance Officer', 'Shipping Agent', 'Port Operations Officer', 'Warehouse Manager', 'Customs Officer', 'Management'];

router.get('/', verifyToken, billingController.getInvoices);
router.get('/invoices', verifyToken, billingController.getInvoices);
router.get('/payments', verifyToken, billingController.getPayments);
router.put('/:id/pay', verifyToken, checkRole(operationalRoles), billingController.payInvoice);
router.post('/invoice/:id/payment', verifyToken, checkRole(operationalRoles), billingController.payInvoice);

// Prepaid PD Ledger Account Operations
router.post('/pda/deposit', verifyToken, checkRole(operationalRoles), billingController.depositPDAFunds);
router.post('/estimate-lock', verifyToken, checkRole(operationalRoles), billingController.estimateAndLockPD);
router.post('/preview', verifyToken, billingController.previewCharges);
router.post('/invoice/generate', verifyToken, checkRole(operationalRoles), billingController.generateCargoInvoice);
router.post('/invoice/assess', verifyToken, checkRole(operationalRoles), billingController.assessCargoInvoice);
router.post('/invoice/clear-offline', verifyToken, checkRole(operationalRoles), billingController.clearInvoiceOffline);

// Supplementary and Refund Soft-Stops
router.post('/adjust/supplementary', verifyToken, checkRole(['Super Admin', 'Finance', 'Finance Officer']), billingController.supplementaryBill);
router.post('/adjust/refund', verifyToken, checkRole(['Super Admin', 'Finance', 'Finance Officer']), billingController.refundClaim);

// Holiday Exceptions Calendar
router.get('/holidays', verifyToken, billingController.getHolidays);
router.post('/holidays', verifyToken, checkRole(['Super Admin', 'Finance', 'Finance Officer']), billingController.addHoliday);

// Trigger Penal Interest accruals
router.post('/interest/run', verifyToken, checkRole(['Super Admin', 'Finance', 'Finance Officer']), billingController.runInterestEngine);

module.exports = router;
