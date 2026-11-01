import React from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';

interface TransformationSuccessProps {
  durationMs?: number;
  outputCount?: number;
}

export const TransformationSuccess: React.FC<TransformationSuccessProps> = ({
  durationMs,
  outputCount = 1,
}) => {
  return (
    <div className="w-full text-center py-2 px-4 rounded-2xl bg-gradient-to-r from-emerald-50/80 via-cyan-50/60 to-emerald-50/80 dark:from-emerald-950/40 dark:via-cyan-950/30 dark:to-emerald-950/40 border border-emerald-300 dark:border-emerald-800 shadow-sm animate-scale-bounce">
      <div className="flex items-center justify-center gap-2">
        <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/30">
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
          Your task has been completed successfully!
        </h3>
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
        Your {outputCount > 1 ? `${outputCount} files have` : 'file has'} been processed and {outputCount > 1 ? 'are' : 'is'} ready.
        {durationMs ? (
          <span className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400 font-bold ml-1.5">
            (⚡ {durationMs}ms)
          </span>
        ) : null}
      </p>
    </div>
  );
};

export default TransformationSuccess;
