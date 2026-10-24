import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Check,
  Sun,
  Moon,
  Bookmark,
  History,
  Zap,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { useTheme } from '../context/ThemeContext';
import { useStorage } from '../context/StorageContext';
import {
  isFastIntentEnabled,
  setFastIntentEnabled,
} from '../services/ai/geminiClient';

export const SettingsPage: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { favorites, recentTools, clearHistory, clearFavorites } = useStorage();

  // Speed & Efficiency
  const [fastIntent, setFastIntent] = useState<boolean>(true);

  // General Status Notification
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    setFastIntent(isFastIntentEnabled());
  }, []);

  const handleToggleFastIntent = (enabled: boolean) => {
    setFastIntent(enabled);
    setFastIntentEnabled(enabled);

    setStatusMessage(enabled ? 'Zero-latency quick intent routing enabled.' : 'Quick intent routing disabled.');
    setTimeout(() => setStatusMessage(null), 2000);
  };

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
        <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] dark:text-white tracking-tight">
          Settings & Preferences
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 font-medium">
          Optimize performance, configure themes, and manage your ToolHub preferences.
        </p>
      </div>

      {statusMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2 shadow-xs transition-all">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* SECTION 1: AI SPEED & EFFICIENCY ACCELERATION */}
      <Card className="p-6 space-y-4">
        <div className="pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-black text-[#0F172A] dark:text-white">
              Speed & Latency Optimization
            </h2>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-normal">
            Configure performance settings for instant responses and minimal latency.
          </p>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
          <div className="space-y-0.5 pr-4">
            <h4 className="text-xs font-bold text-[#0F172A] dark:text-white">
              Zero-Latency Quick Intent Routing
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-normal leading-relaxed">
              Instantly resolve direct tool catalog queries (e.g., "Give me list of image tools", "How to compress image") in 0ms without waiting for network round-trips.
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
            <input
              type="checkbox"
              checked={fastIntent}
              onChange={(e) => handleToggleFastIntent(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </Card>

      {/* SECTION 2: APPEARANCE & THEME */}
      <Card className="p-6 space-y-4">
        <h2 className="text-base font-black text-[#0F172A] dark:text-white flex items-center gap-2">
          <span>Appearance & Theme</span>
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 font-normal">
          Choose your interface theme for high contrast or reduced eye strain.
        </p>

        <div className="grid grid-cols-2 gap-3 sm:w-80">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
              theme === 'light'
                ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold shadow-xs'
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
                ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold shadow-xs'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
            }`}
          >
            <Moon className="w-4 h-4 text-blue-400" />
            <span className="text-xs">Dark Mode</span>
          </button>
        </div>
      </Card>

      {/* SECTION 3: LOCAL STORAGE & PRIVACY */}
      <Card className="p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-base font-black text-[#0F172A] dark:text-white">
              Local Browser Storage & Privacy
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-normal">
              ToolHub preserves 100% data confidentiality. All state stays inside your device.
            </p>
          </div>
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bookmark className="w-4 h-4 text-amber-500" />
              <div>
                <p className="text-xs font-bold text-[#0F172A] dark:text-slate-100">Favorite Tools</p>
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

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <History className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-xs font-bold text-[#0F172A] dark:text-slate-100">Recent Tools</p>
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
