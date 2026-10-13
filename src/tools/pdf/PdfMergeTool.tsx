import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Dropzone } from '../../components/common/Dropzone';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { formatBytes, downloadBlob } from '../../utils/file';
import { useStorage } from '../../context/StorageContext';
import {
  FileText,
  ArrowUp,
  ArrowDown,
  Trash2,
  Download,
  Plus,
  RefreshCw,
  CheckCircle,
} from 'lucide-react';

interface PdfFileItem {
  id: string;
  file: File;
  pageCount?: number;
}

export const PdfMergeTool: React.FC = () => {
  const [pdfItems, setPdfItems] = useState<PdfFileItem[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [mergedBlob, setMergedBlob] = useState<Blob | null>(null);
  const [mergedStats, setMergedStats] = useState<{ totalPages: number; size: number } | null>(null);
  const { recordToolUsage } = useStorage();

  const handleFiles = async (files: File[]) => {
    const newItems: PdfFileItem[] = [];

    for (const file of files) {
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        let pages: number | undefined;
        try {
          const buffer = await file.arrayBuffer();
          const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
          pages = doc.getPageCount();
        } catch {
          pages = undefined;
        }

        newItems.push({
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          file,
          pageCount: pages,
        });
      }
    }

    setPdfItems((prev) => [...prev, ...newItems]);
    setMergedBlob(null);
    setMergedStats(null);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setPdfItems((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const moveDown = (index: number) => {
    if (index === pdfItems.length - 1) return;
    setPdfItems((prev) => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const removeItem = (index: number) => {
    setPdfItems((prev) => prev.filter((_, i) => i !== index));
  };

  const executeMerge = async () => {
    if (pdfItems.length < 2) {
      alert('Please select at least 2 PDF documents to merge.');
      return;
    }

    setIsProcessing(true);

    try {
      const mergedPdf = await PDFDocument.create();
      let totalPages = 0;

      for (const item of pdfItems) {
        const buffer = await item.file.arrayBuffer();
        const doc = await PDFDocument.load(buffer);
        const copiedPages = await mergedPdf.copyPages(doc, doc.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
        totalPages += copiedPages.length;
      }

      const mergedBytes = await mergedPdf.save();
      const blob = new Blob([mergedBytes], { type: 'application/pdf' });

      setMergedBlob(blob);
      setMergedStats({ totalPages, size: blob.size });

      recordToolUsage(
        'pdf-merge',
        `Merged ${pdfItems.length} PDFs (${totalPages} pages) into a single document (${formatBytes(blob.size)})`
      );
    } catch (err) {
      console.error(err);
      alert('Failed to merge PDFs. One of the documents may be password protected or corrupted.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!mergedBlob) return;
    downloadBlob(mergedBlob, 'toolhub-merged.pdf');
  };

  return (
    <div className="space-y-6">
      <Dropzone
        onFilesSelected={handleFiles}
        accept=".pdf,application/pdf"
        multiple={true}
        label="Add PDF files to merge"
        sublabel="Select two or more PDFs • Reorder pages in any sequence"
      />

      {pdfItems.length > 0 && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                PDF Documents Queue ({pdfItems.length})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Use the arrows to adjust the merging order before combining
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPdfItems([]);
                setMergedBlob(null);
              }}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Clear All
            </Button>
          </div>

          <div className="space-y-2">
            {pdfItems.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 flex-shrink-0">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {item.file.name}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {formatBytes(item.file.size)}{' '}
                      {item.pageCount ? `• ${item.pageCount} pages` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30"
                    title="Move Up"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDown(index)}
                    disabled={index === pdfItems.length - 1}
                    className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30"
                    title="Move Down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="p-1 rounded text-slate-400 hover:text-rose-500 transition-colors"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              {pdfItems.length < 2
                ? 'Select at least one more PDF to merge'
                : `Ready to combine ${pdfItems.length} documents`}
            </p>

            <Button
              onClick={executeMerge}
              isLoading={isProcessing}
              disabled={pdfItems.length < 2}
              icon={<FileText className="w-4 h-4" />}
            >
              Merge PDFs Now
            </Button>
          </div>
        </Card>
      )}

      {mergedBlob && mergedStats && (
        <Card className="p-6 bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                <CheckCircle className="w-5 h-5" />
                <span>PDFs Successfully Merged!</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                Generated a single document containing {mergedStats.totalPages} pages ({formatBytes(mergedStats.size)}).
              </p>
            </div>

            <Button onClick={handleDownload} icon={<Download className="w-4 h-4" />}>
              Download Merged PDF
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
