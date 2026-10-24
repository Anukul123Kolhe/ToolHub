import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Wrench,
  Search,
  Sparkles,
  Sun,
  Moon,
  Bookmark,
  History,
  Menu,
  X,
  ShieldCheck,
  Settings,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useStorage } from '../../context/StorageContext';

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenAIAssistant: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSearch, onOpenAIAssistant }) => {
  const { theme, toggleTheme } = useTheme();
  const { favorites } = useStorage();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0B0F17]/95 backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-700 flex items-center justify-center text-white shadow-md shadow-blue-500/30 group-hover:scale-105 group-hover:shadow-brand transition-all duration-200">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-lg text-[#0F172A] dark:text-white tracking-tight">
                Tool<span className="text-blue-600 dark:text-blue-400">Hub</span>
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 font-bold">
                100% Client-Side
              </span>
            </div>
          </div>
        </Link>

        {/* Global Search Bar Trigger */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="hidden md:flex items-center justify-between w-72 lg:w-96 px-3.5 py-2 text-xs text-slate-500 dark:text-slate-400 bg-white/70 dark:bg-slate-900/70 hover:bg-white dark:hover:bg-slate-900 hover:border-blue-500 dark:hover:border-blue-400 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Search 400+ tools or describe your task...</span>
          </div>
          <kbd className="inline-flex items-center gap-0.5 font-mono text-[10px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded shadow-xs text-slate-600 dark:text-slate-300">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1.5">
          <Link
            to="/tools"
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              isActive('/tools')
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900'
            }`}
          >
            All Tools
          </Link>

          <button
            type="button"
            onClick={onOpenAIAssistant}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm shadow-blue-500/25 hover:scale-[1.02] border border-blue-600"
          >
            <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
            <span>AI Assistant</span>
          </button>

          <Link
            to="/favorites"
            className="relative p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Bookmarked Tools"
          >
            <Bookmark className="w-4 h-4" />
            {favorites.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-600" />
            )}
          </Link>

          <Link
            to="/history"
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Session History"
          >
            <History className="w-4 h-4" />
          </Link>

          <Link
            to="/settings"
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Settings & API Key"
          >
            <Settings className="w-4 h-4" />
          </Link>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

          {/* Theme Switcher */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </nav>

        {/* Mobile Action Buttons */}
        <div className="flex md:hidden items-center gap-1">
          <button
            type="button"
            onClick={onOpenSearch}
            className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 space-y-1">
          <Link
            to="/tools"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-medium rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
          >
            All 400+ Tools
          </Link>
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenAIAssistant();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 text-left"
          >
            <Sparkles className="w-4 h-4 text-emerald-500" />
            AI Task Assistant
          </button>
          <Link
            to="/favorites"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-medium rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
          >
            Bookmarked Tools ({favorites.length})
          </Link>
          <Link
            to="/history"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-medium rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
          >
            Activity History
          </Link>
          <Link
            to="/settings"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
          >
            <Settings className="w-4 h-4 text-emerald-500" />
            Settings & API Key
          </Link>
          <Link
            to="/privacy"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg text-emerald-600 dark:text-emerald-400"
          >
            <ShieldCheck className="w-4 h-4" />
            Privacy Architecture
          </Link>
        </div>
      )}
    </header>
  );
};
