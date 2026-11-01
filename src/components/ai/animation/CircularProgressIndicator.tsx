import React from 'react';
import { Check, Sparkles } from 'lucide-react';

interface CircularProgressIndicatorProps {
  progress: number;
  isAnalyzing?: boolean;
  isCompleted?: boolean;
  statusMessage?: string;
  subMessage?: string;
}

export const CircularProgressIndicator: React.FC<CircularProgressIndicatorProps> = ({
  progress,
  isAnalyzing = false,
  isCompleted = false,
  statusMessage,
  subMessage,
}) => {
  const size = 110;
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, progress)) / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center relative select-none">
      {/* Circle SVG Container */}
      <div className="relative w-28 h-28 flex items-center justify-center">
        <svg
          className={`w-full h-full transform -rotate-90 transition-all ${
            isAnalyzing
              ? 'animate-spin-slow drop-shadow-[0_0_14px_rgba(139,92,246,0.45)]'
              : 'drop-shadow-[0_0_12px_rgba(56,189,248,0.35)]'
          }`}
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* Gradient Definition */}
          <defs>
            <linearGradient id="aiProgressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="50%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#818CF8" />
            </linearGradient>
            <linearGradient id="aiAnalyzingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#A78BFA" />
              <stop offset="50%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#818CF8" />
            </linearGradient>
            <linearGradient id="aiSuccessGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>

          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="stroke-slate-200 dark:stroke-slate-800"
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {/* Foreground Animated Progress Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={
              isCompleted
                ? 'url(#aiSuccessGradient)'
                : isAnalyzing
                ? 'url(#aiAnalyzingGradient)'
                : 'url(#aiProgressGradient)'
            }
            strokeWidth={strokeWidth}
            strokeDasharray={isAnalyzing ? `${circumference / 3} ${circumference / 4}` : circumference}
            strokeDashoffset={isAnalyzing ? 0 : strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-300 ease-out"
          />
        </svg>

        {/* Center Display: Percentage or Checkmark or Analyzing Sparkle */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {isCompleted ? (
            <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/40 animate-scale-bounce">
              <Check className="w-5 h-5 stroke-[2.5]" />
            </div>
          ) : isAnalyzing ? (
            <div className="flex flex-col items-center justify-center">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-violet-600 to-blue-500 text-white flex items-center justify-center shadow-md shadow-violet-500/30 animate-pulse">
                <Sparkles className="w-4 h-4 animate-spin-slow" />
              </div>
              <span className="text-[9px] font-bold text-violet-600 dark:text-violet-400 font-mono tracking-widest mt-1">
                REASONING
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <span className="font-mono text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {Math.round(progress)}
                <span className="text-xs text-blue-600 dark:text-blue-400 font-bold ml-0.5">%</span>
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                AI CORE
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Status Text */}
      {statusMessage && (
        <div className="text-center mt-3 max-w-xs space-y-0.5">
          <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white transition-all">
            {statusMessage}
          </p>
          {subMessage && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs">
              {subMessage}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default CircularProgressIndicator;
