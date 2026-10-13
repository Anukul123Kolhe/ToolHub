import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { useStorage } from '../../context/StorageContext';
import { QrCode as QrIcon, Download, Copy, Check, RefreshCw } from 'lucide-react';

export const QrGeneratorTool: React.FC = () => {
  const [content, setContent] = useState<string>('https://toolhub.app');
  const [darkColor, setDarkColor] = useState<string>('#000000');
  const [lightColor, setLightColor] = useState<string>('#FFFFFF');
  const [errorLevel, setErrorLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { recordToolUsage } = useStorage();

  useEffect(() => {
    generateQR();
  }, [content, darkColor, lightColor, errorLevel]);

  const generateQR = async () => {
    if (!content.trim()) {
      setQrDataUrl('');
      return;
    }

    try {
      const url = await QRCode.toDataURL(content, {
        errorCorrectionLevel: errorLevel,
        margin: 2,
        width: 400,
        color: {
          dark: darkColor,
          light: lightColor,
        },
      });
      setQrDataUrl(url);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = 'toolhub-qrcode.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    recordToolUsage('qr-generator', `Generated QR code for "${content.substring(0, 30)}"`);
  };

  const handleCopy = async () => {
    if (!qrDataUrl) return;
    try {
      const res = await fetch(qrDataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('Clipboard copy not supported for images in this browser');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Controls Column */}
      <Card className="p-6 md:col-span-2 space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            QR Content (URL, Text, or Email)
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            placeholder="Enter website link, text, or phone number..."
            className="w-full text-xs p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Foreground Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={darkColor}
                onChange={(e) => setDarkColor(e.target.value)}
                className="w-8 h-8 rounded border border-slate-300 dark:border-slate-700 cursor-pointer p-0.5 bg-transparent"
              />
              <span className="font-mono text-xs text-slate-600 dark:text-slate-400">{darkColor}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Background Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={lightColor}
                onChange={(e) => setLightColor(e.target.value)}
                className="w-8 h-8 rounded border border-slate-300 dark:border-slate-700 cursor-pointer p-0.5 bg-transparent"
              />
              <span className="font-mono text-xs text-slate-600 dark:text-slate-400">{lightColor}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Error Correction
            </label>
            <select
              value={errorLevel}
              onChange={(e) => setErrorLevel(e.target.value as any)}
              className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            >
              <option value="L">Low (7% recovery)</option>
              <option value="M">Medium (15% recovery)</option>
              <option value="Q">Quartile (25% recovery)</option>
              <option value="H">High (30% recovery)</option>
            </select>
          </div>
        </div>

        <div className="pt-2 flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setContent('https://')}
          >
            URL Preset
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setContent('WIFI:S:MyNetwork;T:WPA;P:SecretPassword;;')}
          >
            Wi-Fi Preset
          </Button>
        </div>
      </Card>

      {/* QR Code Preview Card */}
      <Card className="p-6 flex flex-col items-center justify-between text-center space-y-4">
        <div className="w-full">
          <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-3">
            Live QR Preview
          </h3>
          <div className="p-4 bg-white rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-center max-w-[240px] mx-auto">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR Code" className="w-full h-auto object-contain" />
            ) : (
              <div className="text-slate-400 text-xs py-8">Enter content to generate</div>
            )}
          </div>
        </div>

        <div className="w-full space-y-2">
          <Button
            onClick={handleDownload}
            disabled={!qrDataUrl}
            className="w-full"
            icon={<Download className="w-4 h-4" />}
          >
            Download PNG
          </Button>
          <Button
            variant="outline"
            onClick={handleCopy}
            disabled={!qrDataUrl}
            className="w-full"
            icon={copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          >
            {copied ? 'Copied to Clipboard!' : 'Copy Image'}
          </Button>
        </div>
      </Card>
    </div>
  );
};
