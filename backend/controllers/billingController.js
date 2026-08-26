const { Invoice, Cargo, Payment, Notification, User, PDHold, HolidayRegistry, CustomsClearance, DischargedInventoryLog, VesselCall, sequelize } = require('../models');
const { logActivity } = require('../utils/logger');
const { calculateSorDemurrage } = require('../utils/sorEngine');
const { Op } = require('sequelize');

// Helper: Adjust weight according to MNGPRT fractional rounding rule
// Round up to nearest 0.5 if fraction <= 0.5, else round up to 1.0. Baseline minimum floor is 1.0 MT.
const adjustWeight = (weight) => {
  if (!weight || weight <= 1.0) return 1.0;
  const integerPart = Math.floor(weight);
  const fraction = weight - integerPart;
  if (fraction === 0) return weight;
  if (fraction <= 0.5) return integerPart + 0.5;
  return integerPart + 1.0;
};

// Get all invoices (with optional pagination support)
exports.getInvoices = async (req, res) => {
  const { page, limit } = req.query;

  try {
    const queryOptions = {
      include: [
        {
          model: Cargo,
          include: [
            { model: CustomsClearance },
            { model: DischargedInventoryLog, as: 'tallyLogs' },
            { model: VesselCall, as: 'vesselCall' }
          ]
        },
        { model: User, as: 'agent' },
        { model: User, as: 'payerAgent' }
      ],
      order: [['createdAt', 'DESC']]
    };

    if (page && limit) {
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;
      queryOptions.offset = (pageNum - 1) * limitNum;
      queryOptions.limit = limitNum;

      const { count, rows } = await Invoice.findAndCountAll(queryOptions);
      return res.json({
        invoices: rows,
        totalItems: count,
        totalPages: Math.ceil(count / limitNum),
        currentPage: pageNum
      });
    }

    const invoices = await Invoice.findAll(queryOptions);
    return res.json(invoices);
  } catch (error) {
    console.error('Get invoices error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Deposit PDA Advance Funds (Atomic Transaction)
exports.depositPDAFunds = async (req, res) => {
  const { agentId, amount } = req.body;
  const numericAmount = Number(amount);

  if (!agentId || isNaN(numericAmount) || numericAmount <= 0 || numericAmount > 100000000) {
    return res.status(400).json({ 
      message: 'Agent ID and valid positive amount (up to ₹10,00,00,000) are required.' 
    });
  }

  const t = await sequelize.transaction();
  try {
    const agent = await User.findByPk(agentId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!agent) {
      await t.rollback();
      return res.status(404).json({ message: 'Agent not found.' });
    }

    agent.pdaBalance = (agent.pdaBalance || 0) + numericAmount;
    await agent.save({ transaction: t });

    await t.commit();

    await logActivity(
      req,
      'PDA_DEPOSIT',
      `Deposited ₹${numericAmount.toLocaleString()} into Agent ${agent.username} account. New balance: ₹${agent.pdaBalance.toLocaleString()}`,
      'Finance',
      `Advance funds credited to agent ${agent.username}.`
    );

    return res.json({
      message: 'Funds deposited successfully.',
      pdaBalance: agent.pdaBalance
    });
  } catch (err) {
    await t.rollback();
    console.error('PDA deposit error:', err);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Pre-Authorization Lock: Estimate charges and place hold on PD account
exports.estimateAndLockPD = async (req, res) => {
  const { cargoId, agentId } = req.body;

  if (!cargoId || !agentId) {
    return res.status(400).json({ message: 'Cargo ID and Agent ID are required.' });
  }

  const t = await sequelize.transaction();

  try {
    const cargo = await Cargo.findByPk(cargoId, { transaction: t });
    if (!cargo) {
      await t.rollback();
      return res.status(404).json({ message: 'Cargo not found.' });
    }

    const agent = await User.findByPk(agentId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!agent) {
      await t.rollback();
      return res.status(404).json({ message: 'Agent not found.' });
    }

    // 1. Calculate Estimated Wharfage and Handling
    const adjustedWeight = adjustWeight(cargo.weight);
    
    // Base Rates: Wharfage = ₹150/MT, Handling = ₹100/MT
    let baseWharfageRate = 150.0;
    let baseHandlingRate = 100.0;

    // Apply currency locking multiplier if USD denominated
    if (cargo.isUsdDenominated && cargo.exchangeRate) {
      baseWharfageRate = baseWharfageRate * cargo.exchangeRate;
      baseHandlingRate = baseHandlingRate * cargo.exchangeRate;
    }

    // Container TEU Multiplier
    let weightMultiplier = adjustedWeight;
    if (cargo.cargoType === 'Container') {
      const len = cargo.containerLength || 20;
      let multiplier = 1.0;
      if (len > 20 && len <= 40) multiplier = 1.5;
      else if (len > 40) multiplier = 2.0;

      // Base Container Wharfage is ₹2500 per TEU
      baseWharfageRate = 2500.0 * multiplier;
      baseHandlingRate = 1500.0 * multiplier;
      weightMultiplier = cargo.quantity || 1;
    }

    let wharfageEstimate = baseWharfageRate * weightMultiplier;
    let handlingEstimate = baseHandlingRate * weightMultiplier;

    // Coastal Cargo Capping (40% discount, final = 60% of standard rates)
    // Blocked if commodity is Thermal Coal, POL, Crude, Iron Ore, or Iron Ore Pellets
    let isCoastal = (cargo.originType === 'Coastal');
    const blockedCommodities = ['thermal coal', 'pol', 'crude oil', 'iron ore', 'iron ore pellets'];
    const normalizedCommodity = (cargo.commodityType || '').toLowerCase().trim();
    let blockDiscount = blockedCommodities.includes(normalizedCommodity);

    if (isCoastal && !blockDiscount) {
      wharfageEstimate = wharfageEstimate * 0.6;
      handlingEstimate = handlingEstimate * 0.6;
    }

    const subtotal = wharfageEstimate + handlingEstimate;
    const gstAmount = subtotal * 0.18;
    const grandEstimate = Math.ceil(subtotal + gstAmount);

    // 2. Check Unreserved Balance with row lock protection
    const activeHolds = await PDHold.findAll({
      where: { agentId, status: 'ACTIVE' },
      transaction: t
    });
    const totalHolds = activeHolds.reduce((sum, h) => sum + parseFloat(h.holdAmount || 0), 0.0);
    const unreservedBalance = agent.pdaBalance - totalHolds;

    if (unreservedBalance < grandEstimate) {
      await t.rollback();
      return res.status(400).json({
        message: `Insufficient prepaid PD wallet balance. Unreserved: ₹${unreservedBalance.toLocaleString()}, Estimated: ₹${grandEstimate.toLocaleString()}. Clearance is blocked.`,
        unreservedBalance,
        grandEstimate
      });
    }

    // 3. Create pre-auth lock
    const hold = await PDHold.create({
      agentId,
      cargoId: cargo.id,
      holdAmount: grandEstimate,
      status: 'ACTIVE'
    }, { transaction: t });

    await t.commit();

    return res.json({
      message: 'Estimated charges calculated and pre-authorized on PD Ledger.',
      holdId: hold.id,
      estimate: grandEstimate,
      unreservedBalance: unreservedBalance - grandEstimate
    });

  } catch (err) {
    await t.rollback();
    console.error('Lock PD error:', err);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Calculate actual charges dynamically (internal helper and preview API)
exports.previewCharges = async (req, res) => {
  const { cargoId, checkoutDate } = req.body;
  try {
    const cargo = await Cargo.findByPk(cargoId);
    if (!cargo) return res.status(404).json({ message: 'Cargo not found.' });

    const charges = await calculateChargesInternal(cargo, checkoutDate || new Date());
    return res.json(charges);
  } catch (err) {
    console.error('Preview charges error:', err);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Generate Invoice (Unpaid)
exports.generateCargoInvoice = async (req, res) => {
  const { cargoId, agentId, checkoutDate } = req.body;

  try {
    if (!cargoId || !agentId) {
      return res.status(400).json({ message: 'Cargo ID and Agent ID are required.' });
    }

    const cargo = await Cargo.findByPk(cargoId);
    if (!cargo) return res.status(404).json({ message: 'Cargo not found.' });

    const agent = await User.findByPk(agentId);
    if (!agent) return res.status(404).json({ message: 'Agent not found.' });

    const calcCheckoutDate = checkoutDate ? new Date(checkoutDate) : new Date();
    const billing = await calculateChargesInternal(cargo, calcCheckoutDate);

    const totalDue = billing.roundedGrandTotal;
    const invoiceNum = `INV-MNGPRT-${Date.now()}`;
    const invoice = await Invoice.create({
      invoiceNumber: invoiceNum,
      cargoId: cargo.id,
      wharfageFee: billing.wharfageFee,
      handlingFee: billing.handlingFee,
      demurrageFee: billing.demurrageFee,
      cgst: 0,
      sgst: 0,
      igst: 0,
      totalAmount: billing.totalFee,
      roundedGrandTotal: totalDue,
      daysOverstay: billing.demurrageDays,
      status: 'Unpaid',
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days grace
      agentId: agent.id
    });

    await logActivity(
      req,
      'INVOICE_GENERATED',
      `Generated cargo invoice ${invoiceNum} for ₹${totalDue.toLocaleString()} (Agent: ${agent.username}).`,
      'Finance',
      `Invoice ${invoiceNum} issued to agent.`
    );

    return res.json({
      message: 'Invoice successfully generated.',
      invoice
    });

  } catch (err) {
    console.error('Generate invoice error:', err);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Reconcile Supplementary Bill (Soft-Stop rule)
exports.supplementaryBill = async (req, res) => {
  const { cargoId, amount, reason } = req.body;
  if (!amount || amount <= 100) {
    return res.status(400).json({
      message: `Supplementary Bill Denied: Undercharge adjustment amount (₹${amount || 0}) is under the statutory ₹100 floor threshold limit.`
    });
  }
  await logActivity(
    req,
    'SUPPLEMENTARY_BILL_ISSUED',
    `Supplementary bill of ₹${amount} issued. Reason: ${reason || 'Undercharge adjustment'}`
  );
  return res.json({ message: `Supplementary bill of ₹${amount} successfully approved and logged.` });
};

// Reconcile User Refund Claim (Soft-Stop rule)
exports.refundClaim = async (req, res) => {
  const { cargoId, amount, reason } = req.body;
  if (!amount || amount < 100) {
    return res.status(400).json({
      message: `Refund Claim Rejected: Claims under ₹100 are not eligible for processing under MNGPRT Scale of Rates.`
    });
  }
  await logActivity(
    req,
    'REFUND_CLAIM_AUTHORIZED',
    `Refund claim of ₹${amount} authorized. Reason: ${reason || 'Overcharge adjustment'}`
  );
  return res.json({ message: `Refund claim of ₹${amount} authorized for audit clearance.` });
};

// Manage Holidays
exports.getHolidays = async (req, res) => {
  try {
    const holidays = await HolidayRegistry.findAll({ order: [['holidayDate', 'ASC']] });
    return res.json(holidays);
  } catch (error) {
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

exports.addHoliday = async (req, res) => {
  const { holidayDate, description } = req.body;
  try {
    const existing = await HolidayRegistry.findOne({ where: { holidayDate } });
    if (existing) return res.status(400).json({ message: 'Holiday already registered.' });

    const holiday = await HolidayRegistry.create({ holidayDate, description });
    return res.status(201).json(holiday);
  } catch (err) {
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Daily Compounded Penal Interest Cron Job (Exposed as triggers or logic)
exports.runInterestEngine = async (req, res) => {
  try {
    const now = new Date();
    // Query both 'Unpaid' and 'Pending' invoices to support both status designs
    const openInvoices = await Invoice.findAll({
      where: {
        status: {
          [Op.in]: ['Unpaid', 'Pending']
        }
      }
    });
    let updatedCount = 0;

    for (const inv of openInvoices) {
      // Grace period is 10 days
      const issued = inv.issuedDate ? new Date(inv.issuedDate) : (inv.createdAt ? new Date(inv.createdAt) : now);
      const elapsedDays = Math.floor((now - issued) / (1000 * 60 * 60 * 24));
      if (elapsedDays > 10) {
        const delayedDays = elapsedDays - 10;
        // 15% per annum daily compounded interest
        const dailyInterestRate = 0.15 / 365;
        
        // Idempotent interest calculation based on original base amount
        const baseAmount = (inv.wharfageFee || 0) + (inv.handlingFee || 0) + (inv.demurrageFee || 0);
        const interestAccumulated = baseAmount * (Math.pow(1 + dailyInterestRate, delayedDays) - 1);
        
        inv.penaltyInterest = interestAccumulated;
        inv.totalAmount = baseAmount + interestAccumulated;
        inv.roundedGrandTotal = Math.ceil(inv.totalAmount);
        await inv.save();
        updatedCount++;
      }
    }
    return res.json({ status: 'success', message: `Interest engine audited open invoices. Updated: ${updatedCount}.` });
  } catch (err) {
    console.error('Cron job error:', err);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Retrieve all payments with invoice and cargo context
exports.getPayments = async (req, res) => {
  try {
    const payments = await Payment.findAll({
      include: [
        {
          model: Invoice,
          include: [
            {
              model: Cargo,
              include: [
                { model: CustomsClearance },
                { model: DischargedInventoryLog, as: 'tallyLogs' }
              ]
            }
          ]
        }
      ]
    });
    return res.json(payments);
  } catch (error) {
    console.error('Get payments error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Settle an invoice using credit card, cash, or bank transfer
exports.payInvoice = async (req, res) => {
  const { id } = req.params;
  const { paymentMode, paymentMethod, transactionRef } = req.body;
  
  const mode = paymentMode || paymentMethod || 'Credit Card';
  const ref = transactionRef || `TXN-PAY-${Date.now()}`;

  const t = await sequelize.transaction();

  try {
    const invoice = await Invoice.findByPk(id, {
      include: [
        {
          model: Cargo,
          include: [
            { model: CustomsClearance },
            { model: DischargedInventoryLog, as: 'tallyLogs' },
            { model: VesselCall, as: 'vesselCall' }
          ]
        }
      ],
      transaction: t
    });

    if (!invoice) {
      await t.rollback();
      return res.status(404).json({ message: 'Invoice not found.' });
    }

    if (invoice.status === 'Paid') {
      await t.rollback();
      return res.status(400).json({ message: 'Invoice is already paid.' });
    }

    const amount = invoice.roundedGrandTotal || Math.round(invoice.totalAmount);

    // If paying via PDA Wallet or Digital Settlement, deduct from PDA balance atomically with row lock
    const modeLower = (mode || '').toLowerCase();
    const isPdaPayment = modeLower.includes('pda') || modeLower.includes('digital') || modeLower.includes('wallet') || modeLower.includes('prepaid');

    let updatedUserPdaBalance = null;

    if (isPdaPayment) {
      const user = await User.findByPk(req.user.id, { transaction: t, lock: t.LOCK.UPDATE });
      if (!user) {
        await t.rollback();
        return res.status(404).json({ message: 'User account not found.' });
      }
      if (user.pdaBalance < amount) {
        await t.rollback();
        return res.status(400).json({ message: `Insufficient PDA Wallet balance. Current balance is ₹${user.pdaBalance.toLocaleString()}. Required: ₹${amount.toLocaleString()}. Please deposit funds first.` });
      }
      user.pdaBalance -= amount;
      await user.save({ transaction: t });
      updatedUserPdaBalance = user.pdaBalance;
    }

    // Update invoice status
    invoice.status = 'Paid';
    await invoice.save({ transaction: t });

    // Create payment record
    const payment = await Payment.create({
      invoiceId: invoice.id,
      amountPaid: amount,
      paymentMethod: mode,
      transactionRef: ref,
      paymentDate: new Date()
    }, { transaction: t });

    // Update cargo finance status & auto-generate e-DO if Customs is already cleared/approved
    if (invoice.Cargo) {
      invoice.Cargo.financeClearanceStatus = 'RELEASED';
      const customsRec = await CustomsClearance.findOne({ where: { cargoId: invoice.Cargo.id }, transaction: t });
      const isCustomsCleared = invoice.Cargo.customsHoldStatus === 'RELEASED' || 
                               invoice.Cargo.status === 'Customs Approved' || 
                               (customsRec && (customsRec.status === 'Cleared' || customsRec.status === 'Approved'));
      if (isCustomsCleared && !invoice.Cargo.deliveryOrderNo) {
        invoice.Cargo.deliveryOrderNo = `DO-MNGPRT-${invoice.Cargo.cargoId}-${Date.now().toString().slice(-4)}`;
      }
      await invoice.Cargo.save({ transaction: t });

      // Clean up active PD holds for this cargo
      await PDHold.update(
        { status: 'RELEASED' },
        { where: { cargoId: invoice.Cargo.id, status: 'ACTIVE' }, transaction: t }
      );
    }

    await t.commit();

    await logActivity(
      req,
      'INVOICE_SETTLED',
      `Paid MNGPRT cargo invoice ${invoice.invoiceNumber} via ${mode} payment of ₹${amount.toLocaleString()}.`,
      'Finance',
      `Settle completed. Cargo ${invoice.Cargo?.cargoId} finance hold released.`
    );

    return res.json({
      message: 'Invoice paid and settled successfully.',
      invoice,
      payment,
      pdaBalance: updatedUserPdaBalance
    });

  } catch (error) {
    await t.rollback();
    console.error('Pay invoice error:', error);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Assess cargo dues and generate an UNPAID Invoice
exports.assessCargoInvoice = async (req, res) => {
  const { cargoId, checkoutDate } = req.body;
  try {
    if (!cargoId) {
      return res.status(400).json({ message: 'Cargo ID is required.' });
    }

    const cargo = await Cargo.findByPk(cargoId);
    if (!cargo) return res.status(404).json({ message: 'Cargo not found.' });

    const calcCheckoutDate = checkoutDate ? new Date(checkoutDate) : new Date();
    const billing = await calculateChargesInternal(cargo, calcCheckoutDate);

    // Resolve agent details
    const vessel = await VesselCall.findOne({ where: { vesselName: cargo.vesselName } });
    const agentId = vessel ? vessel.userId : null;

    // Check if an unpaid invoice already exists for this cargo
    let invoice = await Invoice.findOne({ where: { cargoId: cargo.id, status: 'Unpaid' } });
    const invoiceNum = invoice ? invoice.invoiceNumber : `INV-MNGPRT-${Date.now()}`;

    const cgst = billing.gstAmount / 2;
    const sgst = billing.gstAmount / 2;

    if (invoice) {
      // Update existing unpaid invoice
      await invoice.update({
        wharfageFee: billing.wharfageFee,
        handlingFee: billing.handlingFee,
        demurrageFee: billing.demurrageFee,
        cgst,
        sgst,
        totalAmount: billing.totalFee,
        roundedGrandTotal: billing.roundedGrandTotal,
        daysOverstay: billing.demurrageDays,
        payerAgentId: agentId || invoice.payerAgentId,
        agentId: agentId || invoice.agentId
      });
    } else {
      // Create new invoice
      invoice = await Invoice.create({
        invoiceNumber: invoiceNum,
        cargoId: cargo.id,
        wharfageFee: billing.wharfageFee,
        handlingFee: billing.handlingFee,
        demurrageFee: billing.demurrageFee,
        cgst,
        sgst,
        totalAmount: billing.totalFee,
        roundedGrandTotal: billing.roundedGrandTotal,
        daysOverstay: billing.demurrageDays,
        status: 'Unpaid',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days grace
        payerAgentId: agentId,
        agentId: agentId
      });
    }

    await logActivity(
      req,
      'BILL_ASSESSED',
      `Manual tariff assessment for Cargo ${cargo.cargoId}. Generated Invoice ${invoiceNum} (₹${billing.roundedGrandTotal.toLocaleString()}).`,
      'Finance',
      `Invoice ${invoiceNum} assessed and issued to the agent.`
    );

    return res.json({ message: 'Cargo bill assessed and invoice issued successfully.', invoice });
  } catch (err) {
    console.error('Assess cargo invoice error:', err);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Manually clear/settle invoice offline (cash, check, etc.) without debiting PDA
exports.clearInvoiceOffline = async (req, res) => {
  const { cargoId } = req.body;
  try {
    if (!cargoId) {
      return res.status(400).json({ message: 'Cargo ID is required.' });
    }

    const cargo = await Cargo.findByPk(cargoId);
    if (!cargo) return res.status(404).json({ message: 'Cargo not found.' });

    // Find the unpaid invoice for this cargo
    let invoice = await Invoice.findOne({ where: { cargoId: cargo.id, status: 'Unpaid' } });
    if (!invoice) {
      // If no invoice exists, let's assess it first
      const billing = await calculateChargesInternal(cargo, new Date());
      const vessel = await VesselCall.findOne({ where: { vesselName: cargo.vesselName } });
      const agentId = vessel ? vessel.userId : null;
      const invoiceNum = `INV-MNGPRT-${Date.now()}`;
      
      invoice = await Invoice.create({
        invoiceNumber: invoiceNum,
        cargoId: cargo.id,
        wharfageFee: billing.wharfageFee,
        handlingFee: billing.handlingFee,
        demurrageFee: billing.demurrageFee,
        cgst: billing.gstAmount / 2,
        sgst: billing.gstAmount / 2,
        totalAmount: billing.totalFee,
        roundedGrandTotal: billing.roundedGrandTotal,
        daysOverstay: billing.demurrageDays,
        status: 'Unpaid',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        payerAgentId: agentId,
        agentId: agentId
      });
    }

    // Settle the invoice
    invoice.status = 'Paid';
    await invoice.save();

    // Release database holds on the cargo & auto-generate e-DO if Customs is approved
    cargo.financeClearanceStatus = 'RELEASED';
    if ((cargo.customsHoldStatus === 'RELEASED' || cargo.status === 'Customs Approved') && !cargo.deliveryOrderNo) {
      cargo.deliveryOrderNo = `DO-MNGPRT-${cargo.cargoId}-${Date.now().toString().slice(-4)}`;
    }
    await cargo.save();

    // Release any active PDA lock holds if they exist
    const existingHold = await PDHold.findOne({
      where: { cargoId: cargo.id, status: 'ACTIVE' }
    });
    if (existingHold) {
      existingHold.status = 'SETTLED';
      await existingHold.save();
    }

    // Create payment record
    await Payment.create({
      invoiceId: invoice.id,
      amountPaid: invoice.roundedGrandTotal,
      paymentMethod: 'Offline Settlement (Finance Desk)',
      transactionRef: `OFFLINE-FIN-${Date.now()}`,
      paymentDate: new Date()
    });

    await logActivity(
      req,
      'BILL_CLEARED_OFFLINE',
      `Invoice ${invoice.invoiceNumber} for Cargo ${cargo.cargoId} was cleared offline at the Finance Desk.`,
      'Finance',
      `Cargo ${cargo.cargoId} finance status updated to RELEASED.`
    );

    return res.json({ message: 'Bill cleared and invoice marked as paid offline.', invoice, cargo });
  } catch (err) {
    console.error('Clear invoice offline error:', err);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Internal Pricing Engine Calculator implementation
async function calculateChargesInternal(cargo, checkoutDate) {
  const sorRes = await calculateSorDemurrage(cargo, checkoutDate);
  return {
    adjustedWeight: sorRes.uomMultiplier,
    wharfageFee: sorRes.wharfageFee,
    handlingFee: sorRes.handlingFee,
    demurrageDays: sorRes.overstayWorkingDays,
    demurrageFee: sorRes.totalDemurrageFee,
    elapsedDays: sorRes.workingDaysCount,
    freeDaysLimit: sorRes.freeDaysAllowed,
    governmentExemptDays: sorRes.governmentExemptDays,
    uomType: sorRes.uomType,
    subtotal: sorRes.wharfageFee + sorRes.handlingFee + sorRes.totalDemurrageFee,
    gstAmount: sorRes.gstAmount,
    totalFee: sorRes.grandTotal,
    roundedGrandTotal: sorRes.grandTotal,
    sorRes
  };
}
