import React from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Cpu, CheckCircle2 } from 'lucide-react';
import { ExecutionPlan } from '../../../services/ai/workflowEngine';

interface AIIntentBannerProps {
  plan?: ExecutionPlan | null;
  isAnalyzing?: boolean;
  isExecuting?: boolean;
  isCompleted?: boolean;
}

export const AIIntentBanner: React.FC<AIIntentBannerProps> = ({
  plan,
  isAnalyzing = false,
  isExecuting = false,
  isCompleted = false,
}) => {
  if (!plan && !isAnalyzing) return null;

  return (
    <div className="w-full rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-blue-200/90 dark:border-blue-900/60 shadow-lg backdrop-blur-md p-4 sm:p-5 select-none transition-all animate-scale-bounce">
      {/* Top Tag & Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-violet-600 to-blue-500 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <span className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
            AI Intent Comprehension
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {isAnalyzing ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950/80 text-violet-700 dark:text-violet-300 border border-violet-300 dark:border-violet-800 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-600 animate-ping" />
              Reasoning with Gemini AI...
            </span>
          ) : isCompleted ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Plan Executed Successfully
            </span>
          ) : isExecuting ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
              Executing Understood Plan...
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="w-3 h-3" />
              Intent Verified
            </span>
          )}
        </div>
      </div>

      {/* Main Understood Intent Text */}
      <div className="space-y-2">
        <div>
          <span className="text-[10px] font-bold font-mono uppercase text-slate-400 tracking-wider">
            What AI Understood:
          </span>
          <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 mt-0.5 leading-relaxed">
            {isAnalyzing
              ? 'Analyzing natural language requirements and parsing tool requirements with Google Gemini AI...'
              : plan?.understoodIntent || plan?.userPrompt || 'Custom file workflow'}
          </p>
        </div>

        {/* Ordered Planned Steps Badges */}
        {plan && plan.steps.length > 0 && !isAnalyzing && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <span className="text-[10px] font-bold font-mono uppercase text-slate-400 tracking-wider">
              Synthesized Operational Pipeline:
            </span>
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              {plan.steps.map((st, i) => (
                <React.Fragment key={st.id || i}>
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                    <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px]">
                      {i + 1}
                    </span>
                    <span>{st.toolName}</span>
                  </span>
                  {i < plan.steps.length - 1 && (
                    <ArrowRight className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIIntentBanner;
