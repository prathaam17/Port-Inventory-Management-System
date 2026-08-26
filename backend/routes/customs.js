const express = require('express');
const router = express.Router();
const customsController = require('../controllers/customsController');
const { verifyToken, checkRole } = require('../middleware/auth');

router.use(verifyToken);

// Read-only access for all logged-in roles
router.get('/', customsController.getCustomsRequests);

// Customs Officer actions
router.put('/:id', checkRole(['Customs Officer', 'Super Admin']), customsController.updateCustomsStatus);
router.post('/ooc', checkRole(['Customs Officer', 'Super Admin']), customsController.registerOoc);
router.post('/seize', checkRole(['Customs Officer', 'Super Admin']), customsController.seizeCargo);
router.post('/release', checkRole(['Customs Officer', 'Super Admin']), customsController.releaseCargo);

module.exports = router;
