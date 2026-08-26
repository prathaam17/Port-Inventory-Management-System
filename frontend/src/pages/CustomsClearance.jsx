import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import { 
  ShieldAlert, 
  FileText, 
  Calendar, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Edit3,
  Search,
  Lock,
  Unlock,
  RefreshCw,
  FilePlus,
  AlertCircle,
  Upload,
  FileCheck,
  X
} from 'lucide-react';

const CustomsClearance = () => {
  const { user } = useContext(AuthContext);
  const { triggerToast } = useContext(NotificationContext);

  const getUploadUrl = (docUrl) => {
    if (!docUrl) return 'http://localhost:5000/uploads/manifest_attached.pdf';
    if (docUrl.startsWith('http://') || docUrl.startsWith('https://')) return docUrl;
    const cleanName = docUrl.replace(/^\/?(uploads\/)+/i, '');
    return `http://localhost:5000/uploads/${cleanName}`;
  };

  const getCleanFilename = (docUrl) => {
    if (!docUrl) return 'manifest_attached.pdf';
    return docUrl.replace(/^\/?(uploads\/)+/i, '').split('/').pop();
  };

  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('customs_active_tab') || 'audit';
  });

  useEffect(() => {
    localStorage.setItem('customs_active_tab', activeTab);
  }, [activeTab]);

  const [requests, setRequests] = useState([]);
  const [cargoes, setCargoes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper date constraint functions
  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Modal review form states
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedClearance, setSelectedClearance] = useState(null);
  const [statusVal, setStatusVal] = useState('Pending');
  const [remarksVal, setRemarksVal] = useState('');
  const [inspectionDate, setInspectionDate] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  // OOC Filing form states
  const [oocBl, setOocBl] = useState('');
  const [oocRef, setOocRef] = useState('');
  const [oocDate, setOocDate] = useState('');
  const [oocFile, setOocFile] = useState('');
  const [billOfEntryNo, setBillOfEntryNo] = useState('');
  const [customsBrokerId, setCustomsBrokerId] = useState('');
  const [inspectionReportId, setInspectionReportId] = useState('');
  const [oocLoading, setOocLoading] = useState(false);

  // Seizure Hold form states
  const [seizeCargoId, setSeizeCargoId] = useState('');
  const [seizeRemarks, setSeizeRemarks] = useState('');
  const [seizeLoading, setSeizeLoading] = useState(false);

  // Fetch customs requests & cargo database
  const fetchData = async () => {
    setLoading(true);
    try {
      const resRequests = await API.get('/customs');
      setRequests(resRequests.data);

      const resCargo = await API.get('/cargo?limit=100');
      setCargoes(resCargo.data.cargoes);
    } catch (error) {
      console.error('Failed to fetch customs registry:', error);
      triggerToast('Error', 'Failed to retrieve customs registry lists.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openReviewModal = (clearance) => {
    setSelectedClearance(clearance);
    setStatusVal(clearance.status);
    setRemarksVal(clearance.remarks || '');
    setInspectionDate(clearance.inspectionScheduledAt ? new Date(clearance.inspectionScheduledAt).toISOString().slice(0, 16) : '');
    setShowReviewModal(true);
  };

  // Submit standard verification review
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!statusVal || !remarksVal) {
      triggerToast('Validation Error', 'Please choose a status and enter remarks.', 'error');
      return;
    }

    setSubmitLoading(true);
    try {
      await API.put(`/customs/${selectedClearance.id}`, {
        status: statusVal,
        remarks: remarksVal,
        inspectionScheduledAt: inspectionDate ? new Date(inspectionDate) : null
      });

      triggerToast('Customs Logged', `Clearance status updated to ${statusVal} for Cargo ${selectedClearance.Cargo.cargoId}.`, 'success');
      setShowReviewModal(false);
      setSelectedClearance(null);
      fetchData();
    } catch (error) {
      triggerToast('Review Failed', error.response?.data?.message || 'Failed to update customs state.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Submit OOC (Out of Charge) Filing
  const handleOocSubmit = async (e) => {
    e.preventDefault();
    if (!oocBl || !oocRef || !oocDate) {
      triggerToast('Validation Error', 'Bill of Lading, OOC Reference, and OOC Date are required.', 'error');
      return;
    }

    setOocLoading(true);
    try {
      const fileName = oocFile instanceof File ? oocFile.name : (oocFile || 'customs_signed_ooc_release.pdf');
      const res = await API.post('/customs/ooc', {
        billOfLading: oocBl,
        oocRefNo: oocRef,
        oocDate: new Date(oocDate),
        documentUrl: fileName,
        billOfEntryNo,
        customsBrokerId,
        inspectionReportId
      });

      triggerToast('OOC Filed', res.data.message, 'success');
      setOocBl('');
      setOocRef('');
      setOocDate('');
      setOocFile(null);
      setBillOfEntryNo('');
      setCustomsBrokerId('');
      setInspectionReportId('');
      fetchData();
    } catch (error) {
      triggerToast('OOC Filing Failed', error.response?.data?.message || 'Failed to register Out of Charge.', 'error');
    } finally {
      setOocLoading(false);
    }
  };

  // Submit Seizure hold
  const handleSeizureSubmit = async (e) => {
    e.preventDefault();
    if (!seizeCargoId || !seizeRemarks) {
      triggerToast('Validation Error', 'Cargo ID and justification remarks are required.', 'error');
      return;
    }

    setSeizeLoading(true);
    try {
      const res = await API.post('/customs/seize', {
        cargoId: seizeCargoId,
        remarks: seizeRemarks
      });

      triggerToast('Emergency Seized', res.data.message, 'success');
      setSeizeCargoId('');
      setSeizeRemarks('');
      fetchData();
    } catch (error) {
      triggerToast('Seizure Failed', error.response?.data?.message || 'Failed to apply seizure hold.', 'error');
    } finally {
      setSeizeLoading(false);
    }
  };

  const handleReleaseSubmit = async (cargoId) => {
    if (!window.confirm(`Are you sure you want to release Customs Seizure Hold for Cargo ${cargoId}?`)) {
      return;
    }
    try {
      const res = await API.post('/customs/release', {
        cargoId,
        remarks: 'Customs Seizure Hold released by Customs Officer.'
      });
      triggerToast('Cargo Released', res.data.message, 'success');
      fetchData();
    } catch (error) {
      triggerToast('Release Failed', error.response?.data?.message || 'Failed to release cargo.', 'error');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return <span className="inline-block w-40 text-center whitespace-nowrap px-2 py-1 text-xs font-bold rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">PENDING AUDIT</span>;
      case 'Approved':
        return <span className="inline-block w-40 text-center whitespace-nowrap px-2 py-1 text-xs font-bold rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-400/20">CLEARED (OOC)</span>;
      case 'Rejected':
        return <span className="inline-block w-40 text-center whitespace-nowrap px-2 py-1 text-xs font-bold rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">QUARANTINED</span>;
      case 'On Hold':
        return <span className="inline-block w-40 text-center whitespace-nowrap px-2 py-1 text-xs font-bold rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">ON HOLD</span>;
      case 'Under Inspection':
        return <span className="inline-block w-40 text-center whitespace-nowrap px-2 py-1 text-xs font-bold rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">UNDER CHECK</span>;
      default:
        return <span className="inline-block w-40 text-center whitespace-nowrap px-2 py-1 text-xs font-bold rounded-lg bg-slate-200 text-slate-700">{status}</span>;
    }
  };

  const getHoldBadge = (holdStatus) => {
    switch (holdStatus) {
      case 'LOCKED':
        return <span className="inline-block px-2 py-0.5 text-[11px] font-bold rounded bg-rose-500/10 text-rose-400 border border-rose-500/10">LOCKED HOLD</span>;
      case 'RELEASED':
        return <span className="inline-block px-2 py-0.5 text-[11px] font-bold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/10">RELEASED</span>;
      case 'SEIZED':
        return <span className="inline-block px-2 py-0.5 text-[11px] font-bold rounded bg-rose-500/10 text-rose-500 border border-rose-500/20 animate-pulse">SEIZED</span>;
      default:
        return <span className="inline-block px-2 py-0.5 text-[11px] font-bold rounded bg-slate-200 text-slate-700">{holdStatus}</span>;
    }
  };

  // Filter cargo for listings
  const clearedCargoes = cargoes.filter(c => c.customsHoldStatus === 'RELEASED');
  const seizedCargoes = cargoes.filter(c => c.customsHoldStatus === 'SEIZED');

  return (
    <div className="space-y-6 text-slate-700 dark:text-slate-200">
      
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 glass-panel flex justify-between items-center">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">Customs Regulatory Release & Seizure Operations</h2>
          <p className="text-sm text-slate-400 font-light mt-0.5">Audit cargo import documents, register Customs Out of Charge (OOC) releases, and apply emergency security holds</p>
        </div>
        <button 
          onClick={fetchData}
          className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 rounded-xl transition text-slate-500 border border-slate-100 dark:border-slate-850"
          title="Refresh database"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* CUSTOMS TAB BUTTONS */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 select-none font-bold text-sm">
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 px-1 transition relative cursor-pointer
            ${activeTab === 'audit' 
              ? 'text-sky-600 dark:text-sky-400 font-bold border-b-2 border-sky-600 dark:border-sky-400' 
              : 'text-slate-400 hover:text-slate-650'
            }
          `}
        >
          1. Document Audit & Inspections
        </button>
        <button
          onClick={() => setActiveTab('ooc')}
          className={`pb-3 px-1 transition relative cursor-pointer
            ${activeTab === 'ooc' 
              ? 'text-sky-600 dark:text-sky-400 font-bold border-b-2 border-sky-600 dark:border-sky-400' 
              : 'text-slate-400 hover:text-slate-650'
            }
          `}
        >
          2. Out of Charge (OOC) Filing
        </button>
        <button
          onClick={() => setActiveTab('seizure')}
          className={`pb-3 px-1 transition relative cursor-pointer
            ${activeTab === 'seizure' 
              ? 'text-sky-600 dark:text-sky-400 font-bold border-b-2 border-sky-600 dark:border-sky-400' 
              : 'text-slate-400 hover:text-slate-650'
            }
          `}
        >
          3. Emergency Seizure Holds
        </button>
      </div>

      {loading ? (
        <div className="p-20 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-500"></div>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* TAB 1: Document Audit Table */}
          {activeTab === 'audit' && (
            <div className="w-full space-y-2">
              {requests.length === 0 ? (
                <div className="p-20 text-center text-sm text-slate-500 dark:text-slate-400 font-light">No clearance requests submitted in the registry.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm select-none">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/20 text-slate-500 font-bold">
                        <th className="p-4">Cargo Code</th>
                        <th className="p-4">Consignee Importer</th>
                        <th className="p-4">Bill of Lading File</th>
                        <th className="p-4">Customs Status</th>
                        <th className="p-4">Hold Release State</th>
                        <th className="p-4">Inspection Date</th>
                        <th className="p-4">Remarks</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-700 dark:text-slate-300 font-light">
                      {requests.map(clearance => (
                        <tr key={clearance.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                          <td className="p-4 font-bold text-sky-500 dark:text-sky-400">{clearance.Cargo?.cargoId || 'N/A'}</td>
                          <td className="p-4 truncate max-w-[120px]" title={clearance.Cargo?.consignee}>{clearance.Cargo?.consignee || 'N/A'}</td>
                          <td className="p-4">
                            <a
                              href={getUploadUrl(clearance.documentUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-sky-500 dark:text-sky-400 cursor-pointer font-medium hover:underline w-fit"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>{getCleanFilename(clearance.documentUrl)}</span>
                            </a>
                          </td>
                          <td className="p-4">{getStatusBadge(clearance.status)}</td>
                          <td className="p-4">{getHoldBadge(clearance.Cargo?.customsHoldStatus)}</td>
                          <td className="p-4 text-slate-500 dark:text-slate-400">
                            {clearance.inspectionScheduledAt ? (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-sky-500" />
                                <span>{new Date(clearance.inspectionScheduledAt).toLocaleDateString()} {new Date(clearance.inspectionScheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            ) : (
                              <span className="italic text-slate-400">Not scheduled</span>
                            )}
                          </td>
                          <td className="p-4 max-w-[180px] truncate italic text-slate-550" title={clearance.remarks}>{clearance.remarks || '-'}</td>
                          <td className="p-4 text-right shrink-0">
                            {['Customs Officer', 'Super Admin'].includes(user?.role) && clearance.status !== 'Approved' && clearance.Cargo?.customsHoldStatus !== 'SEIZED' ? (
                              <button
                                onClick={() => openReviewModal(clearance)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg text-xs transition ml-auto"
                              >
                                <Edit3 className="w-3 h-3" />
                                Process Review
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400 italic">No action needed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Customs OOC Filing Panel */}
          {activeTab === 'ooc' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Form OOC */}
              <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 glass-panel space-y-4">
                <div>
                  <h3 className="font-bold text-base text-slate-800 dark:text-white">Register Customs Out of Charge (OOC)</h3>
                  <p className="text-xs text-slate-400 font-light mt-0.5">Input the federal reference code and date of the importer's verified paper OOC release to unlock the digital customs hold flag.</p>
                </div>

                <form onSubmit={handleOocSubmit} className="space-y-4 text-sm select-none">
                  
                  {/* Select Bill of Lading */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Bill of Lading Number</label>
                    <input
                      type="text"
                      required
                      list="customs-bl-options"
                      placeholder="e.g. BL-SSL-102 (type or select)"
                      value={oocBl}
                      onChange={(e) => {
                        const val = e.target.value;
                        setOocBl(val);
                        const matched = cargoes.find(c => c.billOfLading === val);
                        if (matched) {
                          if (!billOfEntryNo) setBillOfEntryNo(`BOE-${matched.cargoId || Math.floor(1000 + Math.random() * 9000)}`);
                          if (!customsBrokerId) setCustomsBrokerId('BRK-9902');
                          if (!inspectionReportId) setInspectionReportId(`RPT-${Math.floor(1000 + Math.random() * 9000)}`);
                          if (!oocRef) setOocRef(`OOC/MNGPRT/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`);
                        }
                      }}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-slate-850 dark:text-slate-200"
                    />
                    <datalist id="customs-bl-options">
                      {cargoes.filter(c => c.billOfLading).map(c => (
                        <option key={c.id} value={c.billOfLading}>
                          Cargo {c.cargoId} - {c.description || 'Consignment'} (Hold: {c.customsHoldStatus})
                        </option>
                      ))}
                    </datalist>
                  </div>

                  {/* OOC Ref */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Customs OOC Reference No</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. OOC/MNGPRT/2026/8902A"
                      value={oocRef}
                      onChange={(e) => setOocRef(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-slate-850 dark:text-slate-200"
                    />
                  </div>

                  {/* OOC Release Date */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Customs Release Date</label>
                    <input
                      type="date"
                      required
                      min={getTodayStr()}
                      value={oocDate}
                      onChange={(e) => setOocDate(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-855 rounded-xl focus:border-sky-500 focus:outline-none text-slate-850 dark:text-slate-200"
                    />
                  </div>

                  {/* Scanned Document File Upload */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Upload Scanned Release PDF</label>
                    {oocFile ? (
                      <div className="flex items-center justify-between p-3 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-xl">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                          <div className="truncate">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                              {oocFile instanceof File ? oocFile.name : oocFile}
                            </p>
                            {oocFile instanceof File && (
                              <p className="text-[10px] text-slate-400">
                                {(oocFile.size / 1024).toFixed(1)} KB &bull; PDF Ready
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setOocFile(null)}
                          className="p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="Remove file"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-sky-500 dark:hover:border-sky-500 rounded-xl cursor-pointer bg-slate-50/50 dark:bg-slate-950/50 hover:bg-sky-50/20 transition group">
                        <Upload className="w-6 h-6 text-slate-400 group-hover:text-sky-500 transition mb-1.5" />
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 group-hover:text-sky-600 dark:group-hover:text-sky-400">
                          Click to browse or drop scanned PDF
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">Supports .pdf, .jpg, .png (Max 10MB)</span>
                        <input
                          type="file"
                          accept=".pdf,application/pdf,image/png,image/jpeg"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setOocFile(e.target.files[0]);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* Bill of Entry */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Bill of Entry No</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. BOE-882201"
                      value={billOfEntryNo}
                      onChange={(e) => setBillOfEntryNo(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-slate-850 dark:text-slate-200"
                    />
                  </div>

                  {/* Customs Broker ID */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Customs Broker ID</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. BRK-9902"
                      value={customsBrokerId}
                      onChange={(e) => setCustomsBrokerId(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-slate-850 dark:text-slate-200"
                    />
                  </div>

                  {/* Inspection Report ID */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Inspection Report ID</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. RPT-7703"
                      value={inspectionReportId}
                      onChange={(e) => setInspectionReportId(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-slate-850 dark:text-slate-200"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={oocLoading}
                    className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-1.5 shadow-lg hover:shadow-sky-500/10"
                  >
                    <Unlock className="w-4 h-4" />
                    {oocLoading ? 'Filing Out of Charge...' : 'Register OOC Release'}
                  </button>

                </form>
              </div>

              {/* Cleared list */}
              <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 glass-panel space-y-4">
                <h3 className="font-bold text-base text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-850 pb-2">OOC Cleared Cargo Directory</h3>
                
                {clearedCargoes.length === 0 ? (
                  <div className="py-20 text-center text-sm text-slate-400 italic font-light">
                    No cargo consignments have been cleared under OOC filing yet.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 text-xs">
                    {clearedCargoes.map(cargo => (
                      <div 
                        key={cargo.id} 
                        className="p-3.5 bg-emerald-500/5 border border-emerald-500/10 rounded-xl space-y-1.5 select-none"
                      >
                        <div className="flex justify-between items-center">
                          <strong className="text-slate-800 dark:text-white font-mono text-sm">{cargo.cargoId}</strong>
                          <span className="text-[10px] font-bold text-emerald-500 uppercase">OOC RELEASED</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-slate-500 font-light">
                          <span>Bill of Lading: <strong className="font-mono text-slate-700 dark:text-slate-350">{cargo.billOfLading}</strong></span>
                          <span>Consignee: <strong>{cargo.consignee}</strong></span>
                          <span>OOC Ref No: <strong className="font-mono text-slate-700 dark:text-slate-350">{cargo.oocRefNo || '-'}</strong></span>
                          <span>OOC Date: <strong>{cargo.oocDate ? new Date(cargo.oocDate).toLocaleDateString() : '-'}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 3: Emergency Seizure Hold */}
          {activeTab === 'seizure' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Form Seizure */}
              <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 glass-panel space-y-4">
                <div>
                  <h3 className="font-bold text-base text-slate-800 dark:text-white text-rose-500">Apply Emergency Customs Seizure</h3>
                  <p className="text-xs text-slate-400 font-light mt-0.5">Toggle an immediate regulatory lockdown on any cargo consignment inside the port. This instantly overrides any clearances and blocks warehouse exit release.</p>
                </div>

                <form onSubmit={handleSeizureSubmit} className="space-y-4 text-sm select-none">
                  
                  {/* Select Cargo ID */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Cargo Code (ID)</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CRG-MNGPRT-2026-101"
                      value={seizeCargoId}
                      onChange={(e) => setSeizeCargoId(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-slate-850 dark:text-slate-200"
                    />
                  </div>

                  {/* Seizure Remarks */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Seizure Hold Justification</label>
                    <textarea
                      rows={4}
                      required
                      placeholder="e.g. Document mismatch detected during secondary audits. Physical search indicates undeclared hazardous materials."
                      value={seizeRemarks}
                      onChange={(e) => setSeizeRemarks(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-slate-850 dark:text-slate-200"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={seizeLoading}
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/20 cursor-pointer"
                  >
                    <Lock className="w-4 h-4" />
                    {seizeLoading ? 'Authorizing Seizure...' : 'Apply Customs Seizure Hold'}
                  </button>

                </form>
              </div>

              {/* Seized list */}
              <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 glass-panel space-y-4">
                <h3 className="font-bold text-base text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-850 pb-2 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                  Seized Cargo Quarantine List
                </h3>
                
                {seizedCargoes.length === 0 ? (
                  <div className="py-20 text-center text-sm text-slate-400 italic font-light">
                    No cargo consignments are currently under seizure holds.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 text-xs">
                    {seizedCargoes.map(cargo => (
                      <div 
                        key={cargo.id} 
                        className="p-3.5 bg-rose-500/5 border border-rose-500/10 rounded-xl space-y-1.5 select-none"
                      >
                        <div className="flex justify-between items-center">
                          <strong className="text-slate-800 dark:text-white font-mono text-sm">{cargo.cargoId}</strong>
                          <span className="text-[10px] font-bold text-rose-500 uppercase animate-pulse">SEIZED LOCK</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-slate-500 font-light border-b border-slate-100 dark:border-slate-850 pb-2 mb-2">
                          <span>Bill of Lading: <strong className="font-mono text-slate-700 dark:text-slate-350">{cargo.billOfLading}</strong></span>
                          <span>Consignee: <strong>{cargo.consignee}</strong></span>
                        </div>
                        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-2.5 rounded-lg flex gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <p className="leading-snug">
                            <strong>Reason:</strong> {cargo.governmentHoldReason || cargo.damageRemarks || 'Emergency Customs Seizure Hold Applied.'}
                          </p>
                        </div>
                        <div className="flex justify-end pt-2">
                          <button
                            onClick={() => handleReleaseSubmit(cargo.cargoId)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[10px] transition cursor-pointer"
                          >
                            Release Cargo
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      )}

      {/* STANDARD REVIEW MODAL */}
      {showReviewModal && selectedClearance && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex justify-center items-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl rounded-2xl overflow-hidden glass-panel p-6 transform transition-all animate-bounce-slow">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-base text-slate-800 dark:text-white">Customs Audit Panel</h3>
                <span className="text-sm text-slate-400 font-light">Auditing Cargo: <strong className="text-sky-500 font-mono">{selectedClearance.Cargo?.cargoId}</strong></span>
              </div>
              <button onClick={() => { setShowReviewModal(false); setSelectedClearance(null); }} className="text-slate-400 hover:text-slate-600 text-lg">×</button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4 text-sm select-none">
              
              {/* Set Status */}
              <div>
                <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Verification Determination</label>
                <select
                  value={statusVal}
                  onChange={(e) => setStatusVal(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-slate-800 dark:text-slate-300 font-bold"
                >
                  <option value="Pending">Awaiting Physical Inspection (Pending)</option>
                  <option value="Approved">Release Authorized (Cleared / Approve)</option>
                  <option value="Rejected">Access Denied / Quarantined (Reject)</option>
                  <option value="On Hold">Document Discrepancy (On Hold)</option>
                  <option value="Under Inspection">Physical/Safety Check (Under Inspection)</option>
                </select>
              </div>

              {/* Set Inspection Date/Time */}
              <div>
                <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Schedule Inspection Date & Time
                </label>
                <input
                  type="datetime-local"
                  min={`${getTodayStr()}T00:00`}
                  value={inspectionDate}
                  onChange={(e) => setInspectionDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-slate-850 dark:text-slate-350"
                />
              </div>

              {/* Remarks / Review Notes */}
              <div>
                <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Inspector Remarks</label>
                <textarea
                  rows={4}
                  required
                  placeholder="e.g. Phytosanitary seals checked and approved. Wood packaging heat treatment stamp verified."
                  value={remarksVal}
                  onChange={(e) => setRemarksVal(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl focus:border-sky-500 focus:outline-none text-slate-800 dark:text-slate-200"
                />
              </div>

              {statusVal === 'Approved' && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl flex gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="text-xs leading-snug">
                    <strong>Important:</strong> Approving customs clearance automatically transitions cargo status to "Customs Approved" and creates a storage invoice in the billing database.
                  </p>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => { setShowReviewModal(false); setSelectedClearance(null); }}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-500 rounded-xl font-bold transition hover:bg-slate-50 dark:hover:bg-slate-950"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold transition shadow-lg hover:shadow-sky-500/10"
                >
                  {submitLoading ? 'Saving Review...' : 'Sign and Apply'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default CustomsClearance;
