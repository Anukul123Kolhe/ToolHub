import React, { useState } from 'react';
import { Dropzone } from '../../components/common/Dropzone';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { formatBytes, downloadBlob } from '../../utils/file';
import { useStorage } from '../../context/StorageContext';
import { Download, Sliders, CheckCircle, RefreshCw, Eye } from 'lucide-react';

export const ImageCompressorTool: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [compressedUrl, setCompressedUrl] = useState<string | null>(null);
  const [quality, setQuality] = useState<number>(75);
  const [format, setFormat] = useState<'image/jpeg' | 'image/webp' | 'image/png'>('image/jpeg');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const { recordToolUsage } = useStorage();

  const handleFiles = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      setOriginalUrl(URL.createObjectURL(file));
      setCompressedBlob(null);
      setCompressedUrl(null);
    }
  };

  const compressImage = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);

    try {
      const img = new Image();
      const objectUrl = URL.createObjectURL(selectedFile);
      img.src = objectUrl;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not initialize Canvas 2D context');

      // For PNGs with transparency converted to JPEG, fill white background
      if (format === 'image/jpeg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0);

      const blob: Blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else reject(new Error('Canvas compression failed'));
          },
          format,
          quality / 100
        );
      });

      URL.revokeObjectURL(objectUrl);

      if (compressedUrl) {
        URL.revokeObjectURL(compressedUrl);
      }

      const newUrl = URL.createObjectURL(blob);
      setCompressedBlob(blob);
      setCompressedUrl(newUrl);

      const savedPercent = Math.max(
        0,
        Math.round(((selectedFile.size - blob.size) / selectedFile.size) * 100)
      );
      recordToolUsage(
        'image-compressor',
        `Compressed "${selectedFile.name}" from ${formatBytes(selectedFile.size)} to ${formatBytes(blob.size)} (${savedPercent}% saved)`
      );
    } catch (err) {
      console.error('Compression error:', err);
      alert('Failed to compress image. Please try another image file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!compressedBlob || !selectedFile) return;
    const extension = format === 'image/jpeg' ? 'jpg' : format === 'image/webp' ? 'webp' : 'png';
    const originalName = selectedFile.name.replace(/\.[^/.]+$/, '');
    downloadBlob(compressedBlob, `${originalName}-compressed.${extension}`);
  };

  const savedBytes = selectedFile && compressedBlob ? selectedFile.size - compressedBlob.size : 0;
  const savedPercent =
    selectedFile && compressedBlob
      ? Math.round((savedBytes / selectedFile.size) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {!selectedFile ? (
        <Dropzone
          onFilesSelected={handleFiles}
          accept="image/jpeg,image/png,image/webp"
          label="Drag and drop an image to compress"
          sublabel="Supports JPG, PNG, and WebP • 100% in-browser processing"
        />
      ) : (
        <div className="space-y-6">
          {/* Controls Bar */}
          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Compression Quality: <span className="font-mono text-sky-600">{quality}%</span>
                </label>
                <input
                  type="range"
                  min="5"
                  max="95"
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>Smaller File (Lower Quality)</span>
                  <span>Higher Quality (Larger File)</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Output Format
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as any)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500"
                >
                  <option value="image/jpeg">JPEG (Optimal for photos)</option>
                  <option value="image/webp">WebP (Modern high-compression)</option>
                  <option value="image/png">PNG (Preserves transparency)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={compressImage}
                  isLoading={isProcessing}
                  className="w-full"
                  icon={<Sliders className="w-4 h-4" />}
                >
                  Apply Compression
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedFile(null);
                    setCompressedBlob(null);
                  }}
                  title="Choose another image"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Side by Side Comparison & Results */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Original Card */}
            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-700 dark:text-slate-300">Original Image</span>
                <span className="font-mono text-slate-500">{formatBytes(selectedFile.size)}</span>
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
              <p className="text-[11px] text-slate-400 truncate font-mono">{selectedFile.name}</p>
            </Card>

            {/* Compressed Result Card */}
            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-700 dark:text-slate-300">Compressed Output</span>
                {compressedBlob ? (
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    {formatBytes(compressedBlob.size)} ({savedPercent >= 0 ? `-${savedPercent}%` : `+${Math.abs(savedPercent)}%`})
                  </span>
                ) : (
                  <span className="text-slate-400 font-normal">Pending compression</span>
                )}
              </div>

              <div className="relative aspect-video max-h-72 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                {compressedUrl ? (
                  <img
                    src={compressedUrl}
                    alt="Compressed"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="text-center text-slate-400 text-xs p-4">
                    Click "Apply Compression" to process this image.
                  </div>
                )}
              </div>

              {compressedBlob && (
                <div className="pt-2">
                  <Button
                    onClick={handleDownload}
                    className="w-full"
                    icon={<Download className="w-4 h-4" />}
                  >
                    Download ({formatBytes(compressedBlob.size)})
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
