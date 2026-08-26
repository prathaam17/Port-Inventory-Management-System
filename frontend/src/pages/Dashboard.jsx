import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Ship, 
  Warehouse, 
  IndianRupee, 
  AlertCircle, 
  ArrowRight,
  TrendingUp,
  FilePlus,
  Compass,
  FileCheck,
  QrCode,
  Coins
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const { triggerToast } = useContext(NotificationContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'Shipping Agent') {
      navigate('/shipping-portal', { replace: true });
    }
  }, [user, navigate]);

  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const statsRes = await API.get('/reports/dashboard');
        const chartsRes = await API.get('/reports/analytics');
        setStats(statsRes.data);
        setCharts(chartsRes.data);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        triggerToast('API Connection Error', 'Failed to retrieve real-time statistics from backend.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  const { kpis, cargoTypes, recentActivity } = stats || {};
  const { revenueByMonth, dailyTonnage } = charts || {};

  // Color mappings for Pie charts
  const PIE_COLORS = ['#38bdf8', '#0ea5e9', '#0284c7', '#0369a1'];

  // Map quick actions based on user roles
  const getQuickActions = () => {
    switch (user?.role) {
      case 'Super Admin':
        return [
          { label: 'Upload Cargo Manifest', desc: 'Register newly docked cargo manifests', route: '/cargo', icon: FilePlus, color: 'bg-sky-500' },
          { label: 'Verify Customs Documents', desc: 'Approve or hold cargo imports', route: '/customs', icon: FileCheck, color: 'bg-indigo-500' },
          { label: 'Manage Accounts & Roles', desc: 'Edit system directory users', route: '/users', icon: IndianRupee, color: 'bg-amber-500' }
        ];
      case 'Shipping Agent':
        return [
          { label: 'Upload Cargo Manifest', desc: 'Submit a new cargo log', route: '/cargo', icon: FilePlus, color: 'bg-sky-500' },
          { label: 'Outstanding Payments', desc: 'View cargo storage invoices', route: '/billing', icon: IndianRupee, color: 'bg-amber-500' }
        ];
      case 'Port Operations Officer':
      case 'Warehouse Manager':
        return [
          { label: 'Vessel Operations', desc: 'Manage vessel calls and quays', route: '/operations-portal?tab=vessels', icon: Ship, color: 'bg-sky-500' },
          { label: 'Allocate Warehouse Bay', desc: 'Map active cargo to storage', route: '/operations-portal?tab=inventory', icon: Warehouse, color: 'bg-indigo-500' },
          { label: 'Report Damaged Goods', desc: 'File damage reports to yard', route: '/operations-portal?tab=damage', icon: AlertCircle, color: 'bg-rose-500' }
        ];
      case 'Customs Officer':
        return [
          { label: 'Review Pending Customs', desc: 'Verify bill of lading logs', route: '/customs', icon: FileCheck, color: 'bg-indigo-500' }
        ];
      case 'Finance':
        return [
          { label: 'Collect Billing Storage', desc: 'Settle invoices and demurrage', route: '/billing', icon: IndianRupee, color: 'bg-amber-500' }
        ];
      default:
        return [];
    }
  };

  const quickActions = getQuickActions();

  // Pie chart cargo data formatting
  const pieData = cargoTypes?.map(ct => ({
    name: ct.cargoType,
    value: Math.round(ct.totalWeight)
  })) || [];

  return (
    <div className="space-y-6">
      
      {/* Top Banner Welcoming User */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-white rounded-3xl text-slate-800 border border-slate-200 shadow-sm select-none">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800">mngprt Central Hub Terminal</h2>
          <p className="text-sm text-slate-500 mt-1">
            Logged in as <strong className="text-sky-600 font-semibold">{user?.username}</strong> ({user?.role}) | Operational Center.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2 text-sm font-semibold text-slate-500">
          <span className="px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200">
            System Local Time: {new Date().toLocaleDateString('en-GB')}
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Active Cargoes */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 shadow-lg border border-slate-100 dark:border-slate-800/80 flex items-center justify-between glass-panel hover:scale-102 transition-transform duration-200">
          <div className="space-y-2">
            <span className="text-sm text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">Active Cargo</span>
            <h3 className="text-3xl font-black text-slate-800 dark:text-white">{kpis?.activeCargoCount}</h3>
            <p className="text-sm text-sky-500 font-medium">Currently inside port area</p>
          </div>
          <div className="p-3 bg-sky-500/10 dark:bg-sky-500/20 rounded-xl">
            <Ship className="w-6 h-6 text-sky-500" />
          </div>
        </div>

        {/* Warehouse Occupancy */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 shadow-lg border border-slate-100 dark:border-slate-800/80 flex items-center justify-between glass-panel hover:scale-102 transition-transform duration-200">
          <div className="space-y-2">
            <span className="text-sm text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">Yard Utilization</span>
            <h3 className="text-3xl font-black text-slate-800 dark:text-white">{kpis?.warehouseUtil}%</h3>
            <div className="w-24 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
              <div className="bg-sky-500 h-full" style={{ width: `${Math.min(100, kpis?.warehouseUtil)}%` }}></div>
            </div>
          </div>
          <div className="p-3 bg-sky-500/10 dark:bg-sky-500/20 rounded-xl">
            <Warehouse className="w-6 h-6 text-sky-500" />
          </div>
        </div>

        {/* Total Storage Revenue Paid */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 shadow-lg border border-slate-100 dark:border-slate-800/80 flex items-center justify-between glass-panel hover:scale-102 transition-transform duration-200">
          <div className="space-y-2">
            <span className="text-sm text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">Collected Revenue</span>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white truncate">
              ₹{kpis?.paidRevenue?.toLocaleString()}
            </h3>
            <p className="text-sm text-emerald-500 font-medium">₹{kpis?.pendingRevenue?.toLocaleString()} outstanding</p>
          </div>
          <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-xl">
            <IndianRupee className="w-6 h-6 text-emerald-500" />
          </div>
        </div>

        {/* Pending Clearance Alerts */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 shadow-lg border border-slate-100 dark:border-slate-800/80 flex items-center justify-between glass-panel hover:scale-102 transition-transform duration-200">
          <div className="space-y-2">
            <span className="text-sm text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">Customs Queue</span>
            <h3 className="text-3xl font-black text-slate-800 dark:text-white">{kpis?.pendingCustomsCount}</h3>
            <p className="text-sm text-amber-500 font-medium">Awaiting physical clearance</p>
          </div>
          <div className="p-3 bg-amber-500/10 dark:bg-amber-500/20 rounded-xl">
            <AlertCircle className="w-6 h-6 text-amber-500" />
          </div>
        </div>

      </div>

      {/* Main Graphs Panel & Live Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Recharts Graphs */}
        <div className="lg:col-span-8 p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-800/80 glass-panel">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">Daily Tonnage Dispatched (Metric Tons)</h3>
              <p className="text-sm text-slate-400 font-light">Recent 7-day loading weight logged at mngprt gates</p>
            </div>
            <TrendingUp className="w-5 h-5 text-sky-500" />
          </div>

          <div className="h-72 w-full text-sm">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTonnage}>
                <defs>
                  <linearGradient id="containerGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="liquidGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="bulkGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="breakBulkGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                <XAxis dataKey="day" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: 'white' }} />
                <Area type="monotone" dataKey="Container" stroke="#38bdf8" strokeWidth={2.5} fillOpacity={1} fill="url(#containerGrad)" />
                <Area type="monotone" dataKey="Liquid" stroke="#0ea5e9" strokeWidth={2.5} fillOpacity={1} fill="url(#liquidGrad)" />
                <Area type="monotone" dataKey="Bulk" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#bulkGrad)" />
                <Area type="monotone" dataKey="BreakBulk" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#breakBulkGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Side: Cargo Type Pie Chart & Tonnage Proportion */}
        <div className="lg:col-span-4 p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-800/80 glass-panel flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-white">Active Cargo Shares</h3>
            <p className="text-sm text-slate-400 font-light">Proportion of storage tonnage by cargo type</p>
          </div>

          <div className="h-44 flex items-center justify-center relative my-4">
            {pieData.length === 0 ? (
              <span className="text-sm text-slate-400">No active cargo shares logged.</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm select-none">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/60">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}></span>
                <span className="font-bold text-slate-700 dark:text-slate-300 truncate">{d.name}</span>
                <span className="text-slate-500 ml-auto">{d.value}T</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Row 3: User Role Action Cards & System Audit log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Quick Actions Panel */}
        <div className="lg:col-span-5 p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-800/80 glass-panel flex flex-col">
          <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4">Operations Console</h3>
          <div className="flex-1 flex flex-col gap-3 justify-center">
            {quickActions.length === 0 ? (
              <p className="text-center text-sm text-slate-500 font-light">No direct console actions for this terminal session.</p>
            ) : (
              quickActions.map(action => {
                const ActionIcon = action.icon;
                return (
                  <button
                    key={action.label}
                    onClick={() => navigate(action.route)}
                    className="flex items-center gap-3.5 p-3 rounded-xl hover:bg-sky-500/10 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800/60 transition group text-left"
                  >
                    <div className={`p-2.5 rounded-xl ${action.color} text-white shadow-md`}>
                      <ActionIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-sky-400 transition">{action.label}</h4>
                      <p className="text-sm text-slate-400 mt-0.5">{action.desc}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 ml-auto group-hover:translate-x-1 transition" />
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* System audit log feed (Super Admin can see all, other roles see simplified summary) */}
        <div className="lg:col-span-7 p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-800/80 glass-panel flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4">Live Activity Monitor</h3>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/60 overflow-y-auto max-h-60 flex-1 pr-1.5">
            {recentActivity?.length === 0 ? (
              <p className="p-4 text-center text-sm text-slate-500 font-light">No operational activities logged yet.</p>
            ) : (
              recentActivity?.map(activity => (
                <div key={activity.id} className="py-2.5 flex items-start justify-between text-sm hover:bg-slate-50/50 dark:hover:bg-slate-850/20 px-2 rounded-xl transition">
                  <div className="space-y-1">
                    <span className="inline-block px-1.5 py-0.5 text-sm font-bold uppercase rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 select-none">
                      {activity.action}
                    </span>
                    <p className="text-slate-700 dark:text-slate-300 leading-snug font-light">{activity.details}</p>
                  </div>
                  <div className="text-right text-sm text-slate-400 shrink-0 ml-4 font-light">
                    <span className="block font-medium">{activity.username}</span>
                    <span>
                      {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
