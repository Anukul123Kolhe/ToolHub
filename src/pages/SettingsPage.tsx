import React, { useState, useEffect } from 'react';
import {
  Key,
  Cpu,
  ShieldCheck,
  Check,
  AlertCircle,
  ExternalLink,
  Trash2,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Bookmark,
  History,
  RotateCcw,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { useTheme } from '../context/ThemeContext';
import { useStorage } from '../context/StorageContext';
import {
  getEffectiveApiKey,
  saveEffectiveApiKey,
  clearEffectiveApiKey,
  getPreferredModel,
  savePreferredModel,
  testGeminiConnection,
  AVAILABLE_GEMINI_MODELS,
  DEFAULT_GEMINI_MODEL,
} from '../services/ai/geminiClient';

export const SettingsPage: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { favorites, recentTools, clearHistory, clearFavorites } = useStorage();

  const [apiKey, setApiKey] = useState<string>(() => getEffectiveApiKey());
  const [model, setModel] = useState<string>(() => getPreferredModel());
  const [showKey, setShowKey] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    setApiKey(getEffectiveApiKey());
    setModel(getPreferredModel());
  }, []);

  const handleSave = () => {
    saveEffectiveApiKey(apiKey);
    savePreferredModel(model);
    setSaveStatus('Settings saved successfully!');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleClearKey = () => {
    clearEffectiveApiKey();
    setApiKey('');
    setTestResult(null);
    setSaveStatus('API key removed from local storage.');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      setTestResult({
        success: false,
        message: 'Please enter an API key before testing.',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      await testGeminiConnection(apiKey, model);
      setTestResult({
        success: true,
        message: `Successfully connected to Google Gemini using ${model}!`,
      });
      saveEffectiveApiKey(apiKey);
      savePreferredModel(model);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Connection test failed. Please verify your API key.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Breadcrumbs items={[{ label: 'Settings' }]} />

      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Settings & Preferences
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your Google Gemini AI credentials, preferred model, appearance, and local storage.
        </p>
      </div>

      {saveStatus && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2 transition-all">
          <Check className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{saveStatus}</span>
        </div>
      )}

      {/* Section 1: AI Assistant & Google Gemini API */}
      <Card className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Google Gemini AI Integration</span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    apiKey
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                      : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                  }`}
                >
                  {apiKey ? 'API Connected' : 'Key Not Configured'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Powers conversational tool guidance, smart advice, and parameters.
              </p>
            </div>
          </div>

          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
          >
            <span>Get Free API Key</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="space-y-4">
          {/* API Key Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Google Gemini API Key</span>
              {apiKey && (
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-normal">
                  Saved in localStorage
                </span>
              )}
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3 text-slate-400">
                <Key className="w-4 h-4" />
              </div>
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full text-xs font-mono pl-9 pr-24 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                title={showKey ? 'Hide Key' : 'Show Key'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Your key is saved only in your personal browser storage (or loaded from <code>.env</code>). It is sent directly to <code>generativelanguage.googleapis.com</code> via HTTPS and never passes through any third-party server.
            </p>
          </div>

          {/* Model Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-sky-500" />
              <span>Preferred Google Gemini Model</span>
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
            >
              {AVAILABLE_GEMINI_MODELS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>
          </div>

          {/* Test Result Message */}
          {testResult && (
            <div
              className={`p-3 rounded-xl flex items-center gap-2 text-xs font-semibold ${
                testResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300'
              }`}
            >
              {testResult.success ? (
                <Check className="w-4 h-4 shrink-0 text-emerald-500" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <Button onClick={handleSave} variant="primary" size="sm" className="gap-1.5">
                <Check className="w-3.5 h-3.5" /> Save API Settings
              </Button>
              <Button
                onClick={handleTestConnection}
                variant="secondary"
                size="sm"
                disabled={isTesting || !apiKey.trim()}
                className="gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                {isTesting ? 'Testing Connection...' : 'Test Connection'}
              </Button>
            </div>

            {apiKey && (
              <Button
                onClick={handleClearKey}
                variant="ghost"
                size="sm"
                className="gap-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remove Key
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Section 2: Appearance & Theme */}
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
            className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
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
            className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
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

      {/* Section 3: Local Storage & Privacy */}
      <Card className="p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Local Data & Privacy Controls
          </h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> 100% In-Browser
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5 text-sky-500" /> Bookmarked Utilities
            </span>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {favorites.length} saved
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-indigo-500" /> Recent Tool Sessions
            </span>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {recentTools.length} recorded
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button
            onClick={() => {
              clearHistory();
              setSaveStatus('Recent tools and session history cleared.');
              setTimeout(() => setSaveStatus(null), 3000);
            }}
            variant="secondary"
            size="sm"
            className="gap-1.5"
            disabled={recentTools.length === 0}
          >
            <RotateCcw className="w-3.5 h-3.5" /> Clear Recent History
          </Button>

          <Button
            onClick={() => {
              if (window.confirm('Are you sure you want to clear all bookmarks, history, and local settings?')) {
                clearHistory();
                clearFavorites();
                clearEffectiveApiKey();
                setApiKey('');
                setSaveStatus('All local ToolHub data reset.');
                setTimeout(() => setSaveStatus(null), 3000);
              }
            }}
            variant="ghost"
            size="sm"
            className="gap-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
          >
            <Trash2 className="w-3.5 h-3.5" /> Reset All Local Data
          </Button>
        </div>
      </Card>
    </div>
  );
};
