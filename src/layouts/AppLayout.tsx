import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Target,
  Tag,
  BarChart3,
  Settings,
  Bell,
  Menu,
  X,
  LogOut,
  User as UserIcon,
  Sun,
  Moon,
  Trash2,
  Check
} from 'lucide-react';
import { useStore } from '../store';
import { Button } from '../components/UI';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const {
    user,
    notifications,
    settings,
    logout,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications,
    updateProfile
  } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Transactions', path: '/transactions', icon: ArrowLeftRight },
    { name: 'Budgets', path: '/budgets', icon: Wallet },
    { name: 'Savings Goals', path: '/goals', icon: Target },
    { name: 'Categories', path: '/categories', icon: Tag },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  // Sync theme class with local user setting
  useEffect(() => {
    if (user?.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [user?.theme]);

  const toggleTheme = () => {
    if (!user) return;
    const nextTheme = user.theme === 'light' ? 'dark' : 'light';
    updateProfile({ theme: nextTheme });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex transition-colors duration-200">
      
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800/80 sticky top-0 h-screen z-20">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-50 dark:border-slate-800/30 gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-emerald-600/10">
            F
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
            Fin<span className="text-emerald-600 dark:text-emerald-500">Track</span>
          </span>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon
                  className={`mr-3 h-5 w-5 transition-transform duration-200 ${
                    isActive
                      ? 'text-emerald-600 dark:text-emerald-400 scale-105'
                      : 'text-slate-400 group-hover:text-slate-500 dark:group-hover:text-slate-300'
                  }`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Quick Info Footer */}
        <div className="p-4 border-t border-slate-50 dark:border-slate-800/30">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all cursor-pointer" onClick={() => navigate('/settings')}>
            <img
              src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80'}
              alt="Avatar"
              className="h-10 w-10 rounded-full border border-slate-100 dark:border-slate-800 object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-950 dark:text-white truncate">{user?.name}</p>
              <p className="text-2xs text-slate-400 dark:text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* MOBILE DRAWER OVERLAY */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/70 z-40 backdrop-blur-xs lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800/85 z-50 p-4 flex flex-col lg:hidden shadow-2xl"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-50 dark:border-slate-800/40">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center text-white font-bold text-base shadow-md">
                    F
                  </div>
                  <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
                    FinTrack
                  </span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 py-4 space-y-1">
                {menuItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold'
                          : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/30'
                      }`}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              <div className="pt-4 border-t border-slate-50 dark:border-slate-800/40 space-y-2">
                <div className="flex items-center justify-between p-2">
                  <div className="flex items-center gap-2">
                    <img
                      src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80'}
                      alt="Avatar"
                      className="h-8 w-8 rounded-full object-cover"
                    />
                    <span className="text-xs font-semibold truncate max-w-[120px]">{user?.name}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleLogout} className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 px-2 py-1">
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* HEADER BAR */}
        <header className="h-16 border-b border-slate-100 dark:border-slate-900 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/50"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:block">
              <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                System Active
              </p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3.5 relative">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200 transition-all outline-none"
              title={user?.theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {user?.theme === 'dark' ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-indigo-600" />}
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className={`p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all outline-none relative ${
                  isNotifOpen ? 'bg-slate-50 dark:bg-slate-800/50 text-emerald-600' : ''
                }`}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
                )}
              </button>

              {/* Notification Dropdown Panel */}
              <AnimatePresence>
                {isNotifOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsNotifOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2.5 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden z-40"
                    >
                      <div className="px-4 py-3.5 border-b border-slate-50 dark:border-slate-800/50 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
                        <span className="font-semibold text-sm text-slate-900 dark:text-white">Notifications ({unreadCount})</span>
                        <div className="flex gap-2">
                          {unreadCount > 0 && (
                            <button
                              onClick={markAllNotificationsRead}
                              className="text-2xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                            >
                              Mark read
                            </button>
                          )}
                          <button
                            onClick={clearNotifications}
                            className="text-2xs font-bold text-slate-400 hover:text-rose-500 flex items-center gap-1"
                          >
                            <Trash2 className="h-3 w-3" /> Clear
                          </button>
                        </div>
                      </div>

                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800/40">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              className={`p-4 text-left transition-colors relative flex items-start gap-3 ${
                                !n.read ? 'bg-emerald-50/20 dark:bg-emerald-500/5' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/20'
                              }`}
                            >
                              <div className="flex-1 space-y-0.5">
                                <p className={`text-xs font-semibold ${!n.read ? 'text-slate-950 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                  {n.title}
                                </p>
                                <p className="text-2xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                  {n.message}
                                </p>
                                <p className="text-3xs text-slate-400 dark:text-slate-500">
                                  {new Date(n.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                              {!n.read && (
                                <button
                                  onClick={() => markNotificationRead(n.id)}
                                  className="h-5 w-5 rounded-md border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 bg-white dark:bg-slate-950 shadow-sm"
                                  title="Mark as read"
                                >
                                  <Check className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Menu Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-1.5 focus:outline-none"
              >
                <img
                  src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80'}
                  alt="Avatar"
                  className="h-8.5 w-8.5 rounded-full border border-slate-200 dark:border-slate-800 object-cover cursor-pointer hover:opacity-90 transition-all shadow-sm"
                />
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsProfileOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2.5 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden z-40 p-1.5"
                    >
                      <div className="px-3.5 py-3 border-b border-slate-50 dark:border-slate-800/40 text-left">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
                        <p className="text-3xs text-slate-400 dark:text-slate-500 truncate mt-0.5">{user?.email}</p>
                      </div>

                      <div className="py-1">
                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            navigate('/settings');
                          }}
                          className="w-full flex items-center px-3.5 py-2.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200 rounded-xl transition-all"
                        >
                          <UserIcon className="mr-2.5 h-4 w-4" />
                          My Profile
                        </button>
                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            navigate('/settings');
                          }}
                          className="w-full flex items-center px-3.5 py-2.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200 rounded-xl transition-all"
                        >
                          <Settings className="mr-2.5 h-4 w-4" />
                          System Settings
                        </button>
                      </div>

                      <div className="border-t border-slate-50 dark:border-slate-800/40 p-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center px-3 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-all"
                        >
                          <LogOut className="mr-2.5 h-4 w-4" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* MAIN BODY SCROLL AREA */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-8">
          {children}
        </main>
      </div>
    </div>
  );
}
