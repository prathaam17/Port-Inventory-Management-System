import React, { useState, useEffect, useContext } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import InvoicePDFModal from '../components/InvoicePDFModal';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import {
  Anchor,
  FilePlus,
  Coins,
  Upload,
  Clock,
  ArrowRight,
  Activity,
  CheckCircle,
  AlertTriangle,
  Layers,
  Lock,
  Plus,
  CreditCard,
  Search,
  FileText,
  ShieldAlert,
  Loader2,
  Droplet,
  Fuel,
  Trash2,
  Calendar,
  IndianRupee,
  ListTodo,
  FileUp,
  AlertCircle,
  Ship,
  Warehouse,
  Check,
  Compass,
  Printer,
  Edit2,
  Trash,
  PlusCircle,
  FileSpreadsheet,
  Download,
  Info,
  CalendarDays,
  FileCode,
  Sparkles,
  MapPin,
  TrendingUp,
  Archive,
  ArrowUpDown,
  RefreshCw,
  LayoutDashboard,
  Boxes,
  Grid,
  Truck,
  Receipt,
  BarChart3,
  FileCheck
} from 'lucide-react';

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#3b82f6'];

const ShippingAgentPortal = () => {
  const { user } = useContext(AuthContext);
  const { triggerToast } = useContext(NotificationContext);

  const [searchParams, setSearchParams] = useSearchParams();
  const queryTab = searchParams.get('tab');

  // Active Tab state
  const [activeTab, setActiveTabState] = useState(() => {
    const tab = queryTab || localStorage.getItem('shipping_agent_active_tab') || 'dashboard';
    return ['documents', 'allocation'].includes(tab) ? 'dashboard' : tab;
  });

  useEffect(() => {
    if (queryTab && queryTab !== activeTab) {
      setActiveTabState(['documents', 'allocation'].includes(queryTab) ? 'dashboard' : queryTab);
    }
  }, [queryTab]);

  useEffect(() => {
    if (!queryTab && activeTab) {
      setSearchParams({ tab: activeTab }, { replace: true });
    }
  }, [queryTab, activeTab, setSearchParams]);

  useEffect(() => {
    localStorage.setItem('shipping_agent_active_tab', activeTab);
  }, [activeTab]);

  const setActiveTab = (tabId) => {
    setActiveTabState(tabId);
    setSearchParams({ tab: tabId });
  };

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

  const getDayAfterEtaStr = (etaVal) => {
    if (!etaVal) {
      const d = new Date();
      d.setDate(d.getDate() + 2);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}T00:00`;
    }
    const etaDate = new Date(etaVal);
    etaDate.setDate(etaDate.getDate() + 1);
    const year = etaDate.getFullYear();
    const month = String(etaDate.getMonth() + 1).padStart(2, '0');
    const day = String(etaDate.getDate()).padStart(2, '0');
    const hours = String(etaDate.getHours()).padStart(2, '0');
    const minutes = String(etaDate.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Global Search State
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [pdfInvoice, setPdfInvoice] = useState(null);

  // PDA Wallet States
  const [pdaBalance, setPdaBalance] = useState(0);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositLoading, setDepositLoading] = useState(false);

  // Primary Datasets
  const [vesselCalls, setVesselCalls] = useState([]);
  const [vesselProfiles, setVesselProfiles] = useState([]);
  const [cargoes, setCargoes] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [moveLogs, setMoveLogs] = useState([]);
  const [berthsList, setBerthsList] = useState([]);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [vcnSubmitting, setVcnSubmitting] = useState(false);
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [manifestSubmitting, setManifestSubmitting] = useState(false);
  const [moveSubmitting, setMoveSubmitting] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [doLoading, setDoLoading] = useState(false);
  
  // CRUD Modal & Drawer States
  const [showVesselModal, setShowVesselModal] = useState(false);
  const [editingVessel, setEditingVessel] = useState(null);
  
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);

  const [showCargoModal, setShowCargoModal] = useState(false);
  const [editingCargo, setEditingCargo] = useState(null);
  
  const [showMoveModal, setShowMoveModal] = useState(false);
  
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);



  // Form Inputs - Vessel Profile
  const [profName, setProfName] = useState('');
  const [profImo, setProfImo] = useState('');
  const [profFlag, setProfFlag] = useState('India');
  const [profType, setProfType] = useState('Container');
  const [profCallSign, setProfCallSign] = useState('');
  const [profGt, setProfGt] = useState('');
  const [profNt, setProfNt] = useState('');
  const [profLoa, setProfLoa] = useState('');
  const [profBeam, setProfBeam] = useState('');
  const [profDraft, setProfDraft] = useState('');
  const [profOwner, setProfOwner] = useState('');

  // Form Inputs - Vessel Call (Voyage)
  const [vProfileId, setVProfileId] = useState('');
  const [vName, setVName] = useState('');
  const [vVoyageNo, setVVoyageNo] = useState('');
  const [vFlag, setVFlag] = useState('India');
  const [vType, setVType] = useState('Container');
  const [vEta, setVEta] = useState('');
  const [vEtd, setVEtd] = useState('');
  const [vBerthSpec, setVBerthSpec] = useState('Berth No. 2 (B2) - General Cargo / Break Bulk');
  const [vLoa, setVLoa] = useState('');
  const [vBeam, setVBeam] = useState('');
  const [vDraft, setVDraft] = useState('');
  const [vGrt, setVGrt] = useState('');
  const [vStatus, setVStatus] = useState('PRE_ADVICE');

  // Form Inputs - Cargo Manifest
  const [cargoIdInput, setCargoIdInput] = useState('');
  const [manifestNoInput, setManifestNoInput] = useState('');
  const [blNoInput, setBlNoInput] = useState('');
  const [cargoDescInput, setCargoDescInput] = useState('');
  const [commodityInput, setCommodityInput] = useState('General');
  const [categoryInput, setCategoryInput] = useState('Foreign');
  const [cargoTypeInput, setCargoTypeInput] = useState('Container');
  const [shipperInput, setShipperInput] = useState('');
  const [notifyPartyInput, setNotifyPartyInput] = useState('');
  const [consigneeInput, setConsigneeInput] = useState('');
  const [tradeTypeInput, setTradeTypeInput] = useState('Import');
  const [shippingBillInput, setShippingBillInput] = useState('');
  const [quantityInput, setQuantityInput] = useState(1);
  const [weightInput, setWeightInput] = useState('');
  const [volumeInput, setVolumeInput] = useState('');
  const [sealInput, setSealInput] = useState('');
  const [containerInput, setContainerInput] = useState('');
  const [hazmatInput, setHazmatInput] = useState('None');
  const [isDamagedInput, setIsDamagedInput] = useState(false);
  const [damageRemarksInput, setDamageRemarksInput] = useState('');
  const [destinationInput, setDestinationInput] = useState('Mangalore Yard');
  const [manifestFileInput, setManifestFileInput] = useState(null);
  const [manifestMethod, setManifestMethod] = useState('single'); // 'single' or 'bulk'
  const [csvText, setCsvText] = useState('');
  const [csvPreview, setCsvPreview] = useState([]);
  const [selectedVesselName, setSelectedVesselName] = useState('');

  useEffect(() => {
    if (vesselProfiles.length > 0 && !selectedVesselName) {
      setSelectedVesselName(vesselProfiles[0].vesselName);
    }
  }, [vesselProfiles, selectedVesselName]);

  // Form Inputs - Internal Movement
  const [moveCargoId, setMoveCargoId] = useState('');
  const [moveToWarehouseId, setMoveToWarehouseId] = useState('');
  const [moveToYardId, setMoveToYardId] = useState('');
  const [moveQty, setMoveQty] = useState('');
  const [moveEquipment, setMoveEquipment] = useState('Forklift F-40');
  const [moveSupervisor, setMoveSupervisor] = useState('B. R. Shetty');
  const [moveRemarks, setMoveRemarks] = useState('');

  // Form Inputs - Invoice Payment
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [txRef, setTxRef] = useState('');

  // Form Inputs - e-DO Generation
  const [doCargoId, setDoCargoId] = useState('');
  const [doRemarks, setDoRemarks] = useState('');
  const [doExpiry, setDoExpiry] = useState('');
  const [latestDO, setLatestDO] = useState(null);

  // Reports Configuration
  const [reportType, setReportType] = useState('vessel-wise');
  const [reportFilterVessel, setReportFilterVessel] = useState('All');
  const [reportFilterCommodity, setReportFilterCommodity] = useState('All');
  const [reportFilterWarehouse, setReportFilterWarehouse] = useState('All');
  const [reportFilterCargoType, setReportFilterCargoType] = useState('All');
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');

  // Sort & Filter state for lists
  const [vesselFilterType, setVesselFilterType] = useState('All');
  const [vesselFilterStatus, setVesselFilterStatus] = useState('All');
  const [vesselSortField, setVesselSortField] = useState('vesselName');
  const [vesselSortOrder, setVesselSortOrder] = useState('asc');

  const [cargoFilterType, setCargoFilterType] = useState('All');
  const [cargoFilterStatus, setCargoFilterStatus] = useState('All');
  const [cargoSortField, setCargoSortField] = useState('createdAt');
  const [cargoSortOrder, setCargoSortOrder] = useState('desc');

  // Pagination states
  const [vesselPage, setVesselPage] = useState(1);
  const [cargoPage, setCargoPage] = useState(1);
  const itemsPerPage = 8;

  // Initialize data
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [vCalls, vProfs, crgs, whs, invs, mvs, pdaRes, berthsRes] = await Promise.all([
        API.get('/shipping/vessel-calls'),
        API.get('/shipping/profiles'),
        API.get('/cargo?limit=1000'),
        API.get('/warehouses'),
        API.get('/billing/invoices'),
        API.get('/warehouses/moves'),
        API.get('/shipping/pda'),
        API.get('/master-data/berths').catch(() => ({ data: [] }))
      ]);

      setVesselCalls(vCalls.data || []);
      setVesselProfiles(vProfs.data || []);
      setCargoes(crgs.data?.cargoes || []);
      setWarehouses(whs.data || []);
      setInvoices(invs.data || []);
      setMoveLogs(mvs.data || []);
      setPdaBalance(pdaRes.data?.pdaBalance || 0);
      setBerthsList(berthsRes.data || []);
    } catch (err) {
      triggerToast('Error Fetching Data', 'Failed to fetch mngprt portal datasets.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Helper to trigger refetches of specific datasets
  const refetchCargoes = async () => {
    try {
      const res = await API.get('/cargo?limit=1000');
      setCargoes(res.data?.cargoes || []);
    } catch (err) {
      console.error(err);
    }
  };

  const refetchVesselCalls = async () => {
    try {
      const res = await API.get('/shipping/vessel-calls');
      setVesselCalls(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const refetchProfiles = async () => {
    try {
      const res = await API.get('/shipping/profiles');
      setVesselProfiles(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const refetchInvoices = async () => {
    try {
      const res = await API.get('/billing/invoices');
      setInvoices(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const refetchMoveLogs = async () => {
    try {
      const res = await API.get('/warehouses/moves');
      setMoveLogs(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Profile Form Change loader
  const handleProfileSelect = (pId) => {
    setVProfileId(pId);
    if (!pId || pId === 'manual') {
      setVName('');
      setVFlag('India');
      setVType('Container');
      setVLoa('');
      setVBeam('');
      setVDraft('');
      setVGrt('');
      return;
    }
    const prof = vesselProfiles.find(p => p.id === pId || p.vessel_id === pId);
    if (prof) {
      setVName(prof.vesselName);
      setVFlag(prof.flag);
      setVType(prof.vesselType);
      setVLoa(prof.lengthOverall || '');
      setVBeam(prof.beam || '');
      setVDraft(prof.draft || '');
      setVGrt(prof.grossTonnage || '');
      setVVoyageNo(`VOY-${Math.floor(1000 + Math.random() * 9000)}`);
    }
  };

  // Vessel Profile Actions (Create / Edit / Delete)
  const handleVesselProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profImo || !profName || !profCallSign || !profOwner) {
      triggerToast('Validation Error', 'Required fields cannot be empty.', 'error');
      return;
    }
    setProfileSubmitting(true);
    const payload = {
      imoNumber: profImo,
      vesselName: profName,
      flag: profFlag,
      vesselType: profType,
      callSign: profCallSign,
      grossTonnage: profGt ? parseFloat(profGt) : 0,
      netTonnage: profNt ? parseFloat(profNt) : 0,
      lengthOverall: profLoa ? parseFloat(profLoa) : 0,
      beam: profBeam ? parseFloat(profBeam) : 0,
      draft: profDraft ? parseFloat(profDraft) : 0,
      ownerOperator: profOwner
    };
    try {
      if (editingProfile) {
        await API.put(`/shipping/profiles/${editingProfile.id || editingProfile.vessel_id}`, payload);
        triggerToast('Profile Updated', 'Vessel master details saved successfully.', 'success');
      } else {
        await API.post('/shipping/profiles', payload);
        triggerToast('Profile Registered', 'Vessel profile added to MSW Master Database.', 'success');
      }
      setShowProfileModal(false);
      setEditingProfile(null);
      resetProfileForm();
      refetchProfiles();
    } catch (err) {
      triggerToast('Error Saving Profile', err.response?.data?.message || 'Failed to save vessel details.', 'error');
    } finally {
      setProfileSubmitting(false);
    }
  };

  const handleEditProfileClick = (prof) => {
    setEditingProfile(prof);
    setProfImo(prof.imoNumber);
    setProfName(prof.vesselName);
    setProfFlag(prof.flag);
    setProfType(prof.vesselType);
    setProfCallSign(prof.callSign);
    setProfGt(prof.grossTonnage);
    setProfNt(prof.netTonnage);
    setProfLoa(prof.lengthOverall);
    setProfBeam(prof.beam);
    setProfDraft(prof.draft);
    setProfOwner(prof.ownerOperator);
    setShowProfileModal(true);
  };

  const handleDeleteProfileClick = async (pId) => {
    if (!window.confirm('Are you sure you want to delete this vessel profile from registry?')) return;
    try {
      await API.delete(`/shipping/profiles/${pId}`);
      triggerToast('Profile Deleted', 'Vessel master details removed.', 'success');
      refetchProfiles();
    } catch (err) {
      triggerToast('Delete Failed', 'Vessel profile is bound to existing voyages.', 'error');
    }
  };

  const resetProfileForm = () => {
    setProfImo('');
    setProfName('');
    setProfFlag('India');
    setProfType('Container');
    setProfCallSign('');
    setProfGt('');
    setProfNt('');
    setProfLoa('');
    setProfBeam('');
    setProfDraft('');
    setProfOwner('');
  };

  // Vessel Voyage (Call) Actions (Create / Edit / Delete)
  const handleVesselCallSubmit = async (e) => {
    e.preventDefault();
    if (!vName || !vEta || !vVoyageNo) {
      triggerToast('Validation Error', 'Vessel Name, Voyage Number, and ETA are required.', 'error');
      return;
    }
    const tomorrowMin = new Date(getTomorrowDateStr() + 'T00:00:00');
    if (!editingVessel && new Date(vEta) < tomorrowMin) {
      triggerToast('Validation Error', 'Arrival date (ETA) must be from tomorrow onwards.', 'error');
      return;
    }
    if (vEtd && new Date(vEta) >= new Date(vEtd)) {
      triggerToast('Validation Error', 'Departure date (ETD) must be after Arrival date (ETA).', 'error');
      return;
    }

    setVcnSubmitting(true);
    const payload = {
      vesselName: vName,
      flag: vFlag,
      vesselType: vType,
      eta: vEta,
      etd: vEtd || null,
      berthSpecification: vBerthSpec,
      vesselProfileId: vProfileId && vProfileId !== 'manual' ? vProfileId : null,
      voyageNumber: vVoyageNo,
      loa: vLoa ? parseFloat(vLoa) : 0,
      beam: vBeam ? parseFloat(vBeam) : 0,
      draft: vDraft ? parseFloat(vDraft) : 0,
      grt: vGrt ? parseFloat(vGrt) : 0,
      status: vStatus
    };
    try {
      if (editingVessel) {
        await API.put(`/shipping/vessel-calls/${editingVessel.id || editingVessel.allocation_id}`, payload);
        triggerToast('Voyage Updated', 'Voyage call parameters successfully modified.', 'success');
      } else {
        const res = await API.post('/shipping/vessel-calls', payload);
        triggerToast('Voyage Registered', `Vessel voyage approved under VCN: ${res.data.vesselCall.vcn}`, 'success');
      }
      setShowVesselModal(false);
      setEditingVessel(null);
      resetVoyageForm();
      refetchVesselCalls();
    } catch (err) {
      triggerToast('Voyage Action Failed', err.response?.data?.message || 'Error processing voyage request.', 'error');
    } finally {
      setVcnSubmitting(false);
    }
  };

  const handleEditVesselClick = (vc) => {
    setEditingVessel(vc);
    setVProfileId(vc.vesselProfileId || 'manual');
    setVName(vc.vesselName);
    setVVoyageNo(vc.voyageNumber || '');
    setVFlag(vc.flag);
    setVType(vc.vesselType);
    setVEta(vc.eta ? new Date(vc.eta).toISOString().slice(0, 16) : '');
    setVEtd(vc.etd ? new Date(vc.etd).toISOString().slice(0, 16) : '');
    setVBerthSpec(vc.berthSpecification);
    setVLoa(vc.loa || '');
    setVBeam(vc.beam || '');
    setVDraft(vc.draft || '');
    setVGrt(vc.grt || '');
    setVStatus(vc.status);
    setShowVesselModal(true);
  };

  const handleDeleteVesselClick = async (vId) => {
    if (!window.confirm('Are you sure you want to cancel and delete this vessel voyage call?')) return;
    try {
      await API.delete(`/shipping/vessel-calls/${vId}`);
      triggerToast('Voyage Deleted', 'Vessel call cancelled and removed.', 'success');
      refetchVesselCalls();
    } catch (err) {
      triggerToast('Cancel Failed', 'Vessel is already berthed or has manifest logs.', 'error');
    }
  };

  const resetVoyageForm = () => {
    setVProfileId('');
    setVName('');
    setVVoyageNo('');
    setVFlag('India');
    setVType('Container');
    setVEta('');
    setVEtd('');
    setVBerthSpec('Berth 2');
    setVLoa('');
    setVBeam('');
    setVDraft('');
    setVGrt('');
    setVStatus('PRE_ADVICE');
  };

  // Cargo Manifest Actions (Create / Edit / Delete)
  const handleCargoSubmit = async (e) => {
    e.preventDefault();
    if (!cargoIdInput || !manifestNoInput || !blNoInput || !consigneeInput || !weightInput) {
      triggerToast('Validation Error', 'Cargo ID, Manifest Number, BL Number, Consignee, and Weight are required.', 'error');
      return;
    }
    const weightVal = parseFloat(weightInput);
    const qtyVal = parseInt(quantityInput);
    if (weightVal <= 0) {
      triggerToast('Validation Error', 'Weight must be greater than zero.', 'error');
      return;
    }
    if (qtyVal < 0) {
      triggerToast('Validation Error', 'Quantity cannot be negative.', 'error');
      return;
    }

    setManifestSubmitting(true);
    const payload = {
      cargoId: cargoIdInput,
      manifestNumber: manifestNoInput,
      vesselName: selectedVesselName || 'Generic Vessel',
      billOfLading: blNoInput.trim().toUpperCase(),
      cargoDescription: cargoDescInput,
      commodityType: commodityInput,
      originType: categoryInput,
      tradeType: tradeTypeInput,
      shippingBill: tradeTypeInput === 'Export' ? shippingBillInput : null,
      cargoType: cargoTypeInput,
      shipper: shipperInput,
      notifyParty: notifyPartyInput,
      consignee: consigneeInput,
      quantity: qtyVal,
      weight: weightVal,
      volume: volumeInput ? parseFloat(volumeInput) : null,
      sealNumber: sealInput || null,
      containerNo: containerInput || null,
      hazmatClass: hazmatInput === 'None' ? null : hazmatInput,
      isDamaged: isDamagedInput,
      damageRemarks: damageRemarksInput,
      destination: destinationInput
    };
    try {
      if (editingCargo) {
        await API.put(`/cargo/${editingCargo.id || editingCargo.cargo_id}`, payload);
        triggerToast('Manifest Updated', 'Consignment details successfully modified.', 'success');
      } else {
        // Enforce validations of duplicates
        const blDup = cargoes.some(c => c.billOfLading === payload.billOfLading);
        if (blDup) {
          triggerToast('Duplicate Entry', `Bill of Lading ${payload.billOfLading} already exists.`, 'error');
          return;
        }
        const cidDup = cargoes.some(c => c.cargoId === payload.cargoId);
        if (cidDup) {
          triggerToast('Duplicate Entry', `Cargo ID ${payload.cargoId} already exists.`, 'error');
          return;
        }
        const formData = new FormData();
        Object.keys(payload).forEach(key => {
          if (payload[key] !== null && payload[key] !== undefined) {
            formData.append(key, payload[key]);
          }
        });
        if (manifestFileInput) {
          formData.append('manifest', manifestFileInput);
        }
        await API.post('/cargo/manifest', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        triggerToast('Manifest Logged', 'Cargo consignment & manifest document uploaded successfully.', 'success');
      }
      setShowCargoModal(false);
      setEditingCargo(null);
      resetCargoForm();
      setActiveTab('manifest');
      refetchCargoes();
      refetchInvoices();
    } catch (err) {
      triggerToast('Filing Failed', err.response?.data?.message || 'Error processing manifest details.', 'error');
    } finally {
      setManifestSubmitting(false);
    }
  };

  const handleEditCargoClick = (crg) => {
    setEditingCargo(crg);
    setCargoIdInput(crg.cargoId);
    setManifestNoInput(crg.manifestNumber || '');
    setBlNoInput(crg.billOfLading);
    setCargoDescInput(crg.cargoDescription || '');
    setCommodityInput(crg.commodityType || 'General');
    setCategoryInput(crg.originType || 'Foreign');
    setCargoTypeInput(crg.cargoType);
    setTradeTypeInput(crg.tradeType || 'Import');
    setShippingBillInput(crg.shippingBill || '');
    setShipperInput(crg.shipper || '');
    setNotifyPartyInput(crg.notifyParty || '');
    setConsigneeInput(crg.consignee);
    setQuantityInput(crg.quantity);
    setWeightInput(crg.weight);
    setVolumeInput(crg.volume || '');
    setSealInput(crg.sealNumber || '');
    setContainerInput(crg.containerNo || '');
    setHazmatInput(crg.hazmatClass || 'None');
    setIsDamagedInput(crg.isDamaged);
    setDamageRemarksInput(crg.damageRemarks || '');
    setDestinationInput(crg.destination || 'Mangalore Yard');
    setShowCargoModal(true);
  };

  const handleDeleteCargoClick = async (cId) => {
    if (!window.confirm('Are you sure you want to permanently delete this cargo manifest entry?')) return;
    try {
      await API.delete(`/cargo/${cId}`);
      triggerToast('Entry Deleted', 'Cargo manifest and associated customs records deleted.', 'success');
      refetchCargoes();
    } catch (err) {
      triggerToast('Delete Failed', 'Cargo inventory is locked or discharged.', 'error');
    }
  };

  const resetCargoForm = () => {
    setCargoIdInput(`CRG-AUTO-${Math.floor(1000 + Math.random() * 9000)}`);
    setManifestNoInput(`MFEST-${Math.floor(10000 + Math.random() * 90000)}`);
    setBlNoInput('');
    setCargoDescInput('');
    setCommodityInput('General');
    setCategoryInput('Foreign');
    setTradeTypeInput('Import');
    setShippingBillInput('');
    setCargoTypeInput('Container');
    setShipperInput('');
    setNotifyPartyInput('');
    setConsigneeInput('');
    setQuantityInput(1);
    setWeightInput('');
    setVolumeInput('');
    setSealInput('');
    setContainerInput('');
    setHazmatInput('None');
    setIsDamagedInput(false);
    setDamageRemarksInput('');
    setDestinationInput('Mangalore Yard');
    setManifestFileInput(null);
  };

  // Parse bulk manifest text CSV
  const parseBulkCsv = () => {
    if (!csvText.trim()) {
      triggerToast('Empty Input', 'Please paste CSV content.', 'error');
      return;
    }
    const lines = csvText.split('\n');
    const parsed = [];
    const startIndex = lines[0].toLowerCase().includes('bill') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cols = line.split(',');
      if (cols.length >= 4) {
        parsed.push({
          billOfLading: cols[0]?.trim()?.toUpperCase(),
          consignee: cols[1]?.trim(),
          cargoType: cols[2]?.trim() || 'Container',
          quantity: parseInt(cols[3]?.trim()) || 1,
          weight: parseFloat(cols[4]?.trim()) || 0.0,
          shipper: cols[5]?.trim() || '',
          notifyParty: cols[6]?.trim() || '',
          sealNumber: cols[7]?.trim() || '',
          volume: cols[8] ? parseFloat(cols[8]?.trim()) : 0.0
        });
      }
    }
    setCsvPreview(parsed);
    triggerToast('Parsed Successful', `${parsed.length} rows loaded. Confirm manifest below.`, 'success');
  };

  const handleBulkManifestUpload = async () => {
    if (!csvPreview.length) return;
    setManifestSubmitting(true);
    try {
      const containers = csvPreview.map(row => ({
        containerNo: `MNGPRTC-${Math.floor(100000 + Math.random() * 900000)}`,
        cargoType: row.cargoType,
        weight: row.weight,
        destination: 'Mangalore Yard',
        tradeType: 'Import',
        billOfLading: row.billOfLading,
        quantity: row.quantity,
        shipper: row.shipper,
        notifyParty: row.notifyParty,
        sealNumber: row.sealNumber || null,
        volume: row.volume || null
      }));

      await API.post('/cargo/bulk-manifest', {
        vesselName: selectedVesselName || 'Generic Vessel',
        tradeType: 'Import',
        consignee: csvPreview[0].consignee || 'Importer Ltd',
        containers
      });

      triggerToast('Bulk Manifest Filed', `${csvPreview.length} entries approved in ledger.`, 'success');
      setCsvPreview([]);
      setCsvText('');
      refetchCargoes();
      refetchInvoices();
    } catch (err) {
      triggerToast('Filing Failed', err.response?.data?.message || 'Error processing manifest list.', 'error');
    } finally {
      setManifestSubmitting(false);
    }
  };

  // Internal Cargo Movement Request
  const handleMoveSubmit = async (e) => {
    e.preventDefault();
    if (!moveCargoId || !moveToWarehouseId) {
      triggerToast('Validation Error', 'Cargo and Destination Warehouse are required.', 'error');
      return;
    }
    setMoveSubmitting(true);
    try {
      await API.post('/warehouses/move', {
        cargoId: moveCargoId,
        destinationWarehouseId: moveToWarehouseId,
        destinationYardLocationId: moveToYardId || null,
        transferredWeight: moveQty ? parseFloat(moveQty) : 10,
        forkliftStackerId: moveEquipment,
        supervisorName: moveSupervisor,
        remarks: moveRemarks
      });
      triggerToast('Cargo Moved', 'Movement logged inside yard tracks.', 'success');
      setShowMoveModal(false);
      setMoveCargoId('');
      setMoveQty('');
      setMoveRemarks('');
      refetchMoveLogs();
      refetchCargoes();
    } catch (err) {
      triggerToast('Movement Failed', err.response?.data?.message || 'Failed to request transfer.', 'error');
    } finally {
      setMoveSubmitting(false);
    }
  };

  // Invoice Payment Settle Gateway
  const handlePaymentSettle = async (e) => {
    if (e) e.preventDefault();
    if (!selectedInvoice) return;

    if (paymentMode === 'PDA Wallet' && pdaBalance < selectedInvoice.totalAmount) {
      triggerToast('Low PDA Balance', 'Your PDA balance is insufficient. Please top up PDA or choose UPI / Bank Transfer.', 'error');
      return;
    }

    setPayLoading(true);
    try {
      const generatedTxRef = txRef || `TXN-MNGPRT-${Date.now().toString().slice(-6)}`;
      await API.post(`/billing/invoice/${selectedInvoice.id}/payment`, {
        paymentMode,
        transactionRef: generatedTxRef
      });
      triggerToast('Invoice Settled', `Receipt issued for ₹${selectedInvoice.totalAmount.toLocaleString()} via ${paymentMode}`, 'success');
      setShowPayModal(false);
      setSelectedInvoice(null);
      setTxRef('');
      refetchInvoices();
      refetchCargoes();

      // Refetch PDA balance
      const pdaRes = await API.get('/shipping/pda');
      setPdaBalance(pdaRes.data?.pdaBalance || 0);
    } catch (err) {
      triggerToast('Payment Failed', err.response?.data?.message || 'Transaction settlement failed.', 'error');
    } finally {
      setPayLoading(false);
    }
  };

  // PDA Deposit Settle
  const handleDeposit = async (e) => {
    e.preventDefault();
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      triggerToast('Validation Error', 'Please specify a positive deposit amount.', 'error');
      return;
    }
    setDepositLoading(true);
    try {
      const res = await API.post('/shipping/pda/deposit', { amount: parseFloat(depositAmount) });
      setPdaBalance(res.data.pdaBalance);
      triggerToast('Deposit Successful', `₹${parseFloat(depositAmount).toLocaleString()} has been added to your prepaid PDA balance.`, 'success');
      setShowDepositModal(false);
      setDepositAmount('');
    } catch (err) {
      triggerToast('Deposit Failed', err.response?.data?.message || 'Failed to complete deposit.', 'error');
    } finally {
      setDepositLoading(false);
    }
  };

  // Delivery Order (DO/eDO) Action
  const handleDORequestSubmit = async (e) => {
    e.preventDefault();
    if (!doCargoId) {
      triggerToast('Validation Error', 'Select a cargo consignment.', 'error');
      return;
    }
    setDoLoading(true);
    try {
      const res = await API.post(`/cargo/${doCargoId}/delivery-order`);
      triggerToast('DO Issued', 'Electronic Delivery Order generated successfully!', 'success');
      setLatestDO(res.data);
      refetchCargoes();
    } catch (err) {
      triggerToast('Issuance Denied', err.response?.data?.message || 'Compliance holds not lifted.', 'error');
    } finally {
      setDoLoading(false);
    }
  };



  // Print generated e-DO document
  const handlePrintDo = (doObj, cargoItem) => {
    if (cargoItem && (cargoItem.customsHoldStatus === 'SEIZED' || cargoItem.status === 'Customs Hold')) {
      triggerToast('Print Blocked', `Cargo ${cargoItem.cargoId} is under active Emergency Customs Seizure. e-DO printout is revoked & blocked.`, 'error');
      return;
    }
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>mngprt Electronic Delivery Order - ${doObj.deliveryOrderNo}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
            .header { text-align: center; border-bottom: 3px double #cbd5e1; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: 900; letter-spacing: -0.5px; margin: 0; color: #0284c7; }
            .subtitle { font-size: 11px; text-transform: uppercase; color: #64748b; margin-top: 5px; font-weight: bold; letter-spacing: 1px; }
            .stamp { float: right; border: 4px solid #10b981; color: #10b981; font-weight: 900; font-size: 28px; padding: 8px 16px; border-radius: 12px; transform: rotate(12deg); margin-top: 20px; text-transform: uppercase; }
            .section { margin-bottom: 25px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 35px; }
            .label { font-size: 10px; text-transform: uppercase; color: #94a3b8; font-weight: bold; }
            .value { font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 3px; }
            .footer { border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 60px; text-align: center; font-size: 11px; color: #94a3b8; }
            .receipt-border { border: 2px solid #e2e8f0; padding: 30px; border-radius: 20px; max-width: 800px; margin: 0 auto; }
          </style>
        </head>
        <body>
          <div class="receipt-border">
            <div class="stamp">RELEASED</div>
            <div class="header">
              <h1 class="title">PORT INVENTORY MANAGEMENT SYSTEM</h1>
              <div class="subtitle">ELECTRONIC DELIVERY ORDER (e-DO) RELEASE CERTIFICATE</div>
            </div>
            <div class="grid">
              <div>
                <div class="label">e-DO Release Reference</div>
                <div class="value">${doObj.deliveryOrderNo}</div>
              </div>
              <div>
                <div class="label">Cargo Consignment ID</div>
                <div class="value">${cargoItem.cargoId}</div>
              </div>
              <div>
                <div class="label">Vessel Voyage (VCN)</div>
                <div class="value">${cargoItem.vesselName || 'N/A'}</div>
              </div>
              <div>
                <div class="label">Cargo Commodity Type</div>
                <div class="value">${cargoItem.cargoType || 'Containerized Cargo'}</div>
              </div>
              <div style="grid-column: span 2;">
                <div class="label">Importer / Consignee</div>
                <div class="value">${cargoItem.consignee}</div>
              </div>
            </div>
            <div class="section" style="background: #f8fafc; padding: 15px; border-radius: 10px; font-size: 11px; border: 1px solid #f1f5f9; color: #334155;">
              <strong>Declaration of Custody Transfer:</strong> This e-DO serves as legal release from the shipping line. The container custody is officially transferred to the importer. Port gates and yards are authorized to log physical delivery and exit for this cargo.
            </div>
            <div class="footer">
              Digital Certificate issued automatically by mngprt Port Operations Registry. Verification Hash: sha256-${doObj.id || 'N/A'}.
            </div>
          </div>
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Print generated e-DO document
  const handlePrintDoDirect = (doObj, cargoItem) => {
    handlePrintDo(doObj, cargoItem);
  };

  // Helper invoice auto-calculations
  const calculateCharges = (crg) => {
    if (!crg) return { handling: 0, storage: 0, warehouse: 0, demurrage: 0, doc: 0, misc: 0, gst: 0, total: 0 };
    const handling = crg.cargoType === 'Bulk' ? 45000 : 18000;
    const storage = Math.ceil(crg.weight * 125 * 3); // weight * daily rate * days
    const warehouse = crg.cargoType === 'Liquid' ? 25000 : 15000;
    const demurrage = crg.isDamaged ? 10000 : 0;
    const doc = 2500;
    const misc = 1500;
    const subtotal = handling + storage + warehouse + demurrage + doc + misc;
    const gst = Math.round(subtotal * 0.18);
    const total = subtotal + gst;
    return { handling, storage, warehouse, demurrage, doc, misc, gst, total };
  };

  // CSV Exporter Helper
  const exportToCSV = (data, filename) => {
    let csvContent = "data:text/csv;charset=utf-8,";
    const headers = Object.keys(data[0] || {}).join(",");
    csvContent += headers + "\r\n";
    data.forEach(row => {
      const values = Object.values(row).map(v => `"${v}"`).join(",");
      csvContent += values + "\r\n";
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Global search filtering logic
  const matchGlobalSearch = (item, keys) => {
    if (!globalSearchQuery) return true;
    const q = globalSearchQuery.toLowerCase();
    return keys.some(key => {
      const val = item[key];
      if (val === undefined || val === null) return false;
      return String(val).toLowerCase().includes(q);
    });
  };

  // Filtered datasets
  const filteredVessels = vesselCalls.filter(vc => {
    const matchesSearch = matchGlobalSearch(vc, ['vesselName', 'vcn', 'voyageNumber', 'flag', 'vesselType']);
    const matchesType = vesselFilterType === 'All' || vc.vesselType === vesselFilterType;
    
    let matchesStatus = true;
    if (vesselFilterStatus === 'Active') {
      matchesStatus = !['DEPARTED', 'COMPLETED', 'CLOSED'].includes(vc.status);
    } else if (vesselFilterStatus === 'Completed') {
      matchesStatus = ['DEPARTED', 'COMPLETED', 'CLOSED'].includes(vc.status);
    }
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const sortedVessels = [...filteredVessels].sort((a, b) => {
    const valA = a[vesselSortField] || '';
    const valB = b[vesselSortField] || '';
    if (vesselSortOrder === 'asc') {
      return String(valA).localeCompare(String(valB));
    } else {
      return String(valB).localeCompare(String(valA));
    }
  });

  const paginatedVessels = sortedVessels.slice((vesselPage - 1) * itemsPerPage, vesselPage * itemsPerPage);

  const filteredCargoes = cargoes.filter(crg => {
    const matchesSearch = matchGlobalSearch(crg, ['cargoId', 'manifestNumber', 'billOfLading', 'consignee', 'shipper', 'commodityType', 'deliveryOrderNo']);
    const matchesType = cargoFilterType === 'All' || crg.cargoType === cargoFilterType;
    const matchesStatus = cargoFilterStatus === 'All' || crg.status === cargoFilterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const sortedCargoes = [...filteredCargoes].sort((a, b) => {
    const valA = a[cargoSortField] || '';
    const valB = b[cargoSortField] || '';
    if (cargoSortOrder === 'asc') {
      return String(valA).localeCompare(String(valB));
    } else {
      return String(valB).localeCompare(String(valA));
    }
  });

  const paginatedCargoes = sortedCargoes.slice((cargoPage - 1) * itemsPerPage, cargoPage * itemsPerPage);

  // Compute Dashboard Metrics
  const activeVesselsCount = vesselCalls.filter(vc => !['DEPARTED', 'COMPLETED', 'CLOSED'].includes(vc.status)).length;
  const totalManifestsCount = cargoes.length;
  const totalCargoQty = cargoes.reduce((sum, c) => sum + (c.quantity || 0), 0);
  const totalCargoWeight = cargoes.reduce((sum, c) => sum + (c.weight || 0), 0);
  const cargoesInWarehouse = cargoes.filter(c => c.status === 'Allocated' || c.status === 'Yard Staged').length;
  const pendingDOs = cargoes.filter(c => !c.deliveryOrderNo).length;
  const pendingInvoices = invoices.filter(inv => !['Paid', 'PAID'].includes(inv.status)).length;
  const totalRevenue = invoices.filter(inv => ['Paid', 'PAID'].includes(inv.status)).reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
  const totalStorageCharges = invoices.reduce((sum, inv) => sum + (inv.storageFee || 0), 0);

  // Chart Data preparation
  const commodityChartData = [
    { name: 'Bulk', value: cargoes.filter(c => c.cargoType === 'Bulk').reduce((sum, c) => sum + (c.weight || 0), 0) },
    { name: 'Container', value: cargoes.filter(c => c.cargoType === 'Container').reduce((sum, c) => sum + (c.weight || 0), 0) },
    { name: 'Liquid', value: cargoes.filter(c => c.cargoType === 'Liquid').reduce((sum, c) => sum + (c.weight || 0), 0) },
    { name: 'Break Bulk', value: cargoes.filter(c => c.cargoType === 'Break Bulk').reduce((sum, c) => sum + (c.weight || 0), 0) }
  ].filter(d => d.value > 0);

  const monthlyVolumeData = [
    { month: 'Jan', volume: 450 },
    { month: 'Feb', volume: 620 },
    { month: 'Mar', volume: 890 },
    { month: 'Apr', volume: 1200 },
    { month: 'May', volume: 1450 },
    { month: 'Jun', volume: totalCargoWeight || 1600 }
  ];

  const revenueTrendData = [
    { month: 'Jan', revenue: 1500000 },
    { month: 'Feb', revenue: 2200000 },
    { month: 'Mar', revenue: 2900000 },
    { month: 'Apr', revenue: 4500000 },
    { month: 'May', revenue: 5300000 },
    { month: 'Jun', revenue: totalRevenue || 6000000 }
  ];

  if (loading) {
    return (
      <div className="py-40 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-sky-500" />
        <span className="text-slate-400 font-medium text-sm">Loading mngprt Shipping Agency database...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 select-none">
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm glass-panel flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white">mngprt Shipping Agency Hub</h2>
            <p className="text-[11px] text-slate-400 font-light mt-1">Manage cargo vessels, manifest filings, yard staging inventory, and clearances.</p>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 font-medium">
              Agency: <strong className="text-sky-500 font-semibold">{user?.username}</strong>
            </span>
            <span className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 font-medium">
              Licence: <strong className="text-sky-500 font-semibold">NMPA-SA-{(user?.id || 1) * 100}</strong>
            </span>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 select-none">Prepaid PDA Balance</span>
              <h3 className="text-2xl font-black text-emerald-650 dark:text-emerald-500 tracking-tight">₹{pdaBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-light mt-1">Personal Deposit Account balance used for automated invoice settlements and clearances.</p>
            </div>
            <button
              onClick={() => setShowDepositModal(true)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1 cursor-pointer shrink-0 animate-in fade-in duration-200"
              type="button"
            >
              <Plus className="w-3.5 h-3.5" /> Deposit
            </button>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 select-none">Agent Support Desk</span>
              <h3 className="text-xl font-black tracking-tight select-all text-slate-800 dark:text-white">1800-425-5000</h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-light mt-1">For vessel arrivals, manifest queries, or billing, contact mngprt ops control desk.</p>
            </div>
            <Anchor className="w-8 h-8 text-sky-500 shrink-0" />
          </div>
        </div>
      </div>

      {/* Global Search & Quick Actions Row */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 select-none glass-panel shadow-sm">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Global search (Vessel, Manifest, BL, Consignee, DO, Invoice...)"
            value={globalSearchQuery}
            onChange={(e) => setGlobalSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-10 pr-4 py-2.5 rounded-2xl text-sm text-slate-750 dark:text-slate-200 focus:outline-none focus:border-sky-500"
          />
          {globalSearchQuery && (
            <button
              onClick={() => setGlobalSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('manifest');
              setEditingCargo(null);
              resetCargoForm();
              setShowCargoModal(true);
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-xs rounded-2xl transition shadow-md flex items-center gap-2 cursor-pointer shrink-0"
          >
            <PlusCircle className="w-4 h-4" /> + Register Cargo Manifest
          </button>
        </div>
      </div>

      {/* Main Sub-Navigation and Worksheet Panels Layout */}
      <div className="mt-4">
        {/* Right Side Worksheet Workspace */}
        <div className="w-full min-w-0">

        {/* Tab 1: Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: 'Total Active Vessels', value: activeVesselsCount, icon: Ship, color: 'text-sky-500 bg-sky-500/10' },
                { title: 'Total Cargo Manifests', value: totalManifestsCount, icon: FileText, color: 'text-emerald-500 bg-emerald-500/10' },
                { title: 'Total Cargo Quantity', value: totalCargoQty.toLocaleString(), icon: Layers, color: 'text-amber-500 bg-amber-500/10' },
                { title: 'Cargo in Warehouse', value: cargoesInWarehouse, icon: Warehouse, color: 'text-purple-500 bg-purple-500/10' },
                { title: 'Pending Delivery Orders', value: pendingDOs, icon: ListTodo, color: 'text-pink-500 bg-pink-500/10' },
                { title: 'Pending Invoices', value: pendingInvoices, icon: Clock, color: 'text-rose-500 bg-rose-500/10' },
                { title: 'Paid Port Charges', value: `₹${totalRevenue.toLocaleString()}`, icon: IndianRupee, color: 'text-green-500 bg-green-500/10' },
                { title: 'Demurrage & Storage', value: `₹${totalStorageCharges.toLocaleString()}`, icon: IndianRupee, color: 'text-cyan-500 bg-cyan-500/10' }
              ].map((card, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-black uppercase text-slate-400 tracking-wider block">{card.title}</span>
                    <strong className="text-xl font-black text-slate-800 dark:text-white block">{card.value}</strong>
                  </div>
                  <div className={`p-3 rounded-2xl ${card.color} shrink-0`}>
                    <card.icon className="w-5 h-5" />
                  </div>
                </div>
              ))}
            </div>

            {/* Recharts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Cargo by Commodity */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <h3 className="text-sm font-black text-slate-850 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-sky-500" />
                  Cargo Weight by Commodity Type (MT)
                </h3>
                <div className="h-64">
                  {commodityChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={commodityChartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {commodityChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${value.toLocaleString()} MT`} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 italic text-xs">No commodity data found.</div>
                  )}
                </div>
              </div>

              {/* Monthly Volume */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <h3 className="text-sm font-black text-slate-850 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-sky-500" />
                  Monthly Cargo Tonnage Trend (MT)
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyVolumeData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:hidden" />
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <Tooltip formatter={(value) => `${value.toLocaleString()} MT`} />
                      <Bar dataKey="volume" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Warehouse Occupancy */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <h3 className="text-sm font-black text-slate-850 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <Warehouse className="w-4 h-4 text-sky-500" />
                  Warehouse Space Occupancy Status
                </h3>
                <div className="space-y-4">
                  {warehouses.length > 0 ? (
                    warehouses.map(wh => {
                      const capacity = wh.capacity || 1;
                      const occupied = wh.occupiedSpace || 0;
                      const percentage = Math.min(100, Math.round((occupied / capacity) * 100));
                      return (
                        <div key={wh.id} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-700 dark:text-slate-300">{wh.name} ({wh.type || 'Storage'})</span>
                            <span className={percentage > 85 ? 'text-rose-500' : 'text-slate-400'}>{percentage}% Occupied ({occupied.toLocaleString()} / {capacity.toLocaleString()} MT)</span>
                          </div>
                          <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                percentage > 85 ? 'bg-rose-500' : percentage > 50 ? 'bg-amber-500' : 'bg-sky-500'
                              }`}
                              style={{ width: `${Math.min(100, percentage)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center text-slate-400 italic text-xs py-10">No warehouse capacity details recorded.</div>
                  )}
                </div>
              </div>

              {/* Revenue Trend */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <h3 className="text-sm font-black text-slate-850 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-sky-500" />
                  Monthly Billing Settlement Trend (₹ INR)
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueTrendData}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:hidden" />
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                      <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Recent Activities Section */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm select-none">
              <h3 className="text-sm font-black text-slate-850 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-sky-500" />
                Recent Port Activities & Filings
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
                {/* Latest Vessel Profiles */}
                <div className="space-y-3">
                  <span className="font-bold text-slate-400 uppercase tracking-widest block border-b pb-2">Latest Vessel Profiles</span>
                  {vesselProfiles.slice(0, 3).map(p => (
                    <div key={p.id || p.vessel_id} className="p-3 bg-slate-50 dark:bg-slate-955 border border-slate-100 dark:border-slate-855 rounded-2xl flex items-center justify-between">
                      <div>
                        <strong className="block text-slate-700 dark:text-slate-200">{p.vesselName}</strong>
                        <span className="text-[10px] text-slate-400 font-mono">IMO: {p.imoNumber}</span>
                      </div>
                      <span className="px-2 py-0.5 text-[9px] font-black rounded-lg bg-sky-500/10 text-sky-500 uppercase">{p.vesselType}</span>
                    </div>
                  ))}
                </div>

                {/* Latest Cargo */}
                <div className="space-y-3">
                  <span className="font-bold text-slate-400 uppercase tracking-widest block border-b pb-2">Latest Cargo Manifests</span>
                  {cargoes.slice(0, 3).map(crg => (
                    <div key={crg.cargoId} className="p-3 bg-slate-50 dark:bg-slate-955 border border-slate-100 dark:border-slate-850 rounded-2xl flex items-center justify-between">
                      <div>
                        <strong className="block text-slate-700 dark:text-slate-200">{crg.cargoId}</strong>
                        <span className="text-[10px] text-slate-400 font-mono">BL: {crg.billOfLading}</span>
                      </div>
                      <span className="text-slate-500 font-bold">{crg.weight} MT</span>
                    </div>
                  ))}
                </div>

                {/* Recently e-DOs */}
                <div className="space-y-3">
                  <span className="font-bold text-slate-400 uppercase tracking-widest block border-b pb-2">Recently Generated DOs</span>
                  {cargoes.filter(c => c.deliveryOrderNo).slice(0, 3).map(crg => (
                    <div key={crg.cargoId} className="p-3 bg-slate-50 dark:bg-slate-955 border border-slate-100 dark:border-slate-850 rounded-2xl flex items-center justify-between">
                      <div>
                        <strong className="block text-sky-500 font-mono">{crg.deliveryOrderNo}</strong>
                        <span className="text-[10px] text-slate-400">Consignee: {crg.consignee?.slice(0, 15)}...</span>
                      </div>
                      <Check className="w-4 h-4 text-emerald-500" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Vessel Information */}
        {activeTab === 'vessels' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm select-none">
              <div>
                <h3 className="text-lg font-black text-slate-855 dark:text-white">MSW Vessel & Voyage Management</h3>
                <p className="text-xs text-slate-400 font-light mt-0.5">Register new vessel voyage calls (VCN), manage master ship profiles, berth specifications, and vessel schedules.</p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingVessel(null);
                    resetVoyageForm();
                    setShowVesselModal(true);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow flex items-center gap-1.5 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" /> Register Vessel Call (VCN)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingProfile(null);
                    resetProfileForm();
                    setShowProfileModal(true);
                  }}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl transition shadow flex items-center gap-1.5 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" /> Add Vessel Profile
                </button>
                <button
                  type="button"
                  onClick={() => exportToCSV(vesselCalls, 'vessel_calls_list')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Export CSV
                </button>
              </div>
            </div>

            {/* Active Vessel Calls (VCN Voyage Directory) */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm select-none space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-sm font-black text-slate-850 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Ship className="w-4 h-4 text-sky-500" />
                    Seaport Voyage Calls (VCN Directory)
                  </h3>
                  <p className="text-xs text-slate-400 font-light mt-0.5">Active and historical vessel arrival call allocations.</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <select
                    value={vesselFilterType}
                    onChange={(e) => { setVesselFilterType(e.target.value); setVesselPage(1); }}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-slate-700 dark:text-slate-200"
                  >
                    <option value="All">All Cargo Types</option>
                    <option value="Container">Container</option>
                    <option value="Bulk">Bulk</option>
                    <option value="Liquid">Liquid</option>
                    <option value="Break Bulk">Break Bulk</option>
                  </select>

                  <select
                    value={vesselFilterStatus}
                    onChange={(e) => { setVesselFilterStatus(e.target.value); setVesselPage(1); }}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-slate-700 dark:text-slate-200"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Active">Active Calls</option>
                    <option value="Completed">Completed Calls</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingVessel(null);
                      resetVoyageForm();
                      setShowVesselModal(true);
                    }}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Register Vessel Call
                  </button>
                </div>
              </div>

              {/* Table of Vessels */}
              {paginatedVessels.length === 0 ? (
                <div className="py-12 text-center text-slate-400 italic text-xs">
                  No vessel calls match the filter criteria. Click "Register Vessel Call" to schedule a new call.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="pb-3">VCN Code</th>
                        <th className="pb-3">Vessel Name & Voyage</th>
                        <th className="pb-3">Flag / Type</th>
                        <th className="pb-3">ETA Date</th>
                        <th className="pb-3">Berth</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                      {paginatedVessels.map(vc => (
                        <tr key={vc.id || vc.vcn} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                          <td className="py-3 font-mono font-bold text-sky-500">{vc.vcn}</td>
                          <td className="py-3">
                            <strong className="block text-slate-800 dark:text-slate-200">{vc.vesselName}</strong>
                            <span className="text-[10px] text-slate-400 font-mono">Voyage: {vc.voyageNumber || 'N/A'}</span>
                          </td>
                          <td className="py-3 text-slate-600 dark:text-slate-350">{vc.flag || 'India'} ({vc.vesselType})</td>
                          <td className="py-3 text-slate-600 dark:text-slate-350">{vc.eta ? new Date(vc.eta).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}</td>
                          <td className="py-3 text-slate-600 dark:text-slate-350">{vc.berthSpecification || 'Unassigned'}</td>
                          <td className="py-3">
                            <span className={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-lg ${
                              vc.status === 'PRE_ADVICE' || vc.status === 'Awaiting Arrival'
                                ? 'bg-sky-500/10 text-sky-500 border border-sky-500/20'
                                : vc.status === 'BERTHED' || vc.status === 'Docked'
                                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                            }`}>
                              {vc.status}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleEditVesselClick(vc)}
                                className="px-2.5 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-500 font-bold rounded-lg transition text-[11px]"
                              >
                                Edit Call
                              </button>
                              <button
                                onClick={() => handleDeleteVesselClick(vc.id || vc.allocation_id || vc.vcn)}
                                className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold rounded-lg transition text-[11px]"
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination controls */}
              {sortedVessels.length > itemsPerPage && (
                <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-3 text-xs">
                  <span className="text-slate-400">
                    Showing {(vesselPage - 1) * itemsPerPage + 1} - {Math.min(vesselPage * itemsPerPage, sortedVessels.length)} of {sortedVessels.length} vessel calls
                  </span>
                  <div className="flex gap-2">
                    <button
                      disabled={vesselPage === 1}
                      onClick={() => setVesselPage(p => Math.max(1, p - 1))}
                      className="px-3 py-1 bg-slate-100 dark:bg-slate-800 disabled:opacity-50 text-slate-700 dark:text-slate-350 font-bold rounded-lg"
                    >
                      Previous
                    </button>
                    <button
                      disabled={vesselPage * itemsPerPage >= sortedVessels.length}
                      onClick={() => setVesselPage(p => p + 1)}
                      className="px-3 py-1 bg-slate-100 dark:bg-slate-800 disabled:opacity-50 text-slate-700 dark:text-slate-350 font-bold rounded-lg"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Master Vessel Profiles List (Sub-section) */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm select-none">
              <h3 className="text-sm font-black text-slate-850 dark:text-white uppercase tracking-wider mb-4">Master Vessel Profiles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vesselProfiles.map(p => (
                  <div key={p.id || p.vessel_id} className="p-4 bg-slate-50 dark:bg-slate-955 border border-slate-100 dark:border-slate-850 rounded-2xl flex flex-col justify-between h-40">
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <strong className="block text-slate-800 dark:text-slate-200">{p.vesselName}</strong>
                          <span className="text-[10px] text-sky-500 font-mono">IMO: {p.imoNumber} | Call Sign: {p.callSign}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-3 text-[10px] text-slate-400">
                        <span>LOA / Beam: <strong>{p.lengthOverall}m / {p.beam}m</strong></span>
                        <span>Draft Limit: <strong>{p.draft}m</strong></span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center border-t pt-2 mt-2 text-[10px]">
                      <span className="text-slate-500">Operator: <strong>{p.ownerOperator}</strong></span>
                      <div className="flex gap-2">
                        <button onClick={() => handleEditProfileClick(p)} className="text-sky-500 hover:underline">Edit</button>
                        <button onClick={() => handleDeleteProfileClick(p.id || p.vessel_id)} className="text-rose-500 hover:underline">Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Cargo Manifest */}
        {activeTab === 'manifest' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm select-none">
              <div>
                <h3 className="text-lg font-black text-slate-850 dark:text-white">Import Cargo Manifest Filing</h3>
                <p className="text-xs text-slate-400 font-light mt-0.5">Submit single manifest rows or paste bulk IGM manifest data for automated yard stowage allocation.</p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingCargo(null);
                    resetCargoForm();
                    setShowCargoModal(true);
                  }}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl transition shadow flex items-center gap-1.5 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" /> Single Cargo Entry
                </button>
                <button
                  type="button"
                  onClick={() => exportToCSV(cargoes, 'manifest_cargo_list')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Export CSV
                </button>
              </div>
            </div>

            {/* Bulk Upload Drawer */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm select-none">
              <h4 className="text-xs font-black uppercase text-slate-400 mb-3 tracking-widest">Bulk CSV Manifest filer</h4>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8">
                  <textarea
                    rows="4"
                    placeholder="BillOfLading,Consignee,CargoType,Quantity,Weight,Shipper,NotifyParty,SealNumber,Volume"
                    value={csvText}
                    onChange={(e) => setCsvText(e.target.value)}
                    className="w-full font-mono text-xs bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:bg-slate-850 p-4 rounded-2xl focus:outline-none focus:border-sky-500"
                  />
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-[10px] text-slate-400">CSV format: BL,Consignee,Type,Quantity,Weight,Shipper,Notify,Seal,Volume</span>
                    <button
                      type="button"
                      onClick={parseBulkCsv}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition shadow cursor-pointer"
                    >
                      Parse CSV manifest
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-4 bg-slate-50 dark:bg-slate-955 p-4 border border-slate-100 dark:border-slate-855 rounded-2xl flex flex-col justify-between">
                  <div className="text-[11px] text-slate-400 space-y-2">
                    <span className="font-bold text-slate-500 uppercase block tracking-wider">Select Incoming Vessel</span>
                    <select
                      value={selectedVesselName}
                      onChange={(e) => setSelectedVesselName(e.target.value)}
                      className="w-full bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-slate-750 dark:text-slate-200 font-bold focus:outline-none focus:border-sky-500 mb-2"
                    >
                      {vesselProfiles.map((p) => (
                        <option key={p.id || p.vessel_id} value={p.vesselName}>
                          {p.vesselName} ({p.vesselType})
                        </option>
                      ))}
                      {vesselProfiles.length === 0 && (
                        <option value="Generic Vessel">Generic Vessel</option>
                      )}
                    </select>
                    <span className="font-bold text-slate-500 uppercase block tracking-wider">Instructions:</span>
                    <p>Copy and paste manifest rows from mngprt excel filings. On verification, click upload to map coordinates automatically.</p>
                  </div>
                  {csvPreview.length > 0 && (
                    <button
                      type="button"
                      onClick={handleBulkManifestUpload}
                      disabled={manifestSubmitting}
                      className="w-full mt-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition"
                    >
                      {manifestSubmitting ? 'Uploading manifest...' : `Register ${csvPreview.length} items`}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* List Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
              <div className="bg-slate-50 dark:bg-slate-955 p-4 border-b border-slate-100 dark:border-slate-855 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 font-medium">Cargo Type:</span>
                    <select
                      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 focus:outline-none"
                      value={cargoFilterType}
                      onChange={(e) => setCargoFilterType(e.target.value)}
                    >
                      <option value="All">All Types</option>
                      <option value="Container">Container</option>
                      <option value="Bulk">Bulk</option>
                      <option value="Liquid">Liquid</option>
                      <option value="Break Bulk">Break Bulk</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 font-medium">Status:</span>
                    <select
                      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 focus:outline-none"
                      value={cargoFilterStatus}
                      onChange={(e) => setCargoFilterStatus(e.target.value)}
                    >
                      <option value="All">All Statuses</option>
                      <option value="Manifest Uploaded">Manifest Filed</option>
                      <option value="Unloaded">Unloaded</option>
                      <option value="Allocated">Allocated</option>
                      <option value="Customs Approved">Customs Cleared</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-slate-400 font-medium">Sort By:</span>
                  <select
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 focus:outline-none"
                    value={cargoSortField}
                    onChange={(e) => setCargoSortField(e.target.value)}
                  >
                    <option value="createdAt">Date Filed</option>
                    <option value="cargoId">Cargo ID</option>
                    <option value="billOfLading">BL Number</option>
                    <option value="weight">Weight</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setCargoSortOrder(cargoSortOrder === 'asc' ? 'desc' : 'asc')}
                    className="p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <table className="w-full text-left text-xs divide-y divide-slate-100 dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-955 font-bold text-slate-500 uppercase tracking-widest text-[9px] border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="p-4">Cargo ID</th>
                    <th className="p-4">Manifest No</th>
                    <th className="p-4">Bill of Lading</th>
                    <th className="p-4">Vessel Name</th>
                    <th className="p-4">Commodity / Cat</th>
                    <th className="p-4">Type / Package</th>
                    <th className="p-4">Importer / Exporter</th>
                    <th className="p-4">Weight / Volume</th>
                    <th className="p-4">Condition</th>
                    <th className="p-4">DO status</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {paginatedCargoes.length > 0 ? (
                    paginatedCargoes.map(crg => (
                      <tr key={crg.id || crg.cargo_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-955/20">
                        <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">{crg.cargoId}</td>
                        <td className="p-4 font-mono">{crg.manifestNumber || 'N/A'}</td>
                        <td className="p-4 font-mono font-bold text-sky-500">{crg.billOfLading}</td>
                        <td className="p-4">{crg.vesselName}</td>
                        <td className="p-4">{crg.commodityType} ({crg.originType})</td>
                        <td className="p-4">{crg.cargoType} ({crg.quantity} pkgs)</td>
                        <td className="p-4">
                          <span className="block font-medium">{crg.consignee?.slice(0, 15)}</span>
                          <span className="text-[10px] text-slate-400 block">Shipper: {crg.shipper?.slice(0, 15) || 'N/A'}</span>
                        </td>
                        <td className="p-4">
                          <span className="block font-semibold">{crg.weight} MT</span>
                          <span className="text-[10px] text-slate-400 block">{crg.volume ? `${crg.volume} CBM` : 'N/A'}</span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            crg.isDamaged ? 'bg-rose-500/10 text-rose-500' : 'bg-green-500/10 text-green-500'
                          }`}>
                            {crg.isDamaged ? 'Damaged' : 'Sound'}
                          </span>
                        </td>
                        <td className="p-4">
                          {crg.deliveryOrderNo ? (
                            <span className="text-emerald-500 font-mono font-bold">{crg.deliveryOrderNo}</span>
                          ) : (
                            <span className="text-slate-400 italic">Pending</span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2 justify-center">
                            <button
                              type="button"
                              onClick={() => handleEditCargoClick(crg)}
                              className="p-1.5 text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/25 rounded-lg transition"
                              title="Edit Cargo"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCargoClick(crg.id || crg.cargo_id)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/25 rounded-lg transition"
                              title="Delete Cargo"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="11" className="p-10 text-center text-slate-400 italic">No manifest cargo entries match search criteria.</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Pagination controls */}
              {totalPages(sortedCargoes) > 1 && (
                <div className="p-4 bg-slate-50 dark:bg-slate-955 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                  <span className="text-slate-400">Page {cargoPage} of {totalPages(sortedCargoes)}</span>
                  <div className="flex gap-2">
                    <button
                      disabled={cargoPage === 1}
                      onClick={() => setCargoPage(prev => prev - 1)}
                      className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 disabled:opacity-50"
                    >
                      Prev
                    </button>
                    <button
                      disabled={cargoPage === totalPages(sortedCargoes)}
                      onClick={() => setCargoPage(prev => prev + 1)}
                      className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Cargo Inventory */}
        {activeTab === 'inventory' && (
          <div className="space-y-6 animate-in fade-in duration-200 select-none">
            {/* Inventory KPI Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Total Tonnage Stocked</span>
                <strong className="text-2xl font-black text-slate-800 dark:text-white mt-1 block">{totalCargoWeight.toLocaleString()} MT</strong>
              </div>
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Warehouse Cargo Items</span>
                <strong className="text-2xl font-black text-sky-500 mt-1 block">{cargoesInWarehouse} items</strong>
              </div>
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Reserved (DO Released)</span>
                <strong className="text-2xl font-black text-emerald-500 mt-1 block">{cargoes.filter(c => c.deliveryOrderNo).length} items</strong>
              </div>
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Damaged Consignments</span>
                <strong className="text-2xl font-black text-rose-500 mt-1 block">{cargoes.filter(c => c.isDamaged).length} items</strong>
              </div>
            </div>

            {/* Inventory table */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <h3 className="text-sm font-black text-slate-850 dark:text-white uppercase tracking-wider mb-4">Consignment Storage Inventory Logs</h3>
              <table className="w-full text-left text-xs divide-y divide-slate-100 dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-955 font-bold text-slate-500 uppercase tracking-widest text-[9px] border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="p-4">Cargo ID</th>
                    <th className="p-4">BL Reference</th>
                    <th className="p-4">Allocated Warehouse</th>
                    <th className="p-4">Storage Zone / Block</th>
                    <th className="p-4">Bay / Stack / Tier</th>
                    <th className="p-4">Current Qty</th>
                    <th className="p-4">Stored Weight</th>
                    <th className="p-4">Condition</th>
                    <th className="p-4">Inventory Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {cargoes.filter(c => c.Warehouse || c.status === 'Allocated').map(crg => {
                    const inv = crg.Inventories?.[0] || {};
                    return (
                      <tr key={crg.id || crg.cargo_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-955/20">
                        <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">{crg.cargoId}</td>
                        <td className="p-4 font-mono font-bold text-sky-500">{crg.billOfLading}</td>
                        <td className="p-4 font-semibold">{crg.Warehouse?.name || 'Main Warehouse'}</td>
                        <td className="p-4">{crg.binCode || 'Zone A'}</td>
                        <td className="p-4 font-mono">B-{inv.bayNum || '01'} / S-{inv.stackNum || '01'} / T-{inv.tierNum || '1'}</td>
                        <td className="p-4">{crg.quantity} pkgs</td>
                        <td className="p-4 font-semibold">{crg.weight} MT</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            crg.isDamaged ? 'bg-rose-500/10 text-rose-500' : 'bg-green-500/10 text-green-500'
                          }`}>
                            {crg.isDamaged ? 'Damaged' : 'Sound'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                            crg.deliveryOrderNo ? 'bg-emerald-500/10 text-emerald-500' : 'bg-sky-500/10 text-sky-500'
                          }`}>
                            {crg.deliveryOrderNo ? 'RESERVED' : 'STOCKED'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {cargoes.filter(c => c.Warehouse || c.status === 'Allocated').length === 0 && (
                    <tr>
                      <td colSpan="9" className="p-10 text-center text-slate-400 italic">No cargo inventory staged in warehouses.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 6: Internal Cargo Movement */}
        {activeTab === 'movement' && (
          <div className="space-y-6 animate-in fade-in duration-200 select-none">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <div>
                <h3 className="text-lg font-black text-slate-850 dark:text-white">Internal Yard & Warehouse Transfers</h3>
                <p className="text-xs text-slate-400 font-light mt-0.5">Submit warehouse transfer requests and audit chronological cargo logs within the port.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowMoveModal(true)}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl transition shadow flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Move Cargo Consignment
              </button>
            </div>

            {/* Movement logs timeline display */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <h3 className="text-sm font-black text-slate-850 dark:text-white uppercase tracking-wider mb-6">Cargo Transfer Chronology</h3>
              <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 pl-6 space-y-6">
                {moveLogs.map(mv => (
                  <div key={mv.id} className="relative text-xs">
                    <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-sky-500 border border-white dark:border-slate-900"></div>
                    <div className="bg-slate-50 dark:bg-slate-955 p-4 border border-slate-100 dark:border-slate-850 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                      <div>
                        <strong className="block text-slate-700 dark:text-slate-200 text-sm">Ticket ID: {mv.moveTicketId}</strong>
                        <span className="text-slate-400 block mt-1">Transferred: <strong>{mv.transferredWeight} MT</strong> using <strong>{mv.forkliftStackerId || 'Forklift'}</strong></span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-mono">{new Date(mv.createdAt).toLocaleString()}</span>
                        <span className="text-sky-500 font-bold block mt-1">Supervisor: {mv.supervisorName || 'System'}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {moveLogs.length === 0 && (
                  <div className="text-center text-slate-400 italic text-xs py-10">No internal movements logs found in database.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 7: Billing */}
        {activeTab === 'billing' && (
          <div className="space-y-6 animate-in fade-in duration-200 select-none">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-850 dark:text-white">Port Invoice Settlement</h3>
                <p className="text-xs text-slate-400 font-light mt-0.5">Calculate Scale of Rates handling/storage fees, audit invoice summaries, and settle dues.</p>
              </div>
              <button
                type="button"
                onClick={() => exportToCSV(invoices, 'billing_invoices_list')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" /> Export CSV
              </button>
            </div>

            {/* List Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs divide-y divide-slate-100 dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-955 font-bold text-slate-500 uppercase tracking-widest text-[9px] border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="p-4">Invoice No</th>
                    <th className="p-4">Cargo ID</th>
                    <th className="p-4">Vessel Name</th>
                    <th className="p-4">Invoice Date</th>
                    <th className="p-4">Storage Fee</th>
                    <th className="p-4">Handling Fee</th>
                    <th className="p-4">GST (18%)</th>
                    <th className="p-4">Grand Total</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Settlement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {invoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-955/20">
                      <td className="p-4 font-mono font-bold text-slate-800 dark:text-slate-200">{inv.invoiceNumber}</td>
                      <td className="p-4 font-semibold">{inv.Cargo?.cargoId || 'N/A'}</td>
                      <td className="p-4">{inv.Cargo?.vesselName || 'N/A'}</td>
                      <td className="p-4 font-mono">{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                      <td className="p-4 font-mono">₹{inv.storageFee?.toLocaleString()}</td>
                      <td className="p-4 font-mono">₹{inv.handlingFee?.toLocaleString()}</td>
                      <td className="p-4 font-mono">₹{inv.gstAmount?.toLocaleString()}</td>
                      <td className="p-4 font-mono font-black text-sky-500">₹{inv.totalAmount?.toLocaleString()}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                          ['Paid', 'PAID'].includes(inv.status) 
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                            : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                        }`}>
                          {['Paid', 'PAID'].includes(inv.status) ? 'PAID' : 'UNPAID'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {!['Paid', 'PAID'].includes(inv.status) ? (
                            <button
                              onClick={() => {
                                setSelectedInvoice(inv);
                                setShowPayModal(true);
                              }}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] rounded-lg shadow transition cursor-pointer"
                            >
                              Pay Dues
                            </button>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-xs">Settled</span>
                          )}
                          <button
                            onClick={() => setPdfInvoice(inv)}
                            className="px-2 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 font-bold rounded-lg text-[10px] transition flex items-center gap-1 cursor-pointer"
                          >
                            <Printer className="w-3 h-3" /> PDF Receipt
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {invoices.length === 0 && (
                    <tr>
                      <td colSpan="10" className="p-10 text-center text-slate-400 italic">No invoices registered for active cargoes.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Calculations Breakdown Card (Automatic preview) */}
            {cargoes.filter(c => c.status === 'Allocated').slice(0, 1).map(crg => {
              const calc = calculateCharges(crg);
              return (
                <div key={crg.id} className="bg-slate-50 dark:bg-slate-900/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-sm grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-black text-slate-850 dark:text-white uppercase tracking-wider mb-2">Automated Billing Estimator</h4>
                    <p className="text-xs text-slate-400 font-light mb-4">Real-time dues simulation calculated against mngprt Scale of Rates (SOR) for Cargo Consignment: <strong>{crg.cargoId}</strong>.</p>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between border-b pb-1">
                        <span className="text-slate-400">Cargo Type:</span>
                        <strong className="text-slate-700 dark:text-slate-300">{crg.cargoType} ({crg.weight} MT)</strong>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="text-slate-400">Cargo Handling Charges:</span>
                        <strong className="text-slate-755 dark:text-slate-200">₹{calc.handling.toLocaleString()}</strong>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="text-slate-400">Storage Charges:</span>
                        <strong className="text-slate-755 dark:text-slate-200">₹{calc.storage.toLocaleString()}</strong>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="text-slate-400">Warehouse Charges:</span>
                        <strong className="text-slate-755 dark:text-slate-200">₹{calc.warehouse.toLocaleString()}</strong>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="text-slate-400">Demurrage Charges:</span>
                        <strong className="text-slate-755 dark:text-slate-200">₹{calc.demurrage.toLocaleString()}</strong>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="text-slate-400">Documentation & Miscellaneous:</span>
                        <strong className="text-slate-755 dark:text-slate-200">₹{(calc.doc + calc.misc).toLocaleString()}</strong>
                      </div>
                      <div className="flex justify-between border-b pb-1 text-slate-400">
                        <span>GST (18%):</span>
                        <span>₹{calc.gst.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between pt-2 text-sm font-black text-sky-500">
                        <span>Grand Total Dues:</span>
                        <span>₹{calc.total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-855 flex flex-col justify-between">
                    <div className="text-xs text-slate-400 space-y-2">
                      <span className="font-bold text-slate-500 uppercase block">Scale of Rates Auditing</span>
                      <p>Storage charges are dynamically accrued per metric ton. Damaged cargo flags (reported in tally logs) automatically trigger demurrage surcharges in PIMS.</p>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={async () => {
                          try {
                            await API.post('/billing/invoices/generate', { cargoId: crg.id });
                            triggerToast('Invoice Generated', 'Successfully filed port charges invoice.', 'success');
                            refetchInvoices();
                          } catch (err) {
                            triggerToast('Generation Failed', 'Cargo already has a pending or paid invoice.', 'error');
                          }
                        }}
                        className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow cursor-pointer text-center"
                      >
                        Generate Invoice Document
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}



        {/* Tab 9: Delivery Order (DO/eDO) */}
        {activeTab === 'deliveryOrder' && (
          <div className="space-y-6 animate-in fade-in duration-200 select-none">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-850 dark:text-white">Electronic Delivery Order (e-DO) Generation</h3>
                <p className="text-xs text-slate-400 font-light mt-0.5">Generate compliance e-DOs. Access verification certificates and lift customs system holds instantly.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Generation Form */}
              <div className="lg:col-span-6 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest border-b pb-2">Issue New e-DO Certificate</h4>
                <form onSubmit={handleDORequestSubmit} className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-600 dark:text-slate-350">Select Consignment Cargo ID</label>
                    <select
                      value={doCargoId}
                      onChange={(e) => setDoCargoId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-755 dark:text-slate-200 focus:outline-none"
                    >
                      <option value="">-- Choose Cargo --</option>
                      {cargoes.filter(c => !c.deliveryOrderNo).map(c => {
                        const isSeized = c.customsHoldStatus === 'SEIZED' || c.status === 'Customs Hold';
                        return (
                          <option key={c.id} value={c.id}>
                            {c.cargoId} (BL: {c.billOfLading}) - {isSeized ? '🚨 SEIZURE IN PROGRESS' : `Status: ${c.status}`}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {(() => {
                    const selectedCargo = cargoes.find(c => String(c.id) === String(doCargoId));
                    if (selectedCargo && (selectedCargo.customsHoldStatus === 'SEIZED' || selectedCargo.status === 'Customs Hold')) {
                      return (
                        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-500 space-y-1 animate-pulse">
                          <strong className="block font-bold">🚨 Emergency Customs Seizure in Progress</strong>
                          <p className="text-[11px] opacity-90 font-light">Customs Regulatory Hold is active on cargo {selectedCargo.cargoId}. Generation of e-DO is strictly blocked until released by Customs Authorities.</p>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  <div className="space-y-1">
                    <label className="block font-bold text-slate-600 dark:text-slate-355">DO Expiry Date</label>
                    <input
                      type="date"
                      min={getTodayStr()}
                      value={doExpiry}
                      onChange={(e) => setDoExpiry(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-755 dark:text-slate-200 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-bold text-slate-600 dark:text-slate-355">Remarks</label>
                    <textarea
                      rows="3"
                      value={doRemarks}
                      onChange={(e) => setDoRemarks(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-755 dark:text-slate-200 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={doLoading}
                    className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
                  >
                    {doLoading ? 'Verifying invoice dues & customs holds...' : 'Generate e-DO Release Certificate'}
                  </button>
                </form>
              </div>

              {/* Latest e-DO result */}
              <div className="lg:col-span-6 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest border-b pb-2 mb-4">Latest e-DO Printout Preview</h4>
                  {latestDO ? (
                    <div className="space-y-4 text-xs">
                      <div className="flex justify-between items-center p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600">
                        <div>
                          <strong className="block text-sm">e-DO Generated Successfully!</strong>
                          <span className="text-[10px] font-mono">Token: {latestDO.deliveryOrderNo}</span>
                        </div>
                        <CheckCircle className="w-8 h-8" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between border-b pb-1">
                          <span className="text-slate-400">Consignee:</span>
                          <strong>{latestDO.consignee}</strong>
                        </div>
                        <div className="flex justify-between border-b pb-1">
                          <span className="text-slate-400">Cargo ID:</span>
                          <strong>{latestDO.cargoId}</strong>
                        </div>
                        <div className="flex justify-between border-b pb-1">
                          <span className="text-slate-400">Tonnage:</span>
                          <strong>{latestDO.weight} MT</strong>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-slate-400 italic py-16">No e-DO generated in this session yet. Choose a cargo to generate one.</div>
                  )}
                </div>
                {latestDO && (
                  <button
                    type="button"
                    onClick={() => {
                      const crg = cargoes.find(c => c.cargoId === latestDO.cargoId);
                      if (crg) handlePrintDo(latestDO, crg);
                    }}
                    className="w-full mt-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Printer className="w-4 h-4" /> Print DO Certificate
                  </button>
                )}
              </div>
            </div>

            {/* List DO history */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <h3 className="text-sm font-black text-slate-850 dark:text-white uppercase tracking-wider mb-4">DO Issuance Log History</h3>
              <table className="w-full text-left text-xs divide-y divide-slate-100 dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-955 font-bold text-slate-500 uppercase tracking-widest text-[9px] border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="p-4">DO Reference No</th>
                    <th className="p-4">Cargo ID</th>
                    <th className="p-4">BL No</th>
                    <th className="p-4">Consignee</th>
                    <th className="p-4">Discharged Weight</th>
                    <th className="p-4">DO Issue Date</th>
                    <th className="p-4">DO Status</th>
                    <th className="p-4 text-center">Print / Download</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-855">
                  {cargoes.filter(c => c.deliveryOrderNo || c.customsHoldStatus === 'SEIZED' || c.status === 'Customs Hold').map(c => {
                    const isSeized = c.customsHoldStatus === 'SEIZED' || c.status === 'Customs Hold';
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-955/20">
                        <td className="p-4 font-mono font-bold text-sky-500">{isSeized ? (c.deliveryOrderNo || 'REVOKED (SEIZED)') : c.deliveryOrderNo}</td>
                        <td className="p-4 font-semibold">{c.cargoId}</td>
                        <td className="p-4 font-mono">{c.billOfLading}</td>
                        <td className="p-4 font-semibold">{c.consignee}</td>
                        <td className="p-4 font-semibold">{c.weight} MT</td>
                        <td className="p-4 font-mono">{new Date(c.updatedAt).toLocaleDateString()}</td>
                        <td className="p-4">
                          {isSeized ? (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-500/10 text-rose-500 uppercase border border-rose-500/20 animate-pulse">
                              🚨 SEIZED (DO BLOCKED)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-green-500/10 text-green-500 uppercase">
                              RELEASED
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {isSeized ? (
                            <span className="text-slate-400 font-semibold cursor-not-allowed italic text-[11px]" title="Printing e-DO is blocked due to active Emergency Customs Seizure Hold">
                              🚫 e-DO Blocked
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handlePrintDo({ deliveryOrderNo: c.deliveryOrderNo, id: c.id }, c)}
                              className="text-sky-500 hover:underline cursor-pointer font-bold"
                            >
                              Print e-DO
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 10: Reports */}
        {activeTab === 'reports' && (
          <div className="space-y-6 animate-in fade-in duration-200 select-none">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
              <div>
                <h3 className="text-lg font-black text-slate-850 dark:text-white">Reports & Audit Ledger Generator</h3>
                <p className="text-xs text-slate-400 font-light mt-0.5 font-light">Generate auditing reports filterable by dates, vessel calls, commodity type, and storage warehouses.</p>
              </div>

              {/* Filtering criteria */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs pt-2">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-500 uppercase tracking-wide">Report Type</label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-755 dark:text-slate-200"
                  >
                    <option value="vessel-wise">Vessel-wise Cargo Report</option>
                    <option value="commodity-wise">Commodity-wise Cargo Report</option>
                    <option value="warehouse-inventory">Warehouse Inventory Report</option>
                    <option value="cargo-ageing">Cargo Ageing Report</option>
                    <option value="revenue">Revenue Report</option>
                    <option value="storage-charges">Storage Charges Report</option>
                    <option value="pending-do">Pending DO Report</option>
                    <option value="pending-invoice">Pending Invoice Report</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-500 uppercase tracking-wide">Vessel Voyage</label>
                  <select
                    value={reportFilterVessel}
                    onChange={(e) => setReportFilterVessel(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-755 dark:text-slate-200"
                  >
                    <option value="All">All Vessels</option>
                    {vesselCalls.map(vc => (
                      <option key={vc.vcn} value={vc.vesselName}>{vc.vesselName} ({vc.vcn})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-500 uppercase tracking-wide">Commodity</label>
                  <select
                    value={reportFilterCommodity}
                    onChange={(e) => setReportFilterCommodity(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-755 dark:text-slate-200"
                  >
                    <option value="All">All Commodities</option>
                    <option value="General">General</option>
                    <option value="Cashews">Cashews</option>
                    <option value="Hazardous">Hazardous</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-500 uppercase tracking-wide">Warehouse</label>
                  <select
                    value={reportFilterWarehouse}
                    onChange={(e) => setReportFilterWarehouse(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-755 dark:text-slate-200"
                  >
                    <option value="All">All Warehouses</option>
                    {warehouses.map(wh => (
                      <option key={wh.id} value={wh.name}>{wh.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-2 border-t mt-4 justify-end">
                <button
                  onClick={() => exportToCSV(cargoes, `report_${reportType}`)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-755 font-bold text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Export Excel
                </button>
                <button
                  onClick={() => { triggerToast('Export PDF', 'Generating PDF report print dialog...', 'success'); window.print(); }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" /> Export PDF (Print)
                </button>
              </div>
            </div>

            {/* Generated preview table */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <h3 className="text-sm font-black text-slate-850 dark:text-white uppercase tracking-wider mb-4">Report Preview Ledger</h3>
              <table className="w-full text-left text-xs divide-y divide-slate-100 dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-955 font-bold text-slate-500 uppercase tracking-widest text-[9px] border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="p-4">Cargo ID</th>
                    <th className="p-4">Vessel Name</th>
                    <th className="p-4">BL Number</th>
                    <th className="p-4">Commodity</th>
                    <th className="p-4">Warehouse</th>
                    <th className="p-4">Tonnage</th>
                    <th className="p-4">DO status</th>
                    <th className="p-4">Invoiced Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {cargoes.map(crg => (
                    <tr key={crg.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-955/20">
                      <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">{crg.cargoId}</td>
                      <td className="p-4 font-semibold">{crg.vesselName}</td>
                      <td className="p-4 font-mono font-bold text-sky-500">{crg.billOfLading}</td>
                      <td className="p-4">{crg.commodityType}</td>
                      <td className="p-4">{crg.Warehouse?.name || 'Staged Zone'}</td>
                      <td className="p-4 font-bold">{crg.weight} MT</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded ${
                          crg.deliveryOrderNo ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'
                        }`}>
                          {crg.deliveryOrderNo ? 'Released' : 'Pending'}
                        </span>
                      </td>
                      <td className="p-4 font-mono font-semibold">₹{calculateCharges(crg).total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>

      {/* CRUD MODALS */}

      {/* Vessel Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl flex flex-col animate-in zoom-in-95 duration-150 text-xs">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="text-base font-black text-slate-855 dark:text-white flex items-center gap-2">
                <Ship className="w-5 h-5 text-sky-500" />
                {editingProfile ? 'Edit Vessel Profile' : 'Register Master Vessel Profile'}
              </h3>
              <button onClick={() => setShowProfileModal(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">×</button>
            </div>

            <form onSubmit={handleVesselProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600 dark:text-slate-350">Vessel Name *</label>
                  <input
                    type="text" required placeholder="e.g. MV SSL Brahmaputra"
                    value={profName} onChange={(e) => setProfName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-slate-750 dark:text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600 dark:text-slate-350">IMO Number *</label>
                  <input
                    type="text" required placeholder="e.g. IMO992817"
                    value={profImo} onChange={(e) => setProfImo(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-slate-750 dark:text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600 dark:text-slate-355">Vessel Type</label>
                  <select
                    value={profType} onChange={(e) => setProfType(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-slate-750 dark:text-slate-200"
                  >
                    <option value="Container">Container</option>
                    <option value="Bulk">Bulk</option>
                    <option value="Liquid">Liquid</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600 dark:text-slate-355">Flag</label>
                  <input
                    type="text" value={profFlag} onChange={(e) => setProfFlag(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-slate-750 dark:text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600 dark:text-slate-355">Call Sign *</label>
                  <input
                    type="text" required placeholder="e.g. AWTX"
                    value={profCallSign} onChange={(e) => setProfCallSign(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-slate-755 dark:text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600 dark:text-slate-355">Owner / Operator *</label>
                  <input
                    type="text" required placeholder="e.g. SSL Logistics"
                    value={profOwner} onChange={(e) => setProfOwner(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-slate-755 dark:text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600 dark:text-slate-355">Gross Tonnage (GT)</label>
                  <input
                    type="number" value={profGt} onChange={(e) => setProfGt(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-slate-755 dark:text-slate-205"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600 dark:text-slate-355">Max Draft (meters)</label>
                  <input
                    type="number" step="0.1" value={profDraft} onChange={(e) => setProfDraft(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-slate-755 dark:text-slate-205"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t">
                <button
                  type="button" onClick={() => setShowProfileModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={profileSubmitting}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl"
                >
                  {profileSubmitting ? 'Registering...' : 'Register Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vessel Call (Voyage) Modal */}
      {showVesselModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl flex flex-col animate-in zoom-in-95 duration-150 text-xs">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="text-base font-black text-slate-855 dark:text-white flex items-center gap-2">
                <Ship className="w-5 h-5 text-sky-500" />
                {editingVessel ? 'Edit Vessel Call Voyage' : 'Register Seaport Voyage Call (VCN)'}
              </h3>
              <button onClick={() => setShowVesselModal(false)} className="text-slate-400 hover:text-slate-655 text-lg font-bold">×</button>
            </div>

            <form onSubmit={handleVesselCallSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 col-span-2">
                  <label className="block font-bold text-slate-600 dark:text-slate-350">Link Vessel Profile *</label>
                  <select
                    value={vProfileId}
                    onChange={(e) => handleProfileSelect(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-slate-755 dark:text-slate-200 rounded-xl focus:outline-none"
                  >
                    <option value="">-- Choose Profile --</option>
                    <option value="manual">Manual Entry / Free Form</option>
                    {vesselProfiles.map(p => (
                      <option key={p.id || p.vessel_id} value={p.id || p.vessel_id}>{p.vesselName} ({p.imoNumber})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600 dark:text-slate-350">Vessel Name *</label>
                  <input
                    type="text" required
                    value={vName} onChange={(e) => setVName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-slate-750 dark:text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600 dark:text-slate-355">Voyage Number *</label>
                  <input
                    type="text" required placeholder="e.g. VOY-2026-99"
                    value={vVoyageNo} onChange={(e) => setVVoyageNo(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-slate-750 dark:text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600 dark:text-slate-355">Flag</label>
                  <input
                    type="text" value={vFlag} onChange={(e) => setVFlag(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-slate-755 dark:text-slate-202"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600 dark:text-slate-355">Arrival Date (ETA) *</label>
                  <input
                    type="datetime-local" required
                    min={`${getTomorrowDateStr()}T00:00`}
                    value={vEta}
                    onChange={(e) => {
                      const newEta = e.target.value;
                      setVEta(newEta);
                      if (vEtd) {
                        const minEtd = getDayAfterEtaStr(newEta);
                        if (vEtd < minEtd) {
                          setVEtd(minEtd);
                        }
                      }
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-slate-755 dark:text-slate-202"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600 dark:text-slate-355">Departure Date (ETD)</label>
                  <input
                    type="datetime-local"
                    min={getDayAfterEtaStr(vEta)}
                    value={vEtd}
                    onChange={(e) => setVEtd(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-slate-755 dark:text-slate-202"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600 dark:text-slate-355">Berth Assignment</label>
                  <select
                    value={vBerthSpec} onChange={(e) => setVBerthSpec(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-slate-755 dark:text-slate-202"
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
                  {vcnSubmitting ? 'Registering...' : 'Register Voyage'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cargo Manifest Entry Modal */}
      {showCargoModal && (
        <div className="fixed inset-0 bg-slate-955/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl p-6 shadow-2xl flex flex-col animate-in zoom-in-95 duration-150 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="text-base font-black text-slate-855 dark:text-white flex items-center gap-2">
                <FilePlus className="w-5 h-5 text-sky-500" />
                {editingCargo ? 'Edit Cargo Manifest consignment' : 'Filing New IGM Cargo Manifest'}
              </h3>
              <button onClick={() => setShowCargoModal(false)} className="text-slate-400 hover:text-slate-655 text-lg font-bold">×</button>
            </div>

            <form onSubmit={handleCargoSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600 dark:text-slate-350">Select Incoming Vessel *</label>
                  <select
                    value={selectedVesselName}
                    onChange={(e) => setSelectedVesselName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-slate-750 dark:text-slate-200 font-bold"
                  >
                    {vesselProfiles.map((p) => (
                      <option key={p.id || p.vessel_id} value={p.vesselName}>
                        {p.vesselName} ({p.vesselType})
                      </option>
                    ))}
                    {vesselProfiles.length === 0 && (
                      <option value="Generic Vessel">Generic Vessel</option>
                    )}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600 dark:text-slate-350">Cargo ID (Auto generated) *</label>
                  <input
                    type="text" required
                    value={cargoIdInput} onChange={(e) => setCargoIdInput(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-slate-755 dark:text-slate-202 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600 dark:text-slate-350">Manifest Number *</label>
                  <input
                    type="text" required
                    value={manifestNoInput} onChange={(e) => setManifestNoInput(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-slate-755 dark:text-slate-202 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600 dark:text-slate-350">Bill of Lading Number *</label>
                  <input
                    type="text" required placeholder="e.g. BL-992817"
                    value={blNoInput} onChange={(e) => setBlNoInput(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-slate-755 dark:text-slate-202 font-mono uppercase"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600 dark:text-slate-355">Commodity Type</label>
                  <select
                    value={commodityInput} onChange={(e) => setCommodityInput(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-slate-750 dark:text-slate-200"
                  >
                    <option value="General">General</option>
                    <option value="Cashews">Cashews (Raw)</option>
                    <option value="Hazardous">Hazardous Chemicals</option>
                    <option value="Coal">Coal / Minerals</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600 dark:text-slate-355">Cargo Type</label>
                  <select
                    value={cargoTypeInput} onChange={(e) => setCargoTypeInput(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-slate-750 dark:text-slate-200"
                  >
                    <option value="Container">Containerized</option>
                    <option value="Bulk">Bulk Dry</option>
                    <option value="Liquid">Liquid Cargo</option>
                    <option value="Break Bulk">Break Bulk</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600 dark:text-slate-355">Trade Direction (Import / Export)</label>
                  <select
                    value={tradeTypeInput} onChange={(e) => setTradeTypeInput(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-slate-750 dark:text-slate-200 font-bold"
                  >
                    <option value="Import">Import Cargo (7 Free Days)</option>
                    <option value="Export">Export Cargo (21 Free Days)</option>
                  </select>
                </div>
                {tradeTypeInput === 'Export' && (
                  <div className="space-y-1">
                    <label className="block font-bold text-indigo-600 dark:text-indigo-400">Shipping Bill Number (Export) *</label>
                    <input
                      type="text" required placeholder="e.g. SB-2026-MNGPRT-0991"
                      value={shippingBillInput} onChange={(e) => setShippingBillInput(e.target.value)}
                      className="w-full bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 px-3 py-2 rounded-xl text-slate-755 dark:text-slate-202 font-mono uppercase"
                    />
                  </div>
                )}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600 dark:text-slate-355">Trade Category</label>
                  <select
                    value={categoryInput} onChange={(e) => setCategoryInput(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-slate-750 dark:text-slate-200"
                  >
                    <option value="Foreign">Foreign Trade</option>
                    <option value="Coastal">Coastal Goods</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600 dark:text-slate-355">Importer / Consignee *</label>
                  <input
                    type="text" required placeholder="e.g. Mangalore Import Corp"
                    value={consigneeInput} onChange={(e) => setConsigneeInput(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-slate-750 dark:text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600 dark:text-slate-355">Exporter / Shipper</label>
                  <input
                    type="text" placeholder="e.g. Colombo Shipping Ltd"
                    value={shipperInput} onChange={(e) => setShipperInput(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-slate-750 dark:text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600 dark:text-slate-355">Gross Weight (Metric Tons) *</label>
                  <input
                    type="number" step="0.01" required placeholder="e.g. 24.50"
                    value={weightInput} onChange={(e) => setWeightInput(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-slate-755 dark:text-slate-202 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600 dark:text-slate-355">Quantity (Packages Count) *</label>
                  <input
                    type="number" required
                    value={quantityInput} onChange={(e) => setQuantityInput(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-slate-755 dark:text-slate-202 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600 dark:text-slate-355">Container Number (Optional)</label>
                  <input
                    type="text" placeholder="e.g. MNGPRTC-102938"
                    value={containerInput} onChange={(e) => setContainerInput(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-slate-755 dark:text-slate-202 font-mono uppercase"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600 dark:text-slate-355">Notify Party</label>
                  <input
                    type="text" placeholder="e.g. Agent Cargo Brokers Ltd"
                    value={notifyPartyInput} onChange={(e) => setNotifyPartyInput(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-slate-755 dark:text-slate-202"
                  />
                </div>
                <div className="space-y-1 col-span-2 bg-sky-50/50 dark:bg-slate-800/60 p-4 border border-dashed border-sky-300 dark:border-sky-700 rounded-2xl">
                  <label className="block font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    <Upload className="w-4 h-4 text-sky-500" />
                    Attach Cargo Manifest Document File (PDF, Excel, Scanned IGM)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg"
                    onChange={(e) => setManifestFileInput(e.target.files[0])}
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-sky-600 file:text-white hover:file:bg-sky-500 cursor-pointer mt-1"
                  />
                  {manifestFileInput && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold block mt-1">
                      Selected File: {manifestFileInput.name} ({(manifestFileInput.size / 1024).toFixed(1)} KB)
                    </span>
                  )}
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="block font-bold text-slate-600 dark:text-slate-355">Cargo Description</label>
                  <textarea
                    rows="2"
                    value={cargoDescInput} onChange={(e) => setCargoDescInput(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-slate-750 dark:text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="flex items-center gap-1.5 font-bold text-slate-600 dark:text-slate-350">
                    <input
                      type="checkbox"
                      checked={isDamagedInput} onChange={(e) => setIsDamagedInput(e.target.checked)}
                      className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    Flag as Damaged / Audited Shortage
                  </label>
                </div>
                {isDamagedInput && (
                  <div className="space-y-1 col-span-2">
                    <label className="block font-bold text-slate-600 dark:text-slate-355">Damage Remarks</label>
                    <input
                      type="text" value={damageRemarksInput} onChange={(e) => setDamageRemarksInput(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-slate-750 dark:text-slate-200"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t">
                <button
                  type="button" onClick={() => setShowCargoModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={manifestSubmitting}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl"
                >
                  {manifestSubmitting ? 'Submitting manifest...' : 'Submit IGM Manifest'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Internal Movement Modal */}
      {showMoveModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl flex flex-col animate-in zoom-in-95 duration-150 text-xs">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="text-base font-black text-slate-855 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-sky-500" />
                Submit Internal Cargo Movement Ticket
              </h3>
              <button onClick={() => setShowMoveModal(false)} className="text-slate-400 hover:text-slate-655 text-lg font-bold">×</button>
            </div>

            <form onSubmit={handleMoveSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block font-bold text-slate-600 dark:text-slate-350">Select Staged Cargo Consignment</label>
                <select
                  value={moveCargoId}
                  onChange={(e) => setMoveCargoId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-slate-755 dark:text-slate-202 rounded-xl focus:outline-none"
                >
                  <option value="">-- Choose Cargo --</option>
                  {cargoes.filter(c => c.status === 'Allocated' || c.status === 'Yard Staged').map(c => (
                    <option key={c.id} value={c.id}>{c.cargoId} (BL: {c.billOfLading}) - {c.weight} MT</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-600 dark:text-slate-350">To Warehouse / Storage Area</label>
                <select
                  value={moveToWarehouseId}
                  onChange={(e) => setMoveToWarehouseId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-slate-755 dark:text-slate-202 rounded-xl focus:outline-none"
                >
                  <option value="">-- Choose Warehouse --</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-600 dark:text-slate-350">Quantity / Weight to Move (MT)</label>
                <input
                  type="number" step="0.1" placeholder="e.g. 15.0"
                  value={moveQty} onChange={(e) => setMoveQty(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-slate-750 dark:text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-600 dark:text-slate-350">Forklift / Stacker Equipment ID</label>
                <input
                  type="text"
                  value={moveEquipment} onChange={(e) => setMoveEquipment(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-slate-750 dark:text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-600 dark:text-slate-350">Movement Supervisor Name</label>
                <input
                  type="text"
                  value={moveSupervisor} onChange={(e) => setMoveSupervisor(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-slate-750 dark:text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-600 dark:text-slate-350">Remarks</label>
                <input
                  type="text"
                  value={moveRemarks} onChange={(e) => setMoveRemarks(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-slate-755 dark:text-slate-202"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t">
                <button
                  type="button" onClick={() => setShowMoveModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={moveSubmitting}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl"
                >
                  {moveSubmitting ? 'Recording Move...' : 'Record Cargo Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Advanced Settle Invoice Modal */}
      {showPayModal && selectedInvoice && (() => {
        const totalAmt = selectedInvoice.roundedGrandTotal || selectedInvoice.totalAmount || 0;
        const baseHandling = selectedInvoice.baseHandlingCharges || (selectedInvoice.wharfageFee ? selectedInvoice.wharfageFee + selectedInvoice.handlingFee : Math.round(totalAmt * 0.45));
        const storageDues = selectedInvoice.storageFee || Math.round(totalAmt * 0.30);
        const demurrageDues = selectedInvoice.demurrageFee || Math.round(totalAmt * 0.07);
        const cgstVal = selectedInvoice.cgst || Math.round(totalAmt * 0.09);
        const sgstVal = selectedInvoice.sgst || Math.round(totalAmt * 0.09);
        const subtotalBeforeTax = baseHandling + storageDues + demurrageDues;
        const isPdaSufficient = (pdaBalance || 0) >= totalAmt;

        return (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl p-6 md:p-8 shadow-2xl flex flex-col animate-in zoom-in-95 duration-150 text-xs select-none space-y-6 max-h-[92vh] overflow-y-auto">
              
              {/* Modal Header */}
              <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-sky-500/10 text-sky-500 rounded-lg font-bold text-[10px] uppercase tracking-wider border border-sky-500/20">Official mngprt Gateway</span>
                    <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg font-bold text-[10px] uppercase tracking-wider border border-emerald-500/20">🔒 256-Bit SSL Encrypted</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1.5 flex items-center gap-2">
                    <CreditCard className="w-6 h-6 text-sky-500" />
                    Seaport Scale of Rates (SOR) Billing & Settlement Gateway
                  </h3>
                  <p className="text-xs text-slate-400 font-light mt-0.5">Itemized financial tariff breakdown, statutory tax assessments, and instant multi-channel clearance settlement</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowPayModal(false)} 
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-xl transition font-bold text-base cursor-pointer"
                >
                  ×
                </button>
              </div>

              {/* Modal Grid Body */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Column: Itemized SOR Financial Tariff Calculation */}
                <div className="lg:col-span-6 bg-slate-50/70 dark:bg-slate-955/50 p-5 rounded-2xl border border-slate-150 dark:border-slate-800 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                    <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-sky-500" /> Itemized SOR Fee Ledger
                    </span>
                    <span className="font-mono text-[10px] font-bold text-sky-500 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                      {selectedInvoice.invoiceNumber}
                    </span>
                  </div>

                  {/* Consignment Details Card */}
                  <div className="grid grid-cols-2 gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-850 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-bold">Consignment ID</span>
                      <strong className="text-slate-800 dark:text-slate-200 font-mono font-bold">{selectedInvoice.Cargo?.cargoId || 'CRG-CONSIGNMENT'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-bold">BL Reference</span>
                      <strong className="text-slate-800 dark:text-slate-200 font-mono font-bold">{selectedInvoice.Cargo?.billOfLading || 'BL-MANIFEST-REF'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-bold">Consignee</span>
                      <strong className="text-slate-700 dark:text-slate-300 truncate block font-semibold">{selectedInvoice.Cargo?.consignee || 'Consignee Importer'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-bold">Tariff SAC Code</span>
                      <strong className="text-slate-700 dark:text-slate-300 font-mono">996711 (Cargo Handling)</strong>
                    </div>
                  </div>

                  {/* Tariff Breakdown Table */}
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                      <span>Wharfage & Quay Handling (SOR Sec 1.1)</span>
                      <span className="font-mono font-bold">₹{baseHandling.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                      <span>Storage Dues (5 Days | 3 Days Free Period)</span>
                      <span className="font-mono font-bold">₹{storageDues.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                      <span>Demurrage & Dwell Surge Penalty</span>
                      <span className="font-mono font-bold">₹{demurrageDues.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1.5 font-bold text-slate-700 dark:text-slate-300">
                      <span>Subtotal (Net Amount)</span>
                      <span className="font-mono">₹{subtotalBeforeTax.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1 text-[11px] text-slate-400">
                      <span>CGST @ 9.0%</span>
                      <span className="font-mono">₹{cgstVal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1 text-[11px] text-slate-400">
                      <span>SGST @ 9.0%</span>
                      <span className="font-mono">₹{sgstVal.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Total Highlight Card */}
                  <div className="p-4 bg-gradient-to-r from-sky-600 to-indigo-600 text-white rounded-xl shadow-md flex justify-between items-center">
                    <div>
                      <span className="text-[10px] uppercase font-black tracking-wider text-sky-100 block">Total Statutory Payable Dues</span>
                      <span className="text-xs text-sky-200 font-light">Includes 18% GST Statutory Levies</span>
                    </div>
                    <span className="text-xl font-black font-mono tracking-tight">₹{selectedInvoice.totalAmount?.toLocaleString()}</span>
                  </div>
                </div>

                {/* Right Column: Multi-Channel Interactive Payment Gateway */}
                <div className="lg:col-span-6 space-y-4">
                  
                  {/* Payment Method Selector Tabs */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Select Payment Settlement Gateway</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => setPaymentMode('PDA Wallet')}
                        className={`py-2 px-1 text-[11px] font-bold rounded-lg transition flex items-center justify-center gap-1 cursor-pointer ${
                          paymentMode === 'PDA Wallet' ? 'bg-sky-600 text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        💳 PDA Wallet
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMode('UPI')}
                        className={`py-2 px-1 text-[11px] font-bold rounded-lg transition flex items-center justify-center gap-1 cursor-pointer ${
                          paymentMode === 'UPI' ? 'bg-sky-600 text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        📱 UPI / QR
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMode('Bank Transfer')}
                        className={`py-2 px-1 text-[11px] font-bold rounded-lg transition flex items-center justify-center gap-1 cursor-pointer ${
                          paymentMode === 'Bank Transfer' ? 'bg-sky-600 text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        🏦 RTGS / NEFT
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMode('Card')}
                        className={`py-2 px-1 text-[11px] font-bold rounded-lg transition flex items-center justify-center gap-1 cursor-pointer ${
                          paymentMode === 'Card' ? 'bg-sky-600 text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        💳 Credit Card
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handlePaymentSettle} className="space-y-4">
                    
                    {/* MODE 1: PDA WALLET */}
                    {paymentMode === 'PDA Wallet' && (
                      <div className="space-y-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl animate-in fade-in duration-150">
                        <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-955 rounded-xl border border-slate-100 dark:border-slate-850">
                          <div>
                            <span className="text-[9px] uppercase font-bold text-slate-400 block">Available PDA Prepaid Credit</span>
                            <strong className="text-base font-black text-slate-800 dark:text-white font-mono">₹{pdaBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-bold text-slate-400 block text-right">Post-Deduction Balance</span>
                            <strong className={`text-base font-black font-mono text-right block ${isPdaSufficient ? 'text-emerald-500' : 'text-rose-500'}`}>
                              ₹{Math.max(0, pdaBalance - selectedInvoice.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </strong>
                          </div>
                        </div>

                        {isPdaSufficient ? (
                          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-[11px] font-medium flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
                            <span>✓ Instant automated settlement. Funds will be deducted from your Personal Deposit Account and release token issued.</span>
                          </div>
                        ) : (
                          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-[11px] font-medium space-y-1">
                            <strong className="block font-bold">⚠️ Insufficient PDA Balance</strong>
                            <p>Your PDA balance is ₹{pdaBalance.toLocaleString()}, but total dues are ₹{selectedInvoice.totalAmount.toLocaleString()}. Please top up PDA or switch to UPI / Bank Transfer.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* MODE 2: UPI / DYNAMIC QR CODE */}
                    {paymentMode === 'UPI' && (
                      <div className="space-y-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl animate-in fade-in duration-150">
                        <div className="flex flex-col sm:flex-row items-center gap-4 p-3 bg-slate-50 dark:bg-slate-955 rounded-xl border border-slate-100 dark:border-slate-850">
                          
                          {/* Realistic QR Graphic */}
                          <div className="w-28 h-28 bg-white p-2 rounded-xl shadow border border-slate-200 flex flex-col items-center justify-center shrink-0 relative">
                            <div className="w-full h-full border-2 border-sky-500/40 p-1 flex flex-col justify-between">
                              <div className="flex justify-between">
                                <div className="w-4 h-4 bg-slate-900 rounded-sm"></div>
                                <div className="w-4 h-4 bg-slate-900 rounded-sm"></div>
                              </div>
                              <div className="text-[7px] font-black font-mono text-center text-sky-600">MNGPRT PAY</div>
                              <div className="flex justify-between items-end">
                                <div className="w-4 h-4 bg-slate-900 rounded-sm"></div>
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2 text-xs flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-700 dark:text-slate-200">Scan via any UPI App</span>
                              <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[10px] font-bold rounded-md animate-pulse">⏳ Expires 04:58</span>
                            </div>
                            <p className="text-[11px] text-slate-400 font-light">GPay, PhonePe, Paytm, BHIM or Cred</p>
                            
                            <div className="flex items-center gap-2 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                              <span className="text-[10px] font-mono text-slate-500 font-bold truncate">mngprt.billing@sbi</span>
                              <span className="text-[9px] font-bold text-sky-600 bg-sky-50 dark:bg-sky-950 px-1.5 py-0.5 rounded cursor-pointer ml-auto">COPY</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block font-bold text-slate-600 dark:text-slate-350">Enter 12-Digit UTR / Transaction Reference</label>
                          <input
                            type="text"
                            placeholder="e.g. 402910849201"
                            value={txRef}
                            onChange={(e) => setTxRef(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-slate-755 dark:text-slate-200 font-mono uppercase focus:outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* MODE 3: BANK TRANSFER / RTGS */}
                    {paymentMode === 'Bank Transfer' && (
                      <div className="space-y-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl animate-in fade-in duration-150">
                        <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-955 rounded-xl border border-slate-100 dark:border-slate-850 text-[11px]">
                          <div>
                            <span className="text-slate-400 block text-[9px] font-bold uppercase">Beneficiary Account</span>
                            <strong className="font-mono text-slate-800 dark:text-slate-200 font-bold">MNGPRT88492019401</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[9px] font-bold uppercase">IFSC Code</span>
                            <strong className="font-mono text-slate-800 dark:text-slate-200 font-bold">SBIN0000891</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[9px] font-bold uppercase">Bank Name</span>
                            <strong className="text-slate-700 dark:text-slate-300 font-semibold">State Bank of India</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[9px] font-bold uppercase">Branch</span>
                            <strong className="text-slate-700 dark:text-slate-300 font-semibold">Panambur Port Branch</strong>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block font-bold text-slate-600 dark:text-slate-350">Enter Bank UTR / NEFT Reference Number</label>
                          <input
                            type="text"
                            placeholder="e.g. SBIN820194820194"
                            value={txRef}
                            onChange={(e) => setTxRef(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-slate-755 dark:text-slate-200 font-mono uppercase focus:outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* MODE 4: COMMERCIAL CREDIT CARD */}
                    {paymentMode === 'Card' && (
                      <div className="space-y-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl animate-in fade-in duration-150">
                        <div className="p-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl space-y-3 shadow-md">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400">CORPORATE PORT CARD</span>
                            <span className="px-2 py-0.5 bg-sky-500 text-white font-black text-[9px] rounded">VISA / MC</span>
                          </div>
                          <div className="font-mono text-sm tracking-widest font-bold">•••• •••• •••• 4920</div>
                          <div className="flex justify-between text-[10px] font-mono text-slate-300">
                            <span>VALUED CUSTOMER</span>
                            <span>EXP 12/28</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="col-span-2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Cardholder Name</label>
                            <input type="text" placeholder="e.g. SSL Shipping Pvt Ltd" className="w-full p-2 bg-slate-50 dark:bg-slate-955 border rounded-xl font-medium focus:outline-none text-slate-800 dark:text-slate-200" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Expiry Date</label>
                            <input type="text" placeholder="MM/YY" className="w-full p-2 bg-slate-50 dark:bg-slate-955 border rounded-xl font-mono focus:outline-none text-slate-800 dark:text-slate-200" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Security CVV</label>
                            <input type="password" maxLength={4} placeholder="•••" className="w-full p-2 bg-slate-50 dark:bg-slate-955 border rounded-xl font-mono focus:outline-none text-slate-800 dark:text-slate-200" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-light">
                        <Lock className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Instant e-DO clearance token unlocked upon successful settlement</span>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto justify-end">
                        <button
                          type="button" 
                          onClick={() => setShowPayModal(false)}
                          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button" 
                          onClick={(e) => handlePaymentSettle(e)}
                          disabled={payLoading}
                          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition shadow shadow-emerald-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          {payLoading ? 'Processing Settlement...' : `Pay ₹${(selectedInvoice.roundedGrandTotal || selectedInvoice.totalAmount || 0).toLocaleString()} Now`}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        );
      })()}



      {/* Prepaid PDA Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl flex flex-col animate-in zoom-in-95 duration-150 text-xs">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="text-base font-black text-slate-855 dark:text-white flex items-center gap-2">
                <Coins className="w-5 h-5 text-emerald-500 animate-bounce" />
                Deposit Funds to Prepaid PDA Wallet
              </h3>
              <button onClick={() => setShowDepositModal(false)} className="text-slate-400 hover:text-slate-655 text-lg font-bold">×</button>
            </div>

            <form onSubmit={handleDeposit} className="space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-955 rounded-xl border border-slate-100 dark:border-slate-850 space-y-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>Current Balance:</span>
                  <strong className="text-slate-700 dark:text-slate-200">₹{pdaBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Authorized User:</span>
                  <strong className="text-slate-700 dark:text-slate-200">{user?.username}</strong>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-600 dark:text-slate-350">Deposit Amount (₹ INR)</label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  placeholder="Enter amount to add, e.g. 500000"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-slate-755 dark:text-slate-202 rounded-xl focus:outline-none font-bold text-sm"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t">
                <button
                  type="button" onClick={() => setShowDepositModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={depositLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl"
                >
                  {depositLoading ? 'Depositing...' : 'Confirm Deposit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice PDF Modal */}
      {pdfInvoice && (
        <InvoicePDFModal invoice={pdfInvoice} onClose={() => setPdfInvoice(null)} />
      )}

    </div>
  );
};

const totalPages = (arr) => {
  return Math.ceil(arr.length / 8);
};

export default ShippingAgentPortal;
