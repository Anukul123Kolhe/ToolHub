import React from 'react';

interface ConcentricRingsProps {
  isAnalyzing?: boolean;
  isCompleted?: boolean;
}

export const ConcentricRings: React.FC<ConcentricRingsProps> = ({
  isAnalyzing = false,
  isCompleted = false,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
      {/* Soft Radial Ambient Glow */}
      <div
        className={`absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full transition-all duration-700 ${
          isCompleted
            ? 'bg-gradient-to-r from-emerald-400/20 via-cyan-400/25 to-blue-500/20 animate-aura-glow'
            : isAnalyzing
            ? 'bg-gradient-to-r from-violet-500/25 via-fuchsia-400/20 to-sky-400/25 animate-aura-glow'
            : 'bg-gradient-to-r from-blue-400/20 via-sky-300/25 to-indigo-500/20 animate-aura-glow'
        }`}
      />

      {/* Outer Ring: Rotating Dashed Segment */}
      <div
        className={`absolute w-56 h-56 sm:w-64 sm:h-64 rounded-full border border-dashed transition-colors duration-500 animate-spin-slow ${
          isAnalyzing ? 'border-violet-400/40 dark:border-violet-500/40' : 'border-blue-400/30 dark:border-blue-500/30'
        }`}
      />

      {/* Mid Ring 1: Counter-Rotating Dotted Ring */}
      <div
        className={`absolute w-44 h-44 sm:w-52 sm:h-52 rounded-full border border-dotted transition-colors duration-500 animate-spin-reverse ${
          isAnalyzing ? 'border-fuchsia-400/40 dark:border-fuchsia-500/40' : 'border-sky-400/40 dark:border-cyan-400/40'
        }`}
      />

      {/* Mid Ring 2: Subtle Pulsing Solid Line */}
      <div
        className={`absolute w-36 h-36 sm:w-40 sm:h-40 rounded-full border transition-colors duration-500 animate-pulse-ring ${
          isCompleted
            ? 'border-emerald-400/40 shadow-[0_0_20px_rgba(16,185,129,0.25)]'
            : isAnalyzing
            ? 'border-violet-400/50 shadow-[0_0_20px_rgba(139,92,246,0.3)]'
            : 'border-blue-400/40 dark:border-blue-500/40 shadow-[0_0_20px_rgba(56,189,248,0.2)]'
        }`}
      />

      {/* Inner Accent Ring */}
      <div className="absolute w-28 h-28 sm:w-32 sm:h-32 rounded-full border border-blue-300/25 dark:border-blue-400/20" />
    </div>
  );
};

export default ConcentricRings;
