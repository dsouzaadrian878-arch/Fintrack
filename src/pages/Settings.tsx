import React, { useState, useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import {
  User as UserIcon,
  Settings as SettingsIcon,
  ShieldAlert,
  Moon,
  Sun,
  Coins,
  Download,
  Upload,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertOctagon,
  Sparkles,
  HelpCircle,
  Camera
} from 'lucide-react';
import { useStore } from '../store';
import { Card, Button, Input, Modal } from '../components/UI';
import { CURRENCIES, AVATARS } from '../constants';

export default function Settings() {
  const {
    user,
    settings,
    updateProfile,
    updateSettings,
    resetAllData,
    init
  } = useStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile states
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatarUrl || AVATARS[0]);
  const [showProfileSuccess, setShowProfileSuccess] = useState(false);

  // Settings states
  const [darkMode, setDarkMode] = useState(settings?.darkMode || false);
  const [currency, setCurrency] = useState(settings?.currency || 'USD');
  const [largeThreshold, setLargeThreshold] = useState(settings?.largeExpenseThreshold?.toString() || '1000');
  const [showSettingsSuccess, setShowSettingsSuccess] = useState(false);

  // Reset modal state
  const [isResetOpen, setIsResetOpen] = useState(false);

  // Backup state
  const [backupError, setBackupError] = useState<string | null>(null);
  const [backupSuccess, setBackupSuccess] = useState<string | null>(null);

  const currencySymbol = useMemo(() => {
    const curr = CURRENCIES.find(c => c.code === currency);
    return curr ? curr.symbol : '$';
  }, [currency]);

  // Handle Profile Submit
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    updateProfile({
      name,
      email,
      avatarUrl: selectedAvatar
    });

    setShowProfileSuccess(true);
    setTimeout(() => setShowProfileSuccess(false), 3000);
  };

  // Handle Settings Submit
  const handleSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currency || !largeThreshold) return;

    updateSettings({
      darkMode,
      currency,
      backupReminder: settings?.backupReminder || true,
      largeExpenseThreshold: parseFloat(largeThreshold)
    });

    setShowSettingsSuccess(true);
    setTimeout(() => setShowSettingsSuccess(false), 3000);
  };

  // Export JSON Backup
  const handleExportBackup = () => {
    try {
      const keys = [
        'fintrack_user',
        'fintrack_users_list',
        'fintrack_transactions',
        'fintrack_categories',
        'fintrack_budgets',
        'fintrack_goals',
        'fintrack_settings',
        'fintrack_notifications'
      ];

      const backupObj: Record<string, string | null> = {};
      keys.forEach(key => {
        backupObj[key] = localStorage.getItem(key);
      });

      const backupStr = JSON.stringify(backupObj, null, 2);
      const blob = new Blob([backupStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `FinTrack_Secure_Backup_${new Date().toISOString().split('T')[0]}.json`;
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setBackupSuccess('System data backup file exported successfully.');
      setTimeout(() => setBackupSuccess(null), 5000);
    } catch (err) {
      setBackupError('Failed to generate local database backup.');
      setTimeout(() => setBackupError(null), 5000);
    }
  };

  // Import JSON Backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text) as Record<string, string | null>;

        // Simple validation
        if (!parsed || typeof parsed !== 'object' || !('fintrack_user' in parsed)) {
          throw new Error('Invalid backup file formatting');
        }

        // Install keys
        Object.entries(parsed).forEach(([key, val]) => {
          if (val) {
            localStorage.setItem(key, val);
          }
        });

        setBackupSuccess('Backup imported and verified. Reloading assets...');
        setTimeout(() => {
          setBackupSuccess(null);
          // Reload state and refresh page
          init();
          window.location.reload();
        }, 1500);
      } catch (err) {
        setBackupError('Invalid backup file. Format validation failed.');
        setTimeout(() => setBackupError(null), 5000);
      }
    };
    reader.readAsText(file);
  };

  // Handle Application Hard Reset
  const handleResetConfirm = () => {
    resetAllData();
    setIsResetOpen(false);
    window.location.href = '/login'; // Redirect to login
  };

  return (
    <div className="space-y-8 pb-16">
      {/* HEADER SECTION */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          System Preferences
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Customize currency settings, modify metadata files, and secure backups.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Profile Details Panel */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* PROFILE FORM CARD */}
          <Card className="space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-50 dark:border-slate-800/30">
              <UserIcon className="h-5 w-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest">My Profile Info</h3>
            </div>

            {showProfileSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-400 text-center rounded-xl">
                Profile credentials synced to local state.
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-6">
              
              {/* Avatar options selection list */}
              <div className="space-y-2.5">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Choose Avatar Profile</label>
                <div className="flex flex-wrap gap-4 items-center">
                  <img
                    src={selectedAvatar}
                    alt="Active Avatar"
                    className="h-16 w-16 rounded-full border-2 border-emerald-600 object-cover p-0.5 shadow-md"
                  />
                  <div className="flex flex-wrap gap-2.5">
                    {AVATARS.map((av, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setSelectedAvatar(av)}
                        className={`h-10 w-10 rounded-full overflow-hidden border-2 transition-all relative ${
                          selectedAvatar === av ? 'border-emerald-600' : 'border-slate-100 dark:border-slate-800'
                        }`}
                      >
                        <img src={av} alt="Avatar option" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Display Username"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <Input
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <Button type="submit">
                Commit Changes
              </Button>
            </form>
          </Card>

          {/* SYSTEM SETTINGS CARD */}
          <Card className="space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-50 dark:border-slate-800/30">
              <SettingsIcon className="h-5 w-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest">General Preferences</h3>
            </div>

            {showSettingsSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-400 text-center rounded-xl">
                System preferences saved successfully.
              </div>
            )}

            <form onSubmit={handleSettingsSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Currency selector list */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Default Currency System</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2.5 outline-none text-slate-900 dark:text-slate-100"
                  >
                    {CURRENCIES.map(c => (
                      <option key={c.code} value={c.code}>{c.code} ({c.symbol}) — {c.name}</option>
                    ))}
                  </select>
                </div>

                <Input
                  label={`Large Expense Warning Threshold (${currencySymbol})`}
                  type="number"
                  value={largeThreshold}
                  onChange={(e) => setLargeThreshold(e.target.value)}
                  required
                />
              </div>

              {/* Dark mode toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800/50">
                <div className="flex items-center gap-2.5">
                  <Moon className="h-5 w-5 text-indigo-500" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Dark Display Interface</h4>
                    <p className="text-3xs text-slate-400 mt-0.5">Toggle eye-safe slate dark coloring mode</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={darkMode}
                  onChange={(e) => setDarkMode(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 h-4.5 w-4.5 cursor-pointer"
                />
              </div>

              <Button type="submit">
                Apply Preferences
              </Button>
            </form>
          </Card>

        </div>

        {/* SIDE ACTIONS PANEL: BACKUP & DATA DESTRUCTION */}
        <div className="space-y-8">
          
          {/* BACKUP & RESTORE DATA CARD */}
          <Card className="space-y-5">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest border-b border-slate-50 dark:border-slate-800/30 pb-3">Database Utilities</h3>

            {backupSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-3xs font-semibold text-emerald-700 dark:text-emerald-400 rounded-xl leading-relaxed">
                {backupSuccess}
              </div>
            )}

            {backupError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-3xs font-semibold text-rose-700 dark:text-rose-400 rounded-xl leading-relaxed">
                {backupError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <p className="text-slate-400 dark:text-slate-500 text-3xs leading-relaxed">
                Since this application utilizes Local Storage, you can download a full backup file (.json) to safeguard your ledger against browser deletions.
              </p>

              {/* Export Button */}
              <button
                onClick={handleExportBackup}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40 font-semibold text-xs transition-all outline-none"
              >
                <Download className="h-4 w-4" /> Export Backup file (.json)
              </button>

              {/* Import trigger */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40 font-semibold text-xs transition-all outline-none"
              >
                <Upload className="h-4 w-4" /> Import Backup file (.json)
              </button>
            </div>
          </Card>

          {/* DANGER DESTRUCTION BOX */}
          <Card className="border border-rose-100 dark:border-rose-950 bg-rose-50/10 dark:bg-rose-950/5 space-y-4">
            <div className="flex items-center gap-2 text-rose-600 border-b border-rose-100/50 dark:border-rose-950/40 pb-3">
              <ShieldAlert className="h-5 w-5" />
              <h3 className="text-xs font-bold uppercase tracking-widest">Data Destruction</h3>
            </div>

            <p className="text-3xs text-rose-600/75 dark:text-rose-400/70 leading-relaxed font-semibold">
              Warning: Resetting deletes your registered user credentials, settings profile, custom categories, saving goals, and full ledger logs permanently.
            </p>

            <Button onClick={() => setIsResetOpen(true)} variant="danger" className="w-full text-xs font-bold py-3">
              Reset Application Cache
            </Button>
          </Card>

        </div>

      </div>

      {/* DESTRUCTIVE RESET DIALOG */}
      <Modal isOpen={isResetOpen} onClose={() => setIsResetOpen(false)} title="Destroy Application Cache" size="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <AlertOctagon className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Confirm Cache Purge</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Are you absolutely sure you want to proceed? Every registered file will be flushed permanently.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3.5 pt-3">
            <Button variant="ghost" onClick={() => setIsResetOpen(false)}>
              Keep Cache
            </Button>
            <Button variant="danger" onClick={handleResetConfirm}>
              Yes, Purge Cache
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
