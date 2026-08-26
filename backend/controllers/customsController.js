const { CustomsClearance, Cargo, Invoice, Notification, VesselCall } = require('../models');
const { logActivity } = require('../utils/logger');
const { sanitizeInput } = require('../utils/sanitizer');
const { calculateSorDemurrage } = require('../utils/sorEngine');

// Get all customs clearance requests
exports.getCustomsRequests = async (req, res) => {
  try {
    const requests = await CustomsClearance.findAll({
      include: [{ model: Cargo }]
    });
    return res.json(requests);
  } catch (error) {
    console.error('Get customs requests error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Update customs status, add remarks and schedule inspections
exports.updateCustomsStatus = async (req, res) => {
  const { id } = req.params; // CustomsClearance primary key ID
  const { status, remarks, inspectionScheduledAt } = req.body;

  try {
    const clearance = await CustomsClearance.findByPk(id, {
      include: [{ model: Cargo }]
    });

    if (!clearance) {
      return res.status(404).json({ message: 'Customs clearance record not found.' });
    }

    const cargo = clearance.Cargo;
    if (!cargo) {
      return res.status(404).json({ message: 'Associated cargo not found.' });
    }

    // Update clearance details
    if (status) clearance.status = status;
    if (remarks) clearance.remarks = sanitizeInput(remarks);
    if (inspectionScheduledAt) clearance.inspectionScheduledAt = inspectionScheduledAt;
    clearance.officerId = req.user.id;
    await clearance.save();

    // Sync cargo status
    if (status === 'Approved' || status === 'Cleared') {
      cargo.status = 'Customs Approved';
      cargo.customsHoldStatus = 'RELEASED';
      
      // Auto-generate e-DO if invoice is already Paid
      const paidInvoice = await Invoice.findOne({ where: { cargoId: cargo.id, status: 'Paid' } });
      if (paidInvoice && !cargo.deliveryOrderNo) {
        cargo.deliveryOrderNo = `DO-MNGPRT-${cargo.cargoId}-${Date.now().toString().slice(-4)}`;
      }
      await cargo.save();

      // Automatically generate Finance Invoice upon Customs Approval (if not already existing)
      let invoice = await Invoice.findOne({ where: { cargoId: cargo.id } });
      const billing = await calculateSorDemurrage(cargo, new Date());
      let invoiceNumber = invoice ? invoice.invoiceNumber : `INV-MNGPRT-${Date.now().toString().slice(-6)}`;

      if (!invoice) {
        // Resolve payerAgentId from VesselCall
        const vessel = await VesselCall.findOne({ where: { vesselName: cargo.vesselName } });
        const payerAgentId = vessel ? vessel.userId : null;

        invoice = await Invoice.create({
          invoiceNumber,
          cargoId: cargo.id,
          wharfageFee: billing.wharfageFee,
          handlingFee: billing.handlingFee,
          storageFee: 0.0,
          demurrageFee: billing.totalDemurrageFee,
          penaltyFee: 0.0,
          cgst: billing.gstAmount / 2,
          sgst: billing.gstAmount / 2,
          totalAmount: billing.grandTotal,
          roundedGrandTotal: billing.grandTotal,
          status: 'Unpaid',
          payerAgentId,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });
      }

      const invoiceTotalVal = invoice ? (invoice.roundedGrandTotal || invoice.totalAmount) : billing.grandTotal;

      await logActivity(
        req,
        'CUSTOMS_APPROVED',
        `Customs clearance approved for Cargo ${cargo.cargoId}. Invoice ${invoiceNumber}.`,
        'Finance',
        `Cargo ${cargo.cargoId} approved by Customs. Invoice ${invoiceNumber} total: ₹${Number(invoiceTotalVal).toFixed(2)}.`
      );
    } else if (status === 'Rejected') {
      cargo.status = 'Customs Hold';
      cargo.customsHoldStatus = 'LOCKED';
      await cargo.save();

      await logActivity(
        req,
        'CUSTOMS_REJECTED',
        `Customs clearance rejected for Cargo ${cargo.cargoId}. Reason: ${remarks}`,
        'Shipping Agent',
        `Cargo ${cargo.cargoId} was REJECTED by customs. Remarks: ${remarks}`
      );
    } else if (status === 'On Hold') {
      cargo.status = 'Customs Hold';
      cargo.customsHoldStatus = 'LOCKED';
      await cargo.save();

      await logActivity(
        req,
        'CUSTOMS_HOLD',
        `Customs clearance put on hold for Cargo ${cargo.cargoId}. Remarks: ${remarks}`
      );
    } else if (status === 'Under Inspection') {
      cargo.status = 'Customs Hold';
      cargo.customsHoldStatus = 'LOCKED';
      await cargo.save();

      await logActivity(
        req,
        'CUSTOMS_UNDER_INSPECTION',
        `Customs clearance status updated to Under Inspection for Cargo ${cargo.cargoId}. Remarks: ${remarks}`
      );
    }

    return res.json({
      message: `Customs status updated to ${status || clearance.status}.`,
      clearance
    });
  } catch (error) {
    console.error('Update customs error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Out of Charge (OOC) Registration
exports.registerOoc = async (req, res) => {
  const { billOfLading, oocRefNo, oocDate, documentUrl, billOfEntryNo, customsBrokerId, inspectionReportId } = req.body;

  try {
    if (!billOfLading || !oocRefNo || !oocDate) {
      return res.status(400).json({ message: 'Bill of Lading, OOC Reference Number, and OOC Date are required.' });
    }

    const cargo = await Cargo.findOne({ where: { billOfLading } });
    if (!cargo) {
      return res.status(404).json({ message: `Cargo with Bill of Lading ${billOfLading} not found.` });
    }

    // Set Customs Hold Status to RELEASED
    cargo.customsHoldStatus = 'RELEASED';
    cargo.status = 'Customs Approved';
    cargo.oocRefNo = oocRefNo;
    cargo.oocDate = oocDate;
    if (billOfEntryNo) cargo.billOfEntryNo = billOfEntryNo;
    if (customsBrokerId) cargo.customsBrokerId = customsBrokerId;

    // Auto-generate e-DO if invoice is already Paid
    const paidInvoice = await Invoice.findOne({ where: { cargoId: cargo.id, status: 'Paid' } });
    if (paidInvoice && !cargo.deliveryOrderNo) {
      cargo.deliveryOrderNo = `DO-MNGPRT-${cargo.cargoId}-${Date.now().toString().slice(-4)}`;
    }
    await cargo.save();

    // Create or update CustomsClearance entry
    let clearance = await CustomsClearance.findOne({ where: { cargoId: cargo.id } });
    if (!clearance) {
      clearance = await CustomsClearance.create({
        cargoId: cargo.id,
        status: 'Approved',
        remarks: `OOC Registered. Ref: ${oocRefNo}`,
        documentUrl: documentUrl || 'ooc_receipt.pdf',
        billOfEntryNo,
        customsBrokerId,
        inspectionReportId,
        dateCleared: new Date()
      });
    } else {
      clearance.status = 'Approved';
      clearance.remarks = `OOC Registered. Ref: ${oocRefNo}`;
      clearance.billOfEntryNo = billOfEntryNo;
      clearance.customsBrokerId = customsBrokerId;
      clearance.inspectionReportId = inspectionReportId;
      clearance.dateCleared = new Date();
      if (documentUrl) clearance.documentUrl = documentUrl;
      await clearance.save();
    }

    // Automatically generate Finance Invoice upon OOC Approval (if not already existing)
    let invoice = await Invoice.findOne({ where: { cargoId: cargo.id } });
    const billing = await calculateSorDemurrage(cargo, new Date());
    let invoiceNumber = invoice ? invoice.invoiceNumber : `INV-MNGPRT-${Date.now().toString().slice(-6)}`;

    if (!invoice) {
      // Resolve payerAgentId from VesselCall
      const vessel = await VesselCall.findOne({ where: { vesselName: cargo.vesselName } });
      const payerAgentId = vessel ? vessel.userId : null;

      invoice = await Invoice.create({
        invoiceNumber,
        cargoId: cargo.id,
        wharfageFee: billing.wharfageFee,
        handlingFee: billing.handlingFee,
        storageFee: 0.0,
        demurrageFee: billing.totalDemurrageFee,
        penaltyFee: 0.0,
        cgst: billing.gstAmount / 2,
        sgst: billing.gstAmount / 2,
        totalAmount: billing.grandTotal,
        roundedGrandTotal: billing.grandTotal,
        status: 'Unpaid',
        payerAgentId,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });
    }

    const totalVal = invoice ? (invoice.roundedGrandTotal || invoice.totalAmount) : billing.grandTotal;

    await logActivity(
      req,
      'CUSTOMS_OOC_REGISTERED',
      `Customs OOC Registered for Cargo ${cargo.cargoId} (BL: ${billOfLading}). Ref: ${oocRefNo}. Invoice ${invoiceNumber}.`,
      'Finance',
      `Customs OOC approved. Invoice ${invoiceNumber} total: ₹${Number(totalVal).toFixed(2)}.`
    );

    return res.status(200).json({
      message: 'Customs Out of Charge (OOC) registered successfully. Holds released.',
      cargo,
      clearance
    });
  } catch (error) {
    console.error('OOC Registration error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Emergency Customs Seizure Hold
exports.seizeCargo = async (req, res) => {
  const { cargoId, remarks } = req.body;

  try {
    if (!cargoId) {
      return res.status(400).json({ message: 'Cargo ID is required to apply seizure.' });
    }

    const cargo = await Cargo.findOne({ where: { cargoId } });
    if (!cargo) {
      return res.status(404).json({ message: `Cargo ${cargoId} not found.` });
    }

    // Set Customs Hold Status to SEIZED, lock status, and revoke any existing e-DO
    cargo.customsHoldStatus = 'SEIZED';
    cargo.status = 'Customs Hold';
    cargo.deliveryOrderNo = null;
    await cargo.save();

    // Create or update CustomsClearance entry
    let clearance = await CustomsClearance.findOne({ where: { cargoId: cargo.id } });
    const seizureRemarks = remarks || 'EMERGENCY CUSTOMS SEIZURE HOLD APPLIED.';
    if (!clearance) {
      clearance = await CustomsClearance.create({
        cargoId: cargo.id,
        status: 'On Hold',
        remarks: seizureRemarks
      });
    } else {
      clearance.status = 'On Hold';
      clearance.remarks = seizureRemarks;
      await clearance.save();
    }

    await logActivity(
      req,
      'CUSTOMS_SEIZURE_HOLD',
      `EMERGENCY CUSTOMS SEIZURE HOLD applied on Cargo ${cargo.cargoId}. Reason: ${seizureRemarks}`,
      'Super Admin',
      `Emergency Seizure hold locked cargo ${cargo.cargoId}.`
    );

    return res.status(200).json({
      message: 'Emergency Customs Seizure Hold successfully applied on cargo.',
      cargo,
      clearance
    });
  } catch (error) {
    console.error('Cargo seizure error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

exports.releaseCargo = async (req, res) => {
  const { cargoId, remarks } = req.body;

  try {
    if (!cargoId) {
      return res.status(400).json({ message: 'Cargo ID is required to release cargo.' });
    }

    const cargo = await Cargo.findOne({ where: { cargoId } });
    if (!cargo) {
      return res.status(404).json({ message: `Cargo ${cargoId} not found.` });
    }

    // Set Customs Hold Status to RELEASED
    cargo.customsHoldStatus = 'RELEASED';
    cargo.status = 'Customs Approved';
    await cargo.save();

    // Create or update CustomsClearance entry
    let clearance = await CustomsClearance.findOne({ where: { cargoId: cargo.id } });
    const releaseRemarks = remarks || 'CUSTOMS RELEASE APPLIED.';
    if (!clearance) {
      clearance = await CustomsClearance.create({
        cargoId: cargo.id,
        status: 'Approved',
        remarks: releaseRemarks
      });
    } else {
      clearance.status = 'Approved';
      clearance.remarks = releaseRemarks;
      await clearance.save();
    }

    await logActivity(
      req,
      'CUSTOMS_RELEASE',
      `CUSTOMS RELEASE applied on Cargo ${cargo.cargoId}. Reason: ${releaseRemarks}`
    );

    return res.status(200).json({
      message: 'Customs Release successfully applied on cargo.',
      cargo,
      clearance
    });
  } catch (error) {
    console.error('Cargo release error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};
