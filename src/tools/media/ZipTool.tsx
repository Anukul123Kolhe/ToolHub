import React, { useState } from 'react';
import { zip, unzip } from 'fflate';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Dropzone } from '../../components/common/Dropzone';
import { useStorage } from '../../context/StorageContext';
import { formatBytes, downloadBlob } from '../../utils/file';
import { Archive, Download, FileArchive, FolderOpen, Trash2, CheckCircle2, File, Eye } from 'lucide-react';

interface ExtractedItem {
  name: string;
  size: number;
  data: Uint8Array;
  previewUrl?: string;
  isImage: boolean;
}

export const ZipTool: React.FC = () => {
  const [mode, setMode] = useState<'create' | 'extract'>('create');
  
  // Create mode state
  const [filesToZip, setFilesToZip] = useState<File[]>([]);
  const [zipName, setZipName] = useState<string>('toolhub-archive.zip');
  const [createdZipBlob, setCreatedZipBlob] = useState<Blob | null>(null);
  const [isZipping, setIsZipping] = useState<boolean>(false);

  // Extract mode state
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [extractedFiles, setExtractedFiles] = useState<ExtractedItem[]>([]);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { recordToolUsage } = useStorage();

  const handleAddFilesToZip = (files: File[]) => {
    setFilesToZip((prev) => [...prev, ...files]);
    setCreatedZipBlob(null);
  };

  const handleRemoveFileToZip = (index: number) => {
    setFilesToZip((prev) => prev.filter((_, i) => i !== index));
    setCreatedZipBlob(null);
  };

  const handleCreateZip = async () => {
    if (filesToZip.length === 0) return;
    setIsZipping(true);
    setError(null);

    try {
      const zipData: Record<string, Uint8Array> = {};
      for (const file of filesToZip) {
        const buffer = await file.arrayBuffer();
        zipData[file.name] = new Uint8Array(buffer);
      }

      zip(zipData, { level: 6 }, (err, out) => {
        setIsZipping(false);
        if (err) {
          setError(`ZIP creation failed: ${err.message}`);
          return;
        }
        const blob = new Blob([out.buffer as ArrayBuffer], { type: 'application/zip' });
        setCreatedZipBlob(blob);
        recordToolUsage('file-zip-create', 'ZIP Archive Creator');
      });
    } catch (err: any) {
      setIsZipping(false);
      setError(`Failed to create ZIP: ${err.message}`);
    }
  };

  const handleExtractZip = async (files: File[]) => {
    if (files.length === 0) return;
    const file = files[0];
    setZipFile(file);
    setIsExtracting(true);
    setError(null);
    setExtractedFiles([]);

    try {
      const buffer = await file.arrayBuffer();
      unzip(new Uint8Array(buffer), (err, unzipped) => {
        setIsExtracting(false);
        if (err) {
          setError(`Failed to extract ZIP: ${err.message}`);
          return;
        }

        const items: ExtractedItem[] = [];
        for (const [name, data] of Object.entries(unzipped)) {
          // ignore directory entries
          if (name.endsWith('/')) continue;

          const isImage = /\.(jpe?g|png|webp|gif|svg)$/i.test(name);
          let previewUrl: string | undefined;
          if (isImage) {
            const blob = new Blob([data as unknown as BlobPart]);
            previewUrl = URL.createObjectURL(blob);
          }

          items.push({
            name,
            size: data.length,
            data,
            previewUrl,
            isImage,
          });
        }

        setExtractedFiles(items);
        recordToolUsage('file-zip-extract', 'ZIP Archive Extractor');
      });
    } catch (err: any) {
      setIsExtracting(false);
      setError(`Failed to read ZIP archive: ${err.message}`);
    }
  };

  const downloadExtractedItem = (item: ExtractedItem) => {
    const blob = new Blob([item.data as unknown as BlobPart]);
    downloadBlob(blob, item.name.split('/').pop() || 'extracted-file');
  };

  const totalUncompressedSize = filesToZip.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-foreground">ZIP Archive Manager</h1>
          <p className="text-sm text-foreground-muted">
            Create high-compression ZIP files or unpack and inspect archives 100% inside your browser.
          </p>
        </div>

        <div className="inline-flex rounded-lg border border-border p-1 bg-surface-raised self-start">
          <button
            onClick={() => {
              setMode('create');
              setError(null);
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              mode === 'create'
                ? 'bg-primary text-primary-contrast shadow-sm'
                : 'text-foreground-muted hover:text-foreground'
            }`}
          >
            Create ZIP
          </button>
          <button
            onClick={() => {
              setMode('extract');
              setError(null);
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              mode === 'extract'
                ? 'bg-primary text-primary-contrast shadow-sm'
                : 'text-foreground-muted hover:text-foreground'
            }`}
          >
            Extract & Inspect ZIP
          </button>
        </div>
      </div>

      {mode === 'create' ? (
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <Dropzone
              onFilesSelected={handleAddFilesToZip}
              label="Drop files here to package into a ZIP archive"
              sublabel="Add multiple documents, images, or code files"
              multiple
            />

            {filesToZip.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-border">
                <div className="flex items-center justify-between text-xs text-foreground-muted">
                  <span className="font-semibold text-foreground">
                    {filesToZip.length} {filesToZip.length === 1 ? 'file' : 'files'} selected
                  </span>
                  <span>Total uncompressed: {formatBytes(totalUncompressedSize)}</span>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                  {filesToZip.map((file, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-surface-raised border border-border flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <File className="w-4 h-4 text-primary shrink-0" />
                        <span className="truncate font-medium text-foreground">{file.name}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-foreground-muted">{formatBytes(file.size)}</span>
                        <button
                          onClick={() => handleRemoveFileToZip(idx)}
                          className="text-foreground-muted hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-foreground-muted">Archive Name:</label>
                    <input
                      type="text"
                      value={zipName}
                      onChange={(e) => setZipName(e.target.value)}
                      className="rounded-lg border border-border bg-surface-raised px-2.5 py-1 text-xs font-mono text-foreground focus:outline-none"
                    />
                  </div>
                  <Button
                    onClick={handleCreateZip}
                    variant="primary"
                    disabled={isZipping || filesToZip.length === 0}
                    className="gap-2"
                  >
                    <Archive className="w-4 h-4" />
                    {isZipping ? 'Compressing Archive...' : 'Generate ZIP Archive'}
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {createdZipBlob && (
            <Card className="p-6 bg-emerald-500/5 border-emerald-500/20 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  <div>
                    <h3 className="text-sm font-bold text-foreground">ZIP Archive Created Successfully</h3>
                    <p className="text-xs text-foreground-muted">
                      Original: {formatBytes(totalUncompressedSize)} → Compressed: {formatBytes(createdZipBlob.size)} (
                      {Math.round(((totalUncompressedSize - createdZipBlob.size) / (totalUncompressedSize || 1)) * 100)}% saved)
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => downloadBlob(createdZipBlob, zipName.endsWith('.zip') ? zipName : `${zipName}.zip`)}
                  variant="primary"
                  className="gap-2"
                >
                  <Download className="w-4 h-4" /> Download ZIP
                </Button>
              </div>
            </Card>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <Dropzone
              onFilesSelected={handleExtractZip}
              label="Drop a .zip archive to unpack and inspect"
              sublabel="Unpacks safely inside your browser memory without uploading"
            />
          </Card>

          {extractedFiles.length > 0 && (
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">
                    Extracted Contents ({extractedFiles.length} files)
                  </h3>
                </div>
                <span className="text-xs text-foreground-muted">
                  Total unpacked: {formatBytes(extractedFiles.reduce((acc, f) => acc + f.size, 0))}
                </span>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {extractedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-surface-raised border border-border flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 truncate">
                      {file.isImage && file.previewUrl ? (
                        <img
                          src={file.previewUrl}
                          alt="preview"
                          className="w-10 h-10 rounded object-cover border border-border shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                          <File className="w-5 h-5 text-primary" />
                        </div>
                      )}
                      <div className="truncate">
                        <p className="font-semibold text-foreground truncate">{file.name}</p>
                        <p className="text-[11px] text-foreground-muted">{formatBytes(file.size)}</p>
                      </div>
                    </div>

                    <Button
                      onClick={() => downloadExtractedItem(file)}
                      variant="secondary"
                      size="sm"
                      className="gap-1.5 shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium">
          {error}
        </div>
      )}
    </div>
  );
};
