import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { TOOL_MAP } from '../config/tools';
import { CATEGORIES } from '../config/categories';
import { useStorage } from '../context/StorageContext';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { Badge } from '../components/common/Badge';
import { ToolDispatcher } from '../tools/ToolDispatcher';
import { Bookmark, ShieldCheck, WifiOff, AlertCircle, ArrowRight, Info } from 'lucide-react';

export const ToolWorkspacePage: React.FC = () => {
  const { toolId } = useParams<{ toolId: string }>();
  const { isFavorite, toggleFavorite, recordToolUsage } = useStorage();

  const tool = toolId ? TOOL_MAP.get(toolId) : undefined;

  useEffect(() => {
    if (tool) {
      recordToolUsage(tool.id);
      document.title = `${tool.name} — ToolHub`;
    }
    return () => {
      document.title = 'ToolHub — AI-Powered, Privacy-First Online Utilities';
    };
  }, [tool]);

  if (!tool) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Tool Not Found</h1>
        <p className="text-xs text-slate-500">
          The requested tool identifier "{toolId}" was not found in the ToolHub registry.
        </p>
        <Link
          to="/tools"
          className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:underline"
        >
          <span>Browse All 140+ Tools</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  const category = CATEGORIES[tool.category];
  const fav = isFavorite(tool.id);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Breadcrumb Navigation */}
      <Breadcrumbs
        items={[
          { label: category.name, path: `/category/${category.id}` },
          { label: tool.name },
        ]}
      />

      {/* Tool Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              {tool.name}
            </h1>
            <Badge variant="neutral" size="sm">
              {category.name}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            {tool.description}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => toggleFavorite(tool.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              fav
                ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-300 dark:border-sky-700 text-sky-600 dark:text-sky-400'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${fav ? 'fill-current' : ''}`} />
            <span>{fav ? 'Bookmarked' : 'Bookmark'}</span>
          </button>
        </div>
      </div>

      {/* Primary Tool Execution Workspace */}
      <div className="pt-2">
        <ToolDispatcher tool={tool} />
      </div>

      {/* Privacy Guarantee & Specifications Footer */}
      <div className="pt-8 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-500">
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Zero-Knowledge Processing</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            All operations run in your browser memory. Your files and data are never uploaded to any remote server.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
            <Info className="w-4 h-4 text-sky-500" />
            <span>Technical Requirements</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Input: {tool.inputRequirements || 'Standard keyboard input'}. Formats: {tool.supportedFormats?.join(', ') || 'None required'}.
          </p>
        </div>
      </div>
    </div>
  );
};
