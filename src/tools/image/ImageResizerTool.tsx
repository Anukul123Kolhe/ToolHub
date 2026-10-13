import React, { useState } from 'react';
import { Dropzone } from '../../components/common/Dropzone';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { formatBytes, downloadBlob } from '../../utils/file';
import { useStorage } from '../../context/StorageContext';
import { Maximize2, Download, RefreshCw, Eye, CheckCircle } from 'lucide-react';

export const ImageResizerTool: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [originalWidth, setOriginalWidth] = useState<number>(0);
  const [originalHeight, setOriginalHeight] = useState<number>(0);

  const [targetWidth, setTargetWidth] = useState<number>(0);
  const [targetHeight, setTargetHeight] = useState<number>(0);
  const [lockAspectRatio, setLockAspectRatio] = useState<boolean>(true);

  const [resizedBlob, setResizedBlob] = useState<Blob | null>(null);
  const [resizedUrl, setResizedUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const { recordToolUsage } = useStorage();

  const handleFiles = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setOriginalUrl(url);

      const img = new Image();
      img.onload = () => {
        setOriginalWidth(img.naturalWidth);
        setOriginalHeight(img.naturalHeight);
        setTargetWidth(img.naturalWidth);
        setTargetHeight(img.naturalHeight);
      };
      img.src = url;

      setResizedBlob(null);
      setResizedUrl(null);
    }
  };

  const handleWidthChange = (val: number) => {
    setTargetWidth(val);
    if (lockAspectRatio && originalWidth > 0) {
      const ratio = originalHeight / originalWidth;
      setTargetHeight(Math.round(val * ratio));
    }
  };

  const handleHeightChange = (val: number) => {
    setTargetHeight(val);
    if (lockAspectRatio && originalHeight > 0) {
      const ratio = originalWidth / originalHeight;
      setTargetWidth(Math.round(val * ratio));
    }
  };

  const applyPreset = (scale: number) => {
    const w = Math.round(originalWidth * scale);
    const h = Math.round(originalHeight * scale);
    setTargetWidth(w);
    setTargetHeight(h);
  };

  const executeResize = async () => {
    if (!selectedFile || targetWidth <= 0 || targetHeight <= 0) return;
    setIsProcessing(true);

    try {
      const img = new Image();
      img.src = originalUrl!;
      await new Promise((res) => (img.onload = res));

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get Canvas context');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      const mimeType = selectedFile.type || 'image/jpeg';
      const blob: Blob = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b!), mimeType, 0.92)
      );

      if (resizedUrl) URL.revokeObjectURL(resizedUrl);
      const newUrl = URL.createObjectURL(blob);
      setResizedBlob(blob);
      setResizedUrl(newUrl);

      recordToolUsage(
        'image-resizer',
        `Resized "${selectedFile.name}" to ${targetWidth}×${targetHeight}px (${formatBytes(blob.size)})`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resizedBlob || !selectedFile) return;
    const base = selectedFile.name.replace(/\.[^/.]+$/, '');
    const ext = selectedFile.name.split('.').pop() || 'jpg';
    downloadBlob(resizedBlob, `${base}-${targetWidth}x${targetHeight}.${ext}`);
  };

  return (
    <div className="space-y-6">
      {!selectedFile ? (
        <Dropzone
          onFilesSelected={handleFiles}
          accept="image/*"
          label="Select an image to resize"
          sublabel="Change pixel dimensions or scale by percentage • Real-time preview"
        />
      ) : (
        <div className="space-y-6">
          {/* Controls Bar */}
          <Card className="p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                  Target Dimensions
                </h3>
                <p className="text-xs text-slate-500">
                  Original: {originalWidth} × {originalHeight} px ({formatBytes(selectedFile.size)})
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400">Presets:</span>
                {[0.25, 0.5, 0.75, 1.5, 2.0].map((scale) => (
                  <button
                    key={scale}
                    type="button"
                    onClick={() => applyPreset(scale)}
                    className="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-sky-950/40"
                  >
                    {scale * 100}%
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Width (Pixels)
                </label>
                <Input
                  type="number"
                  min="1"
                  max="10000"
                  value={targetWidth}
                  onChange={(e) => handleWidthChange(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Height (Pixels)
                </label>
                <Input
                  type="number"
                  min="1"
                  max="10000"
                  value={targetHeight}
                  onChange={(e) => handleHeightChange(Number(e.target.value))}
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={executeResize}
                  isLoading={isProcessing}
                  className="w-full"
                  icon={<Maximize2 className="w-4 h-4" />}
                >
                  Resize Image
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedFile(null);
                    setResizedBlob(null);
                  }}
                  title="Choose another image"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={lockAspectRatio}
                onChange={(e) => setLockAspectRatio(e.target.checked)}
                className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span>Lock Aspect Ratio (Keep proportions)</span>
            </label>
          </Card>

          {/* Previews: Uploaded vs Resized Output */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Uploaded File Preview */}
            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <Eye className="w-4 h-4 text-sky-500" />
                  <span>Uploaded Image Preview</span>
                </span>
                <span className="font-mono text-slate-400">
                  {originalWidth}×{originalHeight}px
                </span>
              </div>
              <div className="relative aspect-video max-h-72 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                {originalUrl && (
                  <img
                    src={originalUrl}
                    alt="Original"
                    className="max-h-full max-w-full object-contain"
                  />
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate font-mono">
                {selectedFile.name} ({formatBytes(selectedFile.size)})
              </p>
            </Card>

            {/* Completed Output Preview */}
            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Resized Output Preview</span>
                </span>
                {resizedBlob ? (
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    {targetWidth}×{targetHeight}px ({formatBytes(resizedBlob.size)})
                  </span>
                ) : (
                  <span className="text-slate-400 font-normal">Pending resize</span>
                )}
              </div>

              <div className="relative aspect-video max-h-72 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                {resizedUrl ? (
                  <img
                    src={resizedUrl}
                    alt="Resized"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="text-slate-400 text-xs p-4 text-center">
                    Click "Resize Image" to generate preview.
                  </div>
                )}
              </div>

              {resizedBlob && (
                <Button onClick={handleDownload} className="w-full" icon={<Download className="w-4 h-4" />}>
                  Download Resized Image ({formatBytes(resizedBlob.size)})
                </Button>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
