import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Compass,
  LayoutDashboard,
  Compass as ExploreIcon,
  Luggage,
  User,
  LogOut,
  Bell,
  Search,
  Menu,
  X,
  PlusCircle,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';

export const TravelerLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isCopilot = location.pathname.startsWith('/user/ai-trip-copilot');

  const navItems = [
    { label: 'Dashboard', path: '/user/dashboard', icon: LayoutDashboard },
    { label: 'Explore', path: '/user/explore', icon: ExploreIcon },
    { label: 'AI Trip Co-Pilot', path: '/user/ai-trip-copilot', icon: Sparkles },
    { label: 'My Trips', path: '/user/trips', icon: Luggage },
    { label: 'Profile', path: '/user/profile', icon: User },
  ];

  const handleLogout = () => {
    logout();
    navigate('/enter');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/user/explore?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className={`flex ${isCopilot ? 'h-screen overflow-hidden bg-slate-950' : 'min-h-screen bg-slate-50'}`}>
      {/* Desktop & Tablet Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-navy-950 text-slate-300 border-r border-slate-800/80 fixed inset-y-0 z-30 transition-all">
        {/* Brand Header */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-slate-800/60">
          <NavLink to="/user/dashboard" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center shadow-lg shadow-brand-500/25">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold text-white tracking-tight">GoFlexi</span>
              <span className="text-[10px] font-semibold text-brand-400 uppercase tracking-wider">Traveler Portal</span>
            </div>
          </NavLink>
        </div>

        {/* Quick Action */}
        <div className="px-4 pt-5 pb-3">
          <Button
            variant="accent"
            size="md"
            onClick={() => navigate('/user/trips/new')}
            className="w-full justify-center rounded-xl bg-brand-500 hover:bg-brand-600 shadow-md shadow-brand-500/20"
            icon={<PlusCircle className="w-4 h-4" />}
          >
            <span>Plan New Trip</span>
          </Button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-3 py-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-800/80 bg-navy-900/50">
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <Avatar
              name={user?.name || 'Traveler'}
              src={user?.avatarUrl}
              size="md"
              status="online"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{user?.name || 'Traveler'}</p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email || 'traveler@GoFlexi.com'}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-navy-950/70 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-navy-950 text-slate-300 flex flex-col p-6 shadow-2xl z-10 animate-slide-in">
            <div className="flex items-center justify-between pb-6 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-500 text-white flex items-center justify-center">
                  <Compass className="w-5 h-5" />
                </div>
                <span className="text-xl font-bold text-white">GoFlexi</span>
              </div>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="py-4">
              <Button
                variant="accent"
                onClick={() => {
                  setMobileSidebarOpen(false);
                  navigate('/user/trips/new');
                }}
                className="w-full justify-center rounded-xl"
                icon={<PlusCircle className="w-4 h-4" />}
              >
                Plan New Trip
              </Button>
            </div>

            <nav className="flex-1 space-y-2 py-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold ${
                      isActive ? 'bg-brand-500/15 text-brand-400' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-400 hover:bg-rose-500/10"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Wrapper */}
      <div className={`flex-1 flex flex-col md:pl-64 min-w-0 ${isCopilot ? 'h-screen overflow-hidden' : ''}`}>
        {/* Top Navbar */}
        {!isCopilot && (
          <header className="sticky top-0 z-20 h-20 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
                aria-label="Open navigation drawer"
              >
                <Menu className="w-6 h-6" />
              </button>

              {/* Quick Search */}
              <form onSubmit={handleSearchSubmit} className="relative hidden sm:block w-72 lg:w-96">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search destinations (e.g. Goa, Manali, Kerala)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-100/80 border border-slate-200/80 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-all"
                />
              </form>
            </div>

            {/* Right Side Icons */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Notification Popover Toggle */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
                  aria-label="View notifications"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-brand-500" />
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-40 animate-scale-up">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Notifications</span>
                      <span className="text-[11px] font-semibold text-brand-600">All caught up</span>
                    </div>
                    <div className="py-3 space-y-3">
                      <div className="flex gap-3 text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-slate-800">Preferences Saved</p>
                          <p className="text-slate-500 text-[11px]">Your travel style profile is active and personalized.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile badge */}
              <div
                onClick={() => navigate('/user/profile')}
                className="flex items-center gap-3 pl-2 sm:pl-3 border-l border-slate-200 cursor-pointer group"
              >
                <Avatar
                  name={user?.name || 'Traveler'}
                  src={user?.avatarUrl}
                  size="md"
                />
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                    {user?.name || 'Traveler'}
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium">Traveler</div>
                </div>
              </div>
            </div>
          </header>
        )}

        {/* Page Content Outlet */}
        <main className={isCopilot ? "flex-1 w-full h-full overflow-hidden bg-slate-950" : "flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto"}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
