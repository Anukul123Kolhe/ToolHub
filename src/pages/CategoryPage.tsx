import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Bookmark, ArrowRight, AlertCircle } from 'lucide-react';
import { CATEGORIES } from '../config/categories';
import { TOOLS } from '../config/tools';
import { ToolCategory } from '../types/tool';
import { useStorage } from '../context/StorageContext';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { Badge } from '../components/common/Badge';

export const CategoryPage: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useStorage();

  const category = categoryId ? CATEGORIES[categoryId as ToolCategory] : undefined;

  if (!category) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Category Not Found</h1>
        <p className="text-xs text-slate-500">The requested tool category does not exist.</p>
        <Link
          to="/tools"
          className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:underline"
        >
          <span>Return to All Tools</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  const categoryTools = TOOLS.filter((t) => t.category === category.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Breadcrumbs items={[{ label: 'Categories', path: '/tools' }, { label: category.name }]} />

      {/* Category Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-8 text-white shadow-lg border border-slate-800">
        <div className="relative z-10 max-w-2xl space-y-2">
          <Badge variant="info" size="sm">
            {categoryTools.length} Available Tools
          </Badge>
          <h1 className="text-3xl font-extrabold tracking-tight">{category.name}</h1>
          <p className="text-xs text-slate-300 leading-relaxed">{category.description}</p>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Tools in this category
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categoryTools.map((tool) => {
            const fav = isFavorite(tool.id);

            return (
              <div
                key={tool.id}
                onClick={() => navigate(tool.path)}
                className="group p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge variant="neutral" size="sm">
                      {category.name}
                    </Badge>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(tool.id);
                      }}
                      className={`p-1 rounded-md transition-colors ${
                        fav
                          ? 'text-sky-500'
                          : 'text-slate-300 dark:text-slate-600 hover:text-slate-500'
                      }`}
                      title={fav ? 'Remove from bookmarks' : 'Add to bookmarks'}
                    >
                      <Bookmark className={`w-4 h-4 ${fav ? 'fill-current' : ''}`} />
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
                  <span>{tool.isOfflineCapable ? '⚡ Offline Ready' : 'In-Browser'}</span>
                  <span className="font-semibold text-sky-600 dark:text-sky-400 group-hover:translate-x-0.5 transition-transform">
                    Open Tool →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
