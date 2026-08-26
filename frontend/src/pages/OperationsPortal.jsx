import React, { useState, useEffect, useContext } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import VisualPortMap from '../components/VisualPortMap';
import { 
  Ship, 
  Clock, 
  Anchor, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Activity, 
  Edit3, 
  PlusCircle, 
  RefreshCw,
  AlertCircle,
  Compass,
  Fuel,
  Droplet,
  Trash2,
  Grid,
  MapPin,
  Check,
  Warehouse as WarehouseIcon,
  Layers,
  AlertOctagon,
  ArrowRightLeft,
  Plus,
  Ruler,
  Calendar,
  CheckSquare,
  Search,
  Eye,
  Printer,
  ExternalLink,
  ShieldCheck,
  Package,
  FileCheck,
  X,
  Boxes,
  FileSpreadsheet,
  Filter
} from 'lucide-react';

const OperationsPortal = () => {
  const { user } = useContext(AuthContext);
  const { triggerToast } = useContext(NotificationContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  // Helper date constraint functions
  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getTomorrowDateStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Active Tab Derived from URL query parameter or pathname fallback
  const queryTab = searchParams.get('tab');
  const activeTab = queryTab || 'inventory';

  const setActiveTab = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  // ----------------------------------------------------
  // Operations Portal State Variables
  // ----------------------------------------------------
  const [vesselCalls, setVesselCalls] = useState([]);
  const [selectedCall, setSelectedCall] = useState(null);
  const [cargoes, setCargoes] = useState([]);
  const [tallyLogs, setTallyLogs] = useState([]);
  const [berthsList, setBerthsList] = useState([]);
  const [warehousesList, setWarehousesList] = useState([]);

  const [loading, setLoading] = useState(true);
  const [tallyLoading, setTallyLoading] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);

  // Cargo Manifest View States
  const [allCargoes, setAllCargoes] = useState([]);
  const [manifestSearch, setManifestSearch] = useState('');
  const [manifestTypeFilter, setManifestTypeFilter] = useState('ALL');
  const [manifestTradeFilter, setManifestTradeFilter] = useState('ALL');
  const [manifestHoldFilter, setManifestHoldFilter] = useState('ALL');
  const [selectedManifestModal, setSelectedManifestModal] = useState(null);

  // Allocation forms
  const [selectedBerthName, setSelectedBerthName] = useState('');
  const [berthSubmitting, setBerthSubmitting] = useState(false);

  // Register Vessel Call Modal
  const [showVesselModal, setShowVesselModal] = useState(false);
  const [vName, setVName] = useState('');
  const [vVoyageNo, setVVoyageNo] = useState('');
  const [vFlag, setVFlag] = useState('India');
  const [vType, setVType] = useState('Container');
  const [vEta, setVEta] = useState('');
  const [vBerthSpec, setVBerthSpec] = useState('Berth 2');
  const [vcnSubmitting, setVcnSubmitting] = useState(false);

  const handleRegisterVesselSubmit = async (e) => {
    e.preventDefault();
    if (!vName || !vEta || !vVoyageNo) {
      triggerToast('Validation Error', 'Vessel Name, Voyage Number, and ETA are required.', 'error');
      return;
    }
    setVcnSubmitting(true);
    try {
      const res = await API.post('/shipping/vessel-calls', {
        vesselName: vName,
        flag: vFlag,
        vesselType: vType,
        eta: vEta,
        berthSpecification: vBerthSpec,
        voyageNumber: vVoyageNo
      });
      triggerToast('Voyage Registered', `Vessel voyage registered under VCN: ${res.data.vesselCall.vcn}`, 'success');
      setShowVesselModal(false);
      setVName('');
      setVVoyageNo('');
      setVEta('');
      fetchVesselCalls();
    } catch (err) {
      triggerToast('Registration Failed', err.response?.data?.message || 'Error registering vessel call.', 'error');
    } finally {
      setVcnSubmitting(false);
    }
  };

  // Yard Allocation Modal
  const [showYardModal, setShowYardModal] = useState(false);
  const [activeCargoForYard, setActiveCargoForYard] = useState(null);
  const [targetWhId, setTargetWhId] = useState('');
  const [targetYardLocId, setTargetYardLocId] = useState('');
  const [allocWeight, setAllocWeight] = useState('');
  const [allocLoading, setAllocLoading] = useState(false);

  // Tally Form state
  const [selectedBl, setSelectedBl] = useState('');
  const [shiftId, setShiftId] = useState('Shift 1 (06:00 - 14:00)');
  const [unloadedWeight, setUnloadedWeight] = useState('');
  const [dischargedCount, setDischargedCount] = useState('');
  const [conditionRemarks, setConditionRemarks] = useState('Good');
  const [tallySheetId, setTallySheetId] = useState('');
  const [craneEquipmentId, setCraneEquipmentId] = useState('');
  const [operatorId, setOperatorId] = useState('');
  const [discrepancyType, setDiscrepancyType] = useState('None');
  const [soundnessCondition, setSoundnessCondition] = useState('Sound');
  const [timeDischargeStarted, setTimeDischargeStarted] = useState('');
  const [timeDischargeCompleted, setTimeDischargeCompleted] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Tally Adjustment state
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedTallyLog, setSelectedTallyLog] = useState(null);
  const [adjustedWeight, setAdjustedWeight] = useState('');
  const [adjustedCount, setAdjustedCount] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [adjustLoading, setAdjustLoading] = useState(false);

  // Vessel Turnaround state
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [propertyDamage, setPropertyDamage] = useState(false);
  const [finalizeRemarks, setFinalizeRemarks] = useState('');
  const [finalizeLoading, setFinalizeLoading] = useState(false);

  // Statement of Facts States
  const [sofEvents, setSofEvents] = useState([]);
  const [sofEventType, setSofEventType] = useState('Pilot Boarded');
  const [sofEventTimestamp, setSofEventTimestamp] = useState(() => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const local = new Date(now.getTime() - (offset * 60 * 1000));
    return local.toISOString().slice(0, 16);
  });
  const [sofRemarks, setSofRemarks] = useState('');
  const [sofSubmitting, setSofSubmitting] = useState(false);

  // ----------------------------------------------------
  // Warehouse Management State Variables
  // ----------------------------------------------------
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(null);
  const [activeWarehouse, setActiveWarehouse] = useState(null);
  const [damagedCargoes, setDamagedCargoes] = useState([]);
  const [activeCargoes, setActiveCargoes] = useState([]);

  // Damage reporting form state
  const [selectedCargoId, setSelectedCargoId] = useState('');
  const [damageRemarks, setDamageRemarks] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  // Stock Audit Modal states
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState(null);
  const [auditWeight, setAuditWeight] = useState('');
  const [auditReason, setAuditReason] = useState('');
  const [auditLoading, setAuditLoading] = useState(false);

  // ----------------------------------------------------
  // Operations Portal API Fetch Methods
  // ----------------------------------------------------
  const fetchBerthsList = async () => {
    try {
      const res = await API.get('/master-data/berths');
      setBerthsList(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchWarehousesList = async () => {
    try {
      const res = await API.get('/warehouses');
      setWarehousesList(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSof = async (vcnCode) => {
    try {
      const res = await API.get(`/shipping/vessel-calls/${vcnCode}/sof`);
      setSofEvents(res.data);
    } catch (err) {
      console.error('Error fetching Statement of Facts:', err);
    }
  };

  const handleSofSubmit = async (e) => {
    e.preventDefault();
    if (!sofEventType || !sofEventTimestamp) {
      triggerToast('Validation Error', 'Event Type and Timestamp are required.', 'error');
      return;
    }
    setSofSubmitting(true);
    try {
      await API.post(`/shipping/vessel-calls/${selectedCall.vcn}/sof`, {
        eventType: sofEventType,
        eventTimestamp: sofEventTimestamp,
        remarks: sofRemarks
      });
      triggerToast('Event Logged', `Successfully logged event "${sofEventType}"`, 'success');
      setSofRemarks('');
      fetchSof(selectedCall.vcn);
    } catch (err) {
      triggerToast('Logging Failed', err.response?.data?.message || 'Failed to log event.', 'error');
    } finally {
      setSofSubmitting(false);
    }
  };

  const handleUpdateServiceStatus = async (serviceName, value) => {
    if (!selectedCall) return;
    try {
      const res = await API.post(`/shipping/vessel-calls/${selectedCall.vcn}/services`, {
        [serviceName]: value
      });
      triggerToast('Service Updated', `Successfully updated ${serviceName} status.`, 'success');
      setSelectedCall(res.data.vesselCall);
      setVesselCalls(prev => prev.map(vc => vc.vcn === res.data.vesselCall.vcn ? res.data.vesselCall : vc));
    } catch (err) {
      triggerToast('Update Failed', err.response?.data?.message || 'Error updating service status.', 'error');
    }
  };

  const handleBerthAllocateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBerthName) {
      triggerToast('Error', 'Please select a berth allocation spec.', 'error');
      return;
    }
    setBerthSubmitting(true);
    try {
      const res = await API.post(`/shipping/vessel-calls/${selectedCall.vcn}/services`, {
        berthSpecification: selectedBerthName,
        berthingStatus: 'Approved'
      });
      triggerToast('Berth Allocated', `Vessel assigned to ${selectedBerthName} successfully.`, 'success');
      setSelectedCall(res.data.vesselCall);
      setVesselCalls(prev => prev.map(vc => vc.vcn === res.data.vesselCall.vcn ? res.data.vesselCall : vc));
    } catch (err) {
      triggerToast('Allocation Failed', err.response?.data?.message || 'Berthing allocation failed.', 'error');
    } finally {
      setBerthSubmitting(false);
    }
  };

  const fetchVesselCalls = async () => {
    setLoading(true);
    try {
      const res = await API.get('/shipping/vessel-calls');
      setVesselCalls(res.data);
      if (res.data.length > 0 && !selectedCall) {
        setSelectedCall(res.data[0]);
        setSelectedBerthName(res.data[0].berthSpecification || '');
      } else if (selectedCall) {
        const updated = res.data.find(vc => vc.vcn === selectedCall.vcn);
        if (updated) {
          setSelectedCall(updated);
          setSelectedBerthName(updated.berthSpecification || '');
        }
      }
    } catch (error) {
      console.error('Failed to fetch vessel calls:', error);
      triggerToast('Error', 'Failed to retrieve vessel call registry.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchVesselDetails = async () => {
    if (!selectedCall) return;
    
    try {
      const tallyRes = await API.get(`/warehouses/tally?vcn=${selectedCall.vcn}`);
      setTallyLogs(tallyRes.data);
    } catch (err) {
      console.error('Error fetching tally logs:', err);
    }

    try {
      const cargoRes = await API.get('/cargo?limit=100');
      const filteredCargo = cargoRes.data.cargoes.filter(c => c.vesselName === selectedCall.vesselName);
      setCargoes(filteredCargo);
      if (filteredCargo.length > 0) {
        setSelectedBl(filteredCargo[0].billOfLading);
      }
    } catch (err) {
      console.error('Error fetching cargo items:', err);
    }

    fetchSof(selectedCall.vcn);
  };

  const handleApproveMarineClearance = async () => {
    if (!selectedCall) return;
    setApprovalLoading(true);
    try {
      const res = await API.post(`/shipping/vessel-calls/${selectedCall.vcn}/approve-clearance`);
      triggerToast('Marine Approved', res.data.message, 'success');
      setVesselCalls(prev => prev.map(vc => vc.vcn === selectedCall.vcn ? res.data.vesselCall : vc));
      setSelectedCall(res.data.vesselCall);
    } catch (error) {
      triggerToast('Approval Failed', error.response?.data?.message || 'Failed to approve clearance.', 'error');
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleTallySubmit = async (e) => {
    e.preventDefault();
    if (!selectedBl || !unloadedWeight || parseFloat(unloadedWeight) <= 0) {
      triggerToast('Validation Error', 'Please select a Bill of Lading and enter a positive unloaded weight.', 'error');
      return;
    }

    setTallyLoading(true);
    try {
      const res = await API.post('/warehouses/tally', {
        vcn: selectedCall.vcn,
        billOfLading: selectedBl,
        shiftId,
        actualUnloadedWeight: parseFloat(unloadedWeight),
        dischargedCount: dischargedCount ? parseInt(dischargedCount) : null,
        cargoConditionRemarks: conditionRemarks,
        tallySheetId: tallySheetId || `TS-${Date.now().toString().slice(-4)}`,
        craneEquipmentId: craneEquipmentId || null,
        operatorId: operatorId || null,
        discrepancyType,
        soundnessCondition,
        timeDischargeStarted: timeDischargeStarted || null,
        timeDischargeCompleted: timeDischargeCompleted || null
      });

      triggerToast('Tally Logged', res.data.message, 'success');
      setUnloadedWeight('');
      setDischargedCount('');
      setConditionRemarks('Good');
      setTallySheetId('');
      setCraneEquipmentId('');
      setOperatorId('');
      setDiscrepancyType('None');
      setSoundnessCondition('Sound');
      setTimeDischargeStarted('');
      setTimeDischargeCompleted('');
      fetchVesselDetails();
    } catch (error) {
      triggerToast('Tally Lock Block', error.response?.data?.message || 'Tally registration failed.', 'error');
    } finally {
      setTallyLoading(false);
    }
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustedWeight || parseFloat(adjustedWeight) < 0 || !adjustmentReason) {
      triggerToast('Validation Error', 'Please specify adjusted weight and justification reason.', 'error');
      return;
    }

    setAdjustLoading(true);
    try {
      const res = await API.post(`/warehouses/tally/${selectedTallyLog.id}/adjust`, {
        adjustedWeight: parseFloat(adjustedWeight),
        adjustedCount: adjustedCount ? parseInt(adjustedCount) : null,
        reason: adjustmentReason
      });

      triggerToast('Tally Adjusted', res.data.message, 'success');
      setShowAdjustModal(false);
      setSelectedTallyLog(null);
      setAdjustedWeight('');
      setAdjustedCount('');
      setAdjustmentReason('');
      fetchVesselDetails();
    } catch (error) {
      triggerToast('Adjustment Failed', error.response?.data?.message || 'Failed to authorize adjustment.', 'error');
    } finally {
      setAdjustLoading(false);
    }
  };

  const handleFinalizeVessel = async (e) => {
    e.preventDefault();
    setFinalizeLoading(true);
    try {
      const res = await API.post(`/shipping/vessel-calls/${selectedCall.vcn}/finalize`, {
        propertyDamageReported: propertyDamage,
        remarks: finalizeRemarks
      });

      triggerToast('Vessel Finalized', res.data.message, 'success');
      setShowFinalizeModal(false);
      setPropertyDamage(false);
      setFinalizeRemarks('');
      fetchVesselCalls();
    } catch (error) {
      triggerToast('Finalize Failed', error.response?.data?.message || 'Failed to finalize vessel turnaround.', 'error');
    } finally {
      setFinalizeLoading(false);
    }
  };

  const handleYardAllocSubmit = async (e) => {
    e.preventDefault();
    if (!targetWhId || !allocWeight) {
      triggerToast('Validation Error', 'Warehouse Plot selection and weight allocation are required.', 'error');
      return;
    }
    setAllocLoading(true);
    try {
      await API.post('/warehouses/allocate', {
        cargoId: activeCargoForYard.id,
        warehouseId: targetWhId,
        yardLocationId: targetYardLocId || null,
        weight: parseFloat(allocWeight)
      });
      triggerToast('Yard Allocated', `Cargo successfully assigned to storage plot.`, 'success');
      setShowYardModal(false);
      setActiveCargoForYard(null);
      fetchVesselDetails();
    } catch (err) {
      triggerToast('Allocation Failed', err.response?.data?.message || 'Storage allocation failed.', 'error');
    } finally {
      setAllocLoading(false);
    }
  };

  const openYardModal = (cargo) => {
    setActiveCargoForYard(cargo);
    setAllocWeight(cargo.weight);
    setTargetWhId(warehousesList.length > 0 ? warehousesList[0].id : '');
    setTargetYardLocId('');
    setShowYardModal(true);
  };

  // ----------------------------------------------------
  // Warehouse Management API Fetch Methods
  // ----------------------------------------------------


  const fetchWarehouseDetails = async (id) => {
    try {
      const res = await API.get(`/warehouses/${id}`);
      setActiveWarehouse(res.data);
    } catch (error) {
      console.error('Failed to get warehouse details:', error);
    }
  };

  const fetchWarehouseData = async () => {
    try {
      // Fetch Warehouses
      const whRes = await API.get('/warehouses');
      setWarehouses(whRes.data);
      if (whRes.data.length > 0) {
        const nextId = selectedWarehouseId || whRes.data[0].id;
        setSelectedWarehouseId(nextId);
        await fetchWarehouseDetails(nextId);
      }

      // Fetch Damaged Cargo list
      const damageRes = await API.get('/warehouses/damaged/reports');
      setDamagedCargoes(damageRes.data);

      // Fetch active Cargo for dropdown selection (only cargo currently stored in port)
      const cargoRes = await API.get('/cargo', { params: { limit: 100 } });
      const rawCargoes = cargoRes.data.cargoes || [];
      setAllCargoes(rawCargoes);
      const activeInPort = rawCargoes.filter(c => 
        ['Allocated', 'Customs Hold', 'Customs Approved', 'Unloaded', 'Manifest Uploaded'].includes(c.status) && !c.deliveryOrderNo
      );
      setActiveCargoes(activeInPort);
    } catch (error) {
      console.error('Failed to fetch warehouse data:', error);
    }
  };

  const handleWarehouseSelect = (id) => {
    setSelectedWarehouseId(id);
    fetchWarehouseDetails(id);
  };



  const handleReportDamage = async (e) => {
    e.preventDefault();
    if (!selectedCargoId || !damageRemarks) {
      triggerToast('Validation Error', 'Please select a cargo and enter remarks.', 'error');
      return;
    }

    setSubmitLoading(true);
    try {
      await API.post('/warehouses/damage', {
        cargoId: selectedCargoId,
        remarks: damageRemarks
      });

      triggerToast('Damage Filed', `Cargo ${selectedCargoId} flagged as damaged.`, 'success');
      setSelectedCargoId('');
      setDamageRemarks('');
      fetchWarehouseData();
    } catch (error) {
      triggerToast('Filing Failed', error.response?.data?.message || 'Failed to submit report.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };



  const handleAuditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInventory || auditWeight === '' || parseFloat(auditWeight) < 0 || !auditReason) {
      triggerToast('Validation Error', 'Specify a valid weight and audit justification.', 'error');
      return;
    }
    setAuditLoading(true);
    try {
      await API.post(`/warehouses/inventory/${selectedInventory.id}/adjust`, {
        adjustedWeight: parseFloat(auditWeight),
        reason: auditReason
      });
      triggerToast('Stock Adjusted', 'Inventory stock audit adjustment applied successfully.', 'success');
      setShowAuditModal(false);
      setSelectedInventory(null);
      setAuditWeight('');
      setAuditReason('');
      fetchWarehouseData();
    } catch (err) {
      triggerToast('Adjustment Failed', err.response?.data?.message || 'Failed to adjust stock weight.', 'error');
    } finally {
      setAuditLoading(false);
    }
  };

  // ----------------------------------------------------
  // Lifecycle Effects
  // ----------------------------------------------------
  useEffect(() => {
    fetchVesselCalls();
    fetchBerthsList();
    fetchWarehousesList();
  }, []);

  useEffect(() => {
    fetchVesselDetails();
  }, [selectedCall]);

  useEffect(() => {
    if (activeTab && activeTab !== 'vessels') {
      fetchWarehouseData();
    }
  }, [activeTab, selectedWarehouseId]);

  // Helpers
  const getUtilColor = (occupied, capacity) => {
    const pct = (occupied / capacity) * 100;
    if (pct < 50) return 'bg-emerald-500';
    if (pct < 85) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const getUtilBg = (occupied, capacity) => {
    const pct = (occupied / capacity) * 100;
    if (pct < 50) return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    if (pct < 85) return 'bg-amber-500/10 text-slate-700 border-amber-500/20 dark:text-slate-200';
    return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Awaiting Arrival':
      case 'PRE_ADVICE':
        return <span className="inline-block px-2.5 py-0.5 text-xs font-bold rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">AWAITING ARRIVAL</span>;
      case 'Docked':
      case 'BERTHED':
        return <span className="inline-block px-2.5 py-0.5 text-xs font-bold rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">DOCKED / ACTIVE</span>;
      case 'Completed':
      case 'SAILED':
        return <span className="inline-block px-2.5 py-0.5 text-xs font-bold rounded-lg bg-slate-500/10 text-slate-400 border border-slate-500/20">DEPARTED / COMPLETED</span>;
      default:
        return <span className="inline-block px-2.5 py-0.5 text-xs font-bold rounded-lg bg-slate-200 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 text-slate-700 dark:text-slate-200">
      
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 glass-panel flex flex-col md:flex-row justify-between items-start md:items-center gap-4 select-none">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">Seaport Operations & Warehouse Hub</h2>
          <p className="text-sm text-slate-400 font-light mt-0.5">Digitally assign vessel berths, perform yard grid optimizations, and manage inventory logs.</p>
        </div>
        <button 
          onClick={() => {
            if (activeTab === 'vessels') {
              fetchVesselCalls();
            } else {
              fetchWarehouseData();
            }
          }}
          className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-955 dark:hover:bg-slate-900 rounded-xl transition text-slate-500 border border-slate-100 dark:border-slate-855 self-end md:self-auto focus:outline-none"
          title="Refresh data"
          type="button"
        >
          <RefreshCw className="w-5 h-5 animate-in spin duration-200" />
        </button>
      </div>

      {/* Tab Selector */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border select-none shadow-sm">
        <button
          onClick={() => setActiveTab('manifest')}
          className={`flex-1 min-w-[130px] py-2.5 px-3 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'manifest' 
              ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20' 
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}
          type="button"
        >
          <FileText className="w-4 h-4" />
          <span>Cargo Manifests</span>
          <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${activeTab === 'manifest' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
            {allCargoes.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex-1 min-w-[130px] py-2.5 px-3 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'inventory' 
              ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20' 
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}
          type="button"
        >
          <Grid className="w-4 h-4" />
          <span>Yard Stacking Grid</span>
        </button>
        <button
          onClick={() => setActiveTab('damage')}
          className={`flex-1 min-w-[130px] py-2.5 px-3 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'damage' 
              ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20' 
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}
          type="button"
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Damaged Cargo</span>
          <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${activeTab === 'damage' ? 'bg-white/20 text-white' : 'bg-rose-500/10 text-rose-500'}`}>
            {damagedCargoes.length}
          </span>
        </button>
      </div>

      {loading ? (
        <div className="p-20 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-500"></div>
        </div>
      ) : activeTab === 'manifest' ? (
        // ----------------------------------------------------
        // TAB: CARGO MANIFESTS VIEWER WORKSPACE
        // ----------------------------------------------------
        (() => {
          const filteredManifests = allCargoes.filter(c => {
            const q = manifestSearch.toLowerCase().trim();
            const matchesSearch = !q || 
              c.cargoId?.toLowerCase().includes(q) ||
              c.billOfLading?.toLowerCase().includes(q) ||
              c.manifestNumber?.toLowerCase().includes(q) ||
              c.consignee?.toLowerCase().includes(q) ||
              c.shipper?.toLowerCase().includes(q) ||
              c.vesselName?.toLowerCase().includes(q) ||
              c.containerNo?.toLowerCase().includes(q) ||
              c.cargoType?.toLowerCase().includes(q);
            
            const matchesType = manifestTypeFilter === 'ALL' || c.cargoType === manifestTypeFilter;
            const matchesTrade = manifestTradeFilter === 'ALL' || (c.tradeType || 'Import') === manifestTradeFilter;
            const matchesHold = manifestHoldFilter === 'ALL' || (c.customsHoldStatus || 'LOCKED') === manifestHoldFilter;

            return matchesSearch && matchesType && matchesTrade && matchesHold;
          });

          const totalWeight = allCargoes.reduce((acc, c) => acc + (Number(c.weight) || 0), 0);
          const releasedCount = allCargoes.filter(c => c.customsHoldStatus === 'RELEASED').length;
          const heldCount = allCargoes.filter(c => c.customsHoldStatus === 'SEIZED' || c.status === 'Customs Hold').length;

          return (
            <div className="space-y-6 animate-in fade-in duration-200 select-none">
              
              {/* Manifest Overview KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-3">
                  <div className="p-3 bg-sky-500/10 text-sky-500 rounded-xl">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Manifests</span>
                    <strong className="text-lg font-black text-slate-800 dark:text-white">{allCargoes.length}</strong>
                  </div>
                </div>

                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-3">
                  <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
                    <Boxes className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Manifested Tonnage</span>
                    <strong className="text-lg font-black text-slate-800 dark:text-white">{totalWeight.toLocaleString(undefined, { maximumFractionDigits: 1 })} MT</strong>
                  </div>
                </div>

                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-3">
                  <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Customs Cleared</span>
                    <strong className="text-lg font-black text-emerald-500">{releasedCount}</strong>
                  </div>
                </div>

                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-3">
                  <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Customs Holds</span>
                    <strong className="text-lg font-black text-rose-500">{heldCount}</strong>
                  </div>
                </div>
              </div>

              {/* Filters & Search Toolbar */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search Cargo ID, BL, Consignee, Vessel..."
                    value={manifestSearch}
                    onChange={(e) => setManifestSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                  {manifestSearch && (
                    <button
                      onClick={() => setManifestSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 w-full md:w-auto items-center justify-end">
                  <select
                    value={manifestTypeFilter}
                    onChange={(e) => setManifestTypeFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="ALL">All Cargo Types</option>
                    <option value="Container">Container</option>
                    <option value="Bulk">Bulk</option>
                    <option value="Break Bulk">Break Bulk</option>
                    <option value="Liquid">Liquid</option>
                  </select>

                  <select
                    value={manifestTradeFilter}
                    onChange={(e) => setManifestTradeFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="ALL">All Trade Types</option>
                    <option value="Import">Import</option>
                    <option value="Export">Export</option>
                  </select>

                  <select
                    value={manifestHoldFilter}
                    onChange={(e) => setManifestHoldFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="ALL">All Customs Status</option>
                    <option value="RELEASED">Customs Released</option>
                    <option value="LOCKED">Customs Locked</option>
                    <option value="SEIZED">Customs Seized</option>
                  </select>
                </div>
              </div>

              {/* Manifest Table */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs divide-y divide-slate-100 dark:divide-slate-800">
                    <thead className="bg-slate-50 dark:bg-slate-955 font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-3.5">Cargo / Consignment ID</th>
                        <th className="p-3.5">Bill of Lading / Manifest Ref</th>
                        <th className="p-3.5">Vessel / Voyage</th>
                        <th className="p-3.5">Consignee & Shipper</th>
                        <th className="p-3.5">Commodity & Weight</th>
                        <th className="p-3.5">Customs Hold</th>
                        <th className="p-3.5">Attached PDF</th>
                        <th className="p-3.5 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-light">
                      {filteredManifests.map((cargo) => {
                        const isSeized = cargo.customsHoldStatus === 'SEIZED';
                        const isReleased = cargo.customsHoldStatus === 'RELEASED';
                        const fileName = cargo.manifestNumber ? `${cargo.manifestNumber}.pdf` : `${cargo.cargoId}_manifest.pdf`;

                        return (
                          <tr key={cargo.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-sky-600 dark:text-sky-400">{cargo.cargoId}</span>
                                <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                                  cargo.tradeType === 'Export' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-emerald-500/10 text-emerald-500'
                                }`}>
                                  {cargo.tradeType || 'Import'}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-normal block mt-0.5">Status: {cargo.status}</span>
                            </td>

                            <td className="p-3.5">
                              <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                {cargo.billOfLading || 'BL-N/A'}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {cargo.manifestNumber || 'MNF-N/A'}
                              </div>
                            </td>

                            <td className="p-3.5">
                              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                                <Ship className="w-3.5 h-3.5 text-sky-500" />
                                {cargo.vesselName || cargo.vesselCall?.vesselName || 'MV Port Carrier'}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {cargo.vesselCall?.voyageNumber || 'VOY-2026-MNGPRT'}
                              </div>
                            </td>

                            <td className="p-3.5 max-w-[180px]">
                              <div className="font-semibold text-slate-800 dark:text-slate-200 truncate" title={cargo.consignee}>
                                {cargo.consignee || 'N/A'}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate" title={cargo.shipper || 'Global Shipper Ltd'}>
                                From: {cargo.shipper || 'Global Shipper Ltd'}
                              </div>
                            </td>

                            <td className="p-3.5">
                              <div className="font-bold text-slate-800 dark:text-slate-200">
                                {cargo.cargoType} {cargo.commodity ? `(${cargo.commodity})` : ''}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                {Number(cargo.weight || 0).toFixed(2)} MT &bull; {cargo.quantity || 1} Units
                              </div>
                            </td>

                            <td className="p-3.5">
                              {isSeized ? (
                                <span className="px-2 py-1 text-[10px] font-black rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20 animate-pulse">
                                  🚨 SEIZED
                                </span>
                              ) : isReleased ? (
                                <span className="px-2 py-1 text-[10px] font-black rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                  CLEARED (OOC)
                                </span>
                              ) : (
                                <span className="px-2 py-1 text-[10px] font-black rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                  HOLD (LOCKED)
                                </span>
                              )}
                            </td>

                            <td className="p-3.5">
                              <a
                                href={`http://localhost:5000/uploads/${String(fileName || '').replace(/^\/?(uploads\/)+/i, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 text-sky-600 dark:text-sky-400 rounded-lg font-semibold text-[10px] transition cursor-pointer border border-sky-200 dark:border-sky-800"
                                title="Open Scanned Manifest Document"
                              >
                                <FileText className="w-3 h-3" />
                                <span>PDF Record</span>
                              </a>
                            </td>

                            <td className="p-3.5 text-center">
                              <button
                                type="button"
                                onClick={() => setSelectedManifestModal(cargo)}
                                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-sky-600 hover:text-white dark:hover:bg-sky-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-[11px] transition shadow-sm inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" /> Inspect
                              </button>
                            </td>
                          </tr>
                        );
                      })}

                      {filteredManifests.length === 0 && (
                        <tr>
                          <td colSpan="8" className="p-12 text-center text-slate-400 italic">
                            No cargo manifests found matching your criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()
      ) : (
        // ----------------------------------------------------
        // TAB: WAREHOUSE MANAGEMENT WORKSPACES
        // ----------------------------------------------------
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-200">
          
          {/* Left Panel: Warehouse Directory */}
          <div className="lg:col-span-4 space-y-4 select-none">
            <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-wider">Warehouse Directory</h3>
            <div className="space-y-3">
              {warehouses.map(wh => {
                const utilPct = Math.round((wh.occupiedSpace / wh.capacity) * 100);
                const isSelected = wh.id === selectedWarehouseId;
                
                return (
                  <div 
                    key={wh.id} onClick={() => handleWarehouseSelect(wh.id)}
                    className={`cursor-pointer p-4 rounded-2xl border transition-all duration-200 glass-panel ${
                      isSelected 
                        ? 'border-sky-500 bg-sky-500/5 shadow-lg font-bold' 
                        : 'border-slate-100 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-1.5">
                          <WarehouseIcon className="w-4 h-4 text-sky-500" />
                          {wh.name}
                        </h4>
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest">{wh.type} Storage Plot</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] border font-bold ${getUtilBg(wh.occupiedSpace, wh.capacity)}`}>
                        {utilPct}% Utilized
                      </span>
                    </div>

                    <div className="space-y-2 mt-3">
                      <div className="flex justify-between text-xs text-slate-455">
                        <span>Current Occupancy:</span>
                        <span><strong>{wh.occupiedSpace.toLocaleString()}</strong> / {wh.capacity.toLocaleString()} Tons</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${getUtilColor(wh.occupiedSpace, wh.capacity)}`}
                          style={{ width: `${Math.min(100, utilPct)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Warehouse Sub-tabs content */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Yard Stacking Grid Sub-tab */}
            {activeTab === 'inventory' && (() => {
              const rawCargoes = (activeWarehouse?.Cargoes && activeWarehouse.Cargoes.length > 0) 
                ? activeWarehouse.Cargoes 
                : (activeCargoes.length > 0 ? activeCargoes : cargoes);

              const cargoPool = rawCargoes.filter(c => c.status !== 'Dispatched' && !c.deliveryOrderNo);

              const getCargoesAtSlot = (row, col) => {
                return cargoPool.filter((c, idx) => {
                  const explicitMatch = c.Inventories?.some(inv => inv.rowNum === row && inv.colNum === col);
                  if (explicitMatch) return true;
                  const calculatedRow = (idx % 4) + 1;
                  const calculatedCol = (Math.floor(idx / 4) % 5) + 1;
                  return calculatedRow === row && calculatedCol === col;
                });
              };

              const getSegregationViolations = () => {
                if (!activeWarehouse || !activeWarehouse.Cargoes) return [];
                const cashewCargoes = activeWarehouse.Cargoes.filter(c => c.cargoId.toLowerCase().includes('cashew') || c.cargoType?.toLowerCase().includes('cashew') || c.consignee?.toLowerCase().includes('cashew') || c.cargoType?.toLowerCase().includes('reefer'));
                const hazardousCargoes = activeWarehouse.Cargoes.filter(c => c.cargoType?.toLowerCase().includes('chemical') || c.cargoId.toLowerCase().includes('chem') || c.consignee?.toLowerCase().includes('chem') || c.cargoType?.toLowerCase().includes('hazardous'));
                
                const violations = [];
                cashewCargoes.forEach(cash => {
                  const cashInv = cash.Inventories?.[0];
                  if (!cashInv || cashInv.rowNum === null || cashInv.colNum === null) return;
                  
                  hazardousCargoes.forEach(haz => {
                    const hazInv = haz.Inventories?.[0];
                    if (!hazInv || hazInv.rowNum === null || hazInv.colNum === null) return;
                    
                    const rowDiff = Math.abs(cashInv.rowNum - hazInv.rowNum);
                    const colDiff = Math.abs(cashInv.colNum - hazInv.colNum);
                    
                    if (rowDiff <= 1 && colDiff <= 1) {
                      violations.push({
                        cashew: cash.cargoId,
                        cashewSlot: `${String.fromCharCode(64 + cashInv.rowNum)}-${cashInv.colNum}`,
                        haz: haz.cargoId,
                        hazSlot: `${String.fromCharCode(64 + hazInv.rowNum)}-${hazInv.colNum}`,
                      });
                    }
                  });
                });
                return violations;
              };

              const violations = getSegregationViolations();
              const rows = [1, 2, 3, 4];
              const cols = [1, 2, 3, 4, 5];

              return (
                <div className="space-y-6">
                  {/* Interactive Yard Stacking Grid */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow glass-panel space-y-6 select-none animate-in fade-in duration-200">
                    <div className="pb-2 border-b border-slate-100 dark:border-slate-850 flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-base text-slate-855 dark:text-white flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-sky-500" /> Interactive Yard Stacking Grid
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">Visual representation of container storage cells (Row A-D, Col 1-5). Hover to inspect vertical stacking details.</p>
                      </div>
                    </div>

                    {violations.length > 0 && (
                      <div className="bg-rose-500/10 border border-rose-500/25 p-4 rounded-xl space-y-2 animate-pulse">
                        <div className="flex items-center gap-2 text-rose-600 font-bold text-xs">
                          <AlertTriangle className="w-4 h-4" /> YARD STORAGE COMPLIANCE ALERT: IMDG SEGREGATION VIOLATIONS DETECTED
                        </div>
                        <div className="text-xs text-slate-700 dark:text-slate-350 space-y-1">
                          {violations.map((v, i) => (
                            <div key={i}>
                              • Cashew cargo <span className="font-mono font-bold text-sky-500">{v.cashew}</span> at slot <span className="font-bold">{v.cashewSlot}</span> is stored adjacent to hazardous chemical cargo <span className="font-mono font-bold text-rose-500">{v.haz}</span> at slot <span className="font-bold">{v.hazSlot}</span>. Relocation recommended.
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-6 gap-3 text-center">
                      <div className="text-xs font-bold text-slate-400 p-2 flex items-center justify-center">Slot</div>
                      {cols.map(c => (
                        <div key={c} className="text-xs font-extrabold text-slate-400 p-2">Column {c}</div>
                      ))}

                      {rows.map(r => {
                        const rowChar = String.fromCharCode(64 + r);
                        return (
                          <React.Fragment key={r}>
                            <div className="text-xs font-extrabold text-slate-400 flex items-center justify-center border-r border-slate-100 dark:border-slate-800">
                              Row {rowChar}
                            </div>
                            
                            {cols.map(c => {
                              const slotCargoes = getCargoesAtSlot(r, c);
                              const hasCashew = slotCargoes.some(cg => cg.cargoId.toLowerCase().includes('cashew') || cg.cargoType?.toLowerCase().includes('cashew'));
                              const hasHaz = slotCargoes.some(cg => cg.cargoType?.toLowerCase().includes('chemical') || cg.cargoId.toLowerCase().includes('chem') || cg.cargoType?.toLowerCase().includes('hazardous'));
                              
                              let cellBg = 'bg-slate-50/50 dark:bg-slate-955/20 border-slate-100 dark:border-slate-855';
                              if (slotCargoes.length > 0) {
                                if (hasHaz) cellBg = 'bg-rose-500/10 border-rose-500/30 text-rose-600';
                                else if (hasCashew) cellBg = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600';
                                else cellBg = 'bg-sky-500/10 border-sky-500/30 text-sky-600';
                              }

                              return (
                                <div 
                                  key={c}
                                  className={`group relative p-3 border rounded-xl flex flex-col justify-between min-h-[90px] transition-all duration-200 ${cellBg}`}
                                >
                                  <span className="text-[10px] text-slate-400 font-bold block mb-1">{rowChar}-{c}</span>
                                  {slotCargoes.length > 0 ? (
                                    <div className="space-y-1">
                                      <div className="flex flex-col-reverse gap-0.5">
                                        {slotCargoes.slice(0, 3).map((cg, idx) => (
                                          <div 
                                            key={cg.id} 
                                            className={`px-1 py-0.5 rounded text-[8px] font-bold text-center border truncate select-all ${
                                              cg.cargoType?.toLowerCase().includes('chemical') || cg.cargoId.toLowerCase().includes('chem')
                                                ? 'bg-rose-500 text-white border-rose-600'
                                                : cg.cargoId.toLowerCase().includes('cashew') || cg.cargoType?.toLowerCase().includes('cashew')
                                                ? 'bg-emerald-500 text-white border-emerald-600'
                                                : 'bg-sky-600 text-white border-sky-700'
                                            }`}
                                          >
                                            Tier {idx+1}: {cg.containerNo || cg.cargoId.slice(-6)}
                                          </div>
                                        ))}
                                      </div>
                                      <span className="text-[8px] font-semibold block pt-1">{slotCargoes.reduce((sum, x) => sum + x.weight, 0).toFixed(1)} Tons</span>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-slate-455 italic font-light block my-auto">Empty</span>
                                  )}

                                  {slotCargoes.length > 0 && (
                                    <div className="opacity-0 group-hover:opacity-100 absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 bg-slate-900 text-white text-xs rounded-xl shadow-xl w-48 text-left transition-opacity duration-200 pointer-events-none">
                                      <h4 className="font-bold border-b border-slate-700 pb-1 mb-1.5 text-[10px] uppercase text-sky-400">Slot {rowChar}-{c} Details</h4>
                                      {slotCargoes.map((cg, i) => (
                                        <div key={cg.id} className="mb-1 last:mb-0">
                                          <div className="font-bold flex justify-between">
                                            <span>Tier {i+1}: {cg.cargoId}</span>
                                            <span>{cg.weight} MT</span>
                                          </div>
                                          <div className="text-[10px] text-slate-400">BL: {cg.billOfLading}</div>
                                          {cg.containerNo && <div className="text-[9px] text-slate-450 font-mono">Cont: {cg.containerNo}</div>}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>

                  {/* Stock Ledger inside Yard tab */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow glass-panel space-y-4 animate-in fade-in duration-200">
                    <div className="pb-2 border-b border-slate-100 dark:border-slate-850">
                      <h3 className="font-bold text-base text-slate-855 dark:text-white flex items-center gap-1">
                        <FileText className="w-5 h-5 text-sky-500" /> Active Stock Ledger (Opening/Closing Balance)
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">Physical ledger showing total registered and current stored weights in metric tons (MT).</p>
                    </div>

                    {(() => {
                      const displayCargoes = (activeWarehouse?.Cargoes && activeWarehouse.Cargoes.length > 0) 
                        ? activeWarehouse.Cargoes 
                        : (activeCargoes.length > 0 ? activeCargoes : cargoes);

                      if (displayCargoes.length === 0) {
                        return <p className="text-xs text-slate-400 italic text-center py-10">No stock cargo balances currently registered in this warehouse.</p>;
                      }

                      return (
                        <div className="overflow-x-auto select-none">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                                <th className="p-3">Cargo ID / Container</th>
                                <th className="p-3">Bill of Lading</th>
                                <th className="p-3">Slot Position</th>
                                <th className="p-3">Stored Weight</th>
                                <th className="p-3">Vessel Call</th>
                                <th className="p-3 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-330">
                              {displayCargoes.map((cargo, idx) => {
                                const ledger = cargo.Inventories?.[0];
                                const calculatedRowChar = String.fromCharCode(65 + (idx % 4));
                                const calculatedCol = (Math.floor(idx / 4) % 5) + 1;
                                const slotCoords = ledger && ledger.rowNum !== null
                                  ? `${String.fromCharCode(64 + ledger.rowNum)}-${ledger.colNum} (Tier ${ledger.tierNum || 1})`
                                  : `${calculatedRowChar}-${calculatedCol} (Tier 1)`;

                                return (
                                  <tr key={cargo.id || cargo.cargoId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                                    <td className="p-3 font-mono font-bold text-slate-800 dark:text-white">
                                      {cargo.cargoId}
                                      {cargo.containerNo && <span className="block text-[9px] text-slate-400 font-normal font-sans">Cont: {cargo.containerNo}</span>}
                                    </td>
                                    <td className="p-3 font-mono text-sky-500 font-semibold">{cargo.billOfLading}</td>
                                    <td className="p-3 font-medium uppercase text-[10px]">{slotCoords}</td>
                                    <td className="p-3 font-bold">{parseFloat(cargo.weight || 0).toFixed(2)} MT</td>
                                    <td className="p-3 font-light">{cargo.vesselName}</td>
                                    <td className="p-3 text-right flex items-center justify-end gap-2">
                                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                        cargo.isDamaged 
                                          ? 'bg-rose-500/10 text-rose-500 border border-rose-500/15'
                                          : 'bg-emerald-500/10 text-emerald-500'
                                      }`}>
                                        {cargo.isDamaged ? 'DAMAGED' : cargo.status}
                                      </span>
                                      {ledger && (
                                        <button
                                          onClick={() => {
                                            setSelectedInventory(ledger);
                                            setAuditWeight(ledger.weight.toString());
                                            setAuditReason('');
                                            setShowAuditModal(true);
                                          }}
                                          className="p-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 text-slate-550 border border-slate-150 dark:border-slate-800 rounded-lg transition focus:outline-none"
                                          title="Audit and adjust weight"
                                          type="button"
                                        >
                                          <Edit3 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              );
            })()}



            {/* Damaged Registry Sub-tab */}
            {activeTab === 'damage' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-in fade-in duration-200">
                <div className="md:col-span-5 bg-white dark:bg-slate-900 p-5 border border-slate-100 dark:border-slate-800/80 rounded-2xl glass-panel space-y-4">
                  <h3 className="font-bold text-sm text-slate-855 dark:text-white flex items-center gap-1.5">
                    <AlertOctagon className="w-5 h-5 text-rose-500" /> Log Damage Report
                  </h3>

                  <form onSubmit={handleReportDamage} className="space-y-4 text-xs select-none">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Select Stored Cargo</label>
                      <select
                        value={selectedCargoId} onChange={(e) => setSelectedCargoId(e.target.value)}
                        className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl text-slate-800 focus:outline-none"
                      >
                        <option value="">-- Choose Cargo --</option>
                        {activeCargoes.map(c => (
                          <option key={c.id} value={c.cargoId}>
                            {c.cargoId} ({c.cargoType} - {c.weight} Tons)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Damage Description Remarks</label>
                      <textarea
                        rows={3} placeholder="Describe the damage..." value={damageRemarks}
                        onChange={(e) => setDamageRemarks(e.target.value)}
                        className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit" disabled={submitLoading || activeCargoes.length === 0}
                      className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition"
                    >
                      {submitLoading ? 'Logging...' : 'File Damage Report'}
                    </button>
                  </form>
                </div>

                <div className="md:col-span-7 bg-white dark:bg-slate-900 p-5 border border-slate-100 dark:border-slate-800/80 rounded-2xl glass-panel space-y-4">
                  <h3 className="font-bold text-sm text-slate-855 dark:text-white flex items-center gap-1.5">
                    <AlertTriangle className="w-5 h-5 text-rose-500" /> Active Damaged Inventory
                  </h3>

                  <div className="max-h-[300px] overflow-y-auto space-y-3 pr-1 text-xs select-none">
                    {damagedCargoes.map(cargo => (
                      <div key={cargo.id} className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl space-y-1">
                        <div className="flex justify-between items-start font-bold">
                          <span className="text-rose-655 font-bold">{cargo.cargoId}</span>
                          <span className="text-slate-500">{cargo.weight} MT</span>
                        </div>
                        <p className="italic text-slate-650 leading-snug dark:text-slate-350">{cargo.damageRemarks}</p>
                        <div className="text-[10px] text-slate-400 pt-1 flex justify-between">
                          <span>Plot: {cargo.Warehouse?.name || 'Unassigned'}</span>
                          <span>Logged: {new Date(cargo.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                    {damagedCargoes.length === 0 && (
                      <p className="text-slate-400 italic text-center py-10">No damaged cargo reports on file. Yard is clean.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Live Interactive Port & Storage Layout Map */}
      <div className="pt-2">
        <VisualPortMap berths={berthsList} warehouses={warehousesList} />
      </div>

      {/* YARD PLOT GRID ALLOCATION MODAL */}
      {showYardModal && activeCargoForYard && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex justify-center items-center p-4 select-none animate-in fade-in duration-200">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl rounded-2xl p-6 text-sm animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-805">
              <div>
                <h3 className="font-bold text-base text-slate-800 dark:text-white flex items-center gap-1">
                  <Grid className="w-5 h-5 text-sky-500" />
                  Yard Plot Grid Allocation
                </h3>
                <span className="text-xs text-slate-400">Cargo ID: <strong className="text-sky-500 font-mono">{activeCargoForYard.cargoId}</strong> (BL: {activeCargoForYard.billOfLading})</span>
              </div>
              <button onClick={() => { setShowYardModal(false); setActiveCargoForYard(null); }} className="text-slate-400 text-lg">×</button>
            </div>

            <form onSubmit={handleYardAllocSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Target Storage Plot / Covered Warehouse</label>
                <select
                  value={targetWhId}
                  onChange={(e) => {
                    setTargetWhId(e.target.value);
                    setTargetYardLocId('');
                  }}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 rounded-xl focus:outline-none dark:border-slate-800"
                >
                  <option value="">-- Select Plot --</option>
                  {warehousesList.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.type} | Available Cap: {(w.availableSpace || 0).toLocaleString()} Tons)
                    </option>
                  ))}
                </select>
              </div>

              {targetWhId && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Target Grid Coordinate Slot</label>
                  <select
                    value={targetYardLocId}
                    onChange={(e) => setTargetYardLocId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-955 border border-slate-150 rounded-xl focus:outline-none dark:border-slate-800"
                  >
                    <option value="">-- Select Coordinate (Bulk / Yard Area) --</option>
                    {warehousesList.find(w => w.id === parseInt(targetWhId))?.YardLocations?.map(yl => (
                      <option key={yl.id} value={yl.id}>
                        {yl.zoneCode} (Occupied Space: {(yl.occupiedSpace || 0).toLocaleString()} Tons)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Allocation Weight (Tons)</label>
                <input
                  type="number" step="0.01" required value={allocWeight}
                  onChange={(e) => setAllocWeight(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-955 border border-slate-150 rounded-xl focus:outline-none dark:border-slate-800"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button" onClick={() => { setShowYardModal(false); setActiveCargoForYard(null); }}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-500 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={allocLoading}
                  className="px-4 py-2 bg-sky-600 text-white rounded-xl font-bold transition flex items-center gap-1 shadow-lg shadow-sky-500/10 cursor-pointer"
                >
                  <Grid className="w-4 h-4" />
                  {allocLoading ? 'Allocating...' : 'Approve Yard Placement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TALLY ADJUSTMENT MODAL */}
      {showAdjustModal && selectedTallyLog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex justify-center items-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl rounded-2xl p-6 text-sm animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-base text-slate-800 dark:text-white">Supervisor Tally Adjustment</h3>
                <span className="text-xs text-slate-400 font-light">Tally Log ID: #{selectedTallyLog.id} | BL: {selectedTallyLog.billOfLading}</span>
              </div>
              <button onClick={() => { setShowAdjustModal(false); setSelectedTallyLog(null); }} className="text-slate-400 text-lg">×</button>
            </div>
            <form onSubmit={handleAdjustSubmit} className="space-y-4 select-none">
              <div>
                <label className="block text-[11px] font-bold text-slate-455 uppercase mb-1">Corrected Weight (Tons)</label>
                <input
                  type="number" step="0.01" required value={adjustedWeight}
                  onChange={(e) => setAdjustedWeight(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-955 border rounded-xl focus:outline-none dark:border-slate-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-455 uppercase mb-1">Supervisor Justification Reason</label>
                <textarea
                  rows={3} required placeholder="Justification for adjustment..." value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-955 border rounded-xl focus:outline-none dark:border-slate-800"
                />
              </div>
              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button" onClick={() => { setShowAdjustModal(false); setSelectedTallyLog(null); }}
                  className="px-4 py-2 border text-slate-500 rounded-xl font-bold dark:border-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={adjustLoading}
                  className="px-4 py-2 bg-sky-600 text-white rounded-xl font-bold flex items-center gap-1 shadow-lg shadow-sky-500/10 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  {adjustLoading ? 'Applying...' : 'Authorize Change'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEPARTURE CLEAR MODAL */}
      {showFinalizeModal && selectedCall && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex justify-center items-center p-4 animate-in fade-in duration-200">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl rounded-2xl p-6 text-sm animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
              <h3 className="font-bold text-base text-slate-800 dark:text-white">Finalize Vessel Turnaround</h3>
              <button onClick={() => setShowFinalizeModal(false)} className="text-slate-400 text-lg">×</button>
            </div>
            <form onSubmit={handleFinalizeVessel} className="space-y-4 select-none">
              <div className="flex items-start gap-2 p-3 bg-slate-50 dark:bg-slate-950 border rounded-xl dark:border-slate-800">
                <input
                  type="checkbox" id="propDamage" checked={propertyDamage}
                  onChange={(e) => setPropertyDamage(e.target.checked)}
                  className="w-4 h-4 mt-0.5"
                />
                <label htmlFor="propDamage" className="text-xs font-semibold text-slate-600 leading-snug dark:text-slate-350">
                  Property Damage Reported
                  <span className="block text-[10px] text-slate-400 font-light mt-0.5">Toggle this if any quay, crane, or harbor assets were damaged during berthing operations.</span>
                </label>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Departure Clearance Remarks</label>
                <textarea
                  rows={3} required placeholder="Final operational clearance remarks..." value={finalizeRemarks}
                  onChange={(e) => setFinalizeRemarks(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-xl focus:outline-none"
                />
              </div>
              <div className="flex gap-2 justify-end pt-3">
                <button type="button" onClick={() => setShowFinalizeModal(false)} className="px-4 py-2 border text-slate-500 rounded-xl font-bold dark:border-slate-800">
                  Cancel
                </button>
                <button type="submit" disabled={finalizeLoading} className="px-4 py-2 bg-sky-600 text-white rounded-xl font-bold">
                  {finalizeLoading ? 'Authorizing...' : 'Authorize Departure'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STOCK AUDIT MODAL */}
      {showAuditModal && selectedInventory && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/55 backdrop-blur-sm select-none">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-2xl w-full max-w-sm space-y-4 text-xs animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-800 dark:text-white">Audit Inventory Stock</h3>
              <button 
                onClick={() => { setShowAuditModal(false); setSelectedInventory(null); }}
                className="text-slate-400 text-lg hover:text-slate-550 transition focus:outline-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAuditSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Audited Weight (Metric Tons)</label>
                <input
                  type="number" step="0.01" value={auditWeight}
                  onChange={(e) => setAuditWeight(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-955 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Reason for Audit Adjustment</label>
                <select
                  value={auditReason} onChange={(e) => setAuditReason(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-955 border border-slate-150 dark:border-slate-850 rounded-xl focus:outline-none"
                >
                  <option value="">-- Select Audit Reason --</option>
                  <option value="Audited Discrepancy (Physical Count Variance)">Audited Discrepancy (Physical Count Variance)</option>
                  <option value="Cargo Spoilage / Rottening">Cargo Spoilage / Spoilage</option>
                  <option value="Moisture Shrinkage">Moisture Shrinkage / Dust Loss</option>
                  <option value="Authorized Scrap / Write-off">Authorized Scrap / Write-off</option>
                </select>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button" onClick={() => { setShowAuditModal(false); setSelectedInventory(null); }}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={auditLoading}
                  className="flex-1 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl transition"
                >
                  {auditLoading ? 'Saving...' : 'Apply Audit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REGISTER VESSEL CALL MODAL */}
      {showVesselModal && (
        <div className="fixed inset-0 bg-slate-955/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl flex flex-col animate-in zoom-in-95 duration-150 text-xs">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                <Ship className="w-5 h-5 text-sky-500" />
                Register Seaport Voyage Call (VCN)
              </h3>
              <button onClick={() => setShowVesselModal(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">×</button>
            </div>

            <form onSubmit={handleRegisterVesselSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600 dark:text-slate-350">Vessel Name *</label>
                  <input
                    type="text" required placeholder="e.g. MV Voyager"
                    value={vName} onChange={(e) => setVName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-slate-750 dark:text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600 dark:text-slate-350">Voyage Number *</label>
                  <input
                    type="text" required placeholder="e.g. VOY-2026-99"
                    value={vVoyageNo} onChange={(e) => setVVoyageNo(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-slate-750 dark:text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600 dark:text-slate-350">Flag</label>
                  <input
                    type="text" value={vFlag} onChange={(e) => setVFlag(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-slate-750 dark:text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600 dark:text-slate-350">Cargo Type</label>
                  <select
                    value={vType} onChange={(e) => setVType(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-slate-750 dark:text-slate-200"
                  >
                    <option value="Container">Container</option>
                    <option value="Bulk">Bulk</option>
                    <option value="Liquid">Liquid</option>
                    <option value="Break Bulk">Break Bulk</option>
                  </select>
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="block font-bold text-slate-600 dark:text-slate-350">Arrival Date (ETA) *</label>
                  <input
                    type="datetime-local" required
                    min={`${getTomorrowDateStr()}T00:00`}
                    value={vEta} onChange={(e) => setVEta(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-slate-750 dark:text-slate-200"
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="block font-bold text-slate-600 dark:text-slate-350">Berth Assignment</label>
                  <select
                    value={vBerthSpec} onChange={(e) => setVBerthSpec(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-slate-750 dark:text-slate-200"
                  >
                    {(berthsList && berthsList.length > 0 ? berthsList : [
                      { id: 1, number: 'Berth No. 1 (B1) - General Cargo / Coastal', draftLimit: 7.0 },
                      { id: 2, number: 'Berth No. 2 (B2) - General Cargo / Break Bulk', draftLimit: 10.5 },
                      { id: 3, number: 'Berth No. 3 (B3) - General Cargo / Multi-Purpose', draftLimit: 10.3 },
                      { id: 4, number: 'Berth No. 4 (B4) - Liq. Ammonia / Phosphoric Acid', draftLimit: 9.5 },
                      { id: 5, number: 'Berth No. 5 (B5) - Bulk Cement / Edible Oil', draftLimit: 9.5 },
                      { id: 6, number: 'Berth No. 6 (B6) - General Cargo / Coastal Quay', draftLimit: 9.5 },
                      { id: 7, number: 'Berth No. 7 (B7) - General Cargo / Multi-Purpose', draftLimit: 9.5 },
                      { id: 8, number: 'Berth No. 8 (B8) - Iron Ore & Coal (KIOCL Jetty)', draftLimit: 12.5 },
                      { id: 9, number: 'Berth No. 9 (B9) - LPG & Chemical Jetty', draftLimit: 10.5 },
                      { id: 10, number: 'Berth No. 10 (B10) - POL Jetty 1 (Crude & Products)', draftLimit: 14.0 },
                      { id: 11, number: 'Berth No. 11 (B11) - POL Jetty 2 (POL & Chemicals)', draftLimit: 14.0 },
                      { id: 12, number: 'Berth No. 12 (B12) - POL / LPG / Edible Oil', draftLimit: 12.5 },
                      { id: 13, number: 'Berth No. 13 (B13) - POL Jetty 3 (Heavy POL)', draftLimit: 14.0 },
                      { id: 14, number: 'Berth No. 14 (B14) - JSD Container Terminal', draftLimit: 14.0 },
                      { id: 15, number: 'Berth No. 15 (B15) - UPCL Bulk Coal Handling', draftLimit: 14.0 },
                      { id: 16, number: 'Berth No. 16 (B16) - Chettinad Mechanized Coal', draftLimit: 14.0 },
                      { id: 17, number: 'SPM (Single Point Mooring) - Offshore VLCC Crude', draftLimit: 21.0 }
                    ]).map(b => (
                      <option key={b.id || b.number} value={b.number}>
                        {b.number} {b.draftLimit ? `(Max Draft: ${b.draftLimit}m)` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t">
                <button
                  type="button" onClick={() => setShowVesselModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={vcnSubmitting}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl"
                >
                  {vcnSubmitting ? 'Registering...' : 'Register Voyage Call'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manifest Detail Inspector Modal */}
      {selectedManifestModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[300] flex justify-center items-center p-4 overflow-y-auto">
          <div className="max-w-2xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl overflow-hidden animate-in zoom-in-95 duration-150 text-xs">
            
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-400" />
                <div>
                  <h3 className="font-extrabold text-sm">Official Electronic Cargo Manifest</h3>
                  <span className="text-[10px] text-slate-400 font-mono">ID: {selectedManifestModal.cargoId} &bull; BL: {selectedManifestModal.billOfLading}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedManifestModal(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Details */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Status Header Pill Banner */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Customs Clearance & Hold Status</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                    {selectedManifestModal.customsHoldStatus === 'RELEASED' ? '✅ Cleared / Out of Charge' : (selectedManifestModal.customsHoldStatus === 'SEIZED' ? '🚨 Customs Seizure Active' : '🔒 Regulatory Hold Active')}
                  </span>
                </div>
                <span className={`px-3 py-1 text-xs font-black rounded-xl uppercase ${
                  selectedManifestModal.tradeType === 'Export' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-sky-500/10 text-sky-500'
                }`}>
                  {selectedManifestModal.tradeType || 'Import'} Manifest
                </span>
              </div>

              {/* 2 Column Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-955 rounded-xl border border-slate-100 dark:border-slate-850 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Vessel Name</span>
                  <strong className="text-slate-800 dark:text-slate-200">{selectedManifestModal.vesselName || selectedManifestModal.vesselCall?.vesselName || 'MV Port Voyager'}</strong>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-955 rounded-xl border border-slate-100 dark:border-slate-850 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Voyage Number</span>
                  <strong className="text-slate-800 dark:text-slate-200 font-mono">{selectedManifestModal.vesselCall?.voyageNumber || 'VOY-2026-MNGPRT'}</strong>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-955 rounded-xl border border-slate-100 dark:border-slate-850 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Bill of Lading (BL)</span>
                  <strong className="text-slate-800 dark:text-slate-200 font-mono">{selectedManifestModal.billOfLading || 'N/A'}</strong>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-955 rounded-xl border border-slate-100 dark:border-slate-850 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Manifest Reference No</span>
                  <strong className="text-slate-800 dark:text-slate-200 font-mono">{selectedManifestModal.manifestNumber || 'MNF-MNGPRT-DEFAULT'}</strong>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-955 rounded-xl border border-slate-100 dark:border-slate-850 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Consignee (Importer)</span>
                  <strong className="text-slate-800 dark:text-slate-200">{selectedManifestModal.consignee || 'N/A'}</strong>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-955 rounded-xl border border-slate-100 dark:border-slate-850 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Shipper (Consignor)</span>
                  <strong className="text-slate-800 dark:text-slate-200">{selectedManifestModal.shipper || 'Global Exporter Inc.'}</strong>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-955 rounded-xl border border-slate-100 dark:border-slate-850 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Cargo Commodity & Type</span>
                  <strong className="text-slate-800 dark:text-slate-200">{selectedManifestModal.cargoType} ({selectedManifestModal.commodity || 'General Cargo'})</strong>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-955 rounded-xl border border-slate-100 dark:border-slate-850 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Gross Weight</span>
                  <strong className="text-slate-800 dark:text-slate-200 font-mono">{Number(selectedManifestModal.weight || 0).toFixed(2)} Metric Tons</strong>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-955 rounded-xl border border-slate-100 dark:border-slate-850 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Container Number</span>
                  <strong className="text-slate-800 dark:text-slate-200 font-mono">{selectedManifestModal.containerNo || 'Bulk / Non-containerized'}</strong>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-955 rounded-xl border border-slate-100 dark:border-slate-850 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Seal Number</span>
                  <strong className="text-slate-800 dark:text-slate-200 font-mono">{selectedManifestModal.sealNumber || 'SEAL-OK-VERIFIED'}</strong>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 bg-slate-50 dark:bg-slate-955 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <a
                href={`http://localhost:5000/uploads/${selectedManifestModal.manifestNumber || selectedManifestModal.cargoId}.pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 text-sky-600 dark:text-sky-400 rounded-xl font-bold transition flex items-center gap-1.5 border border-sky-200 dark:border-sky-800"
              >
                <FileText className="w-4 h-4" /> Open Official PDF File
              </a>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" /> Print Certificate
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedManifestModal(null)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default OperationsPortal;
