import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import InvoicePDFModal from '../components/InvoicePDFModal';
import { 
  FileSpreadsheet, 
  IndianRupee, 
  CreditCard, 
  Printer, 
  CheckCircle, 
  AlertTriangle, 
  Calendar, 
  Calculator,
  Wallet,
  Percent,
  Plus,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const Billing = () => {
  const { user } = useContext(AuthContext);
  const { triggerToast } = useContext(NotificationContext);

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pdaBalance, setPdaBalance] = useState(0);
  const [holidays, setHolidays] = useState([]);
  const [allCargoes, setAllCargoes] = useState([]);
  const [pdfInvoice, setPdfInvoice] = useState(null);
  const [selectedCargoId, setSelectedCargoId] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState('');
  const [assessLoading, setAssessLoading] = useState(false);
  const [clearOfflineLoading, setClearOfflineLoading] = useState(false);
  
  // Expanded invoice rows tracking
  const [expandedInvoiceId, setExpandedInvoiceId] = useState(null);

  // Modal payment states
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isKarnatakaClient, setIsKarnatakaClient] = useState(true);
  const [payLoading, setPayLoading] = useState(false);

  // Modal print view states
  const [showPrintView, setShowPrintView] = useState(false);
  const [invoiceToPrint, setInvoiceToPrint] = useState(null);

  // --- Real-time SOR Simulator State ---
  const [simWeight, setSimWeight] = useState(12.35);
  const [simOrigin, setSimOrigin] = useState('Foreign'); // Foreign, Coastal
  const [simCommodity, setSimCommodity] = useState('General'); // General, Thermal Coal, POL, etc.
  const [simIsContainer, setSimIsContainer] = useState(false);
  const [simContainerLength, setSimContainerLength] = useState(20);
  const [simDaysOverstay, setSimDaysOverstay] = useState(5);
  const [simIsKarnataka, setSimIsKarnataka] = useState(true);
  const [simIsUsd, setSimIsUsd] = useState(false);
  const [simExchangeRate, setSimExchangeRate] = useState(83.5);
  const [dischargeDate, setDischargeDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 15);
    return d.toISOString().split('T')[0];
  });

  // Automatically calculate overstay days from Discharge Date & Holiday exclusions
  useEffect(() => {
    if (!dischargeDate) return;
    const start = new Date(dischargeDate);
    const end = new Date();
    let workingDays = 0;
    const holidaySet = new Set(holidays.map(h => h.holidayDate));

    const cur = new Date(start);
    cur.setHours(0, 0, 0, 0);
    const last = new Date(end);
    last.setHours(23, 59, 59, 999);

    while (cur <= last) {
      const dateStr = cur.toISOString().split('T')[0];
      const isSunday = cur.getDay() === 0;
      const isHoliday = holidaySet.has(dateStr);
      if (!isSunday && !isHoliday) {
        workingDays++;
      }
      cur.setDate(cur.getDate() + 1);
    }

    const freeDays = simOrigin === 'Export' ? 21 : 7;
    const autoOverstay = Math.max(0, workingDays - freeDays);
    setSimDaysOverstay(autoOverstay);
  }, [dischargeDate, simOrigin, holidays]);

  // Simulated Outputs
  const [simResults, setSimResults] = useState({
    adjustedWeight: 12.5,
    wharfageFee: 0,
    handlingFee: 0,
    demurrageFee: 0,
    coastalApplied: false,
    gstAmount: 0,
    totalFee: 0,
    roundedGrandTotal: 0
  });

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await API.get('/billing');
      setInvoices(res.data);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      triggerToast('Error', 'Failed to retrieve billing invoices.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchPdaBalance = async () => {
    try {
      const res = await API.get('/shipping/pda');
      setPdaBalance(res.data.pdaBalance);
    } catch (err) {
      console.error('Error fetching PDA balance:', err);
    }
  };

  const fetchHolidays = async () => {
    try {
      const res = await API.get('/billing/holidays');
      setHolidays(res.data);
    } catch (err) {
      console.error('Error fetching holidays:', err);
    }
  };

  const fetchCargoes = async () => {
    try {
      const res = await API.get('/cargo?limit=100');
      setAllCargoes(res.data.cargoes || []);
    } catch (err) {
      console.error('Failed to fetch cargoes for simulator:', err);
    }
  };

  const handleCargoSelect = async (cargoId) => {
    setSelectedCargoId(cargoId);
    if (!cargoId) return;

    const cargo = allCargoes.find(c => c.id === cargoId);
    if (!cargo) return;

    try {
      const res = await API.post('/billing/preview', { cargoId });
      const charges = res.data;
      
      setSimWeight(cargo.weight);
      setSimOrigin(cargo.tradeType === 'Export' ? 'Coastal' : (cargo.vesselCall?.flag === 'India' ? 'Coastal' : 'Foreign'));
      setSimCommodity(cargo.cargoType === 'Liquid' ? 'POL' : (cargo.cargoType === 'Container' ? 'General' : 'Thermal Coal'));
      setSimIsContainer(cargo.cargoType === 'Container');
      setSimDaysOverstay(charges.demurrageDays || 0);
      
      triggerToast('Cargo Loaded', `Calculated overstay: ${charges.demurrageDays} days. Dues estimated at ₹${charges.roundedGrandTotal.toLocaleString()}.`, 'info');
    } catch (err) {
      console.error('Failed to preview cargo charges:', err);
      setSimWeight(cargo.weight);
      setSimIsContainer(cargo.cargoType === 'Container');
      setSimDaysOverstay(0);
    }
  };

  const handleAssessBill = async () => {
    if (!selectedCargoId) return;
    setAssessLoading(true);
    try {
      const res = await API.post('/billing/invoice/assess', { cargoId: selectedCargoId });
      triggerToast('Success', res.data.message || 'Cargo bill generated successfully.', 'success');
      fetchInvoices();
      setSelectedCargoId('');
    } catch (err) {
      console.error(err);
      triggerToast('Error', err.response?.data?.message || 'Failed to assess cargo dues.', 'error');
    } finally {
      setAssessLoading(false);
    }
  };

  const handleClearBillOffline = async () => {
    if (!selectedCargoId) return;
    setClearOfflineLoading(true);
    try {
      const res = await API.post('/billing/invoice/clear-offline', { cargoId: selectedCargoId });
      triggerToast('Success', res.data.message || 'Bill cleared offline successfully.', 'success');
      fetchInvoices();
      fetchPdaBalance();
      setSelectedCargoId('');
    } catch (err) {
      console.error(err);
      triggerToast('Error', err.response?.data?.message || 'Failed to clear invoice offline.', 'error');
    } finally {
      setClearOfflineLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchPdaBalance();
    fetchHolidays();
    fetchCargoes();
  }, []);

  // Recalculate Simulator Values
  useEffect(() => {
    // 1. Fractional weight rounding rule
    const adjustWeight = (w) => {
      if (!w || w <= 1.0) return 1.0;
      const integerPart = Math.floor(w);
      const fraction = w - integerPart;
      if (fraction === 0) return w;
      if (fraction <= 0.5) return integerPart + 0.5;
      return integerPart + 1.0;
    };

    const finalWeight = adjustWeight(simWeight);
    
    // Base standard rates: Wharfage = ₹150/MT, Handling = ₹100/MT
    let wharfageRate = 150.0;
    let handlingRate = 100.0;

    // USD rate conversion
    if (simIsUsd) {
      wharfageRate = wharfageRate * simExchangeRate;
      handlingRate = handlingRate * simExchangeRate;
    }

    // Container multiplier
    let weightMultiplier = finalWeight;
    if (simIsContainer) {
      let multiplier = 1.0;
      if (simContainerLength > 20 && simContainerLength <= 40) multiplier = 1.5;
      else if (simContainerLength > 40) multiplier = 2.0;

      wharfageRate = 2500.0 * multiplier;
      handlingRate = 1500.0 * multiplier;
      weightMultiplier = 1; // 1 container slot unit
    }

    let wharfageFee = wharfageRate * weightMultiplier;
    let handlingFee = handlingRate * weightMultiplier;

    // Coastal Capping: 40% discount on standard rates
    // Blocked if commodity is Thermal Coal, POL, Crude, Iron Ore, or Iron Ore Pellets
    const blockedCommodities = ['Thermal Coal', 'POL', 'Crude Oil', 'Iron Ore', 'Iron Ore Pellets'];
    const blockDiscount = blockedCommodities.includes(simCommodity);
    const isCoastal = simOrigin === 'Coastal';

    let coastalApplied = false;
    let coastalDiscount = 0.0;
    if (isCoastal && !blockDiscount) {
      coastalApplied = true;
      coastalDiscount = (wharfageFee + handlingFee) * 0.40;
      wharfageFee = wharfageFee * 0.6;
      handlingFee = handlingFee * 0.6;
    }

    // MNGPRT Official SOR Progressive Demurrage Slabs
    let demurrageFee = 0.0;
    const isExport = simOrigin === 'Export';
    
    if (isExport) {
      // Export flat rate ₹5.050 after 21 free working days
      demurrageFee = simDaysOverstay * 5.050 * weightMultiplier;
    } else {
      // Import 3-tier progressive slab rates
      for (let d = 1; d <= simDaysOverstay; d++) {
        if (d <= 7) demurrageFee += 5.050 * weightMultiplier;
        else if (d <= 14) demurrageFee += 8.827 * weightMultiplier;
        else demurrageFee += 12.614 * weightMultiplier;
      }
    }

    const subtotal = wharfageFee + handlingFee + demurrageFee;
    const gstAmount = subtotal * 0.18;
    const totalFee = subtotal + gstAmount;
    const roundedGrandTotal = Math.ceil(totalFee);

    setSimResults({
      adjustedWeight: finalWeight,
      wharfageFee,
      handlingFee,
      demurrageFee,
      coastalApplied,
      coastalDiscount,
      coastalBlocked: isCoastal && blockDiscount,
      gstAmount,
      totalFee,
      roundedGrandTotal
    });

  }, [
    simWeight, simOrigin, simCommodity, simIsContainer, 
    simContainerLength, simDaysOverstay, simIsKarnataka, 
    simIsUsd, simExchangeRate
  ]);

  const openPaymentModal = (invoice) => {
    setSelectedInvoice(invoice);
    setIsKarnatakaClient(true);
    setShowPayModal(true);
  };

  const handlePDAPaymentSubmit = async (e) => {
    e.preventDefault();
    setPayLoading(true);
    try {
      const res = await API.post(`/billing/invoice/${selectedInvoice.id}/payment`, {
        paymentMode: 'Digital Settlement',
        transactionRef: `TXN-PAY-${Date.now()}`
      });

      triggerToast('Invoice Paid', res.data.message, 'success');
      setShowPayModal(false);
      setSelectedInvoice(null);
      fetchInvoices();
      fetchPdaBalance();
      fetchCargoes();
    } catch (error) {
      triggerToast('Settle Failed', error.response?.data?.message || 'Invoice payment failed.', 'error');
    } finally {
      setPayLoading(false);
    }
  };


  const openPrintReceipt = (invoice) => {
    setInvoiceToPrint(invoice);
    setShowPrintView(true);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const getStatusBadge = (status) => {
    if (['Paid', 'PAID'].includes(status)) {
      return <span className="inline-block w-40 text-center whitespace-nowrap px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">PAID & COMPLETED</span>;
    }
    return <span className="inline-block w-40 text-center whitespace-nowrap px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20">UNPAID LEDGER</span>;
  };

  const toggleExpandInvoice = (id) => {
    setExpandedInvoiceId(expandedInvoiceId === id ? null : id);
  };

  // Safe parsing for printed receipt
  const grt = Number(invoiceToPrint?.Cargo?.vesselCall?.grt || 29785);
  const reducedGrt = Math.round(grt * 0.7717) || 22985;
  const isIgst = (invoiceToPrint?.igst > 0) || false;

  // Port dues (wharfageFee)
  const portDuesAmount = invoiceToPrint?.wharfageFee !== undefined ? Number(invoiceToPrint.wharfageFee) : 152036.58;
  const portDuesRateVal = (portDuesAmount / reducedGrt);
  const portDuesRate = isNaN(portDuesRateVal) ? '6.6146' : portDuesRateVal.toFixed(4);

  // Pilotage (handlingFee)
  const pilotageAmount = invoiceToPrint?.handlingFee !== undefined ? Number(invoiceToPrint.handlingFee) / 2 : 208107.80;
  const pilotageRateVal = (pilotageAmount / grt);
  const pilotageRate = isNaN(pilotageRateVal) ? '6.987' : pilotageRateVal.toFixed(4);

  // Berth hire (demurrageFee)
  const berthHireAmount = invoiceToPrint?.demurrageFee !== undefined ? Number(invoiceToPrint.demurrageFee) : 77138.38;
  const berthHireRateVal = (berthHireAmount / (grt * 24));
  const berthHireRate = isNaN(berthHireRateVal) ? '.10791' : berthHireRateVal.toFixed(5);

  const formatVal = (val) => {
    return Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatDateTime = (dateVal) => {
    if (!dateVal) return '';
    const date = new Date(dateVal);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  };

  // Tax values per row
  const portDuesCgst = isIgst ? 0 : (portDuesAmount * 0.09);
  const portDuesSgst = isIgst ? 0 : (portDuesAmount * 0.09);
  const portDuesIgst = isIgst ? (portDuesAmount * 0.18) : 0;

  const pilotageCgst = isIgst ? 0 : (pilotageAmount * 0.09);
  const pilotageSgst = isIgst ? 0 : (pilotageAmount * 0.09);
  const pilotageIgst = isIgst ? (pilotageAmount * 0.18) : 0;

  const berthHireCgst = isIgst ? 0 : (berthHireAmount * 0.09);
  const berthHireSgst = isIgst ? 0 : (berthHireAmount * 0.09);
  const berthHireIgst = isIgst ? (berthHireAmount * 0.18) : 0;

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-sm glass-panel flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print select-none">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            MNGPRT Cargo Billing & prepaid Finance Ledger
          </h2>
          <p className="text-sm text-slate-400 font-light mt-0.5">Scale of Rates (SOR) pricing calculation, slab demurrage audit, and prepaid PD ledger advance settlements</p>
        </div>
           {/* Invoice Summary Status */}
        <div className="flex gap-4 select-none">
          <div className="flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/20 px-4 py-2 rounded-2xl">
            <div className="text-xs">
              <span className="block text-slate-400 font-bold uppercase text-[9px]">Paid Invoices</span>
              <strong className="text-sm font-black text-emerald-600 dark:text-emerald-400">{invoices.filter(inv => ['Paid', 'PAID'].includes(inv.status)).length}</strong>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-amber-500/5 border border-amber-500/20 px-4 py-2 rounded-2xl">
            <div className="text-xs">
              <span className="block text-slate-400 font-bold uppercase text-[9px]">Unpaid Dues</span>
              <strong className="text-sm font-black text-amber-600 dark:text-amber-400">{invoices.filter(inv => !['Paid', 'PAID'].includes(inv.status)).length}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left = Invoices table, Right = Simulator widget */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 no-print">
        
        {/* Invoices List */}
        <div className="lg:col-span-8 space-y-4">
          <div className="pb-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center select-none">
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white flex items-center gap-2">
              Active Invoices & Audit Ledger
            </h3>
            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">MNGPRT SOR V1.2</span>
          </div>

          {loading ? (
            <div className="p-20 flex justify-center items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-500"></div>
            </div>
          ) : invoices.length === 0 ? (
            <div className="p-20 text-center text-sm text-slate-450 italic">No storage/demurrage invoices found in directory.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 text-slate-500 font-bold uppercase tracking-wider select-none text-xs">
                    <th className="p-4 text-center">Invoice No</th>
                    <th className="p-4 text-center">Cargo ID</th>
                    <th className="p-4 text-center">Tonnage</th>
                    <th className="p-4 text-center">Overstay</th>
                    <th className="p-4 text-center">Grand Total (₹)</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-750 dark:text-slate-200">
                  {invoices.map(inv => {
                    const isExpanded = expandedInvoiceId === inv.id;
                    const gstTotal = (inv.cgst || 0) + (inv.sgst || 0) + (inv.igst || 0);
                    
                    return (
                      <React.Fragment key={inv.id}>
                        {/* Primary Row */}
                        <tr className="hover:bg-slate-50/40 dark:hover:bg-slate-850/20 transition-colors font-medium">
                          <td className="p-4 text-center">
                            <div className="flex justify-center">
                              <button 
                                onClick={() => toggleExpandInvoice(inv.id)}
                                className="flex items-center gap-1 text-slate-800 dark:text-white hover:text-sky-500 font-bold font-mono focus:outline-none"
                              >
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-sky-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                                {inv.invoiceNumber}
                              </button>
                            </div>
                          </td>
                          <td className="p-4 text-center font-bold text-sky-500">{inv.Cargo?.cargoId || 'N/A'}</td>
                          <td className="p-4 text-center font-semibold">{inv.Cargo?.weight} MT</td>
                          <td className="p-4 text-center font-bold text-amber-500">{inv.daysOverstay} Days</td>
                          <td className="p-4 text-center font-black text-slate-850 dark:text-white">₹{inv.roundedGrandTotal?.toLocaleString()}</td>
                          <td className="p-4 text-center">{getStatusBadge(inv.status)}</td>
                          <td className="p-4 text-center">
                            <div className="flex gap-2 justify-center">
                              {/* Settle */}
                              {!['Paid', 'PAID'].includes(inv.status) ? (
                                <button
                                  onClick={() => openPaymentModal(inv)}
                                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-[11px] transition shadow-md hover:shadow-emerald-500/10 cursor-pointer"
                                >
                                  Settle Invoice
                                </button>
                              ) : (
                                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-[11px] self-center">Settled</span>
                              )}

                              {/* Download PDF / Print Receipt */}
                              <button
                                onClick={() => setPdfInvoice(inv)}
                                className="px-2.5 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 font-bold rounded-xl text-[11px] transition flex items-center gap-1 cursor-pointer"
                              >
                                <Printer className="w-3 h-3" />
                                PDF Invoice
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expansion Drawer (Audit Breakdown) */}
                        {isExpanded && (
                          <tr className="bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-850">
                            <td colSpan="7" className="p-5 text-slate-550 select-none">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-medium">
                                <div className="space-y-1">
                                  <span className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold">Wharfage Charge</span>
                                  <strong className="text-slate-800 dark:text-slate-200 text-sm">₹{inv.wharfageFee.toLocaleString()}</strong>
                                </div>
                                <div className="space-y-1">
                                  <span className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold">Terminal Handling</span>
                                  <strong className="text-slate-800 dark:text-slate-200 text-sm">₹{inv.handlingFee.toLocaleString()}</strong>
                                </div>
                                <div className="space-y-1">
                                  <span className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold">Slab Demurrage</span>
                                  <strong className="text-slate-800 dark:text-slate-200 text-sm">₹{inv.demurrageFee.toLocaleString()}</strong>
                                </div>
                                <div className="space-y-1">
                                  <span className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold">GST Summary (18%)</span>
                                  <strong className="text-slate-800 dark:text-slate-200 text-sm">₹{gstTotal.toLocaleString()}</strong>
                                  <span className="block text-[9px] text-slate-400">
                                    {inv.igst > 0 ? `IGST: ₹${inv.igst.toLocaleString()}` : `CGST: ₹${inv.cgst.toLocaleString()} | SGST: ₹${inv.sgst.toLocaleString()}`}
                                  </span>
                                </div>
                                {inv.penaltyInterest > 0 && (
                                  <div className="space-y-1 col-span-2 md:col-span-4 p-2 bg-rose-500/5 border border-rose-500/10 rounded-xl flex items-center justify-between text-[11px] text-rose-500 font-bold mt-1">
                                    <span className="flex items-center gap-1.5">
                                      Penal Overdue Interest (15% per annum daily compounded):
                                    </span>
                                    <span>+ ₹{inv.penaltyInterest.toFixed(2)}</span>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Real-time SOR calculator widget */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col justify-start space-y-5 select-none">
          
          {/* Header */}
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              MNGPRT SOR Tariff Simulator
            </h3>
            <span className="px-2.5 py-0.5 bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 text-[10px] font-extrabold rounded-md uppercase tracking-wider border border-sky-200 dark:border-sky-800">
              SOR Tariff Rules
            </span>
          </div>

          <div className="space-y-4">
            
            {/* Cargo Assessment lookup for Finance / Operations / Admin */}
            {['Finance', 'Finance Officer', 'Operations', 'Port Operations Officer', 'Super Admin', 'Management', 'Warehouse Manager', 'Customs Officer', 'Shipping Agent'].includes(user?.role) && (
              <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 animate-fadeIn relative">
                <div className="flex justify-between items-center">
                  <label className="block font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wide text-xs">
                    Assess Cargo ID Dues
                  </label>
                  {selectedCargoId && (
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-md text-[10px] font-extrabold uppercase tracking-wider animate-pulse">
                      Cargo Loaded
                    </span>
                  )}
                </div>

                {/* Searchable Dropdown */}
                <div className="relative">
                  <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden px-3.5 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-sky-500 transition-all">
                    <input
                      type="text"
                      placeholder="Click to search cargo ID..."
                      value={isDropdownOpen ? dropdownSearch : (allCargoes.find(c => c.id === selectedCargoId)?.cargoId || '')}
                      onFocus={() => {
                        setIsDropdownOpen(true);
                        setDropdownSearch('');
                      }}
                      onChange={(e) => setDropdownSearch(e.target.value)}
                      className="w-full bg-transparent font-bold text-slate-800 dark:text-slate-100 focus:outline-none placeholder-slate-400 text-xs sm:text-sm"
                    />
                    {selectedCargoId && (
                      <button 
                        type="button"
                        onClick={() => {
                          setSelectedCargoId('');
                          setDropdownSearch('');
                        }}
                        className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-extrabold ml-1.5 text-base focus:outline-none cursor-pointer"
                      >
                        ×
                      </button>
                    )}
                  </div>

                  {isDropdownOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setIsDropdownOpen(false)} 
                      />
                      <ul className="absolute z-25 left-0 right-0 mt-1.5 max-h-52 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl divide-y divide-slate-100 dark:divide-slate-800 animate-fadeIn">
                        {allCargoes
                          .filter(cg => !cg.cargoId.startsWith('CRG-DUMMY-') && cg.cargoId.toLowerCase().includes(dropdownSearch.toLowerCase()))
                          .map(cg => (
                            <li 
                              key={cg.id}
                              onClick={() => {
                                handleCargoSelect(cg.id);
                                setIsDropdownOpen(false);
                                setDropdownSearch('');
                              }}
                              className="px-4 py-3 hover:bg-sky-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200 cursor-pointer font-bold transition-colors text-xs text-left"
                            >
                              {cg.cargoId} <span className="text-[11px] text-slate-400 font-normal">({cg.cargoType} - {cg.status})</span>
                            </li>
                          ))
                        }
                        {allCargoes.filter(cg => !cg.cargoId.startsWith('CRG-DUMMY-') && cg.cargoId.toLowerCase().includes(dropdownSearch.toLowerCase())).length === 0 && (
                          <li className="px-4 py-3 text-slate-400 italic text-center text-xs">
                            No matching cargo found
                          </li>
                        )}
                      </ul>
                    </>
                  )}
                </div>

                {selectedCargoId && (
                  <div className="flex gap-2 pt-1 animate-fadeIn relative z-0">
                    <button
                      type="button"
                      onClick={handleAssessBill}
                      disabled={assessLoading}
                      className="flex-1 py-2.5 px-3 bg-sky-600 hover:bg-sky-500 disabled:bg-sky-800 text-white font-extrabold rounded-xl text-xs transition shadow cursor-pointer text-center"
                    >
                      {assessLoading ? 'Assessing...' : 'Issue Bill'}
                    </button>
                    <button
                      type="button"
                      onClick={handleClearBillOffline}
                      disabled={clearOfflineLoading}
                      className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-extrabold rounded-xl text-xs transition shadow cursor-pointer text-center"
                    >
                      {clearOfflineLoading ? 'Clearing...' : 'Clear Bill (Offline)'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Weight Input & Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center font-extrabold text-xs text-slate-700 dark:text-slate-200">
                <span>Cargo Weight Tonnage</span>
                <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 px-3 py-1 rounded-full border border-amber-300 dark:border-amber-700 shadow-sm focus-within:ring-2 focus-within:ring-amber-500">
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={simWeight}
                    onChange={(e) => setSimWeight(Math.max(0.1, parseFloat(e.target.value) || 0))}
                    className="w-16 bg-transparent font-mono font-black text-sm text-amber-900 dark:text-amber-200 outline-none text-center"
                  />
                  <span className="font-extrabold text-xs text-amber-800 dark:text-amber-300">MT</span>
                </div>
              </div>
              <input 
                type="range" min="0.1" max="100.0" step="0.05"
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-600"
                value={simWeight} onChange={(e) => setSimWeight(parseFloat(e.target.value) || 0.1)}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                Rounds to: <strong className="text-slate-800 dark:text-slate-200 font-bold">{simResults.adjustedWeight} MT</strong> (MNGPRT 0.5 fractional rule, 1.0 MT floor)
              </p>
            </div>

            {/* Cargo Origin & Commodity Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block font-extrabold text-xs text-slate-700 dark:text-slate-200">Origin Tariff Type</label>
                <select
                  value={simOrigin} onChange={(e) => setSimOrigin(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
                >
                  <option value="Foreign">Foreign Cargo</option>
                  <option value="Coastal">Coastal Cargo</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-extrabold text-xs text-slate-700 dark:text-slate-200">Commodity Category</label>
                <select
                  value={simCommodity} onChange={(e) => setSimCommodity(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
                >
                  <option value="General">General Goods</option>
                  <option value="Thermal Coal">Thermal Coal</option>
                  <option value="POL">POL (Fuel/Oil)</option>
                  <option value="Crude Oil">Crude Oil</option>
                  <option value="Iron Ore">Iron Ore</option>
                </select>
              </div>
            </div>

            {/* Container Cargo Handling Toggle */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between items-center font-extrabold text-slate-800 dark:text-slate-200">
                <span>Container Cargo Handling</span>
                <input 
                  type="checkbox"
                  className="w-4 h-4 cursor-pointer accent-sky-600"
                  checked={simIsContainer} onChange={(e) => setSimIsContainer(e.target.checked)}
                />
              </div>

              {simIsContainer && (
                <div className="space-y-1.5 animate-fadeIn pt-1 border-t border-slate-200/60 dark:border-slate-800">
                  <label className="block font-extrabold text-xs text-slate-700 dark:text-slate-300">CFS Box Length Size</label>
                  <select
                    value={simContainerLength} onChange={(e) => setSimContainerLength(parseInt(e.target.value))}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl font-bold text-xs text-slate-800 dark:text-slate-100 focus:outline-none shadow-sm"
                  >
                    <option value={20}>20 ft Standard (1.0 TEU Multiplier)</option>
                    <option value={40}>40 ft High-cube (1.5 TEU Multiplier)</option>
                    <option value={45}>45 ft Special (2.0 TEU Multiplier)</option>
                  </select>
                </div>
              )}
            </div>

            {/* USD Conversion Toggle */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between items-center font-extrabold text-slate-800 dark:text-slate-200">
                <span>USD Denominated Invoice</span>
                <input 
                  type="checkbox"
                  className="w-4 h-4 cursor-pointer accent-sky-600"
                  checked={simIsUsd} onChange={(e) => setSimIsUsd(e.target.checked)}
                />
              </div>

              {simIsUsd && (
                <div className="space-y-1.5 animate-fadeIn pt-1 border-t border-slate-200/60 dark:border-slate-800">
                  <label className="block font-extrabold text-xs text-slate-700 dark:text-slate-300">Locked Exchange Rate (₹/$)</label>
                  <input 
                    type="number" step="0.05"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl font-mono font-bold text-xs text-slate-800 dark:text-slate-100 focus:outline-none shadow-sm"
                    value={simExchangeRate} onChange={(e) => setSimExchangeRate(parseFloat(e.target.value))}
                  />
                </div>
              )}
            </div>

            {/* Discharge Date & Automatic Overstay Calculation */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between items-center font-extrabold text-slate-800 dark:text-slate-200">
                <span>Discharge / Cargo Entry Date</span>
                <span className="text-[10px] text-sky-500 font-bold bg-sky-500/10 px-2 py-0.5 rounded-md">
                  ⚡ Auto-Calculates Overstay & Rates
                </span>
              </div>
              <input
                type="date"
                value={dischargeDate}
                onChange={(e) => setDischargeDate(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl font-mono font-bold text-xs text-slate-800 dark:text-slate-100 focus:outline-none shadow-sm"
              />
              <p className="text-[11px] text-slate-400 font-light">
                Excludes Sundays & Port/Customs holidays automatically. Subtracts 7 working free days (Import) or 21 days (Export).
              </p>
            </div>

            {/* Demurrage Overstay Duration (Typeable Rounded Pill Input) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center font-extrabold text-xs text-slate-700 dark:text-slate-200">
                <span>Demurrage Overstay Duration</span>
                <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 px-3.5 py-1 rounded-full border border-amber-300 dark:border-amber-700 shadow-sm focus-within:ring-2 focus-within:ring-amber-500">
                  <input
                    type="number"
                    min="0"
                    max="365"
                    value={simDaysOverstay}
                    onChange={(e) => setSimDaysOverstay(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-14 bg-transparent font-mono font-black text-sm text-amber-900 dark:text-amber-200 outline-none text-center"
                  />
                  <span className="font-extrabold text-xs text-amber-900 dark:text-amber-300">Days</span>
                </div>
              </div>
              <input 
                type="range" min="0" max="30" step="1"
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                value={simDaysOverstay} onChange={(e) => setSimDaysOverstay(parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                MNGPRT SOR progressive demurrage: Days 1-7 @ ₹5.050, Days 8-14 @ ₹8.827, Day 15+ @ ₹12.614
              </p>
            </div>

          </div>

          {/* Calculator Output details */}
          <div className="p-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-2.5 shadow-sm">
            <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium">
              <span>Wharfage Charges:</span>
              <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">₹{simResults.wharfageFee.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium">
              <span>Terminal Handling:</span>
              <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">₹{simResults.handlingFee.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium">
              <span>Demurrage Overstay Fee:</span>
              <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">₹{simResults.demurrageFee.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            
            {/* Notifications */}
            {simResults.coastalApplied && (
              <div className="px-3 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg font-extrabold text-[10px] uppercase tracking-wider text-center animate-pulse">
                Coastal discount (40%) applied
              </div>
            )}
            {simResults.coastalBlocked && (
              <div className="px-3 py-1 bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-lg font-extrabold text-[10px] uppercase tracking-wider text-center animate-pulse">
                Coastal discount blocked (POL/Coal Exclusions)
              </div>
            )}

            <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium">
              <span>GST Split (18%):</span>
              <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">₹{simResults.gstAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            
            <div className="flex justify-between items-center font-extrabold border-t border-slate-200 dark:border-slate-800 pt-3 text-sm sm:text-base">
              <span className="text-slate-900 dark:text-white">Grand Total:</span>
              <span className="text-sky-600 dark:text-sky-400 text-lg sm:text-xl font-mono font-black">₹{simResults.roundedGrandTotal.toLocaleString()}</span>
            </div>
          </div>

        </div>
      </div>

      {showPayModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex justify-center items-center p-4 no-print select-none">
          <div className="max-w-sm w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl rounded-3xl overflow-hidden glass-panel p-6">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-850">
              <div>
                <h3 className="font-black text-base text-slate-800 dark:text-white">Settle Invoice Dues</h3>
                <span className="text-xs text-slate-400">Invoice: <strong className="font-mono text-sky-500">{selectedInvoice?.invoiceNumber}</strong></span>
              </div>
              <button onClick={() => { setShowPayModal(false); setSelectedInvoice(null); }} className="text-slate-400 hover:text-slate-655 text-lg focus:outline-none">×</button>
            </div>

            <form onSubmit={handlePDAPaymentSubmit} className="space-y-4 text-xs font-semibold">
              
              {/* Settle breakdown */}
              {(() => {
                const totalAmt = selectedInvoice?.roundedGrandTotal || selectedInvoice?.totalAmount || 0;
                const wharfageVal = selectedInvoice?.wharfageFee || Math.round(totalAmt * 0.25);
                const handlingVal = selectedInvoice?.handlingFee || Math.round(totalAmt * 0.20);
                const demurrageVal = selectedInvoice?.demurrageFee || 0;
                const penaltyVal = selectedInvoice?.penaltyInterest || 0;
                const gstVal = (selectedInvoice?.cgst || 0) + (selectedInvoice?.sgst || 0) + (selectedInvoice?.igst || 0) || Math.round(totalAmt * 0.18);

                return (
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl space-y-2 border border-slate-100 dark:border-slate-855">
                    <div className="flex justify-between text-slate-450">
                      <span>Storage Wharfage & Handling:</span>
                      <span className="text-slate-800 dark:text-slate-200 font-mono font-bold">₹{(wharfageVal + handlingVal).toLocaleString()}</span>
                    </div>
                    {demurrageVal > 0 && (
                      <div className="flex justify-between text-amber-500 font-bold">
                        <span>Demurrage ({selectedInvoice?.daysOverstay || 0} days):</span>
                        <span className="font-mono">+ ₹{demurrageVal.toLocaleString()}</span>
                      </div>
                    )}
                    {penaltyVal > 0 && (
                      <div className="flex justify-between text-rose-500 font-bold">
                        <span>Penal Interest:</span>
                        <span className="font-mono">+ ₹{penaltyVal.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-450">
                      <span>GST Liability (18%):</span>
                      <span className="text-slate-800 dark:text-slate-200 font-mono font-bold">₹{gstVal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-800 dark:text-slate-100 font-black border-t border-slate-200 dark:border-slate-800 pt-2.5 text-sm">
                      <span>Grand Total:</span>
                      <span className="text-sky-500 font-black font-mono">₹{totalAmt.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })()}

              {/* GST splits router */}
              <div className="space-y-1.5">
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold">GST Jurisdictional Split</label>
                <select
                  value={isKarnatakaClient ? 'true' : 'false'}
                  onChange={(e) => setIsKarnatakaClient(e.target.value === 'true')}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-955 border border-slate-105 dark:border-slate-850 rounded-xl focus:outline-none focus:border-sky-500 font-bold text-slate-750 dark:text-slate-200"
                >
                  <option value="true">Intrastate Karnataka (9% CGST + 9% SGST)</option>
                  <option value="false">Interstate/Outside Karnataka (18% IGST)</option>
                </select>
              </div>

              {/* Settle warning */}
              <div className="p-3 bg-sky-500/5 border border-sky-500/10 rounded-xl flex items-start gap-2.5 text-[11px] text-sky-500 leading-normal">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                Mark this invoice as Paid to release financial cargo locks and approve final cargo release.
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => { setShowPayModal(false); setSelectedInvoice(null); }}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-500 rounded-xl font-bold transition hover:bg-slate-50 dark:hover:bg-slate-950"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={(e) => handlePDAPaymentSubmit(e)}
                  disabled={payLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition shadow-lg hover:shadow-emerald-500/10 flex items-center gap-1 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  {payLoading ? 'Paying...' : 'Confirm Payment Clearance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* PRINT RECEIPT OVERLAY */}
      {showPrintView && invoiceToPrint && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] overflow-y-auto flex flex-col items-center p-4 sm:p-8 no-print-backdrop">
          {/* Action buttons bar */}
          <div className="max-w-[1000px] w-full flex justify-between items-center bg-slate-800 text-white px-6 py-3 rounded-t-2xl shadow-xl no-print">
            <span className="font-bold text-sm">Invoice Print Preview</span>
            <div className="flex gap-3">
              <button 
                onClick={() => window.print()}
                className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print Invoice
              </button>
              <button 
                onClick={() => { setShowPrintView(false); setInvoiceToPrint(null); }}
                className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>

          {/* Printable Page Container */}
          <div className="bg-white text-black p-8 max-w-[1000px] w-full shadow-2xl rounded-b-2xl min-h-[1123px] font-sans print-container flex flex-col justify-between">
            <div className="space-y-6">
              
              {/* NMPA Header */}
              <div className="relative flex justify-center items-center pb-4 border-b border-black">
                <div className="absolute left-0">
                  {/* NMPA SVG Crest Logo */}
                  <svg className="w-16 h-16 mr-6 shrink-0" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="45" stroke="#004899" strokeWidth="4" fill="#fff" />
                    <circle cx="50" cy="50" r="38" stroke="#f1c40f" strokeWidth="2" fill="none" />
                    <path d="M50 20 V80 M35 40 H65 M30 65 C30 75, 70 75, 70 65" stroke="#004899" strokeWidth="4" strokeLinecap="round" />
                    <circle cx="50" cy="20" r="4" fill="#004899" />
                  </svg>
                </div>
                <div className="text-center font-sans">
                  <h1 className="text-2xl font-extrabold tracking-wide text-black leading-tight uppercase">PORT INVENTORY MANAGEMENT SYSTEM</h1>
                  <p className="text-sm font-semibold text-black">PANAMBUR, MANGALORE-570010</p>
                  <p className="text-xs font-semibold text-black">ISO 9001:2015 ISO 14001:2015 & ISPS Compliant</p>
                  <p className="text-xs font-semibold text-black">PH:0824-2407341 Fax:2408390</p>
                  <h2 className="text-lg font-black tracking-widest uppercase text-black mt-3">Marine Estimation</h2>
                </div>
              </div>

              {/* Metadata Section - Two distinct side-by-side tables with gap */}
              <div className="flex justify-between items-start my-6">
                {/* Left Table */}
                <table className="w-[48%] border-collapse border border-black text-xs font-sans">
                  <tbody>
                    <tr>
                      <td className="border border-black p-1.5 font-bold w-[35%] text-left">Party Code :</td>
                      <td className="border border-black p-1.5 text-left">{invoiceToPrint.payerAgentId || '1'}</td>
                    </tr>
                    <tr>
                      <td className="border border-black p-1.5 font-bold text-left">Party :</td>
                      <td className="border border-black p-1.5 text-left">{invoiceToPrint.payerAgent?.username?.toUpperCase() || invoiceToPrint.Cargo?.consignee?.toUpperCase() || 'ATLANTIC GLOBAL SHIPPING PRIVATE'}</td>
                    </tr>
                    <tr>
                      <td className="border border-black p-1.5 font-bold text-left">GSTIN :</td>
                      <td className="border border-black p-1.5 text-left">{invoiceToPrint.payerAgent?.gstin || ''}</td>
                    </tr>
                    <tr>
                      <td className="border border-black p-1.5 font-bold text-left">Address :</td>
                      <td className="border border-black p-1.5 text-left">{invoiceToPrint.payerAgent?.address?.toUpperCase() || ''}</td>
                    </tr>
                    <tr>
                      <td className="border border-black p-1.5 font-bold text-left">Place of Supply :</td>
                      <td className="border border-black p-1.5 text-left">KARNATAKA</td>
                    </tr>
                  </tbody>
                </table>

                {/* Right Stack */}
                <div className="w-[48%] flex flex-col gap-3">
                  {/* Small Table */}
                  <table className="w-full border-collapse border border-black text-xs font-sans">
                    <tbody>
                      <tr>
                        <td className="border border-black p-1.5 font-bold w-[35%] text-left">GSTIN :</td>
                        <td className="border border-black p-1.5 text-left"></td>
                      </tr>
                      <tr>
                        <td className="border border-black p-1.5 font-bold text-left">PAN No :</td>
                        <td className="border border-black p-1.5 text-left"></td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Large Table */}
                  <table className="w-full border-collapse border border-black text-xs font-sans">
                    <thead>
                      <tr className="font-bold text-center">
                        <th className="border border-black p-1.5 w-[50%]">BILL NO</th>
                        <th className="border border-black p-1.5">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="text-center font-mono">
                        <td className="border border-black p-1.5 text-center">{invoiceToPrint.invoiceNumber}</td>
                        <td className="border border-black p-1.5 text-center">{formatDateTime(invoiceToPrint.createdAt)}</td>
                      </tr>
                      <tr>
                        <td className="border border-black p-1.5 font-bold text-left w-[50%]">Tax Invoice Number :</td>
                        <td className="border border-black p-1.5 text-left"></td>
                      </tr>
                      <tr>
                        <td className="border border-black p-1.5 font-bold text-left">Invoice Reference Number :</td>
                        <td className="border border-black p-1.5 text-left">{invoiceToPrint.Payments?.[0]?.transactionRef || ''}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Table 1: Vessel Details */}
              <table className="w-full border-collapse border border-black text-[10px] font-sans text-center">
                <thead>
                  <tr className="font-bold">
                    <th className="border border-black p-1">Vessel Name</th>
                    <th className="border border-black p-1">VCN</th>
                    <th className="border border-black p-1">ATA</th>
                    <th className="border border-black p-1">GRT</th>
                    <th className="border border-black p-1">Status</th>
                    <th className="border border-black p-1">Voyage</th>
                    <th className="border border-black p-1">Vessel Type</th>
                    <th className="border border-black p-1">Reduced GRT</th>
                    <th className="border border-black p-1">Mother/Feeder Ind</th>
                    <th className="border border-black p-1">Ballst/Bunkering Ind</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="font-medium text-slate-800">
                    <td className="border border-black p-1">{invoiceToPrint.Cargo?.vesselCall?.vesselName?.toUpperCase() || invoiceToPrint.Cargo?.vesselName?.toUpperCase() || 'STI DUCHESSA'}</td>
                    <td className="border border-black p-1 font-mono">{invoiceToPrint.Cargo?.vesselCall?.vcn || 'INNML125070085'}</td>
                    <td className="border border-black p-1">{invoiceToPrint.Cargo?.vesselCall?.eta ? formatDateTime(invoiceToPrint.Cargo.vesselCall.eta) : '22-07-2025 17:30'}</td>
                    <td className="border border-black p-1">{grt}</td>
                    <td className="border border-black p-1">COASTAL</td>
                    <td className="border border-black p-1">{invoiceToPrint.Cargo?.vesselCall?.voyageNumber || '002'}</td>
                    <td className="border border-black p-1">{invoiceToPrint.Cargo?.vesselCall?.vesselType?.toUpperCase() || 'TNKR'}</td>
                    <td className="border border-black p-1">{reducedGrt}</td>
                    <td className="border border-black p-1">M</td>
                    <td className="border border-black p-1">CARGO</td>
                  </tr>
                </tbody>
              </table>

              {/* Table 2: Service Charges */}
              <table className="w-full border-collapse border border-black text-[8.5px] font-sans">
                <thead>
                  <tr className="font-bold text-center">
                    <th className="border border-black p-1 w-[22%]" rowSpan={2}>SERVICE</th>
                    <th className="border border-black p-1" rowSpan={2}>Berth No</th>
                    <th className="border border-black p-1" rowSpan={2}>SAC Code</th>
                    <th className="border border-black p-1" colSpan={4}>QTY</th>
                    <th className="border border-black p-1" rowSpan={2}>From Date</th>
                    <th className="border border-black p-1" rowSpan={2}>To Date</th>
                    <th className="border border-black p-1" rowSpan={2}>Revn Cd</th>
                    <th className="border border-black p-1" rowSpan={2}>Rate</th>
                    <th className="border border-black p-1" rowSpan={2}>Qty As Per</th>
                    <th className="border border-black p-1" rowSpan={2}>Crncy</th>
                    <th className="border border-black p-1" rowSpan={2}>Exchang Rate</th>
                    <th className="border border-black p-1" rowSpan={2}>Actual Amount</th>
                    <th className="border border-black p-1" rowSpan={2}>Discount/Min</th>
                    <th className="border border-black p-1" rowSpan={2}>SGST Amount</th>
                    <th className="border border-black p-1" rowSpan={2}>CGST Amount</th>
                    <th className="border border-black p-1" rowSpan={2}>IGST Amount</th>
                  </tr>
                  <tr className="font-bold text-center">
                    <th className="border border-black p-1">QTY1</th>
                    <th className="border border-black p-1">UOM1</th>
                    <th className="border border-black p-1">QTY2</th>
                    <th className="border border-black p-1">UOM2</th>
                  </tr>
                </thead>
                <tbody>
                  {/* PORT DUES CHARGES */}
                  <tr className="font-bold border-b border-black text-left">
                    <td colSpan={19} className="p-1 uppercase text-slate-800">TERMINAL CARGO OPERATIONS DUES</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-1 font-semibold text-left">
                      TERMINAL GATE ENTRY AND SEAPORT LOGISTICS DUES (FLAT RATE PER GRT)
                    </td>
                    <td className="border border-black p-1 text-center"></td>
                    <td className="border border-black p-1 text-center">996751</td>
                    <td className="border border-black p-1 text-right">{formatVal(reducedGrt)}</td>
                    <td className="border border-black p-1 text-center">GT</td>
                    <td className="border border-black p-1 text-center"></td>
                    <td className="border border-black p-1 text-center"></td>
                    <td className="border border-black p-1 text-center"></td>
                    <td className="border border-black p-1 text-center"></td>
                    <td className="border border-black p-1 text-center">62030277</td>
                    <td className="border border-black p-1 text-right">{portDuesRate}</td>
                    <td className="border border-black p-1 text-right">{reducedGrt}</td>
                    <td className="border border-black p-1 text-center">INR</td>
                    <td className="border border-black p-1 text-right">1.000000</td>
                    <td className="border border-black p-1 text-right">{formatVal(portDuesAmount)}</td>
                    <td className="border border-black p-1 text-right">0.00</td>
                    <td className="border border-black p-1 text-right">{formatVal(portDuesSgst)}</td>
                    <td className="border border-black p-1 text-right">{formatVal(portDuesCgst)}</td>
                    <td className="border border-black p-1 text-right">{formatVal(portDuesIgst)}</td>
                  </tr>

                  {/* PILOTAGE CHARGES */}
                  <tr className="font-bold border-b border-black text-left">
                    <td colSpan={19} className="p-1 uppercase text-slate-800">CARGO TERMINAL HANDLING CHARGES</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-1 font-semibold text-left">
                      INWARD STEVEDORING AND CRANE LOADING SERVICES FOR BREAK-BULK/CONTAINERS
                    </td>
                    <td className="border border-black p-1 text-center"></td>
                    <td className="border border-black p-1 text-center">996752</td>
                    <td className="border border-black p-1 text-right">{formatVal(grt)}</td>
                    <td className="border border-black p-1 text-center">GT</td>
                    <td className="border border-black p-1 text-center"></td>
                    <td className="border border-black p-1 text-center"></td>
                    <td className="border border-black p-1 text-center">{invoiceToPrint.Cargo?.vesselCall?.eta ? formatDateTime(invoiceToPrint.Cargo.vesselCall.eta).split(' ')[0] : '22-07-2025'} 06:00</td>
                    <td className="border border-black p-1 text-center"></td>
                    <td className="border border-black p-1 text-center">62010287</td>
                    <td className="border border-black p-1 text-right">{pilotageRate}</td>
                    <td className="border border-black p-1 text-right">{grt}</td>
                    <td className="border border-black p-1 text-center">INR</td>
                    <td className="border border-black p-1 text-right">1.000000</td>
                    <td className="border border-black p-1 text-right">{formatVal(pilotageAmount)}</td>
                    <td className="border border-black p-1 text-right">0.00</td>
                    <td className="border border-black p-1 text-right">{formatVal(pilotageSgst)}</td>
                    <td className="border border-black p-1 text-right">{formatVal(pilotageCgst)}</td>
                    <td className="border border-black p-1 text-right">{formatVal(pilotageIgst)}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-1 font-semibold text-left">
                      OUTWARD FORKLIFT AND YARD STORAGE SHIFTING SERVICES TO GATE CHANNELS
                    </td>
                    <td className="border border-black p-1 text-center"></td>
                    <td className="border border-black p-1 text-center">996752</td>
                    <td className="border border-black p-1 text-right">{formatVal(grt)}</td>
                    <td className="border border-black p-1 text-center">GT</td>
                    <td className="border border-black p-1 text-center"></td>
                    <td className="border border-black p-1 text-center"></td>
                    <td className="border border-black p-1 text-center">{invoiceToPrint.Cargo?.vesselCall?.eta ? formatDateTime(invoiceToPrint.Cargo.vesselCall.eta).split(' ')[0] : '22-07-2025'} 06:00</td>
                    <td className="border border-black p-1 text-center"></td>
                    <td className="border border-black p-1 text-center">62010287</td>
                    <td className="border border-black p-1 text-right">{pilotageRate}</td>
                    <td className="border border-black p-1 text-right">{grt}</td>
                    <td className="border border-black p-1 text-center">INR</td>
                    <td className="border border-black p-1 text-right">1.000000</td>
                    <td className="border border-black p-1 text-right">{formatVal(pilotageAmount)}</td>
                    <td className="border border-black p-1 text-right">0.00</td>
                    <td className="border border-black p-1 text-right">{formatVal(pilotageSgst)}</td>
                    <td className="border border-black p-1 text-right">{formatVal(pilotageCgst)}</td>
                    <td className="border border-black p-1 text-right">{formatVal(pilotageIgst)}</td>
                  </tr>

                  {/* BERTHHIRE CHARGES */}
                  <tr className="font-bold border-b border-black text-left">
                    <td colSpan={19} className="p-1 uppercase text-slate-800">PORT STORAGE & DEMURRAGE CHARGES</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-1 font-semibold text-left">
                      TEMPORARY WAREHOUSE/SLOTS DRY-STORAGE FEES AND OVERSTAY SLAB DEMURRAGE
                    </td>
                    <td className="border border-black p-1 text-center"></td>
                    <td className="border border-black p-1 text-center">996752</td>
                    <td className="border border-black p-1 text-right">{formatVal(grt)}</td>
                    <td className="border border-black p-1 text-center">GT</td>
                    <td className="border border-black p-1 text-right">24.00</td>
                    <td className="border border-black p-1 text-center">HR</td>
                    <td className="border border-black p-1 text-center">{invoiceToPrint.Cargo?.vesselCall?.eta ? formatDateTime(invoiceToPrint.Cargo.vesselCall.eta).split(' ')[0] : '22-07-2025'} 06:00</td>
                    <td className="border border-black p-1 text-center">{invoiceToPrint.Cargo?.vesselCall?.eta ? formatDateTime(new Date(invoiceToPrint.Cargo.vesselCall.eta).getTime() + 24*3600*1000).split(' ')[0] : '23-07-2025'} 06:00</td>
                    <td className="border border-black p-1 text-center">62020269</td>
                    <td className="border border-black p-1 text-right">{berthHireRate}</td>
                    <td className="border border-black p-1 text-right">{grt}</td>
                    <td className="border border-black p-1 text-center">INR</td>
                    <td className="border border-black p-1 text-right">1.000000</td>
                    <td className="border border-black p-1 text-right">{formatVal(berthHireAmount)}</td>
                    <td className="border border-black p-1 text-right">0.00</td>
                    <td className="border border-black p-1 text-right">{formatVal(berthHireSgst)}</td>
                    <td className="border border-black p-1 text-right">{formatVal(berthHireCgst)}</td>
                    <td className="border border-black p-1 text-right">{formatVal(berthHireIgst)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Summary Box */}
              <div className="flex justify-end text-xs font-sans mt-4">
                <table className="border border-black border-collapse text-right w-[30%]">
                  <tbody>
                    <tr>
                      <td className="border border-black p-1.5 font-bold w-[60%] text-left">Total Amount :</td>
                      <td className="border border-black p-1.5 font-black text-right">{formatVal(invoiceToPrint.totalAmount)}</td>
                    </tr>
                    <tr>
                      <td className="border border-black p-1.5 font-bold text-left">Total GST :</td>
                      <td className="border border-black p-1.5 font-black text-right">{formatVal(invoiceToPrint.cgst + invoiceToPrint.sgst + invoiceToPrint.igst)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

            </div>

            {/* Print Footer */}
            <div className="border-t border-slate-300 pt-3 mt-6 flex justify-between items-center text-[10px] text-slate-400 no-print font-bold">
              <span>Generated electronically by MNGPRT Port System. Scale of Rates strictly applied.</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold transition cursor-pointer"
                >
                  Print Invoice
                </button>
                <button 
                  onClick={() => { setShowPrintView(false); setInvoiceToPrint(null); }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition cursor-pointer"
                >
                  Close Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Invoice Modal */}
      {pdfInvoice && (
        <InvoicePDFModal invoice={pdfInvoice} onClose={() => setPdfInvoice(null)} />
      )}

    </div>
  );
};

export default Billing;
