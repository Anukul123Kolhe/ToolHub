import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Sparkles,
  ShieldCheck,
  Lock,
  Zap,
  Bookmark,
  ArrowRight,
  Wifi,
  FileText,
  Image as ImageIcon,
  GraduationCap,
  Type,
  Calculator,
  QrCode,
  Code,
  CheckSquare,
  Briefcase,
  Film,
} from 'lucide-react';
import { CATEGORIES } from '../config/categories';
import { getPopularTools } from '../services/search/searchService';
import { useStorage } from '../context/StorageContext';
import { ToolCategory } from '../types/tool';
import { Badge } from '../components/common/Badge';

interface HomePageProps {
  onOpenSearch: () => void;
  onOpenAIAssistant?: () => void;
}

const CATEGORY_ICONS: Record<ToolCategory, React.ComponentType<{ className?: string }>> = {
  pdf: FileText,
  image: ImageIcon,
  student: GraduationCap,
  text: Type,
  calculator: Calculator,
  qr: QrCode,
  developer: Code,
  productivity: CheckSquare,
  career: Briefcase,
  media: Film,
  advanced: Sparkles,
};

export const HomePage: React.FC<HomePageProps> = ({ onOpenSearch, onOpenAIAssistant }) => {
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite, recentTools } = useStorage();
  const popularTools = getPopularTools();

  const quickActionPills = [
    { label: 'Compress photo < 50KB', path: '/tool/image-exact-size' },
    { label: 'Merge assignment PDFs', path: '/tool/pdf-merge' },
    { label: 'Calculate SGPA / CGPA', path: '/tool/sgpa-calculator' },
    { label: 'Format & validate JSON', path: '/tool/dev-json-formatter' },
    { label: 'Wi-Fi QR Code', path: '/tool/qr-wifi' },
    { label: 'Safe attendance bunks', path: '/tool/attendance-calculator' },
    { label: 'Extract text via OCR', path: '/tool/adv-ocr-image' },
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative pt-8 sm:pt-14 text-center max-w-4xl mx-auto px-4">
        {/* Subtle decorative glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-500/10 dark:bg-sky-500/15 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-xs font-semibold text-sky-700 dark:text-sky-300 mb-6">
          <Sparkles className="w-3.5 h-3.5 text-sky-500" />
          <span>Unified Online Utility Platform • 400+ Working Tools</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.15]">
          Every online tool you need. <br />
          <span className="bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
            100% in your browser.
          </span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Compress photos to exact KB, merge assignment PDFs, calculate SGPA, format code, and automate tasks. Zero file uploads, zero ads, zero fees.
        </p>

        {/* Global Search Bar */}
        <div className="mt-8 max-w-2xl mx-auto">
          <div
            onClick={onOpenSearch}
            className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-sky-500 dark:hover:border-sky-500 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none cursor-pointer transition-all group"
          >
            <div className="flex items-center gap-3 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
              <Search className="w-5 h-5 text-sky-500" />
              <span className="text-sm font-medium">
                Search 400+ tools (e.g., "compress image", "pdf merge", "sgpa")...
              </span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-1 font-mono text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-md text-slate-500">
              Ctrl+K
            </kbd>
          </div>

          {/* Quick Action Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs">
            <span className="text-slate-400 font-medium">Quick actions:</span>
            {quickActionPills.map((pill, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => navigate(pill.path)}
                className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:text-sky-600 dark:hover:text-sky-400 text-slate-600 dark:text-slate-300 transition-colors border border-slate-200 dark:border-slate-700"
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* AI Assistant Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 p-8 text-white shadow-xl">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/20 text-white text-xs font-semibold backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Feature Spotlight</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                AI Task Assistant & Tool Orchestrator
              </h2>
              <p className="text-sm text-sky-100 leading-relaxed">
                Tell the assistant what you need in plain English. Attach your files and let ToolHub parameterize and execute the right browser tools for you safely and sequentially.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenAIAssistant}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-sky-700 hover:bg-sky-50 font-semibold text-sm shadow-md transition-all active:scale-95 flex-shrink-0"
            >
              <span>Launch AI Assistant</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Privacy Guarantee & Technical Architecture Highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100">
              100% Client-Side Privacy
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Your PDFs, photos, and documents never leave your browser RAM. File processing happens locally via WebAssembly and Canvas.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950/60 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100">
              Instant Speed & Offline Ready
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Zero network upload delays. Large files compress and process at raw CPU speeds without waiting for server queues.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100">
              No Sign-in, No Tracking
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Use any tool immediately as a guest. Your recent activity and favorites are saved securely in your browser's private local storage.
            </p>
          </div>
        </div>
      </section>

      {/* Recommended Tools Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Recommended Utilities
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Top recommended tools for everyday document, photo, student, and developer tasks
            </p>
          </div>
          <Link
            to="/tools"
            className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
          >
            <span>View All Tools</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {popularTools.map((tool) => {
            const fav = isFavorite(tool.id);
            const cat = CATEGORIES[tool.category];

            return (
              <div
                key={tool.id}
                onClick={() => navigate(tool.path)}
                className="group relative p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col justify-between"
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
                  <span>In-Browser</span>
                  <span className="font-semibold text-sky-600 dark:text-sky-400 group-hover:translate-x-0.5 transition-transform">
                    Use Tool →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent Tools (If any) */}
      {recentTools.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Recently Used
            </h2>
            <Link
              to="/history"
              className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
            >
              View Full History
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {recentTools.slice(0, 6).map((tool) => (
              <div
                key={tool.id}
                onClick={() => navigate(tool.path)}
                className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-500 dark:hover:border-sky-500 cursor-pointer shadow-sm transition-all"
              >
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {tool.name}
                </p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  {CATEGORIES[tool.category].name}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
