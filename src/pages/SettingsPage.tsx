import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Check,
  Sun,
  Moon,
  Bookmark,
  History,
  Key,
  Sparkles,
  Eye,
  EyeOff,
  ExternalLink,
  Zap,
  Cpu,
  Trash2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { useTheme } from '../context/ThemeContext';
import { useStorage } from '../context/StorageContext';
import {
  AVAILABLE_GEMINI_MODELS,
  getPreferredModel,
  savePreferredModel,
  getUserApiKey,
  saveUserApiKey,
  removeUserApiKey,
  hasUserApiKey,
  testGeminiConnection,
  isFastIntentEnabled,
  setFastIntentEnabled,
  DEFAULT_GEMINI_MODEL,
} from '../services/ai/geminiClient';

export const SettingsPage: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { favorites, recentTools, clearHistory, clearFavorites } = useStorage();

  // API Key State
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [isCustomKeySaved, setIsCustomKeySaved] = useState<boolean>(false);

  // Model Selection State
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_GEMINI_MODEL);
  const [customModelId, setCustomModelId] = useState<string>('');
  const [isCustomModelActive, setIsCustomModelActive] = useState<boolean>(false);

  // Speed & Efficiency
  const [fastIntent, setFastIntent] = useState<boolean>(true);

  // Test Connection State
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // General Status Notification
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    const savedKey = getUserApiKey();
    setApiKeyInput(savedKey);
    setIsCustomKeySaved(Boolean(savedKey));

    const preferred = getPreferredModel();
    setSelectedModel(preferred);

    const isKnown = AVAILABLE_GEMINI_MODELS.some((m) => m.id === preferred);
    if (!isKnown && preferred) {
      setCustomModelId(preferred);
      setIsCustomModelActive(true);
    }

    setFastIntent(isFastIntentEnabled());
  }, []);

  const handleSaveApiKey = () => {
    saveUserApiKey(apiKeyInput);
    const hasKey = Boolean(apiKeyInput.trim());
    setIsCustomKeySaved(hasKey);
    setTestResult(null);

    setStatusMessage(hasKey ? 'Google Gemini API key saved successfully!' : 'API key removed. Using default engine.');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleRemoveApiKey = () => {
    removeUserApiKey();
    setApiKeyInput('');
    setIsCustomKeySaved(false);
    setTestResult(null);

    setStatusMessage('Custom API key removed. Reverted to built-in ToolHub AI engine.');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    const activeModel = isCustomModelActive && customModelId.trim() ? customModelId.trim() : selectedModel;
    const res = await testGeminiConnection(apiKeyInput, activeModel);

    setIsTesting(false);
    setTestResult(res);
  };

  const handleSelectModel = (modelId: string) => {
    setSelectedModel(modelId);
    setIsCustomModelActive(false);
    savePreferredModel(modelId);

    setStatusMessage(`Active AI model set to ${modelId}`);
    setTimeout(() => setStatusMessage(null), 2500);
  };

  const handleSaveCustomModel = () => {
    if (!customModelId.trim()) return;
    const cleanId = customModelId.trim();
    setSelectedModel(cleanId);
    setIsCustomModelActive(true);
    savePreferredModel(cleanId);

    setStatusMessage(`Custom model "${cleanId}" activated!`);
    setTimeout(() => setStatusMessage(null), 2500);
  };

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
          Settings & AI Configuration
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 font-medium">
          Configure your Google Gemini API key, select AI models, and customize your experience.
        </p>
      </div>

      {statusMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2 shadow-xs transition-all">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* SECTION 1: GOOGLE GEMINI API KEY CONFIGURATION */}
      <Card className="p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-base font-black text-[#0F172A] dark:text-white">
                Google Gemini API Key
              </h2>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-normal">
              Connect your own free key from Google AI Studio to use unlimited custom quotas and unlock all models.
            </p>
          </div>

          <div>
            {isCustomKeySaved ? (
              <Badge variant="success" size="sm">
                Custom Key Active
              </Badge>
            ) : (
              <Badge variant="default" size="sm">
                Built-in Key Active
              </Badge>
            )}
          </div>
        </div>

        {/* API Key Input & Action Controls */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-[#0F172A] dark:text-slate-200">
            Enter Your Google API Key
          </label>

          <div className="relative rounded-xl shadow-xs">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full text-xs font-mono px-4 py-3 pr-24 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[#0F172A] dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />

            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
              title={showApiKey ? 'Hide key' : 'Show key'}
            >
              {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={handleSaveApiKey}
                size="sm"
                icon={<Check className="w-4 h-4" />}
              >
                Save API Key
              </Button>

              <Button
                onClick={handleTestConnection}
                variant="outline"
                size="sm"
                isLoading={isTesting}
                icon={<Zap className="w-4 h-4 text-blue-600" />}
              >
                Test Connection
              </Button>

              {isCustomKeySaved && (
                <Button
                  onClick={handleRemoveApiKey}
                  variant="ghost"
                  size="sm"
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  icon={<Trash2 className="w-4 h-4" />}
                >
                  Remove Key
                </Button>
              )}
            </div>

            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              <span>Get Free Google API Key</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Test Connection Alert Box */}
          {testResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2.5 transition-all ${
                testResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
            <span className="font-bold text-slate-700 dark:text-slate-300">Privacy Guarantee:</span> Your API key is stored 100% locally in your device's browser memory (<code className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">localStorage</code>). It is never sent to our servers or saved anywhere outside your browser.
          </p>
        </div>
      </Card>

      {/* SECTION 2: GOOGLE GEMINI MODEL SELECTION */}
      <Card className="p-6 space-y-5">
        <div className="pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base font-black text-[#0F172A] dark:text-white">
              Google Gemini Models
            </h2>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-normal">
            Choose which Google Gemini model powers your AI Assistant. You can switch between ultra-fast or deep-reasoning models.
          </p>
        </div>

        {/* Model Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {AVAILABLE_GEMINI_MODELS.map((model) => {
            const isSelected = selectedModel === model.id && !isCustomModelActive;

            return (
              <div
                key={model.id}
                onClick={() => handleSelectModel(model.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 shadow-sm ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-bold text-sm text-[#0F172A] dark:text-white">
                      {model.name}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        model.tag.includes('Fast')
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300'
                      }`}
                    >
                      {model.tag}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                    {model.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                  <code className="text-slate-400 font-mono">{model.id}</code>
                  {isSelected ? (
                    <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      Active Model
                    </span>
                  ) : (
                    <span className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                      Select
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Custom Model ID Option */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <label className="block text-xs font-bold text-[#0F172A] dark:text-slate-200">
            Use Any Custom Google Model (e.g., Experimental or Next-Gen Previews)
          </label>
          <div className="flex items-center gap-2 max-w-md">
            <input
              type="text"
              value={customModelId}
              onChange={(e) => setCustomModelId(e.target.value)}
              placeholder="e.g. gemini-3.0-flash, gemini-exp..."
              className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[#0F172A] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button
              onClick={handleSaveCustomModel}
              size="sm"
              variant="outline"
              disabled={!customModelId.trim()}
            >
              Set Model
            </Button>
          </div>
          {isCustomModelActive && (
            <p className="text-xs font-bold text-blue-600 dark:text-blue-400">
              Active custom model: <code className="font-mono">{selectedModel}</code>
            </p>
          )}
        </div>
      </Card>

      {/* SECTION 3: AI SPEED & EFFICIENCY ACCELERATION */}
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

      {/* SECTION 4: APPEARANCE & THEME */}
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

      {/* SECTION 5: LOCAL STORAGE & PRIVACY */}
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
