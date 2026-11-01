import React from 'react';
import { FileText, FileCode, FileArchive, Image as ImageIcon, Calculator, Layers } from 'lucide-react';
import { formatBytes } from '../../../utils/file';

interface SourceFileCardProps {
  files: File[];
  previews: { id: string; name: string; size: number; type: string; url?: string }[];
  instruction?: string;
}

export const SourceFileCard: React.FC<SourceFileCardProps> = ({ files, previews, instruction }) => {
  const primaryFile = files[0];
  const primaryPreview = previews[0];
  const totalCount = files.length;
  const totalBytes = files.reduce((acc, f) => acc + f.size, 0);

  // If no files but instruction given (e.g. calculator or QR code)
  if (!primaryFile) {
    return (
      <div className="relative w-48 sm:w-56 p-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-md backdrop-blur-md animate-scale-bounce text-left select-none">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Source Input
          </span>
        </div>

        <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2 shadow-inner">
          <Calculator className="w-6 h-6" />
        </div>

        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
          AI Prompt / Parameters
        </p>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
          {instruction || 'User instruction'}
        </p>
      </div>
    );
  }

  const isImage = primaryFile.type.startsWith('image/');
  const isPdf = primaryFile.type === 'application/pdf' || primaryFile.name.toLowerCase().endsWith('.pdf');
  const isZip = primaryFile.name.toLowerCase().endsWith('.zip');
  const ext = primaryFile.name.split('.').pop()?.toUpperCase() || 'FILE';

  return (
    <div className="relative group select-none">
      {/* Background stacked card effect if multiple files */}
      {totalCount > 1 && (
        <>
          <div className="absolute inset-0 bg-slate-200/60 dark:bg-slate-800/60 rounded-2xl transform translate-x-2 translate-y-2 -rotate-1 pointer-events-none" />
          <div className="absolute inset-0 bg-slate-100/70 dark:bg-slate-800/40 rounded-2xl transform translate-x-1 translate-y-1 rotate-1 pointer-events-none" />
        </>
      )}

      {/* Main Source File Card */}
      <div className="relative w-48 sm:w-56 p-3.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 shadow-lg backdrop-blur-md animate-scale-bounce text-left transition-all">
        {/* Source Badge */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800">
            Original Input
          </span>

          {totalCount > 1 && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
              <Layers className="w-3 h-3 text-blue-500" />
              +{totalCount - 1} more
            </span>
          )}
        </div>

        {/* File Preview Thumbnail / Icon */}
        <div className="w-full h-24 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden mb-2 relative group-hover:scale-[1.01] transition-transform">
          {isImage && primaryPreview?.url ? (
            <img
              src={primaryPreview.url}
              alt={primaryFile.name}
              className="w-full h-full object-cover"
            />
          ) : isPdf ? (
            <div className="flex flex-col items-center justify-center text-rose-500">
              <FileText className="w-9 h-9 stroke-[1.8]" />
              <span className="text-[9px] font-bold font-mono uppercase mt-0.5">PDF Document</span>
            </div>
          ) : isZip ? (
            <div className="flex flex-col items-center justify-center text-amber-500">
              <FileArchive className="w-9 h-9 stroke-[1.8]" />
              <span className="text-[9px] font-bold font-mono uppercase mt-0.5">ZIP Archive</span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-blue-500">
              <FileCode className="w-9 h-9 stroke-[1.8]" />
              <span className="text-[9px] font-bold font-mono uppercase mt-0.5">Data / Text</span>
            </div>
          )}

          {/* Format Badge */}
          <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-900/80 text-white backdrop-blur-xs">
            {ext}
          </span>
        </div>

        {/* File Information */}
        <div className="space-y-0.5">
          <p className="text-xs font-bold text-slate-900 dark:text-white truncate" title={primaryFile.name}>
            {primaryFile.name}
          </p>
          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
            <span>Size: {formatBytes(primaryFile.size)}</span>
            {totalCount > 1 && <span className="font-medium text-slate-600 dark:text-slate-300">Total: {formatBytes(totalBytes)}</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SourceFileCard;
