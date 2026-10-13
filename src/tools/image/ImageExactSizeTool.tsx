import React, { useState } from 'react';
import { Dropzone } from '../../components/common/Dropzone';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { formatBytes, downloadBlob } from '../../utils/file';
import { useStorage } from '../../context/StorageContext';
import { Download, Target, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

export const ImageExactSizeTool: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetKb, setTargetKb] = useState<number>(50);
  const [allowDimensionScale, setAllowDimensionScale] = useState<boolean>(true);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [finalDimensions, setFinalDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const { recordToolUsage } = useStorage();

  const handleFiles = (files: File[]) => {
    if (files.length > 0) {
      setSelectedFile(files[0]);
      setResultBlob(null);
      setResultUrl(null);
      setWarningMessage(null);
    }
  };

  const executeExactSizeCompression = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setWarningMessage(null);

    const targetBytes = targetKb * 1024;

    try {
      const img = new Image();
      const objUrl = URL.createObjectURL(selectedFile);
      img.src = objUrl;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      let currentWidth = img.naturalWidth;
      let currentHeight = img.naturalHeight;
      let bestBlob: Blob | null = null;
      let bestQuality = 0.8;

      const canvas = document.createElement('canvas');

      const attemptCompression = (scale: number, q: number): Promise<Blob> => {
        const w = Math.round(img.naturalWidth * scale);
        const h = Math.round(img.naturalHeight * scale);
        canvas.width = w;
        canvas.height = h;

        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);

        return new Promise((resolve, reject) => {
          canvas.toBlob(
            (b) => {
              if (b) resolve(b);
              else reject(new Error('Canvas blob conversion error'));
            },
            'image/jpeg',
            q
          );
        });
      };

      // Binary search over quality and optional dimensional scaling
      let scale = 1.0;
      let reachedTarget = false;

      for (let scalePass = 0; scalePass < (allowDimensionScale ? 5 : 1); scalePass++) {
        let lowQuality = 0.05;
        let highQuality = 0.95;

        for (let iter = 0; iter < 7; iter++) {
          const midQuality = (lowQuality + highQuality) / 2;
          const candidateBlob = await attemptCompression(scale, midQuality);

          if (candidateBlob.size <= targetBytes) {
            bestBlob = candidateBlob;
            bestQuality = midQuality;
            currentWidth = canvas.width;
            currentHeight = canvas.height;
            reachedTarget = true;
            lowQuality = midQuality; // Try higher quality while still under target
          } else {
            highQuality = midQuality; // File is too large, reduce quality
          }
        }

        if (reachedTarget || !allowDimensionScale) {
          break;
        }

        // If even lowest quality at this scale is > targetBytes, downscale dimensions by 20%
        scale *= 0.8;
      }

      URL.revokeObjectURL(objUrl);

      if (!bestBlob || bestBlob.size > targetBytes) {
        // Fallback: lowest possible quality
        const fallback = await attemptCompression(allowDimensionScale ? 0.5 : 1.0, 0.05);
        bestBlob = fallback;
        currentWidth = canvas.width;
        currentHeight = canvas.height;

        if (bestBlob.size > targetBytes) {
          setWarningMessage(
            `Could not reach strictly ${targetKb} KB without excessive dimension reduction. Best achieved: ${formatBytes(bestBlob.size)}.`
          );
        }
      }

      if (resultUrl) URL.revokeObjectURL(resultUrl);
      const newUrl = URL.createObjectURL(bestBlob);
      setResultBlob(bestBlob);
      setResultUrl(newUrl);
      setFinalDimensions({ width: currentWidth, height: currentHeight });

      recordToolUsage(
        'image-exact-size',
        `Compressed to ${formatBytes(bestBlob.size)} (target was ${targetKb} KB)`
      );
    } catch (err) {
      console.error(err);
      alert('Error during exact size compression.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultBlob || !selectedFile) return;
    const baseName = selectedFile.name.replace(/\.[^/.]+$/, '');
    downloadBlob(resultBlob, `${baseName}-under-${targetKb}kb.jpg`);
  };

  return (
    <div className="space-y-6">
      {!selectedFile ? (
        <Dropzone
          onFilesSelected={handleFiles}
          accept="image/jpeg,image/png,image/webp"
          label="Select an image to compress to target size"
          sublabel="Ideal for exam applications, portals, and signature forms requiring strict KB limits"
        />
      ) : (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Target Size Limit: <span className="font-mono text-sky-600">{targetKb} KB</span>
                </label>
                <Input
                  type="number"
                  min="5"
                  max="5000"
                  value={targetKb}
                  onChange={(e) => setTargetKb(Math.max(5, Number(e.target.value)))}
                  placeholder="e.g. 50"
                />
                <div className="flex gap-1.5 mt-2">
                  {[20, 50, 100, 200].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setTargetKb(preset)}
                      className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                        targetKb === preset
                          ? 'bg-sky-600 text-white border-sky-600'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {preset} KB
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={allowDimensionScale}
                    onChange={(e) => setAllowDimensionScale(e.target.checked)}
                    className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <span>Downscale dimensions if quality alone cannot reach target</span>
                </label>
                <p className="text-[11px] text-slate-400 mt-1">
                  Required when shrinking high-megapixel photos to tiny sizes (e.g., &lt; 50KB).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={executeExactSizeCompression}
                  isLoading={isProcessing}
                  className="w-full"
                  icon={<Target className="w-4 h-4" />}
                >
                  Compress to Target
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedFile(null);
                    setResultBlob(null);
                  }}
                  title="Choose another image"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>

          {warningMessage && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-center gap-2.5 text-xs text-amber-800 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{warningMessage}</span>
            </div>
          )}

          {resultBlob && (
            <Card className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span>Target Compression Complete</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Original: {formatBytes(selectedFile.size)} ➔ Result: <strong className="text-emerald-600 dark:text-emerald-400">{formatBytes(resultBlob.size)}</strong>
                    {finalDimensions && ` • Dimensions: ${finalDimensions.width}×${finalDimensions.height}px`}
                  </p>
                </div>

                <Button onClick={handleDownload} icon={<Download className="w-4 h-4" />}>
                  Download Image ({formatBytes(resultBlob.size)})
                </Button>
              </div>

              {resultUrl && (
                <div className="relative aspect-video max-h-80 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                  <img
                    src={resultUrl}
                    alt="Result"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              )}
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
