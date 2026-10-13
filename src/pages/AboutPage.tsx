import React from 'react';
import { Wrench, CheckCircle, Cpu, ShieldCheck } from 'lucide-react';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Breadcrumbs items={[{ label: 'About ToolHub' }]} />

      <div className="space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          About ToolHub
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          ToolHub is an open-source, unified online utility platform designed to replace fragmented, ad-cluttered utility websites with a fast, private, 100% in-browser solution.
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Core Engineering Principles
        </h2>
        <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
          <li className="flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Zero-Knowledge File Privacy:</strong> All file conversions and document manipulations are executed in-memory on the client machine.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <span>
              <strong>AI Tool Orchestration:</strong> Natural language intent resolution safely maps plain user requests to validated client function calls without exposing private files.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Honest Error Reporting:</strong> Real execution limits are verified. If a target size or conversion cannot be met, an accurate explanation is given rather than a fake success message.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <span>
              <strong>$0.00 Operating Cost:</strong> Pure static front-end architecture compatible with free serverless hosting and offline Progressive Web Apps.
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};
