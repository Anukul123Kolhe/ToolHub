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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[34rem] h-[22rem] bg-gradient-to-tr from-blue-500/15 via-indigo-500/10 to-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Live Status Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 text-xs font-bold text-blue-700 dark:text-blue-300 mb-6 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Unified Online Utility Platform • 400+ Working Tools</span>
        </div>

        {/* Main Headline - Deep dark slate #0F172A */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#0F172A] dark:text-white tracking-tight leading-[1.12]">
          Every online tool you need. <br />
          <span className="text-blue-600 dark:text-blue-400">
            100% in your browser.
          </span>
        </h1>

        {/* High Contrast Subtext */}
        <p className="mt-5 text-base sm:text-lg text-slate-700 dark:text-slate-300 font-medium max-w-2xl mx-auto leading-relaxed">
          Compress photos to exact KB, merge assignment PDFs, calculate SGPA, format code, and automate tasks. Zero file uploads, zero ads, zero fees.
        </p>

        {/* Global Search Bar with Bold Electric Blue Button */}
        <div className="mt-8 max-w-2xl mx-auto">
          <div
            onClick={onOpenSearch}
            className="flex items-center justify-between p-2.5 sm:p-3 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 hover:border-blue-600 dark:hover:border-blue-500 rounded-2xl shadow-xl shadow-slate-200/60 dark:shadow-none cursor-pointer transition-all group"
          >
            <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors pl-3">
              <Search className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform flex-shrink-0" />
              <span className="text-sm font-medium">
                Search 400+ tools (e.g., "compress image", "pdf merge", "sgpa")...
              </span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="hidden md:inline-flex items-center gap-1 font-mono text-xs bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-2.5 py-1 rounded-md text-slate-600 dark:text-slate-400">
                Ctrl+K
              </kbd>
              <div className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 flex items-center gap-1.5 transition-all">
                <span>Search</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Quick Action Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-bold">Quick actions:</span>
            {quickActionPills.map((pill, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => navigate(pill.path)}
                className="px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-300 hover:border-blue-400 text-slate-700 dark:text-slate-200 font-semibold border border-slate-300 dark:border-slate-700 shadow-xs transition-all"
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* AI Assistant Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 p-8 text-white shadow-xl shadow-blue-900/20 border border-blue-500/20">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold backdrop-blur-sm border border-white/20">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Feature Spotlight</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                AI Task Assistant & Tool Orchestrator
              </h2>
              <p className="text-sm text-blue-100 leading-relaxed font-normal">
                Tell the assistant what you need in plain English. Attach your files and let ToolHub parameterize and execute the right browser tools for you safely and sequentially.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenAIAssistant}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-sm shadow-lg transition-all active:scale-95 flex-shrink-0"
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
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 hover:border-emerald-500 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-[#0F172A] dark:text-white">
              100% Client-Side Privacy
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Your PDFs, photos, and documents never leave your browser RAM. File processing happens locally via WebAssembly and Canvas.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 hover:border-blue-500 transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/80 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-[#0F172A] dark:text-white">
              Instant Speed & Offline Ready
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Zero network upload delays. Large files compress and process at raw CPU speeds without waiting for server queues.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 hover:border-indigo-500 transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-[#0F172A] dark:text-white">
              No Sign-in, No Tracking
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Use any tool immediately as a guest. Your recent activity and favorites are saved securely in your browser's private local storage.
            </p>
          </div>
        </div>
      </section>

      {/* Recommended Tools Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-[#0F172A] dark:text-white tracking-tight">
              Recommended Utilities
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
              Top recommended tools for everyday document, photo, student, and developer tasks
            </p>
          </div>
          <Link
            to="/tools"
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
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
                className="group relative p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-400 shadow-sm hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-0.5 cursor-pointer transition-all flex flex-col justify-between"
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
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed font-normal">
                    {tool.shortDescription || tool.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-medium text-slate-500">In-Browser</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
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
            <h2 className="text-lg font-black text-[#0F172A] dark:text-white tracking-tight">
              Recently Used
            </h2>
            <Link
              to="/history"
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              View Full History
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {recentTools.slice(0, 6).map((tool) => (
              <div
                key={tool.id}
                onClick={() => navigate(tool.path)}
                className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 cursor-pointer shadow-sm hover:shadow-md hover:shadow-blue-500/15 transition-all"
              >
                <p className="text-xs font-bold text-[#0F172A] dark:text-slate-200 truncate">
                  {tool.name}
                </p>
                <p className="text-[10px] text-slate-500 truncate mt-0.5 font-medium">
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
