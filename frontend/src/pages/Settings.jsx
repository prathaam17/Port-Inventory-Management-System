import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import API from '../services/api';
import { 
  Settings2, 
  Bell, 
  Terminal, 
  Key, 
  HardDrive, 
  Save, 
  CheckCircle,
  Copy,
  ShieldAlert,
  IndianRupee,
  LockOpen,
  Calendar,
  CalendarPlus,
  Sliders,
  Trash2
} from 'lucide-react';

const Settings = () => {
  const { user } = useContext(AuthContext);
  const { triggerToast } = useContext(NotificationContext);

  const [notifSound, setNotifSound] = useState(true);
  const [apiKey, setApiKey] = useState('MNGPRT_SECURE_TOKEN_503A120X902L');

  // Super Admin Override State
  const [cargoId, setCargoId] = useState('');
  const [reason, setReason] = useState('');
  const [overrideLoading, setOverrideLoading] = useState(false);

  // SOR Tariff Rules & Holiday Calendar State
  const [sorRules, setSorRules] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [newHolidayCategory, setNewHolidayCategory] = useState('Port Holiday');
  const [newHolidayDesc, setNewHolidayDesc] = useState('');
  const [holidayLoading, setHolidayLoading] = useState(false);

  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  React.useEffect(() => {
    fetchSorRules();
    fetchHolidays();
  }, []);

  const fetchSorRules = async () => {
    try {
      const res = await API.get('/master-data/sor-rules');
      setSorRules(res.data);
    } catch (err) {
      console.error('Failed to fetch SOR rules:', err);
    }
  };

  const fetchHolidays = async () => {
    try {
      const res = await API.get('/master-data/holidays');
      setHolidays(res.data);
    } catch (err) {
      console.error('Failed to fetch holidays:', err);
    }
  };

  const handleUpdateSorRule = async (ruleId, updatedData) => {
    try {
      await API.put(`/master-data/sor-rules/${ruleId}`, updatedData);
      triggerToast('SOR Tariff Updated', 'Scale of Rates parameters updated successfully.', 'success');
      fetchSorRules();
    } catch (err) {
      triggerToast('Update Failed', err.response?.data?.message || 'Failed to update SOR rule.', 'error');
    }
  };

  const handleAddHoliday = async (e) => {
    e.preventDefault();
    if (!newHolidayDate) return;
    setHolidayLoading(true);
    try {
      await API.post('/master-data/holidays', {
        holidayDate: newHolidayDate,
        category: newHolidayCategory,
        description: newHolidayDesc
      });
      triggerToast('Holiday Registered', `Added non-working holiday for ${newHolidayDate}.`, 'success');
      setNewHolidayDate('');
      setNewHolidayDesc('');
      fetchHolidays();
    } catch (err) {
      triggerToast('Holiday Error', err.response?.data?.message || 'Failed to add holiday.', 'error');
    } finally {
      setHolidayLoading(false);
    }
  };

  const handleDeleteHoliday = async (id) => {
    try {
      await API.delete(`/master-data/holidays/${id}`);
      triggerToast('Holiday Deleted', 'Holiday entry removed from calendar.', 'success');
      fetchHolidays();
    } catch (err) {
      triggerToast('Delete Error', err.response?.data?.message || 'Failed to delete holiday.', 'error');
    }
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    triggerToast('Copied to Clipboard', 'System integration key copied successfully.', 'success');
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    triggerToast('Settings Applied', 'Local terminal parameters updated successfully.', 'success');
  };

  const handleAdminOverride = async (e) => {
    e.preventDefault();
    if (!cargoId.trim()) {
      triggerToast('Validation Error', 'Please enter a valid Cargo Code.', 'error');
      return;
    }
    setOverrideLoading(true);
    try {
      const res = await API.post('/cargo/override', { 
        cargoId: cargoId.trim(), 
        reason: reason.trim() || undefined 
      });
      triggerToast('Holds Overridden', res.data.message || `Customs and Finance holds bypassed successfully.`, 'success');
      setCargoId('');
      setReason('');
    } catch (error) {
      console.error('Bypass error:', error);
      triggerToast('Bypass Failed', error.response?.data?.message || 'Bypass operation failed.', 'error');
    } finally {
      setOverrideLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 glass-panel">
        <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">Terminal Configurations & System Parameters</h2>
        <p className="text-sm text-slate-400 font-light mt-0.5">Customize notification channels, manage electronic data interchange (EDI) API integrations, and access Super Admin controls</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Standard Settings Form */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-800/80 glass-panel h-fit">
          <h3 className="font-bold text-base text-slate-800 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 select-none">
            <Settings2 className="w-5 h-5 text-sky-500" />
            Terminal Settings
          </h3>

          <form onSubmit={handleSaveSettings} className="space-y-5 text-sm select-none">
            
            {/* Notification Toggles */}
            <div className="space-y-3.5">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Bell className="w-4 h-4 text-sky-500" />
                Operational Notifications
              </h4>
              
              <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">System Audio Alerts</span>
                  <span className="text-sm text-slate-450 mt-0.5 block font-light">Play audible chimes upon new customs clearance approvals</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={notifSound}
                  onChange={(e) => setNotifSound(e.target.checked)}
                  className="w-4 h-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500 cursor-pointer"
                />
              </div>
            </div>

            {/* API Key Management */}
            <div className="space-y-3.5">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Key className="w-4 h-4 text-sky-500" />
                EDI API Integration Credentials
              </h4>
              
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl space-y-2">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">Integration Secret Token</span>
                <span className="text-sm text-slate-450 block font-light">Authenticate XML custom manifest interfaces</span>
                
                <div className="flex gap-2 items-center mt-2">
                  <input 
                    type="text" 
                    readOnly
                    value={apiKey}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none text-sm text-slate-400 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleCopyKey}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
                    title="Copy to Clipboard"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Hardware Status */}
            <div className="space-y-3.5">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <HardDrive className="w-4 h-4 text-sky-500" />
                Hardware Status
              </h4>
              
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl space-y-2">
                <div className="flex justify-between text-slate-450 font-bold">
                  <span>Database Disk Occupancy (PostgreSQL)</span>
                  <span>4.2 MB of 10.0 GB</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: '0.1%' }}></div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-lg hover:shadow-sky-500/10 border border-sky-500/10"
            >
              <Save className="w-4 h-4" />
              Apply System Parameters
            </button>

          </form>
        </div>

        {/* Right Side: Super Admin Panels */}
        {user?.role === 'Super Admin' && (
          <div className="lg:col-span-6 space-y-6">
            
            {/* Admin Override Card */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-800/80 glass-panel">
              <h3 className="font-bold text-base text-rose-500 mb-4 pb-2 border-b border-slate-100 dark:border-slate-850 flex items-center gap-2 select-none">
                <ShieldAlert className="w-5 h-5" />
                Super Admin Regulatory Override Tool
              </h3>
              
              <p className="text-xs text-slate-400 font-light mb-4 leading-relaxed">
                Emergency override bypass to instantly release Finance and Customs holds for diplomatic cargo, humanitarian aid, or government emergency shipments. Every bypass writes an immutable entry in the system <strong className="text-rose-500/85">AuditLog</strong>.
              </p>

              <form onSubmit={handleAdminOverride} className="space-y-4 text-sm select-none">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Cargo Code (e.g. CRG-MNGPRT-...)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CRG-MNGPRT-004"
                    value={cargoId}
                    onChange={(e) => setCargoId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-rose-500 focus:outline-none text-slate-800 dark:text-slate-200 font-mono"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Override Justification / Reason</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Diplomatic Immunity Clearance / Emergency Relief"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-rose-500 focus:outline-none text-slate-800 dark:text-slate-200"
                  />
                </div>

                <button
                  type="submit"
                  disabled={overrideLoading}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-800 text-white font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-lg hover:shadow-rose-600/10 border border-rose-500/10"
                >
                  <LockOpen className="w-4 h-4" />
                  {overrideLoading ? 'Bypassing Holds...' : 'Bypass Holds & Release Cargo'}
                </button>
              </form>
            </div>

            {/* Master Tariff Configuration Card */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-800/80 glass-panel">
              <h3 className="font-bold text-base text-sky-500 mb-4 pb-2 border-b border-slate-100 dark:border-slate-850 flex items-center gap-2 select-none">
                <IndianRupee className="w-5 h-5" />
                Master Tariff Configurations
              </h3>
              
              <p className="text-xs text-slate-400 font-light mb-4 leading-relaxed">
                Central billing parameters for automated port invoice estimations, coastal discounts, and demurrage calculations.
              </p>

              <div className="overflow-x-auto select-none">
                <table className="w-full text-xs text-left border border-slate-100 dark:border-slate-850 rounded-xl overflow-hidden">
                  <thead className="bg-slate-50 dark:bg-slate-950 font-semibold text-slate-400">
                    <tr>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5">Billing Base</th>
                      <th className="p-2.5 text-right">Standard Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850/60 font-light text-slate-700 dark:text-slate-300">
                    <tr>
                      <td className="p-2.5 font-medium">Container Cargo</td>
                      <td className="p-2.5">Per TEU Container</td>
                      <td className="p-2.5 text-right font-mono font-semibold">₹4,200.00</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium">Liquid Petroleum (POL)</td>
                      <td className="p-2.5">Per Metric Ton (MT)</td>
                      <td className="p-2.5 text-right font-mono font-semibold">₹90.00</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium">Dry Bulk Cargo (Coal)</td>
                      <td className="p-2.5">Per Metric Ton (MT)</td>
                      <td className="p-2.5 text-right font-mono font-semibold">₹110.00</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium">Demurrage Rent Free Limit</td>
                      <td className="p-2.5">Days from Discharge</td>
                      <td className="p-2.5 text-right font-mono font-semibold">3 Days</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium">Demurrage Charge</td>
                      <td className="p-2.5">Per MT / Day (after 3 days)</td>
                      <td className="p-2.5 text-right font-mono font-semibold">₹250.00</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium">Coastal Vessel Discount</td>
                      <td className="p-2.5">Applicable on GRT dues</td>
                      <td className="p-2.5 text-right font-mono font-semibold text-emerald-500">40% Off</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Configurable mngprt SOR Tariff Rules Card */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-800/80 glass-panel space-y-4">
              <h3 className="font-bold text-base text-amber-500 pb-2 border-b border-slate-100 dark:border-slate-850 flex items-center gap-2 select-none">
                <Sliders className="w-5 h-5" />
                Configurable mngprt Scale of Rates (SOR) Rules
              </h3>

              <div className="space-y-4 text-xs">
                {sorRules.map(rule => (
                  <div key={rule.id} className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-slate-800 dark:text-slate-100 text-sm">{rule.tradeType} SOR Rules</span>
                      <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded font-mono">{rule.uomDefault}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300">
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold uppercase">Working Free Days</label>
                        <input
                          type="number"
                          value={rule.freeDaysWorking}
                          onChange={(e) => handleUpdateSorRule(rule.id, { freeDaysWorking: e.target.value })}
                          className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-mono font-bold text-slate-800 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold uppercase">Slab 1 Rate (Days 1-7)</label>
                        <input
                          type="number" step="0.001"
                          value={rule.slab1Rate}
                          onChange={(e) => handleUpdateSorRule(rule.id, { slab1Rate: e.target.value })}
                          className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-mono font-bold text-slate-800 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold uppercase">Slab 2 Rate (Days 8-14)</label>
                        <input
                          type="number" step="0.001"
                          value={rule.slab2Rate}
                          onChange={(e) => handleUpdateSorRule(rule.id, { slab2Rate: e.target.value })}
                          className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-mono font-bold text-slate-800 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold uppercase">Slab 3 Rate (Day 15+)</label>
                        <input
                          type="number" step="0.001"
                          value={rule.slab3Rate}
                          onChange={(e) => handleUpdateSorRule(rule.id, { slab3Rate: e.target.value })}
                          className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-mono font-bold text-slate-800 dark:text-slate-100"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Port & Customs Holiday Calendar Manager */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-800/80 glass-panel space-y-4">
              <h3 className="font-bold text-base text-sky-500 pb-2 border-b border-slate-100 dark:border-slate-850 flex items-center gap-2 select-none">
                <Calendar className="w-5 h-5" />
                Port & Customs Holiday Calendar
              </h3>

              <form onSubmit={handleAddHoliday} className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
                <div className="sm:col-span-4">
                  <input
                    type="date" required
                    min={getTodayStr()}
                    value={newHolidayDate}
                    onChange={(e) => setNewHolidayDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div className="sm:col-span-4">
                  <select
                    value={newHolidayCategory}
                    onChange={(e) => setNewHolidayCategory(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-800 dark:text-slate-100"
                  >
                    <option value="Port Holiday">Port Holiday</option>
                    <option value="Customs Holiday">Customs Holiday</option>
                    <option value="General Non-Working">General Non-Working</option>
                  </select>
                </div>
                <div className="sm:col-span-4">
                  <button
                    type="submit" disabled={holidayLoading}
                    className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-1"
                  >
                    <CalendarPlus className="w-4 h-4" />
                    Add Holiday
                  </button>
                </div>
              </form>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {holidays.map(h => (
                  <div key={h.id} className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs">
                    <div>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{h.holidayDate}</span>
                      <span className="ml-2 text-[10px] px-2 py-0.5 bg-sky-500/10 text-sky-500 font-bold rounded-full">{h.category}</span>
                      {h.description && <span className="ml-2 text-slate-400 font-light">({h.description})</span>}
                    </div>
                    <button
                      onClick={() => handleDeleteHoliday(h.id)}
                      className="p-1 hover:bg-rose-500/10 text-rose-500 rounded-lg transition"
                      title="Delete Holiday"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
};

export default Settings;
