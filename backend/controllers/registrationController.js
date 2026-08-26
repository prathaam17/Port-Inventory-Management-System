const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { ShippingAgentRegistration, User, Role } = require('../models');
const { logActivity } = require('../utils/logger');
const { validateField } = require('../middleware/validator');
const { saveFileToPostgres } = require('../utils/fileStorage');

// 1. Submit Registration
exports.submitRegistration = async (req, res) => {
  try {
    const {
      companyName,
      companyRegNo,
      companyType,
      panNumber,
      gstin,
      licenseNumber,
      licenseExpiry,
      representativeName,
      representativeDesignation,
      representativeMobile,
      representativeEmail,
      addressLine1,
      addressLine2,
      city,
      state,
      pinCode,
      username,
      email,
      password,
      isCertified
    } = req.body;

    // Check required fields
    if (!companyName || !panNumber || !gstin || !representativeName || !representativeDesignation || 
        !representativeMobile || !representativeEmail || !username || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields (*).' });
    }

    // Format & range validations
    const emailErr = validateField('email', email, { required: true, format: 'email', label: 'Account Email' });
    if (emailErr) return res.status(400).json({ message: emailErr });

    const repEmailErr = validateField('representativeEmail', representativeEmail, { required: true, format: 'email', label: 'Representative Email' });
    if (repEmailErr) return res.status(400).json({ message: repEmailErr });

    const panErr = validateField('panNumber', panNumber, { required: true, format: 'pan', label: 'PAN Number' });
    if (panErr) return res.status(400).json({ message: panErr });

    const gstinErr = validateField('gstin', gstin, { required: true, format: 'gstin', label: 'GSTIN Number' });
    if (gstinErr) return res.status(400).json({ message: gstinErr });

    const mobileErr = validateField('representativeMobile', representativeMobile, { required: true, format: 'phone', label: 'Representative Mobile' });
    if (mobileErr) return res.status(400).json({ message: mobileErr });

    const passErr = validateField('password', password, { required: true, minLength: 6, label: 'Password' });
    if (passErr) return res.status(400).json({ message: passErr });

    if (pinCode) {
      const pinErr = validateField('pinCode', pinCode, { format: 'pincode', label: 'PIN Code' });
      if (pinErr) return res.status(400).json({ message: pinErr });
    }

    // Check duplicate username or email in User table
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Username or Email is already taken by an active operator.' });
    }

    // Check duplicate username or email in pending registrations
    const existingReg = await ShippingAgentRegistration.findOne({
      where: {
        [Op.or]: [
          { username },
          { email }
        ],
        status: 'Pending Verification'
      }
    });

    if (existingReg) {
      return res.status(400).json({ message: 'Username or Email has a registration already pending verification.' });
    }

    // Encrypt password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Map uploaded files directly into PostgreSQL BYTEA binary storage
    const docFiles = {};
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        const storedFilename = await saveFileToPostgres(file, 'agent_registration');
        docFiles[file.fieldname] = storedFilename;
      }
    }

    // Generate unique Registration ID
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const registrationId = `REG-MNGPRT-${randomDigits}`;

    // Create registration
    const newRegistration = await ShippingAgentRegistration.create({
      registrationId,
      status: 'Pending Verification',
      companyName,
      companyRegNo,
      companyType,
      panNumber,
      gstin,
      licenseNumber,
      licenseExpiry: licenseExpiry || null,
      representativeName,
      representativeDesignation,
      representativeMobile,
      representativeEmail,
      addressLine1,
      addressLine2,
      city,
      state,
      pinCode,
      username,
      email,
      password: hashedPassword,
      docCompanyReg: docFiles['docCompanyReg'] || null,
      docPan: docFiles['docPan'] || null,
      docGst: docFiles['docGst'] || null,
      docLicense: docFiles['docLicense'] || null,
      docAuthLetter: docFiles['docAuthLetter'] || null,
      isCertified: isCertified === 'true' || isCertified === true
    });

    await logActivity(
      { user: { username: 'System', role: 'Anonymous' } },
      'AGENT_REGISTRATION_SUBMITTED',
      `Shipping Agent registration filed for ${companyName} (Reg ID: ${registrationId})`
    );

    return res.status(201).json({
      message: 'Registration submitted successfully.',
      registrationId: newRegistration.registrationId,
      status: newRegistration.status
    });

  } catch (error) {
    console.error('Submit registration error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// 2. Get All Registrations
exports.getRegistrations = async (req, res) => {
  try {
    const registrations = await ShippingAgentRegistration.findAll({
      order: [['createdAt', 'DESC']]
    });
    return res.json(registrations);
  } catch (error) {
    console.error('Get registrations error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// 3. Approve Registration (Create actual User account)
exports.approveRegistration = async (req, res) => {
  const { id } = req.params;

  try {
    const registration = await ShippingAgentRegistration.findByPk(id);

    if (!registration) {
      return res.status(404).json({ message: 'Registration request not found.' });
    }

    if (registration.status !== 'Pending Verification') {
      return res.status(400).json({ message: `Registration is already in status: ${registration.status}` });
    }

    // Verify role exists
    const agentRole = await Role.findOne({ where: { name: 'Shipping Agent' } });
    if (!agentRole) {
      return res.status(500).json({ message: 'Shipping Agent system role does not exist.' });
    }

    // Check if username already exists in User table
    const duplicateUser = await User.findOne({ where: { username: registration.username } });
    if (duplicateUser) {
      return res.status(400).json({ message: 'Cannot approve: Username is already taken.' });
    }

    // Create the User Operator record
    const newUser = await User.create({
      username: registration.username,
      email: registration.email,
      password: registration.password, // Already hashed
      roleId: agentRole.id,
      status: 'active',
      department: 'Shipping',
      pdaBalance: 5000000.0 // seed-level PLA credit
    });

    // Update status
    registration.status = 'Approved';
    registration.rejectionRemarks = null;
    await registration.save();

    await logActivity(
      req,
      'AGENT_REGISTRATION_APPROVED',
      `Approved Shipping Agent ${registration.companyName} (Reg ID: ${registration.registrationId}), created user account USR-${newUser.username}`
    );

    return res.json({
      message: 'Registration approved and user account created successfully.',
      registrationId: registration.registrationId,
      status: registration.status
    });

  } catch (error) {
    console.error('Approve registration error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// 4. Reject Registration (With Remarks reason)
exports.rejectRegistration = async (req, res) => {
  const { id } = req.params;
  const { remarks } = req.body;

  try {
    if (!remarks || remarks.trim() === '') {
      return res.status(400).json({ message: 'Rejection remarks are required to explain the decision.' });
    }

    const registration = await ShippingAgentRegistration.findByPk(id);

    if (!registration) {
      return res.status(404).json({ message: 'Registration request not found.' });
    }

    if (registration.status !== 'Pending Verification') {
      return res.status(400).json({ message: `Registration is already in status: ${registration.status}` });
    }

    // Update status and remarks
    registration.status = 'Rejected';
    registration.rejectionRemarks = remarks;
    await registration.save();

    await logActivity(
      req,
      'AGENT_REGISTRATION_REJECTED',
      `Rejected Shipping Agent ${registration.companyName} (Reg ID: ${registration.registrationId}). Reason: ${remarks}`
    );

    return res.json({
      message: 'Registration rejected successfully.',
      registrationId: registration.registrationId,
      status: registration.status,
      rejectionRemarks: registration.rejectionRemarks
    });

  } catch (error) {
    console.error('Reject registration error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};
