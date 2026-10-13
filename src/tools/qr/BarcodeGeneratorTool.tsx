import React, { useState, useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useStorage } from '../../context/StorageContext';
import { Barcode, Download, Copy, Check, RefreshCw, Eye } from 'lucide-react';

export const BarcodeGeneratorTool: React.FC = () => {
  const [value, setValue] = useState<string>('TOOLHUB-2026');
  const [format, setFormat] = useState<string>('CODE128');
  const [width, setWidth] = useState<number>(2);
  const [height, setHeight] = useState<number>(80);
  const [displayValue, setDisplayValue] = useState<boolean>(true);
  const [lineColor, setLineColor] = useState<string>('#000000');
  const [background, setBackground] = useState<string>('#ffffff');
  
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const { recordToolUsage } = useStorage();

  const formats = [
    { label: 'Code 128 (Universal)', value: 'CODE128' },
    { label: 'EAN-13 (Retail Global)', value: 'EAN13' },
    { label: 'UPC-A (Retail USA)', value: 'UPC' },
    { label: 'Code 39 (Industrial)', value: 'CODE39' },
    { label: 'ITF (Interleaved 2 of 5)', value: 'ITF' },
    { label: 'MSI (Inventory)', value: 'MSI' },
    { label: 'Pharmacode', value: 'pharmacode' },
  ];

  useEffect(() => {
    if (!svgRef.current || !value.trim()) return;

    try {
      setError(null);
      JsBarcode(svgRef.current, value.trim(), {
        format,
        width,
        height,
        displayValue,
        lineColor,
        background,
        margin: 10,
        font: 'monospace',
        fontSize: 14,
        valid: (valid) => {
          if (!valid) {
            setError(`Invalid value for ${format} barcode format.`);
          }
        },
      });
      recordToolUsage('barcode-generator', 'Barcode Generator');
    } catch (err: any) {
      setError(`Cannot render barcode: ${err.message}`);
    }
  }, [value, format, width, height, displayValue, lineColor, background]);

  const handleDownloadSvg = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `barcode-${value}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPng = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      if (ctx) {
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `barcode-${value}.png`;
            a.click();
            URL.revokeObjectURL(url);
          }
        }, 'image/png');
      }
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleCopySvg = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    navigator.clipboard.writeText(svgData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Barcode Generator</h1>
          <p className="text-sm text-foreground-muted">
            Create standard retail, logistics, and inventory linear barcodes (Code 128, EAN, UPC, Code 39) with vector export.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Settings */}
        <Card className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-foreground-muted">
              Barcode Data / Value
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Enter text or numbers..."
              className="w-full rounded-lg border border-border bg-surface-raised p-2.5 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-foreground-muted">
              Symbology Format
            </label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-raised p-2 text-xs font-medium text-foreground focus:outline-none"
            >
              {formats.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-foreground-muted">Bar Width ({width}px)</label>
              <input
                type="range"
                min="1"
                max="4"
                step="0.5"
                value={width}
                onChange={(e) => setWidth(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-foreground-muted">Height ({height}px)</label>
              <input
                type="range"
                min="40"
                max="160"
                step="5"
                value={height}
                onChange={(e) => setHeight(parseInt(e.target.value, 10))}
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="space-y-1">
              <label className="text-xs text-foreground-muted">Line Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={lineColor}
                  onChange={(e) => setLineColor(e.target.value)}
                  className="w-8 h-8 rounded border border-border cursor-pointer p-0"
                />
                <span className="text-xs font-mono text-foreground">{lineColor}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-foreground-muted">Background Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={background}
                  onChange={(e) => setBackground(e.target.value)}
                  className="w-8 h-8 rounded border border-border cursor-pointer p-0"
                />
                <span className="text-xs font-mono text-foreground">{background}</span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={displayValue}
                onChange={(e) => setDisplayValue(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary/20"
              />
              Display human-readable text label below barcode
            </label>
          </div>
        </Card>

        {/* Live Preview Card */}
        <Card className="p-6 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" /> Live Barcode Preview
              </h3>
              <span className="text-xs font-mono text-foreground-muted">{format}</span>
            </div>

            <div className="p-6 rounded-xl bg-white border border-border flex items-center justify-center min-h-[160px] overflow-x-auto shadow-sm">
              <svg ref={svgRef} className="max-w-full" />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium">
                {error}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-border flex items-center gap-2 flex-wrap">
            <Button onClick={handleDownloadPng} variant="primary" size="sm" className="gap-1.5" disabled={!!error}>
              <Download className="w-3.5 h-3.5" /> Download PNG
            </Button>
            <Button onClick={handleDownloadSvg} variant="secondary" size="sm" className="gap-1.5" disabled={!!error}>
              <Download className="w-3.5 h-3.5" /> Download SVG
            </Button>
            <Button onClick={handleCopySvg} variant="ghost" size="sm" className="gap-1.5" disabled={!!error}>
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy SVG'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
