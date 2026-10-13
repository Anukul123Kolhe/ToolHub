import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bookmark, BookmarkX, ArrowRight } from 'lucide-react';
import { useStorage } from '../context/StorageContext';
import { TOOL_MAP } from '../config/tools';
import { CATEGORIES } from '../config/categories';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';

export const FavoritesPage: React.FC = () => {
  const { favorites, toggleFavorite, clearFavorites } = useStorage();
  const navigate = useNavigate();

  const favoriteTools = favorites
    .map((id) => TOOL_MAP.get(id))
    .filter((tool) => tool !== undefined);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Breadcrumbs items={[{ label: 'Bookmarked Tools' }]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Bookmarked Tools
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Quick access to your preferred utilities saved locally on this device
          </p>
        </div>

        {favoriteTools.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearFavorites} icon={<BookmarkX className="w-4 h-4" />}>
            Clear All
          </Button>
        )}
      </div>

      {favoriteTools.length === 0 ? (
        <div className="text-center py-20 px-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Bookmark className="w-6 h-6" />
          </div>
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            No bookmarked tools yet
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Click the bookmark icon on any tool card across the directory to pin it here for instant access.
          </p>
          <Link to="/tools">
            <Button size="sm" icon={<ArrowRight className="w-4 h-4" />}>
              Explore Tools
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {favoriteTools.map((tool) => {
            if (!tool) return null;
            const cat = CATEGORIES[tool.category];

            return (
              <div
                key={tool.id}
                onClick={() => navigate(tool.path)}
                className="group p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-500 dark:hover:border-sky-500 shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col justify-between"
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
                      className="p-1 rounded-md text-sky-500 hover:text-rose-500 transition-colors"
                      title="Remove from bookmarks"
                    >
                      <Bookmark className="w-4 h-4 fill-current" />
                    </button>
                  </div>

                  <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                    {tool.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {tool.shortDescription || tool.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span>In-Browser</span>
                  <span className="font-semibold text-sky-600 dark:text-sky-400 group-hover:translate-x-0.5 transition-transform">
                    Open Tool →
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
