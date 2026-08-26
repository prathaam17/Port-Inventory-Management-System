const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registrationController');
const { verifyToken, checkRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public route for self-registration with document upload files
router.post('/register', upload.any(), registrationController.submitRegistration);

// Protected routes
router.get('/', verifyToken, checkRole(['Super Admin']), registrationController.getRegistrations);
router.post('/:id/approve', verifyToken, checkRole(['Super Admin']), registrationController.approveRegistration);
router.post('/:id/reject', verifyToken, checkRole(['Super Admin']), registrationController.rejectRegistration);

module.exports = router;
