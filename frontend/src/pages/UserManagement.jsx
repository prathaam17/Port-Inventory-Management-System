import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit, 
  ShieldAlert, 
  CheckCircle,
  Key,
  Anchor,
  Grid,
  Box,
  Layers,
  Database,
  Building2,
  UserCheck,
  MapPin,
  UploadCloud,
  FileCheck
} from 'lucide-react';

const UserManagement = () => {
  const { user } = useContext(AuthContext);
  const { triggerToast } = useContext(NotificationContext);

  const [activeTab, setActiveTab] = useState('operators');
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [berths, setBerths] = useState([]);
  const [containerTypes, setContainerTypes] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals visibility
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [showBerthModal, setShowBerthModal] = useState(false);
  const [selectedBerth, setSelectedBerth] = useState(null);

  const [showContainerTypeModal, setShowContainerTypeModal] = useState(false);
  const [selectedContainerType, setSelectedContainerType] = useState(null);

  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);

  const [showYardLocModal, setShowYardLocModal] = useState(false);
  const [selectedYardLoc, setSelectedYardLoc] = useState(null);

  // Form states - Users
  const [usernameVal, setUsernameVal] = useState('');
  const [emailVal, setEmailVal] = useState('');
  const [passwordVal, setPasswordVal] = useState('');
  const [roleVal, setRoleVal] = useState('');

  // Form states - Berths
  const [berthNum, setBerthNum] = useState('');
  const [berthDraft, setBerthDraft] = useState('');
  const [berthCapacity, setBerthCapacity] = useState('');
  const [berthStatus, setBerthStatus] = useState('Available');

  // Form states - Container Types
  const [ctName, setCtName] = useState('');
  const [ctLength, setCtLength] = useState('');
  const [ctHeight, setCtHeight] = useState('');
  const [ctWidth, setCtWidth] = useState('');
  const [ctMaxWeight, setCtMaxWeight] = useState('');

  // Form states - Warehouses (Yard Plots)
  const [whName, setWhName] = useState('');
  const [whType, setWhType] = useState('Transit Shed');
  const [whCapacity, setWhCapacity] = useState('');

  // Form states - Yard Locations
  const [ylWarehouseId, setYlWarehouseId] = useState('');
  const [ylZoneCode, setYlZoneCode] = useState('');
  const [ylCapacity, setYlCapacity] = useState('');
  const [ylRow, setYlRow] = useState('');
  const [ylColumn, setYlColumn] = useState('');
  const [ylTier, setYlTier] = useState('');
  const [ylSlot, setYlSlot] = useState('');

  const [submitLoading, setSubmitLoading] = useState(false);

  // Shipping Agent registrations state
  const [registrations, setRegistrations] = useState([]);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [selectedRegForRejection, setSelectedRegForRejection] = useState(null);
  const [rejectionRemarks, setRejectionRemarks] = useState('');
  const [selectedRegistration, setSelectedRegistration] = useState(null);

  const fetchRegistrations = async () => {
    try {
      const res = await API.get('/registrations');
      setRegistrations(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveRegistration = async (reg) => {
    if (!window.confirm(`Are you sure you want to APPROVE registration for ${reg.companyName} (${reg.registrationId})? This will create an active Shipping Agent account.`)) {
      return;
    }
    try {
      setSubmitLoading(true);
      await API.post(`/registrations/${reg.id}/approve`);
      triggerToast('Registration Approved', `Account for Shipping Agent ${reg.companyName} is now active.`, 'success');
      await fetchRegistrations();
      await fetchUsers(); // Refresh users directory
      setSelectedRegistration(null);
    } catch (err) {
      triggerToast('Approval Failed', err.response?.data?.message || 'Failed to approve registration.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleOpenRejectionModal = (reg) => {
    setSelectedRegForRejection(reg);
    setRejectionRemarks('');
    setRejectionModalOpen(true);
  };

  const handleRejectRegistrationSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!rejectionRemarks.trim()) {
      triggerToast('Remarks Required', 'Please provide a reason for the rejection.', 'error');
      return;
    }
    try {
      setSubmitLoading(true);
      await API.post(`/registrations/${selectedRegForRejection.id}/reject`, {
        remarks: rejectionRemarks
      });
      triggerToast('Registration Rejected', `Application ${selectedRegForRejection.registrationId} rejected.`, 'info');
      setRejectionModalOpen(false);
      setSelectedRegForRejection(null);
      setRejectionRemarks('');
      await fetchRegistrations();
      setSelectedRegistration(null);
    } catch (err) {
      triggerToast('Rejection Failed', err.response?.data?.message || 'Failed to reject registration.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await API.get('/users');
      setUsers(Array.isArray(res.data) ? res.data : []);
      const rolesRes = await API.get('/users/roles');
      if (rolesRes.data && Array.isArray(rolesRes.data)) {
        setRoles(rolesRes.data);
        if (rolesRes.data.length > 0 && !roleVal) {
          setRoleVal(rolesRes.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setUsers([]);
    }
  };

  const fetchBerths = async () => {
    try {
      const res = await API.get('/master-data/berths');
      setBerths(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch berths:', err);
      setBerths([]);
    }
  };

  const fetchContainerTypes = async () => {
    try {
      const res = await API.get('/master-data/container-types');
      setContainerTypes(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch container types:', err);
      setContainerTypes([]);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const res = await API.get('/warehouses');
      const data = Array.isArray(res.data) ? res.data : [];
      setWarehouses(data);
      if (data.length > 0 && !ylWarehouseId) {
        setYlWarehouseId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch warehouses:', err);
      setWarehouses([]);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchUsers(),
        fetchBerths(),
        fetchContainerTypes(),
        fetchWarehouses(),
        fetchRegistrations()
      ]);
    } catch (err) {
      console.error('Error loading User Management data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // --- USER HANDLERS ---
  const openAddModal = () => {
    setUsernameVal('');
    setEmailVal('');
    setPasswordVal('');
    setRoleVal(roles.length > 0 ? roles[0].id : '');
    setShowAddModal(true);
  };

  const openEditModal = (u) => {
    setSelectedUser(u);
    setUsernameVal(u.username || '');
    setEmailVal(u.email || '');
    setRoleVal(u.role_id || u.Role?.id || (roles.length > 0 ? roles[0].id : ''));
    setShowEditModal(true);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!usernameVal || !emailVal || !passwordVal || !roleVal) {
      triggerToast('Validation Error', 'Please fill in all inputs.', 'error');
      return;
    }
    setSubmitLoading(true);
    try {
      await API.post('/users', {
        username: usernameVal,
        email: emailVal,
        password: passwordVal,
        roleId: roleVal
      });
      triggerToast('User Registered', `Account for ${usernameVal} created.`, 'success');
      setShowAddModal(false);
      fetchUsers();
    } catch (error) {
      triggerToast('Creation Failed', error.response?.data?.message || 'Failed to create user.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      await API.put(`/users/${selectedUser.id}`, { roleId: roleVal });
      triggerToast('User Updated', 'User role updated successfully.', 'success');
      setShowEditModal(false);
      fetchUsers();
    } catch (error) {
      triggerToast('Edit Failed', error.response?.data?.message || 'Failed to edit role.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (name === user.username) {
      triggerToast('Action Blocked', 'You cannot terminate your own active session.', 'error');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await API.delete(`/users/${id}`);
      triggerToast('Account Revoked', `${name} deleted successfully.`, 'success');
      fetchUsers();
    } catch (error) {
      triggerToast('Delete Failed', error.response?.data?.message || 'Failed to delete user.', 'error');
    }
  };

  // --- BERTH HANDLERS ---
  const handleBerthSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      if (selectedBerth) {
        await API.put(`/master-data/berths/${selectedBerth.id}`, {
          number: berthNum,
          draftLimit: berthDraft,
          capacity: berthCapacity,
          status: berthStatus
        });
        triggerToast('Berth Updated', `Berth ${berthNum} updated successfully.`, 'success');
      } else {
        await API.post('/master-data/berths', {
          number: berthNum,
          draftLimit: berthDraft,
          capacity: berthCapacity,
          status: berthStatus
        });
        triggerToast('Berth Created', `Berth ${berthNum} created successfully.`, 'success');
      }
      setShowBerthModal(false);
      fetchBerths();
    } catch (error) {
      triggerToast('Berth Action Failed', error.response?.data?.message || 'Operation failed.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const openBerthModal = (b = null) => {
    setSelectedBerth(b);
    if (b) {
      setBerthNum(b.number);
      setBerthDraft(b.draftLimit);
      setBerthCapacity(b.capacity || '');
      setBerthStatus(b.status);
    } else {
      setBerthNum('');
      setBerthDraft('');
      setBerthCapacity('');
      setBerthStatus('Available');
    }
    setShowBerthModal(true);
  };

  const handleDeleteBerth = async (id, num) => {
    if (!window.confirm(`Are you sure you want to delete Berth ${num}?`)) return;
    try {
      await API.delete(`/master-data/berths/${id}`);
      triggerToast('Berth Deleted', `Berth ${num} deleted.`, 'success');
      fetchBerths();
    } catch (err) {
      triggerToast('Delete Failed', 'Could not delete berth.', 'error');
    }
  };

  // --- CONTAINER TYPE HANDLERS ---
  const handleContainerTypeSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const payload = { name: ctName, length: ctLength, height: ctHeight, width: ctWidth, maxWeight: ctMaxWeight };
      if (selectedContainerType) {
        await API.put(`/master-data/container-types/${selectedContainerType.id}`, payload);
        triggerToast('Container Type Updated', `Standard container type ${ctName} updated.`, 'success');
      } else {
        await API.post('/master-data/container-types', payload);
        triggerToast('Container Type Created', `Standard container type ${ctName} added.`, 'success');
      }
      setShowContainerTypeModal(false);
      fetchContainerTypes();
    } catch (error) {
      triggerToast('Container Type Failed', error.response?.data?.message || 'Operation failed.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const openContainerTypeModal = (ct = null) => {
    setSelectedContainerType(ct);
    if (ct) {
      setCtName(ct.name);
      setCtLength(ct.length);
      setCtHeight(ct.height);
      setCtWidth(ct.width);
      setCtMaxWeight(ct.maxWeight);
    } else {
      setCtName('');
      setCtLength('');
      setCtHeight('');
      setCtWidth('');
      setCtMaxWeight('');
    }
    setShowContainerTypeModal(true);
  };

  const handleDeleteContainerType = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await API.delete(`/master-data/container-types/${id}`);
      triggerToast('Container Type Deleted', `Deleted ${name}.`, 'success');
      fetchContainerTypes();
    } catch (err) {
      triggerToast('Delete Failed', 'Could not delete container type.', 'error');
    }
  };

  // --- YARD PLOT (WAREHOUSE) HANDLERS ---
  const handleWarehouseSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const payload = { name: whName, type: whType, capacity: whCapacity };
      if (selectedWarehouse) {
        await API.put(`/master-data/warehouses/${selectedWarehouse.id}`, payload);
        triggerToast('Yard Plot Updated', `Plot ${whName} updated.`, 'success');
      } else {
        await API.post('/master-data/warehouses', payload);
        triggerToast('Yard Plot Created', `Plot ${whName} created.`, 'success');
      }
      setShowWarehouseModal(false);
      fetchWarehouses();
    } catch (error) {
      triggerToast('Operation Failed', error.response?.data?.message || 'Failed.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const openWarehouseModal = (wh = null) => {
    setSelectedWarehouse(wh);
    if (wh) {
      setWhName(wh.name);
      setWhType(wh.type);
      setWhCapacity(wh.capacity);
    } else {
      setWhName('');
      setWhType('Transit Shed');
      setWhCapacity('');
    }
    setShowWarehouseModal(true);
  };

  const handleDeleteWarehouse = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete storage plot ${name}?`)) return;
    try {
      await API.delete(`/master-data/warehouses/${id}`);
      triggerToast('Plot Deleted', `${name} deleted.`, 'success');
      fetchWarehouses();
    } catch (err) {
      triggerToast('Delete Failed', 'Failed to delete yard plot.', 'error');
    }
  };

  // --- YARD LOCATION HANDLERS ---
  const handleYardLocSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const payload = {
        warehouseId: ylWarehouseId,
        zoneCode: ylZoneCode,
        capacity: ylCapacity,
        row: ylRow,
        column: ylColumn,
        tier: ylTier,
        slot: ylSlot
      };
      if (selectedYardLoc) {
        await API.put(`/master-data/yard-locations/${selectedYardLoc.id}`, payload);
        triggerToast('Coordinate Updated', `Coordinate slot ${ylZoneCode} updated.`, 'success');
      } else {
        await API.post('/master-data/yard-locations', payload);
        triggerToast('Coordinate Created', `Coordinate slot ${ylZoneCode} created.`, 'success');
      }
      setShowYardLocModal(false);
      fetchWarehouses();
    } catch (error) {
      triggerToast('Operation Failed', error.response?.data?.message || 'Failed.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const openYardLocModal = (yl = null, whId = null) => {
    setSelectedYardLoc(yl);
    if (yl) {
      setYlWarehouseId(yl.warehouseId);
      setYlZoneCode(yl.zoneCode);
      setYlCapacity(yl.capacity);
      setYlRow(yl.row || '');
      setYlColumn(yl.column || '');
      setYlTier(yl.tier || '');
      setYlSlot(yl.slot || '');
    } else {
      setYlWarehouseId(whId || (warehouses.length > 0 ? warehouses[0].id : ''));
      setYlZoneCode('');
      setYlCapacity('');
      setYlRow('');
      setYlColumn('');
      setYlTier('');
      setYlSlot('');
    }
    setShowYardLocModal(true);
  };

  const handleDeleteYardLoc = async (id, zone) => {
    if (!window.confirm(`Are you sure you want to delete coordinate ${zone}?`)) return;
    try {
      await API.delete(`/master-data/yard-locations/${id}`);
      triggerToast('Coordinate Deleted', `Slot ${zone} deleted.`, 'success');
      fetchWarehouses();
    } catch (err) {
      triggerToast('Delete Failed', 'Failed to delete coordinate slot.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Tab Selector Nav */}
      <div className="flex bg-slate-100 dark:bg-slate-955 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-850 gap-2 w-full max-w-4xl select-none">
        <button
          onClick={() => setActiveTab('operators')}
          className={`flex items-center justify-center flex-1 py-3 px-5 text-sm sm:text-base font-extrabold rounded-xl transition ${activeTab === 'operators' ? 'bg-white dark:bg-slate-900 shadow-md text-sky-600' : 'text-slate-500 hover:bg-white/40 dark:hover:bg-slate-900/40'}`}
        >
          User Operators
        </button>
        <button
          onClick={() => setActiveTab('yard-plots')}
          className={`flex items-center justify-center flex-1 py-3 px-5 text-sm sm:text-base font-extrabold rounded-xl transition ${activeTab === 'yard-plots' ? 'bg-white dark:bg-slate-900 shadow-md text-sky-600' : 'text-slate-500 hover:bg-white/40 dark:hover:bg-slate-900/40'}`}
        >
          Yard Plots / Sheds
        </button>
        <button
          onClick={() => setActiveTab('registrations')}
          className={`flex items-center justify-center flex-1 py-3 px-5 text-sm sm:text-base font-extrabold rounded-xl transition ${activeTab === 'registrations' ? 'bg-white dark:bg-slate-900 shadow-md text-sky-600' : 'text-slate-500 hover:bg-white/40 dark:hover:bg-slate-900/40'}`}
        >
          Agent Registrations
        </button>
      </div>

      {loading ? (
        <div className="p-20 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-500"></div>
        </div>
      ) : (
        <>
          {/* TAB 1: OPERATORS DIRECTORY */}
          {activeTab === 'operators' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 glass-panel">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">Operator Directory Registry</h2>
                  <p className="text-sm text-slate-400 font-light mt-0.5">Manage administrative credentials, adjust RBAC permissions, and review security access policies</p>
                </div>
                <button 
                  onClick={openAddModal}
                  className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-sm font-bold transition shadow-lg hover:shadow-sky-500/10 border border-sky-500/10"
                >
                  <Plus className="w-4 h-4" />
                  Add New Operator
                </button>
              </div>

              <div className="w-full space-y-2">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/20 text-slate-500 font-bold">
                        <th className="p-4">Operator ID</th>
                        <th className="p-4">Username</th>
                        <th className="p-4">Email Address</th>
                        <th className="p-4">Operational Role</th>
                        <th className="p-4">Date Registered</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-700 dark:text-slate-300 font-light">
                      {(Array.isArray(users) ? users : []).map(u => (
                        <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                          <td className="p-4 font-mono text-slate-400">USR-{u.id}</td>
                          <td className="p-4 font-bold text-slate-850 dark:text-slate-100">{u.username}</td>
                          <td className="p-4 font-medium">{u.email}</td>
                          <td className="p-4">
                            <span className="inline-block px-2.5 py-0.5 text-sm font-bold bg-sky-500/10 text-sky-400 border border-sky-500/15 rounded-md">
                              {u.Role?.name || u.role}
                            </span>
                          </td>
                          <td className="p-4 text-slate-500 dark:text-slate-400">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}</td>
                          <td className="p-4 text-right">
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => openEditModal(u)}
                                className="p-1.5 hover:bg-sky-500/10 text-sky-500 rounded-lg transition"
                                title="Edit User Role"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u.id, u.username)}
                                className="p-1.5 hover:bg-rose-500/10 text-rose-500 rounded-lg transition"
                                title="Revoke Credentials"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}



          {/* TAB 3: YARD PLOTS CONFIGURATION */}
          {activeTab === 'yard-plots' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 glass-panel">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">Yard Plots & Covered Sheds</h2>
                  <p className="text-sm text-slate-400 font-light mt-0.5">Register storage zones,Godowns, Transit sheds and define coordinate slot configurations</p>
                </div>
                <button 
                  onClick={() => openWarehouseModal()}
                  className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-sm font-bold transition shadow-lg border border-sky-500/10"
                >
                  <Plus className="w-4 h-4" />
                  Add Storage Yard/Plot
                </button>
              </div>

              {(Array.isArray(warehouses) ? warehouses : []).map(wh => (
                <div key={wh.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-150 dark:border-slate-800/80 shadow-md space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800/60">
                    <div>
                      <h3 className="text-lg font-bold text-slate-850 dark:text-white flex items-center gap-2">
                        <Database className="w-5 h-5 text-sky-500" />
                        {wh.name}
                        <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-md">
                          {wh.type}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">Capacity: {wh.capacity ? wh.capacity.toLocaleString() : 0} Tons | Available: {wh.availableSpace ? wh.availableSpace.toLocaleString() : 0} Tons</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openYardLocModal(null, wh.id)}
                        className="px-3 py-1.5 border border-sky-500/20 text-sky-500 rounded-xl text-xs font-bold hover:bg-sky-500/5 transition flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add Slot
                      </button>
                      <button
                        onClick={() => openWarehouseModal(wh)}
                        className="p-2 hover:bg-sky-500/10 text-sky-500 rounded-lg transition"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteWarehouse(wh.id, wh.name)}
                        className="p-2 hover:bg-rose-500/10 text-rose-500 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Locations Coordinates Slots inside this warehouse */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.isArray(wh.YardLocations) && wh.YardLocations.map(yl => (
                      <div key={yl.id} className="p-3.5 bg-slate-50 dark:bg-slate-955/40 border border-slate-100 dark:border-slate-850 rounded-xl flex justify-between items-center select-none text-xs">
                        <div>
                          <span className="block font-bold text-slate-800 dark:text-slate-200 text-sm font-mono text-sky-500">{yl.zoneCode}</span>
                          <span className="text-slate-400">Cap: {yl.capacity} Tons | Occupied: {yl.occupiedSpace} Tons</span>
                          {(yl.row || yl.column) && (
                            <span className="block text-[10px] text-slate-400 font-light mt-1">
                              Row: {yl.row || '-'} | Col: {yl.column || '-'} | Tier: {yl.tier || '-'} | Slot: {yl.slot || '-'}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => openYardLocModal(yl)}
                            className="p-1 hover:bg-sky-500/10 text-sky-500 rounded transition"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteYardLoc(yl.id, yl.zoneCode)}
                            className="p-1 hover:bg-rose-500/10 text-rose-500 rounded transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {(!wh.YardLocations || wh.YardLocations.length === 0) && (
                      <div className="col-span-full p-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center text-xs text-slate-450 font-light">
                        No coordinate slots registered. Click "Add Slot" to define plot grids.
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}



          {/* TAB 5: AGENT REGISTRATIONS */}
          {activeTab === 'registrations' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 glass-panel">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">Shipping Agent Registration Requests</h2>
                  <p className="text-sm text-slate-400 font-light mt-0.5">Audit self-registered shipping agent requests, review attached documentation, and manage approvals</p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xl overflow-hidden glass-panel">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-955/20 text-slate-500 font-bold">
                        <th className="p-4">Reg ID</th>
                        <th className="p-4">Company Name</th>
                        <th className="p-4">Representative</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Date Filed</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-700 dark:text-slate-300 font-light">
                      {(Array.isArray(registrations) ? registrations : []).map(reg => (
                        <tr key={reg.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                          <td className="p-4 font-mono font-bold text-sky-600 dark:text-sky-400">{reg.registrationId}</td>
                          <td className="p-4 font-bold text-slate-855 dark:text-slate-100">{reg.companyName}</td>
                          <td className="p-4 font-medium">{reg.representativeName} ({reg.representativeDesignation})</td>
                          <td className="p-4 font-mono text-xs">{reg.email}</td>
                          <td className="p-4">{new Date(reg.createdAt).toLocaleDateString()}</td>
                          <td className="p-4">
                            <span className={`inline-block px-2.5 py-0.5 text-xs font-bold rounded-md uppercase tracking-wider ${
                              reg.status === 'Approved'
                                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/15'
                                : reg.status === 'Rejected'
                                  ? 'bg-rose-500/10 text-rose-500 border border-rose-500/15'
                                  : 'bg-amber-500/10 text-amber-500 border border-amber-500/15'
                            }`}>
                              {reg.status}
                            </span>
                            {reg.status === 'Rejected' && reg.rejectionRemarks && (
                              <p className="text-[10px] text-rose-500/80 italic mt-1 max-w-[200px] truncate" title={reg.rejectionRemarks}>
                                Reason: {reg.rejectionRemarks}
                              </p>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex gap-2 justify-end">
                              <button
                                type="button"
                                onClick={() => setSelectedRegistration(reg)}
                                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-lg transition cursor-pointer"
                              >
                                View Details
                              </button>
                              
                              {reg.status === 'Pending Verification' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleApproveRegistration(reg)}
                                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition cursor-pointer"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenRejectionModal(reg)}
                                    className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition cursor-pointer"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {registrations.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-8 text-center italic text-slate-400">
                            No shipping agent registration requests filed in database.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL 1: ADD NEW OPERATOR */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex justify-center items-center p-4">
          <div className="max-w-sm w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl rounded-2xl overflow-hidden glass-panel p-6">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-800 dark:text-white">Register Port Operator</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">×</button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-sm select-none">
              <div>
                <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Username</label>
                <input
                  type="text" required placeholder="e.g. ops_officer" value={usernameVal}
                  onChange={(e) => setUsernameVal(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl text-slate-850 dark:text-slate-200"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
                <input
                  type="email" required placeholder="e.g. ops@nmpa.gov.in" value={emailVal}
                  onChange={(e) => setEmailVal(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl text-slate-850 dark:text-slate-200"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
                <input
                  type="password" required placeholder="••••••••" value={passwordVal}
                  onChange={(e) => setPasswordVal(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl text-slate-850 dark:text-slate-200"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Operator Role</label>
                <select
                  value={roleVal} onChange={(e) => setRoleVal(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl text-slate-800 dark:text-slate-350 font-bold"
                >
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button" onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-500 rounded-xl font-bold transition hover:bg-slate-50 dark:hover:bg-slate-950"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={submitLoading}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold transition flex items-center gap-1 shadow-lg shadow-sky-500/10"
                >
                  <CheckCircle className="w-4 h-4" />
                  {submitLoading ? 'Registering...' : 'Register Operator'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT OPERATOR ROLE */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex justify-center items-center p-4">
          <div className="max-w-sm w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-base text-slate-800 dark:text-white">Modify Authorization Clearances</h3>
                <span className="text-sm text-slate-400 font-light">Operator: <strong className="text-sky-500">{selectedUser?.username}</strong></span>
              </div>
              <button onClick={() => { setShowEditModal(false); setSelectedUser(null); }} className="text-slate-400 hover:text-slate-600 text-lg">×</button>
            </div>
            <form onSubmit={handleEditUser} className="space-y-4 text-sm select-none">
              <div>
                <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Adjust Role Security Tier</label>
                <select
                  value={roleVal} onChange={(e) => setRoleVal(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl text-slate-800 dark:text-slate-350 font-bold"
                >
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div className="p-3.5 bg-sky-500/10 border border-sky-500/20 text-sky-500 rounded-xl flex gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="text-xs leading-snug">
                  <strong>Access Policy Notice:</strong> Modifying roles immediately logs changes. Session updates apply immediately.
                </p>
              </div>
              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button" onClick={() => { setShowEditModal(false); setSelectedUser(null); }}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-500 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={submitLoading}
                  className="px-4 py-2 bg-sky-600 text-white rounded-xl font-bold flex items-center gap-1 shadow-lg shadow-sky-500/10"
                >
                  <Key className="w-4 h-4" />
                  Apply Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: BERTH CREATE/UPDATE */}
      {showBerthModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex justify-center items-center p-4">
          <div className="max-w-sm w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-800 dark:text-white">
                {selectedBerth ? 'Update Berth Master' : 'Create New Berth'}
              </h3>
              <button onClick={() => setShowBerthModal(false)} className="text-slate-400 text-lg">×</button>
            </div>
            <form onSubmit={handleBerthSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-sm font-semibold text-slate-400 uppercase mb-1.5">Berth Number/Name</label>
                <input
                  type="text" required placeholder="e.g. Berth No. 15" value={berthNum}
                  onChange={(e) => setBerthNum(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl text-slate-850 dark:text-slate-200"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-400 uppercase mb-1.5">Safe Low-Tide Draft Limit (m)</label>
                <input
                  type="number" step="0.1" required placeholder="e.g. 12.5" value={berthDraft}
                  onChange={(e) => setBerthDraft(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl text-slate-850 dark:text-slate-200"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-400 uppercase mb-1.5">Tonnage Capacity Limit (Tons)</label>
                <input
                  type="number" placeholder="e.g. 50000" value={berthCapacity}
                  onChange={(e) => setBerthCapacity(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl text-slate-850 dark:text-slate-200"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-400 uppercase mb-1.5">Status</label>
                <select
                  value={berthStatus} onChange={(e) => setBerthStatus(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl text-slate-800 dark:text-slate-350"
                >
                  <option value="Available">Available</option>
                  <option value="Occupied">Occupied</option>
                  <option value="Under Maintenance">Under Maintenance</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button" onClick={() => setShowBerthModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-500 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={submitLoading}
                  className="px-4 py-2 bg-sky-600 text-white rounded-xl font-bold flex items-center gap-1 shadow-lg shadow-sky-500/10"
                >
                  <Anchor className="w-4 h-4" />
                  {selectedBerth ? 'Save Updates' : 'Add Berth'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: CONTAINER SPEC CREATE/UPDATE */}
      {showContainerTypeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex justify-center items-center p-4">
          <div className="max-w-sm w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-800 dark:text-white">
                {selectedContainerType ? 'Update Container Spec' : 'Add Container Type Spec'}
              </h3>
              <button onClick={() => setShowContainerTypeModal(false)} className="text-slate-400 text-lg">×</button>
            </div>
            <form onSubmit={handleContainerTypeSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-sm font-semibold text-slate-400 uppercase mb-1.5">Spec / Name</label>
                <input
                  type="text" required placeholder="e.g. 40ft High Cube" value={ctName}
                  onChange={(e) => setCtName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl text-slate-850 dark:text-slate-200"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Length (ft)</label>
                  <input
                    type="number" required placeholder="40" value={ctLength}
                    onChange={(e) => setCtLength(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-lg text-center"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Height (ft)</label>
                  <input
                    type="number" step="0.1" required placeholder="9.5" value={ctHeight}
                    onChange={(e) => setCtHeight(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-lg text-center"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Width (ft)</label>
                  <input
                    type="number" step="0.1" required placeholder="8.0" value={ctWidth}
                    onChange={(e) => setCtWidth(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-lg text-center"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-400 uppercase mb-1.5">Max Weight Limit (MT)</label>
                <input
                  type="number" required placeholder="e.g. 30" value={ctMaxWeight}
                  onChange={(e) => setCtMaxWeight(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl text-slate-850 dark:text-slate-200"
                />
              </div>
              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button" onClick={() => setShowContainerTypeModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-500 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={submitLoading}
                  className="px-4 py-2 bg-sky-600 text-white rounded-xl font-bold flex items-center gap-1 shadow-lg shadow-sky-500/10"
                >
                  <Box className="w-4 h-4" />
                  Save Spec
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: YARD PLOT (WAREHOUSE) CREATE/UPDATE */}
      {showWarehouseModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex justify-center items-center p-4">
          <div className="max-w-sm w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-800 dark:text-white">
                {selectedWarehouse ? 'Update Yard Plot' : 'Add Storage Yard/Plot'}
              </h3>
              <button onClick={() => setShowWarehouseModal(false)} className="text-slate-400 text-lg">×</button>
            </div>
            <form onSubmit={handleWarehouseSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-sm font-semibold text-slate-400 uppercase mb-1.5">Plot Name / Shed No</label>
                <input
                  type="text" required placeholder="e.g. Godown No. 35" value={whName}
                  onChange={(e) => setWhName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl text-slate-850 dark:text-slate-200"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-400 uppercase mb-1.5">Storage Type</label>
                <select
                  value={whType} onChange={(e) => setWhType(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl text-slate-805 dark:text-slate-350"
                >
                  <option value="Transit Shed">Transit Shed</option>
                  <option value="Covered Warehouse">Covered Warehouse</option>
                  <option value="Container Yard">Container Yard</option>
                  <option value="Liquid Storage">Liquid Storage</option>
                  <option value="Open Yard">Open Yard</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-400 uppercase mb-1.5">Total Capacity (Tons)</label>
                <input
                  type="number" required placeholder="e.g. 10000" value={whCapacity}
                  onChange={(e) => setWhCapacity(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl text-slate-850 dark:text-slate-200"
                />
              </div>
              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button" onClick={() => setShowWarehouseModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-500 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={submitLoading}
                  className="px-4 py-2 bg-sky-600 text-white rounded-xl font-bold flex items-center gap-1 shadow-lg shadow-sky-500/10"
                >
                  <Database className="w-4 h-4" />
                  Save Plot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: YARD LOCATION GRID COORDINATE */}
      {showYardLocModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex justify-center items-center p-4">
          <div className="max-w-sm w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-800 dark:text-white">
                {selectedYardLoc ? 'Update Grid Coordinate' : 'Add Yard Slot Coordinate'}
              </h3>
              <button onClick={() => setShowYardLocModal(false)} className="text-slate-400 text-lg">×</button>
            </div>
            <form onSubmit={handleYardLocSubmit} className="space-y-3.5 text-sm">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Target Storage Plot</label>
                <select
                  value={ylWarehouseId} onChange={(e) => setYlWarehouseId(e.target.value)}
                  disabled={!!selectedYardLoc}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-lg"
                >
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Zone / Coordinate Code</label>
                <input
                  type="text" required placeholder="e.g. Zone-A Row-2" value={ylZoneCode}
                  onChange={(e) => setYlZoneCode(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Capacity (Tons)</label>
                <input
                  type="number" required placeholder="e.g. 2000" value={ylCapacity}
                  onChange={(e) => setYlCapacity(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase mb-0.5">Row</label>
                  <input
                    type="text" value={ylRow} onChange={(e) => setYlRow(e.target.value)}
                    placeholder="A" className="w-full p-1.5 bg-slate-50 dark:bg-slate-950 border text-center rounded"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase mb-0.5">Col</label>
                  <input
                    type="text" value={ylColumn} onChange={(e) => setYlColumn(e.target.value)}
                    placeholder="3" className="w-full p-1.5 bg-slate-50 dark:bg-slate-950 border text-center rounded"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase mb-0.5">Tier</label>
                  <input
                    type="text" value={ylTier} onChange={(e) => setYlTier(e.target.value)}
                    placeholder="1" className="w-full p-1.5 bg-slate-50 dark:bg-slate-950 border text-center rounded"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase mb-0.5">Slot</label>
                  <input
                    type="text" value={ylSlot} onChange={(e) => setYlSlot(e.target.value)}
                    placeholder="12" className="w-full p-1.5 bg-slate-50 dark:bg-slate-950 border text-center rounded"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button" onClick={() => setShowYardLocModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-500 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={submitLoading}
                  className="px-4 py-2 bg-sky-600 text-white rounded-xl font-bold flex items-center gap-1 shadow-lg shadow-sky-500/10"
                >
                  <Grid className="w-4 h-4" />
                  Save Coordinate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REJECTION REMARKS MODAL */}
      {rejectionModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[250] flex justify-center items-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl rounded-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150 select-none">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-800 dark:text-white">Reject Registration Request</h3>
              <button onClick={() => setRejectionModalOpen(false)} className="text-slate-400 hover:text-slate-650 text-lg">×</button>
            </div>
            
            <form onSubmit={handleRejectRegistrationSubmit} className="space-y-4">
              <p className="text-xs text-slate-500 font-light leading-normal">
                Please specify the exact reason behind rejecting the application filed by <strong>{selectedRegForRejection?.companyName}</strong>. This remark will be permanently logged.
              </p>
              
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">Rejection Remarks *</label>
                <textarea
                  required rows={3}
                  value={rejectionRemarks} onChange={(e) => setRejectionRemarks(e.target.value)}
                  placeholder="e.g. Uploaded PAN Card scan is blurred/unreadable."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 rounded-xl text-xs focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button" onClick={() => setRejectionModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-850 text-slate-505 rounded-xl font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={submitLoading}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs flex items-center gap-1 shadow-lg shadow-rose-500/10 cursor-pointer"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REGISTRATION DETAIL MODAL */}
      {selectedRegistration && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex justify-center items-center p-4">
          <div className="max-w-3xl w-full max-h-[85vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl p-6 space-y-6 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
              <div>
                <h3 className="font-extrabold text-base text-slate-855 dark:text-white">
                  Registration Application Review: {selectedRegistration.companyName}
                </h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">Reg ID: {selectedRegistration.registrationId} | Status: <span className="font-bold text-sky-500">{selectedRegistration.status}</span></p>
              </div>
              <button onClick={() => setSelectedRegistration(null)} className="text-slate-400 hover:text-slate-655 text-2xl">×</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              
              {/* Section 1: Company Profile */}
              <div className="space-y-2 p-4 bg-slate-50/50 dark:bg-slate-955 rounded-2xl border border-slate-100 dark:border-slate-855">
                <h4 className="font-extrabold text-xs text-sky-500 border-b border-slate-100 dark:border-slate-850 pb-1 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" /> Company Profile
                </h4>
                <div className="space-y-1.5 leading-normal">
                  <p><span className="text-slate-400 font-semibold">Registration No:</span> {selectedRegistration.companyRegNo || 'N/A'}</p>
                  <p><span className="text-slate-400 font-semibold">Type:</span> {selectedRegistration.companyType}</p>
                  <p><span className="text-slate-400 font-semibold">PAN Number:</span> <span className="font-mono">{selectedRegistration.panNumber}</span></p>
                  <p><span className="text-slate-400 font-semibold">GSTIN:</span> <span className="font-mono">{selectedRegistration.gstin}</span></p>
                  <p><span className="text-slate-400 font-semibold">License No:</span> {selectedRegistration.licenseNumber || 'N/A'}</p>
                  <p><span className="text-slate-400 font-semibold">License Valid Until:</span> {selectedRegistration.licenseExpiry || 'N/A'}</p>
                </div>
              </div>

              {/* Section 2: Authorized Representative */}
              <div className="space-y-2 p-4 bg-slate-50/50 dark:bg-slate-955 rounded-2xl border border-slate-100 dark:border-slate-855">
                <h4 className="font-extrabold text-xs text-sky-500 border-b border-slate-100 dark:border-slate-850 pb-1 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4" /> Authorized Representative
                </h4>
                <div className="space-y-1.5 leading-normal">
                  <p><span className="text-slate-400 font-semibold">Full Name:</span> {selectedRegistration.representativeName}</p>
                  <p><span className="text-slate-400 font-semibold">Designation:</span> {selectedRegistration.representativeDesignation}</p>
                  <p><span className="text-slate-400 font-semibold">Mobile:</span> {selectedRegistration.representativeMobile}</p>
                  <p><span className="text-slate-400 font-semibold">Email:</span> {selectedRegistration.representativeEmail}</p>
                </div>
              </div>

              {/* Section 3: Registered Office Address */}
              <div className="space-y-2 p-4 bg-slate-50/50 dark:bg-slate-955 rounded-2xl border border-slate-100 dark:border-slate-855">
                <h4 className="font-extrabold text-xs text-sky-500 border-b border-slate-100 dark:border-slate-850 pb-1 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" /> Registered Office Address
                </h4>
                <div className="space-y-1.5 leading-normal">
                  <p>{selectedRegistration.addressLine1}</p>
                  {selectedRegistration.addressLine2 && <p>{selectedRegistration.addressLine2}</p>}
                  <p>{selectedRegistration.city}, {selectedRegistration.state} - {selectedRegistration.pinCode}</p>
                </div>
              </div>

              {/* Section 4: Account Credentials */}
              <div className="space-y-2 p-4 bg-slate-50/50 dark:bg-slate-955 rounded-2xl border border-slate-100 dark:border-slate-855">
                <h4 className="font-extrabold text-xs text-sky-500 border-b border-slate-100 dark:border-slate-850 pb-1 flex items-center gap-1.5">
                  <Key className="w-4 h-4" /> Portal User Credentials
                </h4>
                <div className="space-y-1.5 leading-normal">
                  <p><span className="text-slate-400 font-semibold">Username:</span> <strong className="font-mono text-slate-700 dark:text-slate-200">{selectedRegistration.username}</strong></p>
                  <p><span className="text-slate-400 font-semibold">Email:</span> <strong className="font-mono text-slate-700 dark:text-slate-200">{selectedRegistration.email}</strong></p>
                </div>
              </div>

              {/* Section 5: Document Upload */}
              <div className="md:col-span-2 space-y-2 p-4 bg-slate-50/50 dark:bg-slate-955 rounded-2xl border border-slate-100 dark:border-slate-855">
                <h4 className="font-extrabold text-xs text-sky-500 border-b border-slate-100 dark:border-slate-850 pb-1 flex items-center gap-1.5">
                  <UploadCloud className="w-4 h-4" /> Uploaded Documentation Review
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                  {[
                    { label: 'Company Registration Certificate', field: 'docCompanyReg' },
                    { label: 'PAN Card Copy', field: 'docPan' },
                    { label: 'GST Registration Certificate', field: 'docGst' },
                    { label: 'Customs License Scan', field: 'docLicense' },
                    { label: 'Representative Authorization Letter', field: 'docAuthLetter' }
                  ].map(docItem => {
                    const filename = selectedRegistration[docItem.field];
                    return (
                      <div key={docItem.field} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex justify-between items-center gap-2">
                        <span className="font-semibold text-slate-550 truncate max-w-[200px]" title={docItem.label}>{docItem.label}</span>
                        {filename ? (
                          <a
                            href={`http://localhost:5000/uploads/${String(filename || '').replace(/^\/?(uploads\/)+/i, '')}`}
                            target="_blank" rel="noopener noreferrer"
                            className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-600 font-bold rounded-lg text-[10px] transition shrink-0 uppercase cursor-pointer"
                          >
                            View File
                          </a>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 italic shrink-0">Not Uploaded</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            <div className="flex gap-2 justify-end pt-4 border-t border-slate-100 dark:border-slate-850 sticky bottom-0 bg-white dark:bg-slate-900 z-10">
              <button
                type="button" onClick={() => setSelectedRegistration(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-855 text-slate-555 rounded-xl font-bold text-xs cursor-pointer"
              >
                Close Review
              </button>
              {selectedRegistration.status === 'Pending Verification' && (
                <>
                  <button
                    onClick={() => handleApproveRegistration(selectedRegistration)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-500/10 cursor-pointer"
                  >
                    Approve Request
                  </button>
                  <button
                    onClick={() => handleOpenRejectionModal(selectedRegistration)}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-rose-500/10 cursor-pointer"
                  >
                    Reject Request
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

class UserManagementErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('UserManagement Error Boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900/50 shadow-lg text-center space-y-4 max-w-2xl mx-auto my-8">
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">!</div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">User Management Portal Notice</h2>
          <p className="text-xs text-rose-500 font-mono bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-200 dark:border-rose-900/40">
            {this.state.error?.toString()}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="px-5 py-2.5 bg-[#009fe3] hover:bg-[#0089c4] text-white text-xs font-bold rounded-xl transition shadow cursor-pointer"
          >
            Reload User Directory
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const UserManagementPage = () => (
  <UserManagementErrorBoundary>
    <UserManagement />
  </UserManagementErrorBoundary>
);

export default UserManagementPage;
