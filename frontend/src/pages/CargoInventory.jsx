import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import { 
  Plus, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Upload, 
  CheckCircle2, 
  Layers, 
  AlertTriangle 
} from 'lucide-react';

const CargoInventory = () => {
  const { user } = useContext(AuthContext);
  const { triggerToast } = useContext(NotificationContext);

  // Lists & pagination
  const [cargoes, setCargoes] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Tab State
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('cargo_inventory_active_tab') || 'ledger';
  });

  useEffect(() => {
    localStorage.setItem('cargo_inventory_active_tab', activeTab);
  }, [activeTab]);

  const [allocRowNum, setAllocRowNum] = useState('');
  const [allocColNum, setAllocColNum] = useState('');
  const [allocTierNum, setAllocTierNum] = useState('');

  // Yard Transfers Tab State
  const [moveLogs, setMoveLogs] = useState([]);
  const [moveLogsLoading, setMoveLogsLoading] = useState(false);
  const [allCargoList, setAllCargoList] = useState([]); 
  const [allWarehouses, setAllWarehouses] = useState([]); 
  
  // Yard Transfer Form State
  const [transferCargoId, setTransferCargoId] = useState('');
  const [transferForkliftId, setTransferForkliftId] = useState('');
  const [transferSourceWhId, setTransferSourceWhId] = useState('');
  const [transferSourceYardId, setTransferSourceYardId] = useState('');
  const [transferDestWhId, setTransferDestWhId] = useState('');
  const [transferDestYardId, setTransferDestYardId] = useState('');
  const [transferWeight, setTransferWeight] = useState('');
  const [transferSubmitting, setTransferSubmitting] = useState(false);
  const [selectedTransferCargo, setSelectedTransferCargo] = useState(null);
  const [cargoDetailsLoading, setCargoDetailsLoading] = useState(false);
  const [selectedSourceInvIdx, setSelectedSourceInvIdx] = useState(0);
  const [destYardLocations, setDestYardLocations] = useState([]);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [showUnloadModal, setShowUnloadModal] = useState(false);
  const [selectedCargo, setSelectedCargo] = useState(null);
  const [unloadingCargo, setUnloadingCargo] = useState(null);

  // Upload Form State
  const [newCargoId, setNewCargoId] = useState('');
  const [newCargoType, setNewCargoType] = useState('Container');
  const [newQuantity, setNewQuantity] = useState(1);
  const [newWeight, setNewWeight] = useState(0.0);
  const [newConsignee, setNewConsignee] = useState('');
  const [newTradeType, setNewTradeType] = useState('Import');
  const [newShippingBill, setNewShippingBill] = useState('');
  const [manifestFile, setManifestFile] = useState(null);

  // Allocation Form State
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [selectedYardLocId, setSelectedYardLocId] = useState('');
  const [yardLocations, setYardLocations] = useState([]);
  const [binCodeVal, setBinCodeVal] = useState('');
  const [unloadEquipment, setUnloadEquipment] = useState('Cranes');

  const fetchCargoes = async () => {
    setLoading(true);
    try {
      const res = await API.get('/cargo', {
        params: {
          search,
          type: typeFilter,
          status: statusFilter,
          page: currentPage,
          limit: 8
        }
      });
      setCargoes(res.data.cargoes);
      setTotalItems(res.data.totalItems);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      console.error('Failed to fetch cargo inventory:', error);
      triggerToast('Failed to load inventory', 'Could not sync cargo lists.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCargoes();
  }, [currentPage, typeFilter, statusFilter, search]);

  const fetchMoveLogs = async () => {
    setMoveLogsLoading(true);
    try {
      const res = await API.get('/warehouses/moves');
      setMoveLogs(res.data);
    } catch (err) {
      console.error('Error fetching move logs:', err);
    } finally {
      setMoveLogsLoading(false);
    }
  };

  const fetchAllCargoesForTransfer = async () => {
    try {
      const res = await API.get('/cargo?limit=100');
      const eligible = res.data.cargoes.filter(c => c.Warehouse !== null);
      setAllCargoList(eligible);
      if (eligible.length > 0 && !transferCargoId) {
        setTransferCargoId(eligible[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchWarehousesForTransfer = async () => {
    try {
      const res = await API.get('/warehouses');
      setAllWarehouses(res.data);
      if (res.data.length > 0) {
        setTransferDestWhId(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (transferCargoId) {
      const loadCargoDetails = async () => {
        setCargoDetailsLoading(true);
        try {
          const res = await API.get(`/cargo/${transferCargoId}`);
          setSelectedTransferCargo(res.data);
          if (res.data.Inventories && res.data.Inventories.length > 0) {
            const firstInv = res.data.Inventories[0];
            setTransferSourceWhId(firstInv.warehouseId);
            setTransferSourceYardId(firstInv.yardLocationId || '');
            setTransferWeight(firstInv.weight);
          } else {
            setTransferSourceWhId('');
            setTransferSourceYardId('');
            setTransferWeight('');
          }
        } catch (err) {
          console.error(err);
        } finally {
          setCargoDetailsLoading(false);
        }
      };
      loadCargoDetails();
    } else {
      setSelectedTransferCargo(null);
    }
  }, [transferCargoId]);

  useEffect(() => {
    if (selectedTransferCargo?.Inventories && selectedTransferCargo.Inventories.length > 0) {
      const inv = selectedTransferCargo.Inventories[selectedSourceInvIdx] || selectedTransferCargo.Inventories[0];
      setTransferSourceWhId(inv.warehouseId);
      setTransferSourceYardId(inv.yardLocationId || '');
      setTransferWeight(inv.weight);
    }
  }, [selectedTransferCargo, selectedSourceInvIdx]);

  useEffect(() => {
    if (transferDestWhId) {
      const wh = allWarehouses.find(w => w.id === parseInt(transferDestWhId));
      if (wh) {
        setDestYardLocations(wh.YardLocations || []);
        if (wh.YardLocations?.length > 0) {
          setTransferDestYardId(wh.YardLocations[0].id);
        } else {
          setTransferDestYardId('');
        }
      }
    } else {
      setDestYardLocations([]);
      setTransferDestYardId('');
    }
  }, [transferDestWhId, allWarehouses]);

  useEffect(() => {
    if (activeTab === 'transfers') {
      fetchMoveLogs();
      fetchAllCargoesForTransfer();
      fetchWarehousesForTransfer();
    }
  }, [activeTab]);

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (!transferCargoId || !transferSourceWhId || !transferDestWhId || !transferWeight) {
      triggerToast('Validation Error', 'Please complete all transfer details.', 'error');
      return;
    }

    if (parseInt(transferSourceWhId) === parseInt(transferDestWhId) && 
        (transferSourceYardId === transferDestYardId || (!transferSourceYardId && !transferDestYardId))) {
      triggerToast('Validation Error', 'Source and destination locations cannot be identical.', 'error');
      return;
    }

    setTransferSubmitting(true);
    try {
      await API.post('/warehouses/move', {
        cargoId: transferCargoId,
        forkliftStackerId: transferForkliftId,
        sourceWarehouseId: parseInt(transferSourceWhId),
        destinationWarehouseId: parseInt(transferDestWhId),
        sourceYardLocationId: transferSourceYardId ? parseInt(transferSourceYardId) : null,
        destinationYardLocationId: transferDestYardId ? parseInt(transferDestYardId) : null,
        transferredWeight: parseFloat(transferWeight)
      });

      triggerToast('Transfer Logged', 'Yard move ticket registered and stock relocated.', 'success');
      setTransferForkliftId('');
      fetchMoveLogs();
      const res = await API.get(`/cargo/${transferCargoId}`);
      setSelectedTransferCargo(res.data);
      setSelectedSourceInvIdx(0);
      fetchCargoes(); 
    } catch (err) {
      triggerToast('Transfer Failed', err.response?.data?.message || 'Error processing yard movement.', 'error');
    } finally {
      setTransferSubmitting(false);
    }
  };

  // Handle Search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchCargoes();
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearch('');
    setTypeFilter('');
    setStatusFilter('');
    setCurrentPage(1);
    // Slight timeout to let state clear
    setTimeout(fetchCargoes, 50);
  };

  // 1. Action: Unload Cargo Submit (Port Ops / Admin)
  const handleUnloadCargoSubmit = async (e) => {
    e.preventDefault();
    if (!unloadingCargo) return;

    try {
      await API.put(`/cargo/${unloadingCargo.id}/unload`, {
        unloadingEquipment: unloadEquipment
      });
      triggerToast('Cargo Unloaded', `Cargo ${unloadingCargo.cargoId} unloaded successfully using ${unloadEquipment}.`, 'success');
      setShowUnloadModal(false);
      setUnloadingCargo(null);
      fetchCargoes();
    } catch (error) {
      triggerToast('Unload Failed', error.response?.data?.message || 'Failed to register unloading.', 'error');
    }
  };

  // Open Allocation modal (Warehouse Manager / Admin)
  const openAllocateModal = async (cargo) => {
    setSelectedCargo(cargo);
    setBinCodeVal(cargo.binCode || '');
    setAllocRowNum('');
    setAllocColNum('');
    setAllocTierNum('');
    try {
      const res = await API.get('/warehouses');
      setWarehouses(res.data);
      if (res.data.length > 0) {
        setSelectedWarehouseId(res.data[0].id);
        setYardLocations(res.data[0].YardLocations || []);
        if (res.data[0].YardLocations?.length > 0) {
          setSelectedYardLocId(res.data[0].YardLocations[0].id);
        } else {
          setSelectedYardLocId('');
        }
      }
      setShowAllocateModal(true);
    } catch (error) {
      triggerToast('Error loading locations', 'Failed to retrieve warehouse capacities.', 'error');
    }
  };

  // Sync Yard locations dropdown on warehouse change
  useEffect(() => {
    if (selectedWarehouseId) {
      const wh = warehouses.find(w => w.id === parseInt(selectedWarehouseId));
      if (wh) {
        setYardLocations(wh.YardLocations || []);
        if (wh.YardLocations?.length > 0) {
          setSelectedYardLocId(wh.YardLocations[0].id);
        } else {
          setSelectedYardLocId('');
        }
      }
    }
  }, [selectedWarehouseId]);

  // 2. Action: Allocate Storage Space (Warehouse Manager / Admin)
  const handleAllocateStorage = async (e) => {
    e.preventDefault();
    if (!selectedWarehouseId) return;

    if (allocTierNum && parseInt(allocTierNum) > 5) {
      triggerToast('Safety Violation', 'Tier height cannot exceed 5 containers for yard safety.', 'error');
      return;
    }

    try {
      await API.put(`/cargo/${selectedCargo.id}/allocate`, {
        warehouseId: parseInt(selectedWarehouseId),
        yardLocationId: selectedYardLocId ? parseInt(selectedYardLocId) : null,
        binCode: binCodeVal,
        rowNum: allocRowNum ? parseInt(allocRowNum) : null,
        colNum: allocColNum ? parseInt(allocColNum) : null,
        tierNum: allocTierNum ? parseInt(allocTierNum) : null
      });

      triggerToast('Storage Assigned', `Cargo ${selectedCargo.cargoId} allocated successfully.`, 'success');
      setShowAllocateModal(false);
      setSelectedCargo(null);
      setBinCodeVal('');
      setAllocRowNum('');
      setAllocColNum('');
      setAllocTierNum('');
      fetchCargoes();
    } catch (error) {
      triggerToast('Allocation Failed', error.response?.data?.message || 'Failed to allocate warehouse space.', 'error');
    }
  };

  // 3. Action: Upload Manifest (Shipping Agent / Admin)
  const handleUploadManifestSubmit = async (e) => {
    e.preventDefault();

    if (!newCargoId || !newConsignee || newWeight <= 0) {
      triggerToast('Validation Error', 'Please fill all manifest details with valid entries.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('cargoId', newCargoId);
    formData.append('cargoType', newCargoType);
    formData.append('quantity', newQuantity);
    formData.append('weight', newWeight);
    formData.append('consignee', newConsignee);
    formData.append('tradeType', newTradeType);
    if (newTradeType === 'Export' && newShippingBill) {
      formData.append('shippingBill', newShippingBill);
    }
    if (manifestFile) {
      formData.append('manifest', manifestFile);
    }

    try {
      await API.post('/cargo/manifest', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      triggerToast('Manifest Registered', `Cargo manifest ${newCargoId} registered successfully.`, 'success');
      setShowUploadModal(false);
      // Reset Form fields
      setNewCargoId('');
      setNewCargoType('Container');
      setNewQuantity(1);
      setNewWeight(0.0);
      setNewConsignee('');
      setManifestFile(null);
      fetchCargoes();
    } catch (error) {
      triggerToast('Upload Failed', error.response?.data?.message || 'Failed to submit cargo manifest.', 'error');
    }
  };

  // Status Badge configurations
  const getStatusBadge = (status) => {
    switch (status) {
      case 'MANIFESTED':
      case 'Manifest Uploaded':
        return <span className="inline-block w-44 text-center whitespace-nowrap px-2 py-1 text-sm font-bold rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">MANIFEST UPLOADED</span>;
      case 'Unloaded':
        return <span className="inline-block w-44 text-center whitespace-nowrap px-2 py-1 text-sm font-bold rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">UNLOADED</span>;
      case 'Customs Approved':
      case 'Cleared':
      case 'CLEARED':
      case 'RELEASE_READY':
      case 'Dispatched':
      case 'GATE_OUT':
        return <span className="inline-block w-44 text-center whitespace-nowrap px-2 py-1 text-sm font-bold rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-400/20">CLEARED</span>;
      case 'Allocated':
      case 'YARD_STAGED':
      case 'Customs Hold':
      case 'CUSTOMS_HOLD':
      default:
        return <span className="inline-block w-44 text-center whitespace-nowrap px-2 py-1 text-sm font-bold rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">ALLOCATED</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header and top buttons */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 glass-panel">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">Cargo Manifest Database</h2>
          <p className="text-sm text-slate-400 font-light mt-0.5">Browse active shipments, track terminal status, and register manifest declarations</p>
        </div>
        {['Shipping Agent', 'Super Admin'].includes(user?.role) && (
          <button 
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-sm font-bold transition shadow-lg hover:shadow-sky-500/10 border border-sky-500/10"
          >
            <Plus className="w-4 h-4" />
            Upload Cargo Manifest
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 rounded-2xl glass-panel gap-2">
        <button 
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-2 text-sm font-bold rounded-xl transition ${activeTab === 'ledger' ? 'bg-sky-500 text-white shadow-md shadow-sky-500/10' : 'text-slate-400 hover:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-850'}`}
        >
          Cargo Ledger
        </button>
        <button 
          onClick={() => setActiveTab('transfers')}
          className={`px-4 py-2 text-sm font-bold rounded-xl transition ${activeTab === 'transfers' ? 'bg-sky-500 text-white shadow-md shadow-sky-500/10' : 'text-slate-400 hover:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-850'}`}
        >
          Yard Transfers (Move Tickets)
        </button>
      </div>

      {activeTab === 'ledger' && (
        <>
          {/* Search and filtering bars */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 glass-panel">
            
            {/* Search */}
            <form onSubmit={handleSearchSubmit} className="md:col-span-5 relative">
              <input
                type="text"
                placeholder="Search Cargo ID, Consignee..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-880 rounded-xl focus:border-sky-500 focus:outline-none text-sm text-slate-700 dark:text-slate-200 transition"
              />
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </span>
            </form>

            {/* Type Filter */}
            <div className="md:col-span-3 relative">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full pl-3 pr-8 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 rounded-xl focus:border-sky-500 focus:outline-none text-sm text-slate-700 dark:text-slate-300 transition appearance-none"
              >
                <option value="">All Cargo Categories</option>
                <option value="Container">Container</option>
                <option value="Bulk">Bulk</option>
                <option value="Liquid">Liquid</option>
                <option value="Break Bulk">Break Bulk</option>
              </select>
              <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                <Filter className="w-4.5 h-4.5" />
              </span>
            </div>

            {/* Status Filter */}
            <div className="md:col-span-3 relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-3 pr-8 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 rounded-xl focus:border-sky-500 focus:outline-none text-sm text-slate-700 dark:text-slate-300 transition appearance-none"
              >
                <option value="">All Workflow States</option>
                <option value="Manifest Uploaded">Manifest Uploaded</option>
                <option value="Allocated">Allocated</option>
                <option value="Customs Approved">Cleared</option>
              </select>
              <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                <Filter className="w-4.5 h-4.5" />
              </span>
            </div>

            {/* Reset button */}
            <button 
              onClick={handleResetFilters}
              className="md:col-span-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-xl transition"
            >
              Reset
            </button>

          </div>

          {/* Cargo Table */}
          <div className="w-full space-y-2">
            
            {loading ? (
              <div className="p-20 flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-500"></div>
              </div>
            ) : cargoes.length === 0 ? (
              <div className="p-20 text-center text-sm text-slate-500 dark:text-slate-450 font-light">No cargo records found matching the filters.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm select-none">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/20 text-slate-500 font-bold">
                      <th className="p-4">Cargo ID</th>
                      <th className="p-4">Category / UOM</th>
                      <th className="p-4">Weight</th>
                      <th className="p-4">Trade & Free Days</th>
                      <th className="p-4">Consignee</th>
                      <th className="p-4">Assigned Yard</th>
                      <th className="p-4">e-DO Ref</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-700 dark:text-slate-300 font-light">
                    {cargoes.map(cargo => (
                      <tr key={cargo.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="p-4 font-bold text-sky-500 dark:text-sky-400">{cargo.cargoId}</td>
                        <td className="p-4">
                          <div>{cargo.cargoType}</div>
                          <span className="inline-block mt-0.5 px-1.5 py-0.2 text-[10px] font-mono font-bold bg-amber-500/10 text-amber-500 border border-amber-500/15 rounded">
                            {cargo.uomType || 'MTDA'}
                          </span>
                        </td>
                        <td className="p-4 font-mono font-bold">{cargo.weight.toFixed(1)} MT</td>
                        <td className="p-4">
                          <span className={`inline-block px-2 py-0.5 text-xs font-bold rounded-md ${cargo.tradeType === 'Export' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'}`}>
                            {cargo.tradeType || 'Import'} ({cargo.tradeType === 'Export' ? '21 Working Free Days' : '7 Working Free Days'})
                          </span>
                          {cargo.isGovernmentDetained && (
                            <span className="block mt-1 text-[10px] font-bold text-rose-500">
                              🔒 Govt Detention Exempt
                            </span>
                          )}
                        </td>
                        <td className="p-4 max-w-[150px] truncate" title={cargo.consignee}>{cargo.consignee}</td>
                        <td className="p-4 max-w-[180px] truncate text-slate-500 dark:text-slate-400">
                          {cargo.Warehouse?.name || <span className="italic text-slate-400">Unallocated</span>}
                        </td>
                        <td className="p-4">
                          {cargo.deliveryOrderNo ? (
                            <span className="text-emerald-500 font-mono font-bold text-xs">{cargo.deliveryOrderNo}</span>
                          ) : (
                            <span className="text-slate-400 italic text-xs">Pending</span>
                          )}
                        </td>
                        <td className="p-4">{getStatusBadge(cargo.status)}</td>
                        <td className="p-4 text-right shrink-0">
                          {/* Action 1: Unload Cargo (Ops / Admin only, only if Manifest Uploaded or MANIFESTED) */}
                          {['Port Operations Officer', 'Super Admin'].includes(user?.role) && ['Manifest Uploaded', 'MANIFESTED'].includes(cargo.status) && (
                            <button
                              onClick={() => {
                                setUnloadingCargo(cargo);
                                setUnloadEquipment('Cranes');
                                setShowUnloadModal(true);
                              }}
                              className="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg text-sm transition cursor-pointer"
                            >
                              Unload Cargo
                            </button>
                          )}

                          {/* Action 2: Allocate Storage (Warehouse Manager / Admin only, only if Unloaded) */}
                          {['Warehouse Manager', 'Super Admin'].includes(user?.role) && cargo.status === 'Unloaded' && (
                            <button
                              onClick={() => openAllocateModal(cargo)}
                              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-sm transition"
                            >
                              Allocate Storage
                            </button>
                          )}

                          {/* Fallback indicator */}
                          {!((['Port Operations Officer', 'Super Admin'].includes(user?.role) && ['Manifest Uploaded', 'MANIFESTED'].includes(cargo.status)) ||
                            ((['Warehouse Manager', 'Super Admin'].includes(user?.role) && cargo.status === 'Unloaded'))) && (
                            <span className="text-sm text-slate-400 italic">No actions available</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Bar */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20">
                <span className="text-sm text-slate-400 font-light">
                  Showing page <strong className="text-slate-600 dark:text-slate-200">{currentPage}</strong> of <strong className="text-slate-600 dark:text-slate-200">{totalPages}</strong> ({totalItems} items total)
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 disabled:opacity-40 enabled:hover:bg-slate-100 dark:enabled:hover:bg-slate-800 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 disabled:opacity-40 enabled:hover:bg-slate-100 dark:enabled:hover:bg-slate-800 transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

          </div>
        </>
      )}

      {activeTab === 'transfers' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 select-none">
          {/* Left Column: Form */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 glass-panel space-y-4">
            <h3 className="font-bold text-base text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-850 pb-2">Log Internal Yard Transfer</h3>
            
            {allCargoList.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No cargoes currently allocated to warehouse storage.</p>
            ) : (
              <form onSubmit={handleTransferSubmit} className="space-y-4 text-sm">
                {/* Select Cargo */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Select Cargo Consignment</label>
                  <select
                    value={transferCargoId}
                    onChange={(e) => setTransferCargoId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-slate-800 dark:text-slate-350"
                  >
                    {allCargoList.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.cargoId} - {c.consignee} ({c.cargoType})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Display Current Positions of the Cargo */}
                {selectedTransferCargo && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl space-y-2">
                    <span className="text-xs font-bold text-slate-500 block">Current Inventory Stored:</span>
                    {cargoDetailsLoading ? (
                      <span className="text-xs text-slate-400">Loading cargo positions...</span>
                    ) : selectedTransferCargo.Inventories && selectedTransferCargo.Inventories.length > 0 ? (
                      <div className="space-y-2">
                        {selectedTransferCargo.Inventories.length > 1 && (
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-1">Multiple locations detected. Select source:</label>
                            <select
                              value={selectedSourceInvIdx}
                              onChange={(e) => setSelectedSourceInvIdx(parseInt(e.target.value))}
                              className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-lg text-xs"
                            >
                              {selectedTransferCargo.Inventories.map((inv, idx) => (
                                <option key={idx} value={idx}>
                                  {inv.Warehouse?.name || selectedTransferCargo.Warehouse?.name || inv.zoneBlock || 'Storage Area'} {inv.YardLocation ? `(${inv.YardLocation.zoneCode})` : (inv.zoneBlock ? `(${inv.zoneBlock})` : '')} - {inv.weight} Tons
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                        {selectedTransferCargo.Inventories.map((inv, idx) => (
                          <div key={idx} className={`flex items-center justify-between text-xs p-2.5 rounded-xl border ${idx === selectedSourceInvIdx ? 'border-sky-500 bg-sky-500/10 text-slate-800 dark:text-slate-200' : 'border-slate-200 dark:border-slate-800 opacity-70'}`}>
                            <div className="flex items-center gap-1.5 flex-1 min-w-0 pr-2">
                              <span className="font-semibold truncate text-slate-800 dark:text-slate-200">
                                {inv.Warehouse?.name || selectedTransferCargo.Warehouse?.name || inv.zoneBlock || 'Storage Yard'}
                              </span>
                              {(inv.YardLocation?.zoneCode || inv.zoneBlock) && (
                                <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
                                  | Zone: {inv.YardLocation?.zoneCode || inv.zoneBlock}
                                </span>
                              )}
                            </div>
                            <span className="font-bold text-sky-500 shrink-0 whitespace-nowrap">{inv.weight} Tons</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-rose-500">No active warehouse inventory found.</span>
                    )}
                  </div>
                )}

                {/* Forklift / Stacker ID */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Forklift / Stacker Vehicle ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FKL-02, STK-09"
                    value={transferForkliftId}
                    onChange={(e) => setTransferForkliftId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-slate-800 dark:text-slate-200"
                  />
                </div>

                {/* Destination Warehouse */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Destination Warehouse</label>
                  <select
                    value={transferDestWhId}
                    onChange={(e) => setTransferDestWhId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-slate-800 dark:text-slate-350 font-bold"
                  >
                    {allWarehouses.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.name} - (Type: {w.type}, Available: {w.availableSpace.toFixed(0)}T)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Destination Yard Location */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Destination Zone (Yard Location)</label>
                  {destYardLocations.length === 0 ? (
                    <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl text-xs">
                      No specific yard zones configured for this warehouse. General storage applies.
                    </div>
                  ) : (
                    <select
                      value={transferDestYardId}
                      onChange={(e) => setTransferDestYardId(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-slate-800 dark:text-slate-350"
                    >
                      {destYardLocations.map(y => (
                        <option key={y.id} value={y.id}>
                          {y.zoneCode} - (Row: {y.row || 'N/A'}, Col: {y.column || 'N/A'}, Tier: {y.tier || 'N/A'})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Transferred Weight */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Transferred Weight (Tons)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 15.5"
                    value={transferWeight}
                    onChange={(e) => setTransferWeight(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-slate-800 dark:text-slate-200"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={transferSubmitting || !selectedTransferCargo?.Inventories?.length}
                  className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-1.5 shadow-lg hover:shadow-sky-500/10 cursor-pointer"
                >
                  Execute Internal Movement
                </button>
              </form>
            )}
          </div>

          {/* Right Column: Move Tickets Table */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 glass-panel space-y-4">
            <h3 className="font-bold text-base text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-850 pb-2">Yard Movement Tickets Ledger</h3>
            
            {moveLogsLoading ? (
              <div className="py-20 flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-500"></div>
              </div>
            ) : moveLogs.length === 0 ? (
              <p className="py-20 text-center text-sm text-slate-400 italic">No internal warehouse moves logged yet.</p>
            ) : (
              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-850 text-slate-500 font-bold">
                      <th className="pb-3">Ticket ID</th>
                      <th className="pb-3">Cargo ID</th>
                      <th className="pb-3">Vehicle ID</th>
                      <th className="pb-3">From</th>
                      <th className="pb-3">To</th>
                      <th className="pb-3 text-right">Weight (Tons)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-850 text-slate-700 dark:text-slate-355 font-light">
                    {moveLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                        <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">{log.moveTicketId}</td>
                        <td className="py-3 font-bold text-sky-500">{log.Cargo?.cargoId || 'N/A'}</td>
                        <td className="py-3 font-medium text-amber-500">{log.forkliftStackerId || 'N/A'}</td>
                        <td className="py-3 truncate max-w-[120px]" title={log.sourceWarehouse?.name}>
                          {log.sourceWarehouse?.name} {log.sourceYardLocation ? `(${log.sourceYardLocation.zoneCode})` : ''}
                        </td>
                        <td className="py-3 truncate max-w-[120px]" title={log.destinationWarehouse?.name}>
                          {log.destinationWarehouse?.name} {log.destinationYardLocation ? `(${log.destinationYardLocation.zoneCode})` : ''}
                        </td>
                        <td className="py-3 text-right font-bold">{log.transferredWeight} T</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: Upload Cargo Manifest */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex justify-center items-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl rounded-2xl overflow-hidden glass-panel p-6 transform transition-all animate-bounce-slow">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-800 dark:text-white">New Manifest Declaration</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">×</button>
            </div>

            <form onSubmit={handleUploadManifestSubmit} className="space-y-4 text-sm select-none">
              
              <div>
                <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Cargo ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CRG-MNGPRT-010"
                  value={newCargoId}
                  onChange={(e) => setNewCargoId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Trade Direction</label>
                  <select
                    value={newTradeType}
                    onChange={(e) => setNewTradeType(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-slate-800 dark:text-slate-300 font-bold"
                  >
                    <option value="Import">Import Cargo</option>
                    <option value="Export">Export Cargo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Cargo Category</label>
                  <select
                    value={newCargoType}
                    onChange={(e) => setNewCargoType(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-slate-800 dark:text-slate-300"
                  >
                    <option value="Container">Container</option>
                    <option value="Bulk">Bulk</option>
                    <option value="Liquid">Liquid</option>
                    <option value="Break Bulk">Break Bulk</option>
                  </select>
                </div>
              </div>

              {newTradeType === 'Export' && (
                <div>
                  <label className="block text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1.5">Shipping Bill Number (Export)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SB-2026-MNGPRT-8821"
                    value={newShippingBill}
                    onChange={(e) => setNewShippingBill(e.target.value)}
                    className="w-full p-2.5 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl focus:border-indigo-500 focus:outline-none text-slate-800 dark:text-slate-200 font-mono uppercase"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Consignee / Client</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MRPL India / Global Freight"
                    value={newConsignee}
                    onChange={(e) => setNewConsignee(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Quantity (Units/TEU)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(parseInt(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Tonnage (Metric Tons)</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0.1"
                    placeholder="0.00"
                    value={newWeight || ''}
                    onChange={(e) => setNewWeight(parseFloat(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              {/* Manifest File Drop */}
              <div>
                <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Cargo Manifest PDF</label>
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-950 transition flex flex-col items-center gap-1.5 relative">
                  <Upload className="w-5 h-5 text-slate-400" />
                  <span className="text-sm text-slate-500 font-medium">
                    {manifestFile ? manifestFile.name : 'Click to browse or drop files (.pdf, .csv, .xls)'}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.csv,.xls,.xlsx"
                    onChange={(e) => setManifestFile(e.target.files[0])}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-500 rounded-xl font-bold transition hover:bg-slate-50 dark:hover:bg-slate-950"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold transition flex items-center gap-1 shadow-lg hover:shadow-sky-500/10"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Submit Manifest
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Allocate Storage Space */}
      {showAllocateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex justify-center items-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl rounded-2xl overflow-hidden glass-panel p-6 transform transition-all animate-bounce-slow">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-base text-slate-800 dark:text-white">Allocate Storage Space</h3>
                <span className="text-sm text-slate-400 font-light">Assigning Cargo <strong className="text-sky-500">{selectedCargo?.cargoId}</strong> ({selectedCargo?.weight} Tons)</span>
              </div>
              <button onClick={() => { setShowAllocateModal(false); setSelectedCargo(null); }} className="text-slate-400 hover:text-slate-600 text-lg">×</button>
            </div>

            <form onSubmit={handleAllocateStorage} className="space-y-4 text-sm select-none">
              
              {/* Select Warehouse */}
              <div>
                <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Warehouse / Terminal</label>
                <select
                  value={selectedWarehouseId}
                  onChange={(e) => setSelectedWarehouseId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-slate-800 dark:text-slate-350 font-bold"
                >
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name} - ({w.availableSpace.toFixed(0)}T left / type: {w.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Yard location section if exists */}
              <div>
                <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Yard Location / Zone Slot
                </label>
                {yardLocations.length === 0 ? (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>No specific zone racks configured. General storage applies.</span>
                  </div>
                ) : (
                  <select
                    value={selectedYardLocId}
                    onChange={(e) => setSelectedYardLocId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-slate-800 dark:text-slate-350"
                  >
                    {yardLocations.map(y => (
                      <option key={y.id} value={y.id}>
                        {y.zoneCode} - (Capacity: {y.capacity}T / Occupied: {y.occupiedSpace}T)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Bin Code / Stacking Position input */}
              <div>
                <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Bin / Stacking Position (Container Stacking)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Row-4, Tier-3, Level-2"
                  value={binCodeVal}
                  onChange={(e) => setBinCodeVal(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-slate-800 dark:text-slate-200"
                />
              </div>

              {/* Row, Column, Tier Coordinates */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Row Num</label>
                  <input
                    type="number"
                    placeholder="e.g. 4"
                    value={allocRowNum}
                    onChange={(e) => setAllocRowNum(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-sky-500 focus:outline-none text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Col Num</label>
                  <input
                    type="number"
                    placeholder="e.g. 12"
                    value={allocColNum}
                    onChange={(e) => setAllocColNum(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-sky-500 focus:outline-none text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tier Num</label>
                  <input
                    type="number"
                    placeholder="Max 5"
                    value={allocTierNum}
                    onChange={(e) => setAllocTierNum(e.target.value)}
                    className={`w-full p-2.5 bg-slate-50 dark:bg-slate-950 border rounded-xl focus:outline-none text-slate-800 dark:text-slate-200 ${
                      allocTierNum && parseInt(allocTierNum) > 5 
                        ? 'border-rose-500 focus:border-rose-500 text-rose-500' 
                        : 'border-slate-200 dark:border-slate-800 focus:border-sky-500'
                    }`}
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => { setShowAllocateModal(false); setSelectedCargo(null); }}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-500 rounded-xl font-bold transition hover:bg-slate-50 dark:hover:bg-slate-950"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={warehouses.length === 0}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white rounded-xl font-bold transition flex items-center gap-1 shadow-lg hover:shadow-indigo-500/10"
                >
                  <Layers className="w-4 h-4" />
                  Allocate Bay
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Select Unloading Equipment */}
      {showUnloadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex justify-center items-center p-4">
          <div className="max-w-sm w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl rounded-2xl overflow-hidden glass-panel p-6 transform transition-all animate-bounce-slow">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-800 dark:text-white">Register Cargo Unloading</h3>
              <button onClick={() => { setShowUnloadModal(false); setUnloadingCargo(null); }} className="text-slate-400 hover:text-slate-600 text-lg">×</button>
            </div>

            <form onSubmit={handleUnloadCargoSubmit} className="space-y-4 text-sm select-none">
              <div>
                <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Select Unloading Equipment</label>
                <select
                  value={unloadEquipment}
                  onChange={(e) => setUnloadEquipment(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-slate-800 dark:text-slate-350 font-bold"
                >
                  <option value="Cranes">Gantry Cranes</option>
                  <option value="Reach stackers">Reach Stackers</option>
                  <option value="Forklifts">Heavy Forklifts</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => { setShowUnloadModal(false); setUnloadingCargo(null); }}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-500 rounded-xl font-bold transition hover:bg-slate-50 dark:hover:bg-slate-950"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold transition shadow-lg hover:shadow-sky-505/10 animate-pulse-slow"
                >
                  Confirm Unload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default CargoInventory;
