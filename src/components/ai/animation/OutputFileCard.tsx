import React from 'react';
import {
  FileText,
  FileCode,
  FileArchive,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Download,
  Eye,
} from 'lucide-react';
import { formatBytes } from '../../../utils/file';
import { ProcessedFile } from '../../../services/ai/toolRegistry';

interface OutputFileCardProps {
  isExecuting: boolean;
  isCompleted: boolean;
  outputFiles: ProcessedFile[];
  textOutput?: string | null;
  errorMessage?: string | null;
  targetFormatHint?: string;
  onPreview?: (file: ProcessedFile) => void;
  onDownload?: (file: ProcessedFile) => void;
}

export const OutputFileCard: React.FC<OutputFileCardProps> = ({
  isExecuting,
  isCompleted,
  outputFiles,
  textOutput,
  errorMessage,
  targetFormatHint,
  onPreview,
  onDownload,
}) => {
  const primaryOutput = outputFiles[0];

  // Error State
  if (errorMessage) {
    return (
      <div className="relative w-48 sm:w-56 p-3.5 rounded-2xl bg-rose-50/95 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 shadow-lg text-left select-none animate-scale-bounce">
        <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-300 mb-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Transformation Failed</span>
        </div>
        <div className="w-full h-24 rounded-xl bg-rose-100/70 dark:bg-rose-900/40 flex items-center justify-center text-rose-600 mb-2">
          <AlertCircle className="w-9 h-9 stroke-[1.8]" />
        </div>
        <p className="text-[11px] text-rose-700 dark:text-rose-200 line-clamp-2">
          {errorMessage}
        </p>
      </div>
    );
  }

  // Completed State: Real Output File Available
  if (isCompleted && (primaryOutput || textOutput)) {
    const isImage = primaryOutput?.type.startsWith('image/');
    const isPdf =
      primaryOutput?.type === 'application/pdf' ||
      primaryOutput?.name.toLowerCase().endsWith('.pdf');
    const isZip = primaryOutput?.name.toLowerCase().endsWith('.zip');
    const ext = primaryOutput ? primaryOutput.name.split('.').pop()?.toUpperCase() || 'OUT' : 'TXT';

    return (
      <div className="relative group select-none animate-scale-bounce">
        {/* Soft Success Aura Glow */}
        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 blur-md pointer-events-none" />

        <div className="relative w-48 sm:w-56 p-3.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 border-2 border-emerald-500/50 dark:border-emerald-500/40 shadow-xl backdrop-blur-md text-left transition-all">
          {/* Header Badge */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Transformed Output
            </span>

            {outputFiles.length > 1 && (
              <span className="text-[10px] font-bold text-slate-500">
                +{outputFiles.length - 1} more
              </span>
            )}
          </div>

          {/* Thumbnail / Output File Preview */}
          <div className="w-full h-24 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden mb-2 relative group-hover:scale-[1.01] transition-transform">
            {primaryOutput && isImage && primaryOutput.url ? (
              <img
                src={primaryOutput.url}
                alt={primaryOutput.name}
                className="w-full h-full object-cover"
              />
            ) : isPdf ? (
              <div className="flex flex-col items-center justify-center text-rose-500">
                <FileText className="w-9 h-9 stroke-[1.8]" />
                <span className="text-[9px] font-bold font-mono uppercase mt-0.5">PDF Ready</span>
              </div>
            ) : isZip ? (
              <div className="flex flex-col items-center justify-center text-amber-500">
                <FileArchive className="w-9 h-9 stroke-[1.8]" />
                <span className="text-[9px] font-bold font-mono uppercase mt-0.5">ZIP Archive</span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-blue-500">
                <FileCode className="w-9 h-9 stroke-[1.8]" />
                <span className="text-[9px] font-bold font-mono uppercase mt-0.5">Text / Data</span>
              </div>
            )}

            {/* Format Tag */}
            <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-600 text-white shadow-xs">
              {ext}
            </span>

            {/* Savings percentage tag if compressed */}
            {primaryOutput?.originalSize && primaryOutput.originalSize > primaryOutput.size && (
              <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-600 text-white shadow-xs">
                -{Math.round(((primaryOutput.originalSize - primaryOutput.size) / primaryOutput.originalSize) * 100)}%
              </span>
            )}
          </div>

          {/* File Information */}
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-slate-900 dark:text-white truncate" title={primaryOutput?.name || 'Output'}>
              {primaryOutput?.name || 'Transformed Data'}
            </p>
            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
              <span>{primaryOutput ? formatBytes(primaryOutput.size) : 'Completed'}</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">100% Ready</span>
            </div>
          </div>

          {/* Quick In-Page Preview Button */}
          {onPreview && primaryOutput && (
            <div className="pt-2 mt-1 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => onPreview(primaryOutput)}
                className="w-full py-1.5 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview In-Page</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // In-Progress / Standby Placeholder
  return (
    <div className="relative group select-none">
      <div className="relative w-48 sm:w-56 p-3.5 rounded-2xl bg-white/70 dark:bg-slate-900/70 border-2 border-dashed border-blue-300 dark:border-blue-700/60 shadow-sm backdrop-blur-md text-left transition-all">
        {/* Placeholder Badge */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            {isExecuting ? 'Synthesizing...' : 'Target Output'}
          </span>

          {isExecuting && (
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
          )}
        </div>

        {/* Shimmering Container */}
        <div className="w-full h-24 rounded-xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/50 flex flex-col items-center justify-center overflow-hidden mb-2 relative">
          {/* Animated Scanning Line */}
          {isExecuting && (
            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-scan-line" />
          )}

          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-500/70 flex items-center justify-center">
            <Sparkles className={`w-5 h-5 ${isExecuting ? 'animate-spin-slow text-blue-500' : ''}`} />
          </div>

          <span className="text-[10px] font-mono text-slate-400 mt-1 font-semibold">
            {targetFormatHint || 'Awaiting Process'}
          </span>
        </div>

        <div className="space-y-0.5">
          <p className="text-xs font-bold text-slate-600 dark:text-slate-400 truncate">
            {isExecuting ? 'Transforming payload...' : 'Pending execution'}
          </p>
          <p className="text-[10px] text-slate-400 font-mono">
            {isExecuting ? 'Engines active' : 'Ready'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default OutputFileCard;
