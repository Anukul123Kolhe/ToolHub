import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Dropzone } from '../../components/common/Dropzone';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { formatBytes, downloadBlob } from '../../utils/file';
import { useStorage } from '../../context/StorageContext';
import {
  FilePlus,
  Download,
  RefreshCw,
  Eye,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Trash2,
} from 'lucide-react';

interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
}

export const ImagesToPdfTool: React.FC = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [pageSize, setPageSize] = useState<'fit' | 'a4'>('fit');
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const { recordToolUsage } = useStorage();

  const handleFiles = (files: File[]) => {
    const newItems = files.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...newItems]);
    setOutputBlob(null);
    setOutputUrl(null);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const moveDown = (index: number) => {
    if (index === images.length - 1) return;
    setImages((prev) => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(images[index].previewUrl);
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const convertToPdf = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);

    try {
      const pdfDoc = await PDFDocument.create();

      for (const item of images) {
        const imageBytes = await item.file.arrayBuffer();
        let embeddedImage;

        if (item.file.type === 'image/png') {
          embeddedImage = await pdfDoc.embedPng(imageBytes);
        } else {
          // Default to JPG embedding
          embeddedImage = await pdfDoc.embedJpg(imageBytes);
        }

        const imgWidth = embeddedImage.width;
        const imgHeight = embeddedImage.height;

        let pageWidth = imgWidth;
        let pageHeight = imgHeight;

        if (pageSize === 'a4') {
          // Standard A4: 595.28 x 841.89 points
          pageWidth = 595.28;
          pageHeight = 841.89;
          const page = pdfDoc.addPage([pageWidth, pageHeight]);

          const scale = Math.min((pageWidth - 40) / imgWidth, (pageHeight - 40) / imgHeight);
          const drawW = imgWidth * scale;
          const drawH = imgHeight * scale;
          const x = (pageWidth - drawW) / 2;
          const y = (pageHeight - drawH) / 2;

          page.drawImage(embeddedImage, { x, y, width: drawW, height: drawH });
        } else {
          // Fit page to exact image dimensions
          const page = pdfDoc.addPage([pageWidth, pageHeight]);
          page.drawImage(embeddedImage, { x: 0, y: 0, width: pageWidth, height: pageHeight });
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });

      if (outputUrl) URL.revokeObjectURL(outputUrl);
      const newUrl = URL.createObjectURL(blob);
      setOutputBlob(blob);
      setOutputUrl(newUrl);

      recordToolUsage(
        'images-to-pdf',
        `Converted ${images.length} images to PDF document (${formatBytes(blob.size)})`
      );
    } catch (err) {
      console.error(err);
      alert('Failed to generate PDF. Make sure images are valid JPEG or PNG files.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!outputBlob) return;
    downloadBlob(outputBlob, 'photos-to-document.pdf');
  };

  return (
    <div className="space-y-6">
      <Dropzone
        onFilesSelected={handleFiles}
        accept="image/jpeg,image/png,image/webp"
        multiple={true}
        label="Select images to convert into PDF"
        sublabel="Add single or multiple photos • Reorder pages in custom sequence"
      />

      {images.length > 0 && (
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                  Image Queue ({images.length} pages)
                </h3>
                <p className="text-xs text-slate-500">
                  Arrange images in the sequence you want them to appear in the PDF
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-600 dark:text-slate-400">Page Sizing:</label>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(e.target.value as any)}
                  className="text-xs p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="fit">Fit to Image Size</option>
                  <option value="a4">Standard A4 Sheet</option>
                </select>
                <Button
                  onClick={convertToPdf}
                  isLoading={isProcessing}
                  size="sm"
                  icon={<FilePlus className="w-4 h-4" />}
                >
                  Generate PDF
                </Button>
              </div>
            </div>

            {/* Thumbnail Reorder Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 max-h-72 overflow-y-auto p-1">
              {images.map((item, index) => (
                <div
                  key={item.id}
                  className="relative group rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-2 flex flex-col justify-between"
                >
                  <span className="absolute top-1 left-1 w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center text-[10px] font-bold z-10">
                    {index + 1}
                  </span>
                  <div className="aspect-square rounded-lg overflow-hidden bg-white dark:bg-slate-800 flex items-center justify-center mb-1">
                    <img src={item.previewUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                  </div>
                  <p className="text-[10px] truncate text-slate-600 dark:text-slate-400 font-mono">
                    {item.file.name}
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveDown(index)}
                      disabled={index === images.length - 1}
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="p-1 text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Generated PDF Output Preview */}
          {outputBlob && outputUrl && (
            <Card className="p-6 bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-emerald-200 dark:border-emerald-800/60">
                <div>
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                    <CheckCircle className="w-5 h-5" />
                    <span>PDF Successfully Generated!</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    Created a {images.length}-page document ({formatBytes(outputBlob.size)}). Preview below.
                  </p>
                </div>

                <Button onClick={handleDownload} icon={<Download className="w-4 h-4" />}>
                  Download Generated PDF ({formatBytes(outputBlob.size)})
                </Button>
              </div>

              <div className="w-full h-80 rounded-xl overflow-hidden border border-emerald-200 dark:border-emerald-800">
                <iframe src={outputUrl} title="Generated PDF Preview" className="w-full h-full" />
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
