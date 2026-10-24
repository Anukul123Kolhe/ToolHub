import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bookmark, WifiOff } from 'lucide-react';
import { searchTools } from '../services/search/searchService';
import { CATEGORIES, CATEGORY_LIST } from '../config/categories';
import { useStorage } from '../context/StorageContext';
import { ToolCategory } from '../types/tool';
import { Badge } from '../components/common/Badge';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';

export const ToolsCatalogPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | 'all'>('all');
  const [offlineOnly, setOfflineOnly] = useState(false);
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useStorage();

  const filteredTools = searchTools(query, {
    category: selectedCategory,
    offlineOnly,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Breadcrumbs items={[{ label: 'All Tools' }]} />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Tool Directory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Browse and filter through all 400+ privacy-first client-side utilities
          </p>
        </div>

        {/* Search bar inside catalog */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter tools..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#0F172A] dark:text-slate-100 placeholder:text-slate-400 shadow-2xs"
          />
        </div>
      </div>

      {/* Filter controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex-shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-gradient-to-r bg-blue-600 text-white font-bold shadow-md shadow-blue-500/25'
                : 'bg-white/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 hover:bg-blue-50/60 dark:hover:bg-blue-950/40 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
            }`}
          >
            All Categories
          </button>
          {CATEGORY_LIST.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex-shrink-0 ${
                selectedCategory === cat.id
                  ? 'bg-gradient-to-r bg-blue-600 text-white font-bold shadow-md shadow-blue-500/25'
                  : 'bg-white/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 hover:bg-blue-50/60 dark:hover:bg-blue-950/40 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={offlineOnly}
            onChange={(e) => setOfflineOnly(e.target.checked)}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <WifiOff className="w-3.5 h-3.5" />
          <span>Offline Capable Only</span>
        </label>
      </div>

      {/* Results Header */}
      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
        Showing {filteredTools.length} tools
      </div>

      {/* Tools Grid */}
      {filteredTools.length === 0 ? (
        <div className="text-center py-16 p-6 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 space-y-2">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            No utilities match your search criteria.
          </p>
          <p className="text-xs text-slate-400">
            Try resetting your filters or clearing your search query.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTools.map((tool) => {
            const fav = isFavorite(tool.id);
            const cat = CATEGORIES[tool.category];

            return (
              <div
                key={tool.id}
                onClick={() => navigate(tool.path)}
                className="group p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 hover:border-blue-500 dark:hover:border-blue-400 shadow-sm hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-0.5 cursor-pointer transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge variant="neutral" size="sm">
                      {cat.name}
                    </Badge>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(tool.id);
                      }}
                      className={`p-1 rounded-md transition-colors ${
                        fav
                          ? 'text-amber-500'
                          : 'text-slate-300 dark:text-slate-600 hover:text-slate-500'
                      }`}
                      title={fav ? 'Remove from bookmarks' : 'Add to bookmarks'}
                    >
                      <Bookmark className={`w-4 h-4 ${fav ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  <h3 className="font-bold text-sm text-[#0F172A] dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {tool.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {tool.shortDescription || tool.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span>In-Browser</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400 font-bold group-hover:translate-x-0.5 transition-transform">
                    Use Tool →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
