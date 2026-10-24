import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ArrowRight, CornerDownLeft, Sparkles, WifiOff } from 'lucide-react';
import { searchTools, getPopularTools } from '../../services/search/searchService';
import { ToolCategory, ToolRegistryItem } from '../../types/tool';
import { CATEGORIES } from '../../config/categories';
import { Badge } from '../common/Badge';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | 'all'>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const results = searchTools(query, {
    category: selectedCategory,
  });

  const displayTools: ToolRegistryItem[] = query.trim() ? results : getPopularTools();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery('');
      setSelectedCategory('all');
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, selectedCategory]);

  const handleSelectTool = (tool: ToolRegistryItem) => {
    onClose();
    navigate(tool.path);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < displayTools.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (displayTools[selectedIndex]) {
        handleSelectTool(displayTools[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-start justify-center p-4 pt-16 sm:pt-24 text-center">
        {/* Backdrop */}
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        />

        {/* Modal Window */}
        <div
          onKeyDown={handleKeyDown}
          className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl text-left transition-all"
        >
          {/* Search Header Input */}
          <div className="relative border-b border-slate-200 dark:border-slate-800 p-4">
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tools or type what you want to do (e.g. 'compress photo to 50kb', 'sgpa')..."
                className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-3 pb-1 no-scrollbar text-xs">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors flex-shrink-0 ${
                  selectedCategory === 'all'
                    ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-sm shadow-emerald-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                All Tools
              </button>
              {(Object.keys(CATEGORIES) as ToolCategory[]).map((catKey) => (
                <button
                  key={catKey}
                  type="button"
                  onClick={() => setSelectedCategory(catKey)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors flex-shrink-0 ${
                    selectedCategory === catKey
                      ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-sm shadow-emerald-500/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {CATEGORIES[catKey].name}
                </button>
              ))}
            </div>
          </div>

          {/* Results List */}
          <div className="max-h-96 overflow-y-auto p-2 space-y-1">
            {!query.trim() && (
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Popular & Frequently Used Tools
              </div>
            )}

            {displayTools.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  No matching tools found for "{query}".
                </p>
                <p className="text-xs text-slate-400">
                  Try simpler keywords like "pdf", "compress", "gpa", "json", or open the AI assistant.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/ai-assistant');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Ask the AI Assistant to find or build it
                </button>
              </div>
            ) : (
              displayTools.map((tool, index) => {
                const isSelected = index === selectedIndex;
                const cat = CATEGORIES[tool.category];

                return (
                  <div
                    key={tool.id}
                    onClick={() => handleSelectTool(tool)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-400/50 dark:border-emerald-500/50 shadow-xs'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent'
                    }`}
                  >
                    <div className="min-w-0 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {tool.name}
                        </span>
                        <Badge variant="neutral" size="sm">
                          {cat.name}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {tool.shortDescription || tool.description}
                      </p>
                    </div>

                    <div className="flex-shrink-0 flex items-center text-slate-400">
                      {isSelected ? (
                        <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          <span>Open</span>
                          <CornerDownLeft className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <ArrowRight className="w-4 h-4 opacity-50" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Modal Footer Controls */}
          <div className="border-t border-slate-200 dark:border-slate-800 p-3 bg-slate-50 dark:bg-slate-950/50 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-3">
              <span>
                <kbd className="px-1 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono">
                  ↑
                </kbd>{' '}
                <kbd className="px-1 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono">
                  ↓
                </kbd>{' '}
                to navigate
              </span>
              <span>
                <kbd className="px-1 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono">
                  Enter
                </kbd>{' '}
                to select
              </span>
              <span>
                <kbd className="px-1 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono">
                  Esc
                </kbd>{' '}
                to close
              </span>
            </div>
            <span className="font-medium text-slate-500">400+ utilities loaded</span>
          </div>
        </div>
      </div>
    </div>
  );
};
