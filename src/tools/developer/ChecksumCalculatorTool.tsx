import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Dropzone } from '../../components/common/Dropzone';
import { useStorage } from '../../context/StorageContext';
import { formatBytes } from '../../utils/file';
import { ShieldCheck, Copy, Check, Hash, FileCheck, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';

interface HashResults {
  sha256: string;
  sha512: string;
  sha1: string;
}

export const ChecksumCalculatorTool: React.FC = () => {
  const [sourceType, setSourceType] = useState<'file' | 'text'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [textInput, setTextInput] = useState<string>('');
  
  const [hashes, setHashes] = useState<HashResults | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [compareHash, setCompareHash] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { recordToolUsage } = useStorage();

  const computeDigests = async (buffer: ArrayBuffer): Promise<HashResults> => {
    const cryptoObj = typeof window !== 'undefined' ? window.crypto : globalThis.crypto;
    const subtle = cryptoObj.subtle;

    const [sha256Buf, sha512Buf, sha1Buf] = await Promise.all([
      subtle.digest('SHA-256', buffer),
      subtle.digest('SHA-512', buffer),
      subtle.digest('SHA-1', buffer),
    ]);

    const toHex = (buf: ArrayBuffer) =>
      Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

    return {
      sha256: toHex(sha256Buf),
      sha512: toHex(sha512Buf),
      sha1: toHex(sha1Buf),
    };
  };

  const handleFiles = async (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      setError(null);

      if (file.type.startsWith('image/')) {
        setFilePreviewUrl(URL.createObjectURL(file));
      } else {
        setFilePreviewUrl(null);
      }

      setIsCalculating(true);
      try {
        const buffer = await file.arrayBuffer();
        const results = await computeDigests(buffer);
        setHashes(results);
        recordToolUsage('dev-checksum-calculator', 'Checksum Hash Calculator');
      } catch (err: any) {
        setError(`Failed to compute hash: ${err.message}`);
      } finally {
        setIsCalculating(false);
      }
    }
  };

  const handleComputeText = async () => {
    if (!textInput) return;
    setIsCalculating(true);
    setError(null);
    try {
      const encoder = new TextEncoder();
      const buffer = encoder.encode(textInput).buffer;
      const results = await computeDigests(buffer);
      setHashes(results);
      recordToolUsage('dev-checksum-calculator', 'Checksum Hash Calculator');
    } catch (err: any) {
      setError(`Failed to compute hash: ${err.message}`);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleCopy = (val: string, key: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getMatchStatus = () => {
    if (!compareHash.trim() || !hashes) return null;
    const cleanCompare = compareHash.trim().toLowerCase();
    if (hashes.sha256.toLowerCase() === cleanCompare) return { match: true, algo: 'SHA-256' };
    if (hashes.sha512.toLowerCase() === cleanCompare) return { match: true, algo: 'SHA-512' };
    if (hashes.sha1.toLowerCase() === cleanCompare) return { match: true, algo: 'SHA-1' };
    return { match: false, algo: 'None' };
  };

  const matchResult = getMatchStatus();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cryptographic Checksum & Hash Tool</h1>
          <p className="text-sm text-foreground-muted">
            Compute SHA-256, SHA-512, and SHA-1 checksums locally in browser memory to verify file authenticity.
          </p>
        </div>

        <div className="inline-flex rounded-lg border border-border p-1 bg-surface-raised self-start">
          <button
            onClick={() => {
              setSourceType('file');
              setHashes(null);
            }}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              sourceType === 'file'
                ? 'bg-primary text-primary-contrast shadow-sm'
                : 'text-foreground-muted hover:text-foreground'
            }`}
          >
            File Hash
          </button>
          <button
            onClick={() => {
              setSourceType('text');
              setHashes(null);
            }}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              sourceType === 'text'
                ? 'bg-primary text-primary-contrast shadow-sm'
                : 'text-foreground-muted hover:text-foreground'
            }`}
          >
            Text String Hash
          </button>
        </div>
      </div>

      {sourceType === 'file' ? (
        <Card className="p-6 space-y-4">
          <Dropzone
            onFilesSelected={handleFiles}
            label="Drop any file to compute cryptographic checksums"
            sublabel="SHA-256, SHA-512 & SHA-1 computed completely inside your browser"
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
                    className="max-h-44 rounded-lg border border-border mx-auto object-contain shadow-sm"
                  />
                </div>
              )}
            </div>
          )}
        </Card>
      ) : (
        <Card className="p-6 space-y-4">
          <label className="text-xs font-bold uppercase tracking-wider text-foreground-muted">
            Text to Hash
          </label>
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Type or paste text string..."
            rows={5}
            className="w-full rounded-lg border border-border bg-surface-raised p-3 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <Button onClick={handleComputeText} variant="primary" disabled={!textInput || isCalculating}>
            {isCalculating ? 'Computing Hashes...' : 'Compute Cryptographic Hashes'}
          </Button>
        </Card>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium">
          {error}
        </div>
      )}

      {hashes && (
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Computed Checksums
            </h3>
            <span className="text-xs text-foreground-muted">WebCrypto API Verified</span>
          </div>

          <div className="space-y-4">
            {/* SHA-256 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground">SHA-256 (Industry Standard)</span>
                <button
                  onClick={() => handleCopy(hashes.sha256, 'sha256')}
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  {copiedKey === 'sha256' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedKey === 'sha256' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="p-3 rounded-lg bg-surface-raised border border-border font-mono text-xs text-foreground break-all select-all">
                {hashes.sha256}
              </div>
            </div>

            {/* SHA-512 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground">SHA-512 (High Security)</span>
                <button
                  onClick={() => handleCopy(hashes.sha512, 'sha512')}
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  {copiedKey === 'sha512' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedKey === 'sha512' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="p-3 rounded-lg bg-surface-raised border border-border font-mono text-xs text-foreground break-all select-all">
                {hashes.sha512}
              </div>
            </div>

            {/* SHA-1 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground">SHA-1 (Legacy / Git Commit)</span>
                <button
                  onClick={() => handleCopy(hashes.sha1, 'sha1')}
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  {copiedKey === 'sha1' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedKey === 'sha1' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="p-3 rounded-lg bg-surface-raised border border-border font-mono text-xs text-foreground break-all select-all">
                {hashes.sha1}
              </div>
            </div>
          </div>

          {/* Verification section */}
          <div className="pt-4 border-t border-border space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-foreground-muted">
              Verify / Compare against Official Checksum
            </label>
            <input
              type="text"
              value={compareHash}
              onChange={(e) => setCompareHash(e.target.value)}
              placeholder="Paste checksum to verify match..."
              className="w-full rounded-lg border border-border bg-surface-raised p-2.5 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {matchResult && (
              <div
                className={`p-3 rounded-lg flex items-center gap-2 text-xs font-semibold ${
                  matchResult.match
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : 'bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400'
                }`}
              >
                {matchResult.match ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                    <span>Checksum Verified! Perfectly matches {matchResult.algo} hash.</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                    <span>Checksum Mismatch! The provided hash does not match this file.</span>
                  </>
                )}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
