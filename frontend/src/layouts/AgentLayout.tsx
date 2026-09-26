import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Compass,
  LayoutDashboard,
  Users,
  Map,
  CreditCard,
  CalendarDays,
  Store,
  Bell,
  Settings,
  LogOut,
  Search,
  Menu,
  X,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';

export const AgentLayout: React.FC = () => {
  const { agent, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  const navItems = [
    { label: 'Dashboard', path: '/agent/dashboard', icon: LayoutDashboard },
    { label: 'Travelers', path: '/agent/travelers', icon: Users },
    { label: 'Tours', path: '/agent/tours', icon: Map },
    { label: 'Bookings', path: '/agent/bookings', icon: CreditCard },
    { label: 'Schedules', path: '/agent/schedules', icon: CalendarDays },
    { label: 'Vendors', path: '/agent/vendors', icon: Store },
    { label: 'Notifications', path: '/agent/notifications', icon: Bell, badge: '3' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/enter');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop / Tablet Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-navy-950 text-slate-300 border-r border-slate-800/80 fixed inset-y-0 z-30 transition-all">
        {/* Brand Header */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-slate-800/60">
          <NavLink to="/agent/dashboard" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-amber-500/20">
              <Compass className="w-5 h-5 text-navy-950" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold text-white tracking-tight">Voyara</span>
              <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">Ops Command</span>
            </div>
          </NavLink>
        </div>

        {/* Agency indicator */}
        <div className="mx-4 mt-4 px-3.5 py-2.5 rounded-xl bg-navy-900 border border-slate-800 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Agency</p>
            <p className="text-xs font-bold text-white truncate">{agent?.agencyName || 'Voyage Luxe'}</p>
          </div>
          <Badge variant="warning" size="sm" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[10px]">
            Operator
          </Badge>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom controls */}
        <div className="p-4 border-t border-slate-800/80 bg-navy-900/50 space-y-2">
          <NavLink
            to="/agent/settings"
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold ${
              location.pathname === '/agent/settings'
                ? 'bg-white/10 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Settings & Preferences</span>
          </NavLink>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Avatar name={agent?.name || 'Agent'} src={agent?.avatarUrl} size="sm" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{agent?.name || 'Agent'}</p>
                <p className="text-[10px] text-slate-400 truncate">Tour Operator</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Logout"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-navy-950/70 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-navy-950 text-slate-300 flex flex-col p-6 shadow-2xl z-10 animate-slide-in">
            <div className="flex items-center justify-between pb-6 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xl font-bold text-white">Voyara</span>
                  <span className="block text-[10px] text-amber-400">Agent Command</span>
                </div>
              </div>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <nav className="flex-1 space-y-1.5 py-4 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold ${
                      isActive ? 'bg-amber-500/15 text-amber-400' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
              <NavLink
                to="/agent/settings"
                onClick={() => setMobileSidebarOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </NavLink>
            </nav>

            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-rose-400 hover:bg-rose-500/10"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content wrapper */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-20 h-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-lg">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
              aria-label="Open operations menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Global Search */}
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search travelers, tours, booking ID..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full bg-slate-100/80 border border-slate-200/80 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-navy-600 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-3 sm:gap-5">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Operations Live</span>
            </div>

            {/* Quick alert badge */}
            <button
              onClick={() => navigate('/agent/notifications')}
              className="relative p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
            </button>

            {/* Agent Profile avatar */}
            <div
              onClick={() => navigate('/agent/settings')}
              className="flex items-center gap-3 pl-3 border-l border-slate-200 cursor-pointer group"
            >
              <Avatar name={agent?.name || 'Agent'} src={agent?.avatarUrl} size="md" />
              <div className="hidden md:block text-left">
                <div className="text-xs font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                  {agent?.name || 'Alex Vance'}
                </div>
                <div className="text-[11px] text-slate-400 font-medium">{agent?.agencyName || 'Voyage Luxe'}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
