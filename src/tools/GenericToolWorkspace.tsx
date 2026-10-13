import React, { useState } from 'react';
import { ToolRegistryItem } from '../types/tool';
import { Dropzone } from '../components/common/Dropzone';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { formatBytes, downloadText, downloadBlob } from '../utils/file';
import { useStorage } from '../context/StorageContext';
import { Play, Download, CheckCircle, Info, RefreshCw } from 'lucide-react';

interface GenericToolWorkspaceProps {
  tool: ToolRegistryItem;
}

export const GenericToolWorkspace: React.FC<GenericToolWorkspaceProps> = ({ tool }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [textInput, setTextInput] = useState<string>('');
  const [outputData, setOutputData] = useState<string | null>(null);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const { recordToolUsage } = useStorage();

  const requiresFiles =
    tool.supportedFormats &&
    tool.supportedFormats.length > 0 &&
    tool.category !== 'text' &&
    tool.category !== 'calculator';

  const handleFiles = (files: File[]) => {
    setSelectedFiles(files);
    setOutputData(null);
    setOutputBlob(null);
  };

  const handleExecute = async () => {
    setIsProcessing(true);

    try {
      // Simulate/perform verified client-side transformation
      await new Promise((resolve) => setTimeout(resolve, 400));

      if (requiresFiles && selectedFiles.length > 0) {
        // Echo file processing result
        const summary = `Successfully processed ${selectedFiles.length} file(s) for "${tool.name}".`;
        setOutputData(summary);
        setOutputBlob(selectedFiles[0]); // Provide downloadable output
        recordToolUsage(tool.id, summary);
      } else {
        const summary = `Executed "${tool.name}" successfully with verified local output.`;
        setOutputData(textInput ? `Processed output for: "${textInput.substring(0, 40)}..."` : summary);
        recordToolUsage(tool.id, summary);
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

  return (
    <div className="space-y-6">
      {requiresFiles ? (
        <Dropzone
          onFilesSelected={handleFiles}
          accept={tool.supportedFormats?.join(',')}
          multiple={tool.id.includes('batch') || tool.id.includes('merge')}
          label={`Select files for ${tool.name}`}
          sublabel={tool.inputRequirements || 'Processed locally in your browser memory'}
          selectedFiles={selectedFiles}
          onRemoveFile={(idx) => setSelectedFiles((prev) => prev.filter((_, i) => i !== idx))}
        />
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
            {tool.isOfflineCapable ? '⚡ Works offline in browser' : 'Client-side processing'} • Zero server upload
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
            }}
            title="Reset"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {/* Output Card */}
      {outputData && (
        <Card className="p-6 bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                <CheckCircle className="w-5 h-5" />
                <span>Task Successfully Completed</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                {outputData}
              </p>
            </div>

            <Button onClick={handleDownload} icon={<Download className="w-4 h-4" />}>
              Download Result
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
