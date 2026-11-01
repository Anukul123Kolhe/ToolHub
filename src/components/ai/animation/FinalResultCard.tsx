import React, { useState } from 'react';
import { Download, Eye, RotateCcw, ArrowRight, Copy, Check, FileText, FileArchive, FileCode } from 'lucide-react';
import { formatBytes, downloadBlob } from '../../../utils/file';
import { ProcessedFile } from '../../../services/ai/toolRegistry';
import { Button } from '../../common/Button';

interface FinalResultCardProps {
  files: ProcessedFile[];
  textOutput?: string | null;
  onReset: () => void;
  onContinueWithAI: (file: ProcessedFile) => void;
  onPreviewFile?: (file: ProcessedFile) => void;
}

export const FinalResultCard: React.FC<FinalResultCardProps> = ({
  files,
  textOutput,
  onReset,
  onContinueWithAI,
  onPreviewFile,
}) => {
  const [copiedText, setCopiedText] = useState(false);

  const handleCopyText = () => {
    if (!textOutput) return;
    navigator.clipboard.writeText(textOutput);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const primaryFile = files[0];

  return (
    <div className="w-full space-y-4 pt-2 select-none">
      {/* Text / Data Output Display */}
      {textOutput && (
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Generated Text / Telemetry Output
            </span>
            <button
              type="button"
              onClick={handleCopyText}
              className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              {copiedText ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedText ? 'Copied' : 'Copy Output'}
            </button>
          </div>
          <pre className="p-3 rounded-xl bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto max-h-44 leading-relaxed">
            {textOutput}
          </pre>
        </div>
      )}

      {/* Generated Output File Items */}
      {files.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {files.map((file, idx) => {
            const isImage = file.type.startsWith('image/');
            const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
            const isZip = file.name.endsWith('.zip');
            const percentSmaller =
              file.originalSize && file.originalSize > file.size
                ? Math.round(((file.originalSize - file.size) / file.originalSize) * 100)
                : null;

            return (
              <div
                key={file.name + idx}
                className="p-3.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col justify-between gap-3 text-left transition-all hover:border-blue-400 dark:hover:border-blue-500"
              >
                <div className="flex items-start gap-3">
                  {/* Thumbnail / Icon */}
                  <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {isImage && file.url ? (
                      <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                    ) : isPdf ? (
                      <FileText className="w-7 h-7 text-rose-500" />
                    ) : isZip ? (
                      <FileArchive className="w-7 h-7 text-amber-500" />
                    ) : (
                      <FileCode className="w-7 h-7 text-blue-500" />
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="min-w-0 flex-grow">
                    <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate" title={file.name}>
                      {file.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>Size: <strong className="text-slate-800 dark:text-slate-200">{formatBytes(file.size)}</strong></span>
                      {file.originalSize && (
                        <span className="text-[10px] line-through text-slate-400">
                          {formatBytes(file.originalSize)}
                        </span>
                      )}
                    </div>

                    {percentSmaller !== null && (
                      <span className="inline-block mt-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                        ⚡ {percentSmaller}% smaller
                      </span>
                    )}
                  </div>
                </div>

                {/* File Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                  {/* Button 1: View Result */}
                  <button
                    type="button"
                    onClick={() => {
                      if (onPreviewFile) {
                        onPreviewFile(file);
                      } else if (file.url) {
                        window.open(file.url, '_blank');
                      }
                    }}
                    className="w-full py-2 px-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-center gap-1.5"
                    title="View Result in Preview Window"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span>View Result</span>
                  </button>

                  {/* Button 2: Download */}
                  <button
                    type="button"
                    onClick={() => downloadBlob(file.blob, file.name)}
                    className="w-full py-2 px-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5"
                    title="Download Generated File"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Global Bottom Actions: Do Another Task & Continue With AI */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
        {/* Button 3: Do Another Task */}
        <Button
          variant="secondary"
          size="sm"
          onClick={onReset}
          className="text-xs font-bold flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Do Another Task</span>
        </Button>

        {/* Button 4: Continue With AI */}
        {primaryFile && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onContinueWithAI(primaryFile)}
            className="text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white flex items-center gap-1.5 shadow-md shadow-blue-500/25"
          >
            <span>Continue With AI</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default FinalResultCard;
