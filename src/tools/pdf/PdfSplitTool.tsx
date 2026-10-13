import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Dropzone } from '../../components/common/Dropzone';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { formatBytes, downloadBlob } from '../../utils/file';
import { useStorage } from '../../context/StorageContext';
import { Scissors, Download, RefreshCw, Eye, CheckCircle, AlertCircle } from 'lucide-react';

export const PdfSplitTool: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [pageRange, setPageRange] = useState<string>('1-2');

  const [splitBlob, setSplitBlob] = useState<Blob | null>(null);
  const [splitUrl, setSplitUrl] = useState<string | null>(null);
  const [splitPageCount, setSplitPageCount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { recordToolUsage } = useStorage();

  const handleFiles = async (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      setError(null);
      setSplitBlob(null);
      setSplitUrl(null);

      const url = URL.createObjectURL(file);
      setFileUrl(url);

      try {
        const buffer = await file.arrayBuffer();
        const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
        const count = doc.getPageCount();
        setTotalPages(count);
        setPageRange(count > 1 ? `1-${Math.min(2, count)}` : '1');
      } catch {
        setTotalPages(1);
      }
    }
  };

  const parsePageIndices = (rangeStr: string, max: number): number[] => {
    const indices = new Set<number>();
    const parts = rangeStr.split(',');

    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.includes('-')) {
        const [start, end] = trimmed.split('-').map((n) => parseInt(n.trim(), 10));
        if (!isNaN(start) && !isNaN(end)) {
          const s = Math.max(1, Math.min(start, end));
          const e = Math.min(max, Math.max(start, end));
          for (let i = s; i <= e; i++) {
            indices.add(i - 1);
          }
        }
      } else {
        const p = parseInt(trimmed, 10);
        if (!isNaN(p) && p >= 1 && p <= max) {
          indices.add(p - 1);
        }
      }
    }

    return Array.from(indices).sort((a, b) => a - b);
  };

  const executeSplit = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setError(null);

    try {
      const indices = parsePageIndices(pageRange, totalPages);
      if (indices.length === 0) {
        throw new Error(`Invalid page range. Please specify pages between 1 and ${totalPages}.`);
      }

      const buffer = await selectedFile.arrayBuffer();
      const sourceDoc = await PDFDocument.load(buffer);
      const splitDoc = await PDFDocument.create();

      const copiedPages = await splitDoc.copyPages(sourceDoc, indices);
      copiedPages.forEach((p) => splitDoc.addPage(p));

      const pdfBytes = await splitDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });

      if (splitUrl) URL.revokeObjectURL(splitUrl);
      const newUrl = URL.createObjectURL(blob);
      setSplitBlob(blob);
      setSplitUrl(newUrl);
      setSplitPageCount(indices.length);

      recordToolUsage(
        'pdf-split',
        `Extracted ${indices.length} pages from "${selectedFile.name}" (${formatBytes(blob.size)})`
      );
    } catch (err: any) {
      setError(err.message || 'Failed to split PDF');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!splitBlob || !selectedFile) return;
    const base = selectedFile.name.replace(/\.[^/.]+$/, '');
    downloadBlob(splitBlob, `${base}-pages-${pageRange.replace(/[^0-9-]/g, '_')}.pdf`);
  };

  return (
    <div className="space-y-6">
      {!selectedFile ? (
        <Dropzone
          onFilesSelected={handleFiles}
          accept=".pdf,application/pdf"
          label="Select a PDF document to split"
          sublabel="Extract page ranges, chapters, or individual pages • 100% in-browser"
        />
      ) : (
        <div className="space-y-6">
          {/* Controls Bar */}
          <Card className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                  Select Pages to Extract
                </h3>
                <p className="text-xs text-slate-500">
                  Document has <strong className="text-sky-600">{totalPages}</strong> total pages ({formatBytes(selectedFile.size)})
                </p>
              </div>

              <div className="flex gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setPageRange('1')}
                  className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 border text-slate-600 dark:text-slate-300"
                >
                  First Page Only
                </button>
                {totalPages > 2 && (
                  <button
                    type="button"
                    onClick={() => setPageRange(`1-${Math.ceil(totalPages / 2)}`)}
                    className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 border text-slate-600 dark:text-slate-300"
                  >
                    First Half (1-{Math.ceil(totalPages / 2)})
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Page Range or Numbers (e.g. "1-3", "1, 4, 7-9")
                </label>
                <Input
                  type="text"
                  value={pageRange}
                  onChange={(e) => setPageRange(e.target.value)}
                  placeholder="e.g. 1-3, 5"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={executeSplit}
                  isLoading={isProcessing}
                  className="w-full"
                  icon={<Scissors className="w-4 h-4" />}
                >
                  Split PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedFile(null);
                    setSplitBlob(null);
                  }}
                  title="Choose another PDF"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}
          </Card>

          {/* Previews: Uploaded PDF vs Split Output PDF */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Uploaded PDF Preview */}
            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <Eye className="w-4 h-4 text-sky-500" />
                  <span>Original Document Preview</span>
                </span>
                <span className="font-mono text-slate-400">{totalPages} pages</span>
              </div>
              <div className="w-full h-80 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
                {fileUrl && (
                  <iframe src={fileUrl} title="Original PDF" className="w-full h-full" />
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate font-mono">{selectedFile.name}</p>
            </Card>

            {/* Split Result Output Preview */}
            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Extracted PDF Output Preview</span>
                </span>
                {splitBlob ? (
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    {splitPageCount} pages ({formatBytes(splitBlob.size)})
                  </span>
                ) : (
                  <span className="text-slate-400 font-normal">Pending extraction</span>
                )}
              </div>

              <div className="w-full h-80 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                {splitUrl ? (
                  <iframe src={splitUrl} title="Split PDF Output" className="w-full h-full" />
                ) : (
                  <div className="text-slate-400 text-xs p-4 text-center">
                    Enter your page range and click "Split PDF" to generate preview.
                  </div>
                )}
              </div>

              {splitBlob && (
                <Button onClick={handleDownload} className="w-full" icon={<Download className="w-4 h-4" />}>
                  Download Extracted PDF ({formatBytes(splitBlob.size)})
                </Button>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
