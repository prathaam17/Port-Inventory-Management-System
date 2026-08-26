import React, { useContext } from 'react';
import { NavLink, useLocation, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Package, 
  Anchor, 
  Ship, 
  ShieldCheck, 
  IndianRupee, 
  BarChart3, 
  Users, 
  Settings,
  FileText,
  Boxes,
  Grid,
  Truck,
  FileCheck
} from 'lucide-react';

const Sidebar = ({ isOpen }) => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const [searchParams] = useSearchParams();

  if (!user) return null;

  const isShippingPortal = location.pathname === '/shipping-portal';
  const rawTab = searchParams.get('tab') || localStorage.getItem('shipping_agent_active_tab') || 'dashboard';
  const activeTab = ['documents', 'allocation'].includes(rawTab) ? 'dashboard' : rawTab;

  const shippingSubLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'vessels', label: 'Vessel Calls & Profiles', icon: Ship },
    { id: 'manifest', label: 'Cargo Manifest', icon: FileText },
    { id: 'inventory', label: 'Cargo Inventory', icon: Boxes },
    { id: 'movement', label: 'Cargo Movement', icon: Truck },
    { id: 'billing', label: 'Billing & Invoices', icon: IndianRupee },
    { id: 'deliveryOrder', label: 'Delivery Order (DO)', icon: FileCheck },
    { id: 'reports', label: 'Reports', icon: BarChart3 }
  ];

  // Sidebar link configurations with Lucide Icons
  const allLinks = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['Super Admin', 'Port Operations Officer', 'Warehouse Manager', 'Customs Officer', 'Finance', 'Finance Officer', 'Management'] },
    { to: '/cargo', label: 'Cargo Inventory', icon: Package, roles: ['Super Admin', 'Port Operations Officer', 'Warehouse Manager'] },
    { to: '/operations-portal', label: 'Operations & Warehouse', icon: Anchor, roles: ['Super Admin', 'Port Operations Officer', 'Warehouse Manager'] },
    { to: '/shipping-portal', label: 'Shipping Agent Portal', icon: Ship, roles: ['Super Admin', 'Shipping Agent'] },
    { to: '/customs', label: 'Customs Clearance', icon: ShieldCheck, roles: ['Super Admin', 'Customs Officer'] },
    { to: '/billing', label: 'Billing & Invoices', icon: IndianRupee, roles: ['Super Admin', 'Finance', 'Finance Officer'] },
    { to: '/reports', label: 'Reports & Stats', icon: BarChart3, roles: ['Super Admin', 'Warehouse Manager', 'Customs Officer', 'Finance', 'Finance Officer', 'Port Operations Officer', 'Management'] },
    { to: '/users', label: 'User Directory', icon: Users, roles: ['Super Admin'] }
  ];

  const normalizeRole = (r) => {
    if (!r) return '';
    const lower = r.toLowerCase().trim();
    if (lower === 'finance' || lower === 'finance officer') return 'finance';
    return lower;
  };

  const userRoleNorm = normalizeRole(user.role);
  const userLinks = allLinks.filter(link => link.roles.map(normalizeRole).includes(userRoleNorm));

  return (
    <aside 
      style={{ width: isOpen ? '310px' : '64px' }}
      className={`fixed top-0 left-0 z-40 h-screen pt-32 transition-all duration-200 bg-white border-r border-slate-200 text-slate-700 no-print select-none ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}
    >
      <div className="h-full px-2 py-4 overflow-y-auto flex flex-col justify-between">
        <ul className="space-y-1.5 font-bold">
          {userLinks.map((link) => {
            const IconComp = link.icon;
            return (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  className="w-full block"
                  title={!isOpen ? link.label : undefined}
                >
                  {({ isActive }) => (
                    <div className={`flex items-center gap-2.5 px-3 py-2 transition-all duration-150 rounded-xl
                      ${isActive 
                        ? 'bg-sky-50 text-sky-800 font-extrabold border-l-4 border-sky-600 shadow-sm dark:bg-sky-950/80 dark:text-sky-300' 
                        : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-l-4 border-transparent'
                      }
                      ${!isOpen ? 'justify-center px-0' : ''}
                    `}>
                      <IconComp className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400 group-hover:text-slate-600'}`} />
                      {isOpen && (
                        <span className="font-bold text-xs sm:text-[13px] whitespace-nowrap">
                          {link.label}
                        </span>
                      )}
                    </div>
                  )}
                </NavLink>

                {/* Shipping Agent Sub-Navigation */}
                {link.to === '/shipping-portal' && isShippingPortal && (
                  <ul className={`mt-1 space-y-1 transition-all duration-200 ${isOpen ? 'pl-4 pr-1' : 'px-0'}`}>
                    {shippingSubLinks.map((subLink) => {
                      const isSubActive = activeTab === subLink.id;
                      const SubIcon = subLink.icon;
                      return (
                        <li key={subLink.id}>
                          <NavLink
                            to={`/shipping-portal?tab=${subLink.id}`}
                            className="w-full block"
                            title={!isOpen ? subLink.label : undefined}
                          >
                            <div className={`flex items-center gap-2.5 px-3 py-2 transition-all duration-150 rounded-lg text-xs
                              ${isSubActive
                                ? 'bg-sky-100/70 text-sky-900 font-extrabold dark:bg-sky-900/40 dark:text-sky-300'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'
                              }
                              ${!isOpen ? 'justify-center px-0 py-2' : ''}
                            `}>
                              <SubIcon className={`w-4 h-4 shrink-0 ${isSubActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'}`} />
                              {isOpen && (
                                <span className="font-bold text-xs sm:text-[13px] whitespace-nowrap">
                                  {subLink.label}
                                </span>
                              )}
                            </div>
                          </NavLink>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>

        {/* Footer text */}
        <div className={`p-2.5 rounded-none bg-slate-50 border-t border-slate-200 transition-all duration-200 text-slate-500 text-[10px]
          ${isOpen ? 'opacity-100' : 'opacity-0 w-0 h-0 p-0 overflow-hidden border-none'}
        `}>
          <div className="font-bold text-slate-700 uppercase tracking-wider">mngprt Terminal</div>
          <div className="font-mono text-slate-400">System v1.2</div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
