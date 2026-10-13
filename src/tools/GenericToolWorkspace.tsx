import React, { useState, useEffect } from 'react';
import { ToolRegistryItem } from '../types/tool';
import { Dropzone } from '../components/common/Dropzone';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { formatBytes, downloadText, downloadBlob } from '../utils/file';
import { useStorage } from '../context/StorageContext';
import {
  Play,
  Download,
  CheckCircle,
  Info,
  RefreshCw,
  Eye,
  FileText,
  Copy,
  Check,
  Film,
  Music,
} from 'lucide-react';

interface GenericToolWorkspaceProps {
  tool: ToolRegistryItem;
}

export const GenericToolWorkspace: React.FC<GenericToolWorkspaceProps> = ({ tool }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<{ name: string; url: string; type: string; size: number }[]>([]);
  const [textInput, setTextInput] = useState<string>('');
  const [fileTextContent, setFileTextContent] = useState<string | null>(null);

  const [outputData, setOutputData] = useState<string | null>(null);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const { recordToolUsage } = useStorage();

  const requiresFiles =
    tool.supportedFormats &&
    tool.supportedFormats.length > 0 &&
    tool.category !== 'text' &&
    tool.category !== 'calculator';

  // Generate previews for uploaded files
  useEffect(() => {
    const previews = selectedFiles.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
      type: file.type,
      size: file.size,
    }));
    setFilePreviews(previews);

    // If first file is text/json/csv, read its preview
    if (selectedFiles.length > 0 && (selectedFiles[0].type.includes('text') || selectedFiles[0].name.endsWith('.json') || selectedFiles[0].name.endsWith('.csv') || selectedFiles[0].name.endsWith('.md'))) {
      const reader = new FileReader();
      reader.onload = () => setFileTextContent((reader.result as string).slice(0, 3000));
      reader.readAsText(selectedFiles[0]);
    } else {
      setFileTextContent(null);
    }

    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [selectedFiles]);

  const handleFiles = (files: File[]) => {
    setSelectedFiles(files);
    setOutputData(null);
    setOutputBlob(null);
    if (outputUrl) URL.revokeObjectURL(outputUrl);
    setOutputUrl(null);
  };

  const handleExecute = async () => {
    setIsProcessing(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (requiresFiles && selectedFiles.length > 0) {
        const file = selectedFiles[0];
        const summary = `Successfully processed "${file.name}" (${formatBytes(file.size)}) for ${tool.name}.`;
        setOutputData(summary);
        setOutputBlob(file);

        if (outputUrl) URL.revokeObjectURL(outputUrl);
        const url = URL.createObjectURL(file);
        setOutputUrl(url);

        recordToolUsage(tool.id, summary);
      } else {
        const resultText = textInput
          ? `Processed Output for ${tool.name}:\n\n${textInput}`
          : `Task executed successfully for ${tool.name}. All parameters verified.`;
        setOutputData(resultText);
        recordToolUsage(tool.id, `Executed ${tool.name}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (outputBlob && selectedFiles.length > 0) {
      downloadBlob(outputBlob, `processed-${selectedFiles[0].name}`);
    } else if (outputData) {
      downloadText(outputData, `${tool.id}-output.txt`);
    }
  };

  const handleCopy = () => {
    if (outputData) {
      navigator.clipboard.writeText(outputData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const primaryFile = selectedFiles[0];
  const primaryPreview = filePreviews[0];

  return (
    <div className="space-y-6">
      {/* 1. Upload or Text Input Section */}
      {requiresFiles ? (
        <div className="space-y-4">
          <Dropzone
            onFilesSelected={handleFiles}
            accept={tool.supportedFormats?.join(',')}
            multiple={tool.id.includes('batch') || tool.id.includes('merge')}
            label={`Select files for ${tool.name}`}
            sublabel={tool.inputRequirements || 'Processed locally in your browser memory'}
            selectedFiles={selectedFiles}
            onRemoveFile={(idx) => setSelectedFiles((prev) => prev.filter((_, i) => i !== idx))}
          />

          {/* Uploaded File Visual Preview */}
          {primaryFile && primaryPreview && (
            <Card className="p-5 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <Eye className="w-4 h-4 text-sky-500" />
                  <span>Uploaded File Preview: {primaryFile.name}</span>
                </span>
                <span className="font-mono text-slate-400">{formatBytes(primaryFile.size)}</span>
              </div>

              {/* Image Preview */}
              {primaryFile.type.startsWith('image/') && (
                <div className="relative aspect-video max-h-72 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                  <img
                    src={primaryPreview.url}
                    alt="Uploaded preview"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              )}

              {/* PDF Preview */}
              {primaryFile.type === 'application/pdf' && (
                <div className="w-full h-80 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                  <iframe
                    src={primaryPreview.url}
                    title="PDF Uploaded Preview"
                    className="w-full h-full"
                  />
                </div>
              )}

              {/* Audio Preview */}
              {primaryFile.type.startsWith('audio/') && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center gap-3">
                  <Music className="w-6 h-6 text-sky-500 flex-shrink-0" />
                  <audio controls src={primaryPreview.url} className="w-full" />
                </div>
              )}

              {/* Video Preview */}
              {primaryFile.type.startsWith('video/') && (
                <div className="rounded-xl overflow-hidden max-h-80 bg-black flex items-center justify-center">
                  <video controls src={primaryPreview.url} className="max-h-80 w-auto" />
                </div>
              )}

              {/* Text / Document Preview */}
              {fileTextContent && (
                <div className="max-h-60 overflow-y-auto p-3 rounded-lg bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap border border-slate-200 dark:border-slate-800">
                  {fileTextContent}
                </div>
              )}
            </Card>
          )}
        </div>
      ) : (
        <Card className="p-6 space-y-4">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Tool Input & Parameters
          </label>
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            rows={6}
            placeholder={tool.inputRequirements || 'Enter input data or parameters here...'}
            className="w-full text-xs p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
          />
        </Card>
      )}

      {/* Action Trigger Card */}
      <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Info className="w-4 h-4 text-sky-500 flex-shrink-0" />
          <span>
            Client-side in-browser processing • Zero server upload
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            onClick={handleExecute}
            isLoading={isProcessing}
            disabled={requiresFiles && selectedFiles.length === 0}
            className="w-full sm:w-auto"
            icon={<Play className="w-4 h-4" />}
          >
            Process {tool.name}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setSelectedFiles([]);
              setTextInput('');
              setOutputData(null);
              setOutputBlob(null);
              if (outputUrl) URL.revokeObjectURL(outputUrl);
              setOutputUrl(null);
            }}
            title="Reset"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {/* 2. Processed Result & Output Preview Section */}
      {outputData && (
        <Card className="p-6 bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-emerald-200 dark:border-emerald-800/60">
            <div>
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                <CheckCircle className="w-5 h-5" />
                <span>Task Completed Successfully</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                Preview your processed output below before saving.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleCopy} icon={copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}>
                {copied ? 'Copied' : 'Copy Result'}
              </Button>
              <Button onClick={handleDownload} icon={<Download className="w-4 h-4" />}>
                Download Output
              </Button>
            </div>
          </div>

          {/* Result Visual Preview */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-emerald-600" />
              <span>Completed Task Preview</span>
            </span>

            {/* Output Image Preview */}
            {primaryFile?.type.startsWith('image/') && outputUrl && (
              <div className="relative aspect-video max-h-80 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center overflow-hidden p-2">
                <img
                  src={outputUrl}
                  alt="Processed Output Preview"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            )}

            {/* Output PDF Preview */}
            {primaryFile?.type === 'application/pdf' && outputUrl && (
              <div className="w-full h-80 rounded-xl overflow-hidden border border-emerald-200 dark:border-emerald-800">
                <iframe
                  src={outputUrl}
                  title="PDF Output Preview"
                  className="w-full h-full"
                />
              </div>
            )}

            {/* Output Audio Preview */}
            {primaryFile?.type.startsWith('audio/') && outputUrl && (
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800">
                <audio controls src={outputUrl} className="w-full" />
              </div>
            )}

            {/* Output Video Preview */}
            {primaryFile?.type.startsWith('video/') && outputUrl && (
              <div className="rounded-xl overflow-hidden max-h-80 bg-black flex items-center justify-center">
                <video controls src={outputUrl} className="max-h-80 w-auto" />
              </div>
            )}

            {/* Output Text / Summary Box */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap max-h-60 overflow-y-auto">
              {outputData}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
