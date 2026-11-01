import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  FileText,
  FileArchive,
  FileCode,
  Copy,
  Check,
  FolderArchive,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { formatBytes, downloadBlob } from '../../utils/file';
import { ProcessedFile } from '../../services/ai/toolRegistry';
import { Button } from '../common/Button';
import { unzipSync } from 'fflate';

interface InPageFilePreviewModalProps {
  file: ProcessedFile | null;
  onClose: () => void;
}

export const InPageFilePreviewModal: React.FC<InPageFilePreviewModalProps> = ({ file, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [isLoadingText, setIsLoadingText] = useState(false);
  const [zipEntries, setZipEntries] = useState<{ name: string; size: number }[]>([]);
  const [isLoadingZip, setIsLoadingZip] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Inspect ZIP or Text contents when file changes
  useEffect(() => {
    if (!file) {
      setTextContent(null);
      setZipEntries([]);
      setIsZoomed(false);
      return;
    }

    const isZip = file.name.toLowerCase().endsWith('.zip') || file.type.includes('zip');
    const isText =
      file.type.startsWith('text/') ||
      file.name.endsWith('.json') ||
      file.name.endsWith('.csv') ||
      file.name.endsWith('.txt') ||
      file.name.endsWith('.md') ||
      file.name.endsWith('.xml') ||
      file.name.endsWith('.html');

    if (isZip) {
      setIsLoadingZip(true);
      file.blob
        .arrayBuffer()
        .then((buf) => {
          const unzipped = unzipSync(new Uint8Array(buf));
          const list = Object.entries(unzipped).map(([path, data]) => ({
            name: path,
            size: data.length,
          }));
          setZipEntries(list);
        })
        .catch((err) => {
          console.warn('Failed to parse zip archive in-memory:', err);
        })
        .finally(() => setIsLoadingZip(false));
    } else if (isText && file.size < 5 * 1024 * 1024) {
      setIsLoadingText(true);
      file.blob
        .text()
        .then((txt) => setTextContent(txt))
        .catch((err) => console.warn('Failed to read text stream:', err))
        .finally(() => setIsLoadingText(false));
    }
  }, [file]);

  if (!file) return null;

  const isImage = file.type.startsWith('image/');
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  const isZip = file.name.toLowerCase().endsWith('.zip') || file.type.includes('zip');
  const isText =
    file.type.startsWith('text/') ||
    file.name.endsWith('.json') ||
    file.name.endsWith('.csv') ||
    file.name.endsWith('.txt') ||
    file.name.endsWith('.md') ||
    file.name.endsWith('.xml');

  const handleCopyText = () => {
    if (!textContent) return;
    navigator.clipboard.writeText(textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none"
    >
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] z-10 transition-all animate-scale-bounce">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center flex-shrink-0 text-blue-600 dark:text-blue-400">
              {isImage ? (
                <span className="font-mono text-xs font-bold uppercase">IMG</span>
              ) : isPdf ? (
                <FileText className="w-5 h-5 text-rose-500" />
              ) : isZip ? (
                <FileArchive className="w-5 h-5 text-amber-500" />
              ) : (
                <FileCode className="w-5 h-5 text-blue-500" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate" title={file.name}>
                  {file.name}
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  In-Page Preview
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {formatBytes(file.size)} • {file.type || 'Processed file'}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {isImage && (
              <button
                type="button"
                onClick={() => setIsZoomed((z) => !z)}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title={isZoomed ? 'Fit to Screen' : 'Zoom 100%'}
              >
                {isZoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
              </button>
            )}

            {textContent && (
              <button
                type="button"
                onClick={handleCopyText}
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5"
                title="Copy contents"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            )}

            <Button
              variant="primary"
              size="sm"
              onClick={() => downloadBlob(file.blob, file.name)}
              className="text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </Button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-1"
              title="Close preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Interactive In-Page Viewer */}
        <div className="flex-1 overflow-auto bg-slate-100/70 dark:bg-slate-950 p-3 sm:p-5 flex items-center justify-center">
          {/* 1. PDF Embedded In-Page Viewer */}
          {isPdf && file.url && (
            <div className="w-full h-[76vh] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white shadow-inner">
              <iframe
                src={`${file.url}#toolbar=1`}
                title={`In-Page PDF Viewer for ${file.name}`}
                className="w-full h-full border-0"
              />
            </div>
          )}

          {/* 2. Image In-Page Viewer */}
          {isImage && file.url && (
            <div className="w-full h-[75vh] flex items-center justify-center overflow-auto rounded-2xl bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] bg-[size:16px_16px] p-4">
              <img
                src={file.url}
                alt={file.name}
                className={`transition-all duration-200 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 ${
                  isZoomed ? 'max-w-none max-h-none' : 'max-w-full max-h-[70vh] object-contain'
                }`}
              />
            </div>
          )}

          {/* 3. ZIP Archive In-Page File Explorer */}
          {isZip && (
            <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <FolderArchive className="w-5 h-5 text-amber-500" />
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    Archive Manifest ({zipEntries.length} files inside)
                  </h4>
                </div>
                <span className="text-xs font-mono text-slate-500">Unpacked in memory</span>
              </div>

              {isLoadingZip ? (
                <div className="p-8 text-center text-slate-500 text-xs font-mono animate-pulse">
                  Inspecting ZIP archive structure...
                </div>
              ) : zipEntries.length > 0 ? (
                <div className="space-y-1.5 max-h-[58vh] overflow-y-auto pr-1">
                  {zipEntries.map((entry, idx) => (
                    <div
                      key={entry.name + idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs font-mono"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-slate-400 font-bold">{idx + 1}.</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate" title={entry.name}>
                          {entry.name}
                        </span>
                      </div>
                      <span className="text-slate-500 text-[11px] flex-shrink-0 ml-3">
                        {formatBytes(entry.size)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500 text-xs">
                  Archive contains no visible entries.
                </div>
              )}
            </div>
          )}

          {/* 4. Text / Code In-Page Viewer */}
          {isText && textContent !== null && (
            <div className="w-full max-w-4xl bg-slate-950 rounded-2xl border border-slate-800 shadow-xl overflow-hidden text-left flex flex-col h-[75vh]">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs font-mono text-slate-400">
                <span>{file.name}</span>
                <span>{textContent.split('\n').length} lines • {textContent.length} characters</span>
              </div>
              <pre className="flex-1 p-4 font-mono text-xs text-slate-200 overflow-auto leading-relaxed select-text">
                {textContent}
              </pre>
            </div>
          )}

          {/* 5. Fallback File Info */}
          {!isPdf && !isImage && !isZip && (!isText || textContent === null) && (
            <div className="p-10 text-center max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-lg space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                <FileCode className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-base text-slate-900 dark:text-white">{file.name}</h4>
                <p className="text-xs text-slate-500 mt-1">
                  {formatBytes(file.size)} • {file.type || 'Binary format'}
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-2">
                  ✓ File generated and validated locally in ToolHub
                </p>
              </div>
              <Button
                variant="primary"
                size="md"
                onClick={() => downloadBlob(file.blob, file.name)}
                className="w-full justify-center text-xs font-bold"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Processed File
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InPageFilePreviewModal;
