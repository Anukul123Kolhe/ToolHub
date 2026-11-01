import React, { useState, useEffect } from 'react';
import {
  Download,
  Eye,
  RotateCcw,
  ArrowRight,
  Copy,
  Check,
  FileText,
  FileArchive,
  FileCode,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Maximize2,
  FolderArchive,
} from 'lucide-react';
import { formatBytes, downloadBlob } from '../../../utils/file';
import { ProcessedFile } from '../../../services/ai/toolRegistry';
import { Button } from '../../common/Button';
import { unzipSync } from 'fflate';

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
  const [zipContents, setZipContents] = useState<Record<string, { name: string; size: number }[]>>({});
  const [expandedPreview, setExpandedPreview] = useState<Record<string, boolean>>({});

  const handleCopyText = () => {
    if (!textOutput) return;
    navigator.clipboard.writeText(textOutput);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Inspect zip contents in-memory without extracting to disk
  useEffect(() => {
    files.forEach(async (file) => {
      if (file.name.toLowerCase().endsWith('.zip') && !zipContents[file.name]) {
        try {
          const buffer = await file.blob.arrayBuffer();
          const unzipped = unzipSync(new Uint8Array(buffer));
          const list = Object.entries(unzipped).map(([path, data]) => ({
            name: path,
            size: data.length,
          }));
          setZipContents((prev) => ({ ...prev, [file.name]: list }));
        } catch (e) {
          console.warn('Could not inspect zip contents:', e);
        }
      }
    });
  }, [files]);

  const toggleInlinePreview = (fileName: string) => {
    setExpandedPreview((prev) => ({
      ...prev,
      [fileName]: !prev[fileName],
    }));
  };

  const primaryFile = files[0];

  return (
    <div className="w-full space-y-4 pt-2 select-none">
      {/* Text / Data Output Display */}
      {textOutput && (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <FileCode className="w-4 h-4 text-blue-500" />
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
          <pre className="p-3 rounded-xl bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto max-h-52 leading-relaxed">
            {textOutput}
          </pre>
        </div>
      )}

      {/* Generated Output File Items with Live In-Page Preview */}
      {files.length > 0 && (
        <div className="space-y-4">
          {files.map((file, idx) => {
            const isImage = file.type.startsWith('image/');
            const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
            const isZip = file.name.toLowerCase().endsWith('.zip');
            const percentSmaller =
              file.originalSize && file.originalSize > file.size
                ? Math.round(((file.originalSize - file.size) / file.originalSize) * 100)
                : null;
            const isPreviewOpen = expandedPreview[file.name] !== false; // Default open for immediate in-page preview

            return (
              <div
                key={file.name + idx}
                className="p-4 sm:p-5 rounded-2xl bg-white/95 dark:bg-slate-900/95 border-2 border-slate-200 dark:border-slate-800 shadow-md flex flex-col gap-3.5 text-left transition-all hover:border-blue-400 dark:hover:border-blue-500"
              >
                {/* File Header Details */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/70 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center flex-shrink-0">
                      {isImage ? (
                        <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 uppercase">IMG</span>
                      ) : isPdf ? (
                        <FileText className="w-6 h-6 text-rose-500" />
                      ) : isZip ? (
                        <FileArchive className="w-6 h-6 text-amber-500" />
                      ) : (
                        <FileCode className="w-6 h-6 text-blue-500" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate" title={file.name}>
                          {file.name}
                        </h4>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          Ready
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        <span>Size: <strong className="text-slate-800 dark:text-slate-200">{formatBytes(file.size)}</strong></span>
                        {file.originalSize && (
                          <span className="text-[11px] line-through text-slate-400">
                            {formatBytes(file.originalSize)}
                          </span>
                        )}
                        {percentSmaller !== null && (
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            (-{percentSmaller}%)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions: Download & In-Page Modal */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleInlinePreview(file.name)}
                      className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>{isPreviewOpen ? 'Hide Preview' : 'Show In-Page Preview'}</span>
                      {isPreviewOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => onPreviewFile && onPreviewFile(file)}
                      className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5"
                      title="Enlarge preview on this page"
                    >
                      <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
                      <span className="hidden sm:inline">Maximize</span>
                    </button>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => downloadBlob(file.blob, file.name)}
                      className="text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </Button>
                  </div>
                </div>

                {/* IN-PAGE LIVE PREVIEW CONTAINER (Never redirects, stays in ToolHub) */}
                {isPreviewOpen && (
                  <div className="w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 transition-all">
                    {/* PDF Embedded Live Reader */}
                    {isPdf && file.url ? (
                      <div className="w-full space-y-1">
                        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                          <span className="font-mono text-[11px] font-bold flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-rose-500" />
                            Live In-Page PDF Reader
                          </span>
                          <span className="text-[10px] text-slate-400">Scroll to view all pages</span>
                        </div>
                        <div className="w-full h-80 sm:h-96">
                          <iframe
                            src={`${file.url}#toolbar=1`}
                            title={`Live preview of ${file.name}`}
                            className="w-full h-full border-0"
                          />
                        </div>
                      </div>
                    ) : isImage && file.url ? (
                      /* Image Live In-Page Preview */
                      <div className="w-full p-4 flex flex-col items-center justify-center bg-slate-100/50 dark:bg-slate-950">
                        <img
                          src={file.url}
                          alt={file.name}
                          className="max-h-80 w-auto object-contain rounded-lg shadow-md border border-slate-200 dark:border-slate-800"
                        />
                      </div>
                    ) : isZip ? (
                      /* ZIP Live In-Page File Manifest */
                      <div className="p-3.5 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
                          <span className="flex items-center gap-1.5 font-mono text-[11px]">
                            <FolderArchive className="w-4 h-4 text-amber-500" />
                            Archived Files ({zipContents[file.name]?.length || 0} items inside ZIP)
                          </span>
                          <span className="text-[10px] text-slate-500">Unpacked in memory</span>
                        </div>

                        {zipContents[file.name] && zipContents[file.name].length > 0 ? (
                          <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
                            {zipContents[file.name].map((entry, eIdx) => (
                              <div
                                key={entry.name + eIdx}
                                className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono"
                              >
                                <span className="truncate text-slate-800 dark:text-slate-200" title={entry.name}>
                                  📄 {entry.name}
                                </span>
                                <span className="text-slate-500 text-[11px] flex-shrink-0 ml-2">
                                  {formatBytes(entry.size)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 italic p-2">
                            Reading zip file structure...
                          </p>
                        )}
                      </div>
                    ) : (
                      /* Text/Code Preview */
                      <div className="p-3.5">
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                          Ready for download: {file.name} ({formatBytes(file.size)})
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Global Bottom Actions: Do Another Task & Continue With AI */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
        {/* Button: Do Another Task */}
        <Button
          variant="secondary"
          size="sm"
          onClick={onReset}
          className="text-xs font-bold flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Do Another Task</span>
        </Button>

        {/* Button: Continue With AI */}
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
