import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { 
  TrendingUp, 
  Download, 
  Calendar, 
  ShieldAlert, 
  BarChart3, 
  Clock, 
  Layers, 
  Users 
} from 'lucide-react';

const Reports = () => {
  const { user } = useContext(AuthContext);
  const { triggerToast } = useContext(NotificationContext);

  const [analytics, setAnalytics] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Date range filters
  const [startDate, setStartDate] = useState('2026-05-01');
  const [endDate, setEndDate] = useState('2026-05-31');

  const fetchReportsData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Analytics data
      const analyticsRes = await API.get('/reports/analytics');
      setAnalytics(analyticsRes.data);

      // 2. Fetch Audit Logs if Super Admin
      if (user?.role === 'Super Admin') {
        const auditRes = await API.get('/reports/audit-logs');
        setAuditLogs(auditRes.data);
      }
    } catch (error) {
      console.error('Failed to load reports data:', error);
      triggerToast('Sync Error', 'Failed to retrieve reports databases.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, [user]);

  // Export CSV mock trigger
  const handleExportCSV = (reportName, data) => {
    if (!data || data.length === 0) {
      triggerToast('Export Blocked', 'No records available to export.', 'error');
      return;
    }
    
    // Simulate creating a CSV file content
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${reportName}_Export_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    triggerToast('Spreadsheet Exported', `CSV file successfully generated.`, 'success');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  const { revenueByMonth, statsSummary } = analytics || {};

  return (
    <div className="space-y-6">
      
      {/* Top filter banner */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 glass-panel items-center no-print">
        <div className="md:col-span-6">
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">Seaport Analytics & Operations audit</h2>
          <p className="text-sm text-slate-400 font-light mt-0.5">Review revenue trends, gate tonnage throughputs, and system security access trails</p>
        </div>

        {/* Date Filters */}
        <div className="md:col-span-4 flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl text-sm focus:outline-none focus:border-sky-500 text-slate-800 dark:text-slate-350"
          />
          <span className="text-slate-400 text-sm">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl text-sm focus:outline-none focus:border-sky-500 text-slate-800 dark:text-slate-350"
          />
        </div>

        {/* Export Button */}
        <button
          onClick={() => handleExportCSV('Financial_Ledger', revenueByMonth)}
          className="md:col-span-2 flex items-center justify-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-sm font-bold transition shadow-lg hover:shadow-sky-500/10 border border-sky-500/10"
        >
          <Download className="w-4 h-4" />
          Export Ledger CSV
        </button>
      </div>

      {/* Numerical Metrics grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 no-print">
        
        {/* Metric 1 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 glass-panel flex items-center gap-4">
          <div className="p-3 bg-sky-500/10 dark:bg-sky-500/20 rounded-xl">
            <Clock className="w-6 h-6 text-sky-500" />
          </div>
          <div>
            <span className="text-sm text-slate-450 uppercase font-semibold block">Avg Turnaround Time</span>
            <h4 className="text-lg font-bold text-slate-800 dark:text-white mt-1">
              {statsSummary?.avgTurnaroundDays !== undefined ? statsSummary.avgTurnaroundDays.toFixed(1) : '0.0'} Days
            </h4>
            <span className="text-sm text-slate-400 font-light">From manifests to gate exit</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 glass-panel flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-xl">
            <TrendingUp className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <span className="text-sm text-slate-450 uppercase font-semibold block">Active Tonnage Handled</span>
            <h4 className="text-lg font-bold text-slate-800 dark:text-white mt-1">
              {statsSummary?.totalActiveTonnage !== undefined ? statsSummary.totalActiveTonnage.toLocaleString() : '0'} Tons
            </h4>
            <span className="text-sm text-slate-400 font-light">Total active cargo in yard</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 glass-panel flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 dark:bg-amber-500/20 rounded-xl">
            <Layers className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <span className="text-sm text-slate-450 uppercase font-semibold block">Demurrage Ratio</span>
            <h4 className="text-lg font-bold text-slate-800 dark:text-white mt-1">
              {statsSummary?.demurrageRatio !== undefined ? statsSummary.demurrageRatio.toFixed(1) : '0.0'}%
            </h4>
            <span className="text-sm text-slate-400 font-light">Storage exceeding 3-day window</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 glass-panel flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-xl">
            <Users className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <span className="text-sm text-slate-450 uppercase font-semibold block">Port Agency Partners</span>
            <h4 className="text-lg font-bold text-slate-800 dark:text-white mt-1">
              {statsSummary?.portAgencyPartners !== undefined ? statsSummary.portAgencyPartners : '0'} Lines
            </h4>
            <span className="text-sm text-slate-400 font-light">Authorized shipping agents</span>
          </div>
        </div>

      </div>

      {/* Chart Panel 1: Revenue Comparison */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-800/80 glass-panel no-print">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-white">Monthly Storage Revenue comparison (INR)</h3>
            <p className="text-sm text-slate-400 font-light mt-0.5">Comparing paid collection invoices vs outstanding invoices by month</p>
          </div>
          <BarChart3 className="w-5 h-5 text-sky-500" />
        </div>

        <div className="h-72 w-full text-sm">
          {revenueByMonth && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: 'white' }} />
                <Legend />
                <Bar dataKey="Paid" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Unpaid" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Chart Panel 2: Import vs Export Volume & Dwell Time Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 no-print">
        
        {/* Trade Volume */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-800/80 glass-panel">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-800 dark:text-white">Import vs Export Cargo Tonnage (Tons)</h3>
              <p className="text-xs text-slate-400 mt-0.5">Volume comparison by cargo classification category</p>
            </div>
            <TrendingUp className="w-5 h-5 text-sky-500" />
          </div>
          <div className="h-60 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { category: 'Containers', Import: 4200, Export: 6100 },
                { category: 'Liquid Bulk', Import: 8500, Export: 3200 },
                { category: 'Dry Bulk', Import: 12400, Export: 9800 },
                { category: 'General Cargo', Import: 3100, Export: 4500 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                <XAxis dataKey="category" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: 'white' }} />
                <Legend />
                <Bar dataKey="Import" fill="#0284c7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Export" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cargo Dwell Time Breakdown */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-800/80 glass-panel">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-800 dark:text-white">Cargo Dwell Time Distribution</h3>
              <p className="text-xs text-slate-400 mt-0.5">Storage duration in transit yard plots</p>
            </div>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <div className="h-60 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={[
                    { name: '0-3 Days (Free)', value: 65, fill: '#10b981' },
                    { name: '4-7 Days (Tier 1)', value: 22, fill: '#f59e0b' },
                    { name: '8-14 Days (Tier 2)', value: 9, fill: '#ef4444' },
                    { name: '15+ Days (Severe)', value: 4, fill: '#8b5cf6' }
                  ]} 
                  dataKey="value" 
                  nameKey="name" 
                  cx="50%" 
                  cy="50%" 
                  outerRadius={75} 
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {[
                    { name: '0-3 Days (Free)', value: 65, fill: '#10b981' },
                    { name: '4-7 Days (Tier 1)', value: 22, fill: '#f59e0b' },
                    { name: '8-14 Days (Tier 2)', value: 9, fill: '#ef4444' },
                    { name: '15+ Days (Severe)', value: 4, fill: '#8b5cf6' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: 'white' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Row 3: Super Admin Audit Log Directory */}
      {user?.role === 'Super Admin' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-800/80 glass-panel">
          
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-base text-slate-800 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-sky-500" />
                System Security & Audit logs
              </h3>
              <p className="text-sm text-slate-400 font-light mt-0.5">Chronological record of all critical database operations and staff modifications</p>
            </div>
            <button
              onClick={() => handleExportCSV('System_Audit_Logs', auditLogs)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-700 dark:text-slate-350 text-sm font-bold rounded-lg transition"
            >
              <Download className="w-3.5 h-3.5" />
              Export Logs
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm select-none">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/20 text-slate-500 font-bold">
                  <th className="p-3">Ref ID</th>
                  <th className="p-3">Staff Operator</th>
                  <th className="p-3">Action logged</th>
                  <th className="p-3">Operation description</th>
                  <th className="p-3">IP Address</th>
                  <th className="p-3 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-700 dark:text-slate-300 font-light">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="p-3 font-mono text-slate-400">AUD-{log.id}</td>
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-150">{log.username}</td>
                    <td className="p-3 font-semibold text-sky-500 dark:text-sky-400">{log.action}</td>
                    <td className="p-3 font-light text-slate-600 dark:text-slate-300 italic">{log.details}</td>
                    <td className="p-3 font-mono text-sm text-slate-450">{log.ipAddress || '127.0.0.1'}</td>
                    <td className="p-3 text-right text-sm text-slate-400 font-light shrink-0">
                      {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

    </div>
  );
};

export default Reports;
