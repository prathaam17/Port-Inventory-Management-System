const { HolidayRegistry, SorTariffRule } = require('../models');

/**
 * Calculates mngprt SOR Transit Storage & Demurrage Dues
 * @param {Object} cargo Cargo instance or data object
 * @param {Date|string} targetDate Calculation cutoff date (defaults to current date)
 */
async function calculateSorDemurrage(cargo, targetDate = new Date()) {
  const cutoff = new Date(targetDate);
  const tradeType = cargo.tradeType === 'Export' ? 'Export' : 'Import';

  // 1. Fetch active SOR Tariff Rules from Database
  let tariffRule = await SorTariffRule.findOne({ where: { tradeType } });
  if (!tariffRule) {
    // Default fallback rules matching mngprt official SOR
    tariffRule = {
      tradeType,
      freeDaysWorking: tradeType === 'Export' ? 21 : 7,
      slab1Days: 7,
      slab1Rate: 5.050,
      slab2Days: 7,
      slab2Rate: 8.827,
      slab3Rate: 12.614,
      uomDefault: 'MTDA'
    };
  }

  // 2. Fetch Holiday Registry (Port and Customs non-working dates)
  const holidayRecords = await HolidayRegistry.findAll();
  const holidayDatesSet = new Set(
    holidayRecords.map(h => new Date(h.holidayDate).toISOString().split('T')[0])
  );

  // 3. Determine Start Date (Discharge Completion for Import, Entry Date for Export)
  const startDate = cargo.dischargeCompletionDate 
    ? new Date(cargo.dischargeCompletionDate)
    : (cargo.entryTime ? new Date(cargo.entryTime) : new Date());

  // 4. Calculate Total Days & Working Days (Excluding Sundays and Registered Holidays)
  let totalCalendarDays = 0;
  let workingDaysCount = 0;
  let excludedHolidayCount = 0;

  const currentIter = new Date(startDate);
  currentIter.setHours(0, 0, 0, 0);
  const endIter = new Date(cutoff);
  endIter.setHours(23, 59, 59, 999);

  while (currentIter <= endIter) {
    totalCalendarDays++;
    const dateStr = currentIter.toISOString().split('T')[0];
    const isSunday = currentIter.getDay() === 0;
    const isRegisteredHoliday = holidayDatesSet.has(dateStr);

    if (isSunday || isRegisteredHoliday) {
      excludedHolidayCount++;
    } else {
      workingDaysCount++;
    }

    currentIter.setDate(currentIter.getDate() + 1);
  }

  // 5. Government Detention / Exemption Days (Customs, Health, Survey)
  let governmentExemptDays = 0;
  if (cargo.isGovernmentDetained || cargo.customsHoldStatus === 'QUARANTINED' || cargo.customsHoldStatus === 'LOCKED') {
    // Approved detention duration is treated as free period
    governmentExemptDays = Math.max(0, workingDaysCount - tariffRule.freeDaysWorking);
  }

  // 6. Calculate Chargeable Overstay Days
  const totalFreeWorkingDays = tariffRule.freeDaysWorking + governmentExemptDays;
  const overstayWorkingDays = Math.max(0, workingDaysCount - totalFreeWorkingDays);

  // 7. Determine UOM Multiplier (MTDA / CMDA / UTDA)
  let uomType = cargo.uomType || tariffRule.uomDefault;
  let uomMultiplier = cargo.weight || 1.0;

  // Commodity special UOM rules (TCS SRS Specifications)
  const commodity = cargo.cargoType || '';
  if (commodity.includes('Timber') || commodity.includes('Plywood') || commodity.includes('Paper')) {
    uomType = 'CMDA';
    uomMultiplier = cargo.volume || cargo.weight * 1.5;
  } else if (commodity.includes('Vehicle') || commodity.includes('Machinery') || uomType === 'UTDA') {
    uomType = 'UTDA';
    uomMultiplier = cargo.quantity || 1;
  }

  // Apply fractional rounding rule (mngprt 0.5 fractional rule, 1.0 MT floor)
  let adjustedUnits = uomMultiplier;
  if (uomType === 'MTDA') {
    const fraction = adjustedUnits - Math.floor(adjustedUnits);
    if (fraction > 0 && fraction <= 0.5) adjustedUnits = Math.floor(adjustedUnits) + 0.5;
    else if (fraction > 0.5) adjustedUnits = Math.ceil(adjustedUnits);
    adjustedUnits = Math.max(1.0, adjustedUnits);
  }

  // 8. Calculate Demurrage Dues per Tariff Slabs
  let slab1OverstayDays = 0;
  let slab2OverstayDays = 0;
  let slab3OverstayDays = 0;

  let slab1Fee = 0.0;
  let slab2Fee = 0.0;
  let slab3Fee = 0.0;

  if (tradeType === 'Export') {
    // Export flat rate ₹5.050 after 21 working days
    slab1OverstayDays = overstayWorkingDays;
    slab1Fee = slab1OverstayDays * tariffRule.slab1Rate * adjustedUnits;
  } else {
    // Import progressive 3-tier slab rate
    let remainingOverstay = overstayWorkingDays;

    // Slab 1 (Days 1 to 7)
    slab1OverstayDays = Math.min(remainingOverstay, tariffRule.slab1Days);
    slab1Fee = slab1OverstayDays * tariffRule.slab1Rate * adjustedUnits;
    remainingOverstay = Math.max(0, remainingOverstay - slab1OverstayDays);

    // Slab 2 (Days 8 to 14)
    slab2OverstayDays = Math.min(remainingOverstay, tariffRule.slab2Days);
    slab2Fee = slab2OverstayDays * tariffRule.slab2Rate * adjustedUnits;
    remainingOverstay = Math.max(0, remainingOverstay - slab2OverstayDays);

    // Slab 3 (Day 15 onwards)
    slab3OverstayDays = remainingOverstay;
    slab3Fee = slab3OverstayDays * tariffRule.slab3Rate * adjustedUnits;
  }

  const totalDemurrageFee = Math.round((slab1Fee + slab2Fee + slab3Fee) * 100) / 100;
  const wharfageRate = 150.0;
  const handlingRate = 100.0;
  const wharfageFee = Math.round((wharfageRate * adjustedUnits) * 100) / 100;
  const handlingFee = Math.round((handlingRate * adjustedUnits) * 100) / 100;

  const subTotal = wharfageFee + handlingFee + totalDemurrageFee;
  const gstAmount = Math.round((subTotal * 0.18) * 100) / 100;
  const grandTotal = Math.round(subTotal + gstAmount);

  return {
    tradeType,
    totalCalendarDays,
    workingDaysCount,
    excludedHolidayCount,
    freeDaysAllowed: tariffRule.freeDaysWorking,
    governmentExemptDays,
    totalFreeWorkingDays,
    overstayWorkingDays,
    uomType,
    uomMultiplier: adjustedUnits,
    slab1OverstayDays,
    slab1Rate: tariffRule.slab1Rate,
    slab1Fee,
    slab2OverstayDays,
    slab2Rate: tariffRule.slab2Rate,
    slab2Fee,
    slab3OverstayDays,
    slab3Rate: tariffRule.slab3Rate,
    slab3Fee,
    wharfageFee,
    handlingFee,
    totalDemurrageFee,
    gstAmount,
    grandTotal
  };
}

module.exports = {
  calculateSorDemurrage
};
