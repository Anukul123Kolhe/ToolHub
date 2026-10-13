import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Heart, Github, Lock, Cpu, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 mt-auto transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">
                Tool<span className="text-sky-500">Hub</span>
              </span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-400">
                v1.0
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              An AI-powered, privacy-first, unified online utility platform. Every file is processed
              locally inside your browser. No server uploads. No ads. No fees.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Zero-Upload Guarantee</span>
            </div>
          </div>

          {/* Quick Categories */}
          <div>
            <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-3">
              Popular Suites
            </h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <Link to="/category/pdf" className="hover:text-sky-500 transition-colors">
                  PDF & Document Tools
                </Link>
              </li>
              <li>
                <Link to="/category/image" className="hover:text-sky-500 transition-colors">
                  Image & Photo Utilities
                </Link>
              </li>
              <li>
                <Link to="/category/student" className="hover:text-sky-500 transition-colors">
                  Student & Academic Calculators
                </Link>
              </li>
              <li>
                <Link to="/category/developer" className="hover:text-sky-500 transition-colors">
                  Developer & Code Tools
                </Link>
              </li>
              <li>
                <Link to="/category/calculator" className="hover:text-sky-500 transition-colors">
                  Financial & Everyday Calculators
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform Features */}
          <div>
            <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-3">
              Platform
            </h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <Link to="/ai-assistant" className="hover:text-sky-500 flex items-center gap-1.5 transition-colors">
                  <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                  AI Task Assistant
                </Link>
              </li>
              <li>
                <Link to="/tools" className="hover:text-sky-500 transition-colors">
                  Complete 140+ Tool Catalog
                </Link>
              </li>
              <li>
                <Link to="/favorites" className="hover:text-sky-500 transition-colors">
                  Bookmarked Utilities
                </Link>
              </li>
              <li>
                <Link to="/history" className="hover:text-sky-500 transition-colors">
                  Activity History
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-sky-500 transition-colors">
                  Privacy Architecture
                </Link>
              </li>
            </ul>
          </div>

          {/* Privacy & Security Specs */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-3">
              Security Boundary
            </h4>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-emerald-500" />
                <span>Client-Side Sandboxing</span>
              </div>
              <div className="flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-sky-500" />
                <span>WebAssembly & Web Workers</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal pt-1">
                Files remain in volatile RAM and are evicted upon session closure.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} ToolHub. Open-Source, Free, and Privacy-Preserving.</p>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-slate-600 dark:hover:text-slate-300">
              Privacy Policy
            </Link>
            <Link to="/about" className="hover:text-slate-600 dark:hover:text-slate-300">
              Architecture
            </Link>
            <span className="flex items-center gap-1">
              Built with <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> for engineers & students
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
