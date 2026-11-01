import React from 'react';
import { DoWithAIWorkspace } from '../components/ai/DoWithAIWorkspace';
import { Sparkles, ShieldCheck } from 'lucide-react';

export const DoWithAIPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
          <span>Intelligent File Processing & Task Execution Workspace</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          Do With <span className="text-blue-600 dark:text-blue-400">AI</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300">
          Upload anything. Tell AI what you need. Get it done.
        </p>
      </div>

      {/* Main Workspace Component */}
      <DoWithAIWorkspace />
    </div>
  );
};

export default DoWithAIPage;
