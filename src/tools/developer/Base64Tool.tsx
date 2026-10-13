import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Dropzone } from '../../components/common/Dropzone';
import { useStorage } from '../../context/StorageContext';
import { formatBytes, downloadBlob } from '../../utils/file';
import { Copy, Check, Download, RefreshCw, FileText, Image as ImageIcon, Binary } from 'lucide-react';

export const Base64Tool: React.FC = () => {
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [inputSubtype, setInputSubtype] = useState<'text' | 'file'>('text');
  const [inputText, setInputText] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  
  const [outputText, setOutputText] = useState<string>('');
  const [decodedMediaUrl, setDecodedMediaUrl] = useState<string | null>(null);
  const [decodedMediaType, setDecodedMediaType] = useState<'image' | 'text' | 'binary' | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { recordToolUsage } = useStorage();

  const handleFiles = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      setError(null);
      if (file.type.startsWith('image/')) {
        setFilePreviewUrl(URL.createObjectURL(file));
      } else {
        setFilePreviewUrl(null);
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setOutputText(result);
        recordToolUsage('dev-base64-encode', 'Base64 Encoder');
      };
      reader.onerror = () => {
        setError('Failed to read file for Base64 conversion.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEncodeText = () => {
    try {
      setError(null);
      if (!inputText) {
        setOutputText('');
        return;
      }
      // UTF-8 safe encode
      const encoded = btoa(encodeURIComponent(inputText).replace(/%([0-9A-F]{2})/g, (_, p1) => 
        String.fromCharCode(parseInt(p1, 16))
      ));
      setOutputText(encoded);
      recordToolUsage('dev-base64-encode', 'Base64 Encoder');
    } catch (e: any) {
      setError(`Encoding error: ${e.message}`);
    }
  };

  const handleDecode = () => {
    try {
      setError(null);
      setDecodedMediaUrl(null);
      setDecodedMediaType(null);

      const raw = inputText.trim();
      if (!raw) {
        setOutputText('');
        return;
      }

      // Check if data URL
      let base64Part = raw;
      let mime = 'text/plain';
      const dataUriMatch = raw.match(/^data:([^;]+);base64,(.+)$/);
      if (dataUriMatch) {
        mime = dataUriMatch[1];
        base64Part = dataUriMatch[2];
      }

      // Attempt decoding
      const binaryString = atob(base64Part.replace(/\s/g, ''));
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      if (mime.startsWith('image/') || (!dataUriMatch && isImageHeader(bytes))) {
        const blob = new Blob([bytes], { type: mime.startsWith('image/') ? mime : 'image/png' });
        const url = URL.createObjectURL(blob);
        setDecodedMediaUrl(url);
        setDecodedMediaType('image');
        setOutputText(`[Decoded Image: ${formatBytes(blob.size)}]`);
      } else {
        try {
          const decodedUtf8 = decodeURIComponent(
            Array.prototype.map.call(bytes, (byte: number) => '%' + ('00' + byte.toString(16)).slice(-2)).join('')
          );
          setOutputText(decodedUtf8);
          setDecodedMediaType('text');
        } catch {
          // Fallback to Latin-1
          setOutputText(binaryString);
          setDecodedMediaType('text');
        }
      }

      recordToolUsage('dev-base64-decode', 'Base64 Decoder');
    } catch (e: any) {
      setError(`Decoding error: Invalid Base64 input string (${e.message})`);
    }
  };

  const isImageHeader = (bytes: Uint8Array): boolean => {
    // PNG magic numbers: 137 80 78 71
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return true;
    // JPEG: 0xFF 0xD8 0xFF
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return true;
    // GIF: 'GIF8'
    if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return true;
    // WebP: 'RIFF'
    if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) return true;
    return false;
  };

  const handleCopy = () => {
    if (!outputText) return;
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (decodedMediaUrl) {
      const a = document.createElement('a');
      a.href = decodedMediaUrl;
      a.download = `decoded-file-${Date.now()}`;
      a.click();
    } else if (outputText) {
      const blob = new Blob([outputText], { type: 'text/plain;charset=utf-8' });
      downloadBlob(blob, `base64-${mode}-output.txt`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Base64 Encoder & Decoder</h1>
          <p className="text-sm text-foreground-muted">
            Encode text & files to Base64 or decode Base64 back into text, images, and binary files.
          </p>
        </div>

        <div className="inline-flex rounded-lg border border-border p-1 bg-surface-raised self-start">
          <button
            onClick={() => {
              setMode('encode');
              setOutputText('');
              setError(null);
            }}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              mode === 'encode'
                ? 'bg-primary text-primary-contrast shadow-sm'
                : 'text-foreground-muted hover:text-foreground'
            }`}
          >
            Encode
          </button>
          <button
            onClick={() => {
              setMode('decode');
              setOutputText('');
              setError(null);
            }}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              mode === 'decode'
                ? 'bg-primary text-primary-contrast shadow-sm'
                : 'text-foreground-muted hover:text-foreground'
            }`}
          >
            Decode
          </button>
        </div>
      </div>

      {mode === 'encode' ? (
        <Card className="p-6 space-y-5">
          <div className="flex items-center gap-3 border-b border-border pb-3">
            <button
              onClick={() => setInputSubtype('text')}
              className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                inputSubtype === 'text' ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground-muted hover:text-foreground'
              }`}
            >
              <FileText className="w-4 h-4" /> Text String
            </button>
            <button
              onClick={() => setInputSubtype('file')}
              className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                inputSubtype === 'file' ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground-muted hover:text-foreground'
              }`}
            >
              <Binary className="w-4 h-4" /> File / Image
            </button>
          </div>

          {inputSubtype === 'text' ? (
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground-muted">
                Input Text to Encode
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type or paste plain text here..."
                rows={6}
                className="w-full rounded-lg border border-border bg-surface-raised p-3 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <Button onClick={handleEncodeText} variant="primary" disabled={!inputText}>
                Encode to Base64
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Dropzone
                onFilesSelected={handleFiles}
                label="Drop an image or file here to convert to Base64"
                sublabel="All file types supported • Converted 100% locally in browser RAM"
              />
              {selectedFile && (
                <div className="p-4 rounded-xl border border-border bg-surface-raised space-y-3">
                  <div className="flex items-center justify-between text-xs text-foreground-muted">
                    <span className="font-semibold text-foreground">{selectedFile.name}</span>
                    <span>{formatBytes(selectedFile.size)}</span>
                  </div>
                  {filePreviewUrl && (
                    <div className="mt-2 text-center">
                      <p className="text-xs font-medium text-foreground-muted mb-2 text-left">Uploaded Image Preview:</p>
                      <img
                        src={filePreviewUrl}
                        alt="Preview"
                        className="max-h-48 rounded-lg border border-border mx-auto object-contain shadow-sm"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </Card>
      ) : (
        <Card className="p-6 space-y-4">
          <label className="text-xs font-bold uppercase tracking-wider text-foreground-muted">
            Base64 Input String
          </label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste Base64 or Data URI (e.g. data:image/png;base64,iVBORw0KGgo...) here..."
            rows={7}
            className="w-full rounded-lg border border-border bg-surface-raised p-3 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <Button onClick={handleDecode} variant="primary" disabled={!inputText.trim()}>
            Decode Base64
          </Button>
        </Card>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Output Section */}
      {(outputText || decodedMediaUrl) && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-emerald-500" />
              {mode === 'encode' ? 'Base64 Result' : 'Decoded Result Preview'}
            </h3>
            <div className="flex items-center gap-2">
              <Button onClick={handleCopy} variant="secondary" size="sm" className="gap-1.5">
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <Button onClick={handleDownload} variant="primary" size="sm" className="gap-1.5">
                <Download className="w-3.5 h-3.5" />
                Download
              </Button>
            </div>
          </div>

          {decodedMediaType === 'image' && decodedMediaUrl && (
            <div className="space-y-3 text-center">
              <p className="text-xs font-medium text-foreground-muted text-left">Decoded Image Live Preview:</p>
              <div className="p-4 rounded-xl bg-surface-raised border border-border inline-block max-w-full">
                <img
                  src={decodedMediaUrl}
                  alt="Decoded"
                  className="max-h-72 rounded-lg border border-border object-contain mx-auto shadow-sm"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-foreground-muted">
              <span>Length: {outputText.length.toLocaleString()} characters</span>
              {mode === 'encode' && selectedFile && (
                <span>Overhead: ~{Math.round((outputText.length / selectedFile.size) * 100)}%</span>
              )}
            </div>
            <textarea
              readOnly
              value={outputText}
              rows={8}
              className="w-full rounded-lg border border-border bg-surface-raised p-3 text-xs font-mono text-foreground focus:outline-none"
            />
          </div>
        </Card>
      )}
    </div>
  );
};
