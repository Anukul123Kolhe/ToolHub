import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Check,
  Sun,
  Moon,
  Bookmark,
  History,
  Sparkles,
  Zap,
  Search,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { useTheme } from '../context/ThemeContext';
import { useStorage } from '../context/StorageContext';
import {
  getAllAvailableModels,
  normalizeModelId,
  getPreferredModel,
  savePreferredModel,
  isFastIntentEnabled,
  setFastIntentEnabled,
  DEFAULT_GEMINI_MODEL,
  GeminiModelOption,
} from '../services/ai/geminiClient';

export const SettingsPage: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { favorites, recentTools, clearHistory, clearFavorites } = useStorage();

  // Model Selection State
  const [modelsList, setModelsList] = useState<GeminiModelOption[]>(() => getAllAvailableModels());
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_GEMINI_MODEL);
  const [customModelId, setCustomModelId] = useState<string>('');
  const [isCustomModelActive, setIsCustomModelActive] = useState<boolean>(false);
  const [modelFilter, setModelFilter] = useState<'all' | 'argon' | 'flash' | 'pro'>('all');
  const [modelSearch, setModelSearch] = useState<string>('');

  // Speed & Efficiency
  const [fastIntent, setFastIntent] = useState<boolean>(true);

  // General Status Notification
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    const allModels = getAllAvailableModels();
    setModelsList(allModels);

    const preferred = getPreferredModel();
    setSelectedModel(preferred);

    const isKnown = allModels.some((m) => m.id === preferred);
    if (!isKnown && preferred) {
      setCustomModelId(preferred);
      setIsCustomModelActive(true);
    }

    setFastIntent(isFastIntentEnabled());
  }, []);

  const handleSelectModel = (modelId: string) => {
    const normalized = normalizeModelId(modelId);
    setSelectedModel(normalized);
    setIsCustomModelActive(false);
    savePreferredModel(normalized);

    setStatusMessage(`Active AI model set to ${normalized}`);
    setTimeout(() => setStatusMessage(null), 2500);
  };

  const handleSaveCustomModel = () => {
    if (!customModelId.trim()) return;
    const cleanId = normalizeModelId(customModelId.trim());
    setSelectedModel(cleanId);
    setIsCustomModelActive(true);
    savePreferredModel(cleanId);

    if (!modelsList.some((m) => m.id === cleanId)) {
      setModelsList((prev) => [
        {
          id: cleanId,
          name: cleanId.replace(/^gemini-/, 'Gemini ').toUpperCase(),
          tag: 'Custom',
          description: `Custom model ID: ${cleanId}`,
          isLatest: true,
        },
        ...prev,
      ]);
    }

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

  // Filtered models based on tab and search
  const filteredModels = useMemo(() => {
    let list = modelsList;

    if (modelFilter === 'argon') {
      list = list.filter((m) => m.id.includes('argon') || m.tag.toLowerCase().includes('argon'));
    } else if (modelFilter === 'flash') {
      list = list.filter((m) => m.id.includes('flash') || m.id.includes('3.8'));
    } else if (modelFilter === 'pro') {
      list = list.filter((m) => m.id.includes('pro'));
    }

    if (modelSearch.trim()) {
      const q = modelSearch.toLowerCase().trim();
      list = list.filter(
        (m) =>
          m.id.toLowerCase().includes(q) ||
          m.name.toLowerCase().includes(q) ||
          m.tag.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q)
      );
    }

    return list;
  }, [modelsList, modelFilter, modelSearch]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Breadcrumbs items={[{ label: 'Settings' }]} />

      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] dark:text-white tracking-tight">
          Settings & Preferences
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 font-medium">
          Choose your AI Assistant model, optimize performance, and customize your experience.
        </p>
      </div>

      {statusMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2 shadow-xs transition-all">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* SECTION 1: AI ASSISTANT MODELS */}
      <Card className="p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-base font-black text-[#0F172A] dark:text-white">
                AI Assistant Models
              </h2>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-normal">
              Select which AI model powers your in-browser assistant. You can switch between ultra-fast models or deep-reasoning models.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="info" size="sm">
              {modelsList.length} Models Available
            </Badge>
          </div>
        </div>

        {/* Filter Pills and Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setModelFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                modelFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All ({modelsList.length})
            </button>
            <button
              type="button"
              onClick={() => setModelFilter('flash')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                modelFilter === 'flash'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Fast Flash
            </button>
            <button
              type="button"
              onClick={() => setModelFilter('pro')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                modelFilter === 'pro'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Pro Reasoning
            </button>
            <button
              type="button"
              onClick={() => setModelFilter('argon')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                modelFilter === 'argon'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Argon
            </button>
          </div>

          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={modelSearch}
              onChange={(e) => setModelSearch(e.target.value)}
              placeholder="Filter models..."
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[#0F172A] dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Model Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1">
          {filteredModels.length === 0 ? (
            <div className="col-span-2 p-6 text-center text-xs text-slate-500 dark:text-slate-400">
              No models match your search query. Try typing another term.
            </div>
          ) : (
            filteredModels.map((model) => {
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
                          model.id.includes('argon')
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300'
                            : model.id.includes('3.8') || model.tag.includes('Fast') || model.tag.includes('Ready')
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
            })
          )}
        </div>

        {/* Custom Model ID Option */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <label className="block text-xs font-bold text-[#0F172A] dark:text-slate-200">
            Use Any Custom Model ID (e.g. "argon", "3.8", or custom identifier)
          </label>
          <div className="flex items-center gap-2 max-w-md">
            <input
              type="text"
              value={customModelId}
              onChange={(e) => setCustomModelId(e.target.value)}
              placeholder="e.g. argon, 3.8, gemini-3.0-flash..."
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
          {customModelId.trim() && normalizeModelId(customModelId) !== customModelId.trim() && (
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              Alias recognized → Resolves to <code className="font-mono">{normalizeModelId(customModelId)}</code>
            </p>
          )}
          {isCustomModelActive && (
            <p className="text-xs font-bold text-blue-600 dark:text-blue-400">
              Active custom model: <code className="font-mono">{selectedModel}</code>
            </p>
          )}
        </div>
      </Card>

      {/* SECTION 2: AI SPEED & EFFICIENCY ACCELERATION */}
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

      {/* SECTION 3: APPEARANCE & THEME */}
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

      {/* SECTION 4: LOCAL STORAGE & PRIVACY */}
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
