import React, { useState } from 'react';
import {
  ShieldCheck,
  Check,
  Sun,
  Moon,
  Bookmark,
  History,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { useTheme } from '../context/ThemeContext';
import { useStorage } from '../context/StorageContext';

export const SettingsPage: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { favorites, recentTools, clearHistory, clearFavorites } = useStorage();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleClearHistory = () => {
    clearHistory();
    setStatusMessage('Recent tools history cleared.');
    setTimeout(() => setStatusMessage(null), 2500);
  };

  const handleClearFavorites = () => {
    clearFavorites();
    setStatusMessage('Pinned favorites cleared.');
    setTimeout(() => setStatusMessage(null), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Breadcrumbs items={[{ label: 'Settings' }]} />

      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Settings & Preferences
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Customize interface appearance and manage your local browser data.
        </p>
      </div>

      {statusMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2 transition-all">
          <Check className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Section 1: Appearance & Theme */}
      <Card className="p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <span>Appearance & Theme</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Choose your interface theme for high contrast or reduced eye strain.
        </p>

        <div className="grid grid-cols-2 gap-3 sm:w-80">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
              theme === 'light'
                ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-300 font-bold shadow-sm'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
            }`}
          >
            <Sun className="w-4 h-4 text-amber-500" />
            <span className="text-xs">Light Mode</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
              theme === 'dark'
                ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-300 font-bold shadow-sm'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
            }`}
          >
            <Moon className="w-4 h-4 text-indigo-400" />
            <span className="text-xs">Dark Mode</span>
          </button>
        </div>
      </Card>

      {/* Section 2: Local Storage & Privacy */}
      <Card className="p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Local Browser Storage & Privacy
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              ToolHub preserves 100% data confidentiality. All state stays inside your device.
            </p>
          </div>
          <ShieldCheck className="w-5 h-5 text-emerald-500" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bookmark className="w-4 h-4 text-sky-500" />
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Favorite Tools</p>
                <p className="text-[11px] text-slate-400">{favorites.length} tools pinned</p>
              </div>
            </div>
            <Button
              onClick={handleClearFavorites}
              variant="outline"
              size="sm"
              disabled={favorites.length === 0}
              className="text-xs"
            >
              Clear
            </Button>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <History className="w-4 h-4 text-amber-500" />
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Recent Tools</p>
                <p className="text-[11px] text-slate-400">{recentTools.length} tools recorded</p>
              </div>
            </div>
            <Button
              onClick={handleClearHistory}
              variant="outline"
              size="sm"
              disabled={recentTools.length === 0}
              className="text-xs"
            >
              Clear
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
