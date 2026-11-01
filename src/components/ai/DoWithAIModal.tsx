import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, X, Maximize2, ShieldCheck } from 'lucide-react';
import { DoWithAIWorkspace } from './DoWithAIWorkspace';

interface DoWithAIModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DoWithAIModal: React.FC<DoWithAIModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-3 sm:p-4 text-center">
        {/* Backdrop */}
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        />

        {/* Modal Window */}
        <div className="relative w-full max-w-5xl transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl text-left transition-all flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 shadow-2xs">
                <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-[#0F172A] dark:text-white tracking-tight">
                    Do With AI
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    100% Client-Side
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Upload files, describe your requirements in natural language, and get it done
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/do-with-ai');
                }}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 border border-slate-200 dark:border-slate-700"
                title="Open as full standalone page"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Full Page</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-1"
                title="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Modal Workspace Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <DoWithAIWorkspace
              isModal
              onNavigateFullPage={() => {
                onClose();
                navigate('/do-with-ai');
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoWithAIModal;
