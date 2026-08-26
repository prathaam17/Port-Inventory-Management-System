import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import { 
  Menu, 
  Bell, 
  LogOut, 
  User, 
  Anchor
} from 'lucide-react';

const Navbar = ({ toggleSidebar, isSidebarOpen }) => {
  const { user, logout } = useContext(AuthContext);
  const { notifications, unreadCount, markAllRead } = useContext(NotificationContext);
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  if (!user) return null;

  // Filter notifications for the current user's role
  const userNotifications = notifications.filter(n => 
    n.roleTarget === 'All' || n.roleTarget === user.role
  );

  return (
    <nav className="fixed top-0 z-50 w-full h-32 bg-sky-900 border-b border-sky-950 text-white px-6 flex items-center justify-between no-print shadow-md">
      
      {/* Brand Logo & Hamburger */}
      <div className="flex items-center gap-3">
        <button 
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-white/10 focus:outline-none transition-colors"
        >
          <Menu className="w-5 h-5 text-white" />
        </button>
        
        <div className="flex items-center gap-3 select-none">
          <div className="p-2 rounded-xl bg-white/10 border border-white/20 text-sky-300">
            <Anchor className="w-6 h-6" />
          </div>
          <span className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-wider uppercase font-sans">
            Port Inventory Management System
          </span>
        </div>
      </div>

      {/* Action Utilities (Theme, Notifications, Profile) */}
      <div className="flex items-center gap-2">
        


        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfile(false);
            }}
            className="p-2.5 rounded-xl hover:bg-white/10 text-slate-100 hover:text-white transition-all duration-200 relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-sm font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 rounded-xl bg-white border border-slate-200 shadow-2xl overflow-hidden z-[100] transform transition-all text-slate-700">
              <div className="p-3 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <span className="font-bold text-sm text-slate-700">Alerts & Actions</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={() => {
                      markAllRead();
                      setShowNotifications(false);
                    }}
                    className="text-sm text-sky-600 hover:text-sky-700 font-semibold"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {userNotifications.length === 0 ? (
                  <p className="p-5 text-center text-sm text-slate-400 font-light">No new alerts found.</p>
                ) : (
                  userNotifications.map(item => (
                    <div 
                      key={item.id} 
                      className={`p-3 transition-colors ${item.isRead ? 'bg-transparent text-slate-400' : 'bg-slate-50 text-slate-700 font-medium'}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="text-sm font-bold text-sky-600">{item.title}</h4>
                        <span className="text-sm text-slate-400 font-light">
                          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm leading-snug">{item.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfile(!showProfile);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 p-1.5 pl-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10"
          >
            <div className="flex flex-col text-right hidden sm:flex select-none">
              <span className="text-sm font-bold leading-tight text-white">{user.username}</span>
              <span className="text-sm text-sky-200 leading-none mt-0.5">{user.role}</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-white/25 border border-white/20 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
          </button>

          {/* Profile Panel */}
          {showProfile && (
            <div className="absolute right-0 mt-3 w-56 rounded-xl bg-white border border-slate-200 shadow-2xl overflow-hidden z-[100] p-1.5 text-slate-700">
              <div className="p-3 border-b border-slate-200 select-none mb-1">
                <p className="text-sm text-slate-400 leading-none">Signed in as</p>
                <p className="text-sm font-bold text-slate-800 mt-1 truncate">{user.email}</p>
                <span className="inline-block mt-2 px-2 py-0.5 text-sm font-bold bg-sky-600/10 text-sky-600 rounded-md border border-sky-600/20">
                  {user.role}
                </span>
              </div>
              
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 p-2.5 rounded-lg text-sm font-medium text-rose-500 hover:bg-rose-500/10 transition-colors text-left"
              >
                <LogOut className="w-4 h-4" />
                Disconnect Terminal
              </button>
            </div>
          )}
        </div>

      </div>
    </nav>
  );
};

export default Navbar;
