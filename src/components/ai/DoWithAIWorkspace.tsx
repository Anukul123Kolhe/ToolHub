import React, { useState, useRef, useEffect } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { formatBytes, downloadBlob } from '../../utils/file';
import { useStorage } from '../../context/StorageContext';
import {
  Sparkles,
  Upload,
  FileText,
  FileArchive,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  Trash2,
  RefreshCw,
  ShieldCheck,
  Mic,
  MicOff,
  Copy,
  Check,
  X,
  FileCode,
  Zap,
} from 'lucide-react';
import {
  parseWorkflowInstruction,
  executeWorkflowPlan,
  ExecutionPlan,
  ExecutionStep,
} from '../../services/ai/workflowEngine';
import { ProcessedFile } from '../../services/ai/toolRegistry';

interface DoWithAIWorkspaceProps {
  isModal?: boolean;
  onNavigateFullPage?: () => void;
}

export const DoWithAIWorkspace: React.FC<DoWithAIWorkspaceProps> = ({ isModal = false, onNavigateFullPage }) => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<{ id: string; name: string; size: number; type: string; url?: string }[]>([]);
  const [instruction, setInstruction] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [recognitionAvailable, setRecognitionAvailable] = useState<boolean>(false);

  // Execution state
  const [currentPlan, setCurrentPlan] = useState<ExecutionPlan | null>(null);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionSteps, setExecutionSteps] = useState<ExecutionStep[]>([]);
  const [finalFiles, setFinalFiles] = useState<ProcessedFile[]>([]);
  const [textOutput, setTextOutput] = useState<string | null>(null);
  const [executionMessage, setExecutionMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const { recordToolUsage } = useStorage();

  // Initialize Speech Recognition if supported
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setRecognitionAvailable(true);
      const recog = new SpeechRecognition();
      recog.continuous = false;
      recog.interimResults = false;
      recog.lang = 'en-US';

      recog.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        setInstruction((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };

      recog.onerror = () => {
        setIsListening(false);
      };

      recog.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recog;
    }
  }, []);

  // Update file previews when files change
  const handleFilesSelected = (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    setUploadedFiles((prev) => [...prev, ...fileArray]);

    const newPreviews = fileArray.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      name: file.name,
      size: file.size,
      type: file.type,
      url: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));

    setFilePreviews((prev) => [...prev, ...newPreviews]);
    setErrorMessage(null);
  };

  const removeFile = (index: number) => {
    const preview = filePreviews[index];
    if (preview?.url) {
      URL.revokeObjectURL(preview.url);
    }
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    filePreviews.forEach((p) => {
      if (p.url) URL.revokeObjectURL(p.url);
    });
    setUploadedFiles([]);
    setFilePreviews([]);
    setCurrentPlan(null);
    setFinalFiles([]);
    setTextOutput(null);
    setErrorMessage(null);
  };

  const toggleVoice = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Generate Plan & Execute
  const handlePlanAndExecute = async (overrideParams?: Record<string, any>) => {
    if (!instruction.trim() && uploadedFiles.length === 0) {
      setErrorMessage('Please upload files or enter an instruction for AI.');
      return;
    }

    setErrorMessage(null);
    setFinalFiles([]);
    setTextOutput(null);

    // 1. Task Understanding
    const plan = parseWorkflowInstruction(instruction, uploadedFiles);

    if (overrideParams && plan.steps.length > 0) {
      plan.steps[0].parameters = { ...plan.steps[0].parameters, ...overrideParams };
      plan.needsClarification = false;
    }

    setCurrentPlan(plan);
    setExecutionSteps(plan.steps);

    // If clarification needed, pause and display options
    if (plan.needsClarification) {
      return;
    }

    if (plan.steps.length === 0) {
      setErrorMessage(
        'Could not identify specific operations from your instruction. Try mentioning actions like "compress", "merge", "convert to JPG", "images to pdf", or "zip".'
      );
      return;
    }

    // 2. Execution Pipeline
    setIsExecuting(true);
    recordToolUsage('do-with-ai', `Ran AI workflow with ${plan.steps.length} step(s)`);

    const result = await executeWorkflowPlan(
      plan,
      uploadedFiles,
      (stepId, progress, msg) => {
        setExecutionSteps((prev) =>
          prev.map((s) => (s.id === stepId ? { ...s, progress, status: 'running' as const, outputSummary: msg } : s))
        );
      },
      (stepId, success, summary) => {
        setExecutionSteps((prev) =>
          prev.map((s) =>
            s.id === stepId
              ? {
                  ...s,
                  status: success ? ('completed' as const) : ('failed' as const),
                  progress: 100,
                  outputSummary: summary,
                }
              : s
          )
        );
      }
    );

    setIsExecuting(false);

    if (result.success) {
      setFinalFiles(result.finalFiles);
      if (result.textOutput) setTextOutput(result.textOutput);
      setExecutionMessage(result.message);
    } else {
      setErrorMessage(result.message);
    }
  };

  const handleCopyText = () => {
    if (!textOutput) return;
    navigator.clipboard.writeText(textOutput);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Quick suggestions based on uploaded file types
  const hasImages = uploadedFiles.some((f) => f.type.startsWith('image/'));
  const hasPdfs = uploadedFiles.some((f) => f.type === 'application/pdf' || f.name.endsWith('.pdf'));

  return (
    <div className={`space-y-6 ${isModal ? 'max-w-full' : ''}`}>
      {/* Privacy and Security Indicator Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <span className="font-semibold text-slate-800 dark:text-slate-200">Supported Formats:</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700/60 font-mono text-[11px]">
            JPG, PNG, WebP
          </span>
          <span className="px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700/60 font-mono text-[11px]">
            PDF
          </span>
          <span className="px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700/60 font-mono text-[11px]">
            JSON, Text
          </span>
          <span className="px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700/60 font-mono text-[11px]">
            ZIP
          </span>
        </div>

        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          100% Client-Side Local & Private
        </span>
      </div>

      {/* Main Workspace Layout Grid */}
      <div className={`grid grid-cols-1 ${isModal ? 'lg:grid-cols-12' : 'lg:grid-cols-12'} gap-6`}>
        {/* Left Column: File Upload Area */}
        <div className={isModal ? 'lg:col-span-5 space-y-4' : 'lg:col-span-5 space-y-4'}>
          <Card className="p-4 sm:p-5 space-y-4 shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-600" />
                <span>Uploaded Files ({uploadedFiles.length})</span>
              </h2>

              {uploadedFiles.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllFiles}
                  className="text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>

            {/* Drag & Drop Box */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files) handleFilesSelected(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-2xl p-5 text-center cursor-pointer transition-all bg-slate-50/50 dark:bg-slate-900/50 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) handleFilesSelected(e.target.files);
                }}
              />
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                Drag and drop files here, or <span className="text-blue-600 dark:text-blue-400 underline">browse</span>
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Upload photos, PDFs, or data files for execution
              </p>
            </div>

            {/* Staged File List */}
            {filePreviews.length > 0 && (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {filePreviews.map((file, idx) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between gap-3 p-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {file.url ? (
                        <img
                          src={file.url}
                          alt={file.name}
                          className="w-8 h-8 object-cover rounded-lg border border-slate-300 dark:border-slate-700 flex-shrink-0"
                        />
                      ) : file.name.endsWith('.pdf') ? (
                        <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center flex-shrink-0">
                          <FileCode className="w-4 h-4" />
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{file.name}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">{formatBytes(file.size)}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors flex-shrink-0"
                      title="Remove file"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: AI Instructions & Execution */}
        <div className={isModal ? 'lg:col-span-7 space-y-4' : 'lg:col-span-7 space-y-4'}>
          <Card className="p-4 sm:p-5 space-y-3.5 shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label htmlFor="modal-ai-instructions" className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Tell AI What You Need</span>
              </label>

              {instruction && (
                <button
                  type="button"
                  onClick={() => setInstruction('')}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Instruction Textarea */}
            <div className="relative">
              <textarea
                id="modal-ai-instructions"
                rows={isModal ? 3 : 4}
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="Tell AI what you want to do with your files...

Examples:
• Compress these images below 100 KB, convert them into JPG, and put in one ZIP.
• Merge these PDF files into one document and add page numbers.
• Convert these photos into a clean PDF.
• Extract pages 1-3 from this PDF.
• Resize this photo to passport photo dimensions."
                className="w-full p-3.5 rounded-xl text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all placeholder:text-slate-400 leading-relaxed"
              />

              {/* Voice Input Button */}
              {recognitionAvailable && (
                <button
                  type="button"
                  onClick={toggleVoice}
                  className={`absolute right-2.5 bottom-2.5 p-1.5 rounded-lg transition-all ${
                    isListening
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                  title={isListening ? 'Stop listening' : 'Speak your instruction'}
                >
                  {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>

            {/* Smart Suggestions Chips */}
            <div className="space-y-1">
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                {hasImages && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setInstruction(
                          'Compress these images below 100 KB, convert them into JPG format, and put all the processed images into one ZIP file.'
                        )
                      }
                      className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition-colors"
                    >
                      ⚡ Compress below 100KB + JPG + ZIP
                    </button>
                    <button
                      type="button"
                      onClick={() => setInstruction('Convert these images into a clean PDF document')}
                      className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      📄 Images to PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => setInstruction('Resize this photo to official passport photo dimensions')}
                      className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      👤 Passport Size
                    </button>
                  </>
                )}

                {hasPdfs && (
                  <>
                    <button
                      type="button"
                      onClick={() => setInstruction('Merge these PDF files into one document and add page numbers')}
                      className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition-colors"
                    >
                      📑 Merge PDFs + Page Numbers
                    </button>
                    <button
                      type="button"
                      onClick={() => setInstruction('Extract pages 1-2 from this PDF document')}
                      className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      ✂️ Extract pages 1-2
                    </button>
                  </>
                )}

                {!hasImages && !hasPdfs && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setInstruction(
                          'Compress these images below 100 KB, convert them into JPG format, and put all into one ZIP file.'
                        )
                      }
                      className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      Compress images below 100KB + ZIP
                    </button>
                    <button
                      type="button"
                      onClick={() => setInstruction('Merge these PDF files into one document')}
                      className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      Merge PDFs
                    </button>
                    <button
                      type="button"
                      onClick={() => setInstruction('Clean extra spaces and format JSON')}
                      className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      Format JSON & Clean Text
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Execute Button */}
            <div className="pt-1">
              <Button
                variant="primary"
                size="md"
                onClick={() => handlePlanAndExecute()}
                disabled={isExecuting}
                className="w-full justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 shadow-md shadow-blue-500/25 transition-all text-sm rounded-xl"
              >
                {isExecuting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    Executing AI Operations...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2 text-yellow-300" />
                    Do It With AI
                  </>
                )}
              </Button>
            </div>

            {/* Clarification Box */}
            {currentPlan?.needsClarification && (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-200">
                      {currentPlan.clarificationQuestion}
                    </h3>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                      Select a target option to begin:
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                  {currentPlan.clarificationOptions?.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handlePlanAndExecute(opt.parameters)}
                      className="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-100 transition-all text-center"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </Card>

          {/* Execution Plan & Timeline */}
          {executionSteps.length > 0 && (
            <Card className="p-4 space-y-2.5 border border-slate-200 dark:border-slate-800">
              <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>AI Execution Plan ({executionSteps.length} Steps)</span>
              </h2>

              <div className="space-y-2 pt-1">
                {executionSteps.map((step, idx) => (
                  <div
                    key={step.id}
                    className={`p-2.5 rounded-xl border text-xs transition-all ${
                      step.status === 'running'
                        ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-400 dark:border-blue-600 shadow-sm'
                        : step.status === 'completed'
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                        : step.status === 'failed'
                        ? 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-400 dark:border-rose-700'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            step.status === 'completed'
                              ? 'bg-emerald-600 text-white'
                              : step.status === 'running'
                              ? 'bg-blue-600 text-white animate-pulse'
                              : step.status === 'failed'
                              ? 'bg-rose-600 text-white'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {step.status === 'completed' ? <Check className="w-3 h-3" /> : idx + 1}
                        </span>

                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200">{step.toolName}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">{step.description}</p>
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        {step.status === 'running' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                            <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                            {step.progress}%
                          </span>
                        )}
                        {step.status === 'completed' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" />
                            Done
                          </span>
                        )}
                        {step.status === 'failed' && (
                          <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">Failed</span>
                        )}
                        {step.status === 'pending' && (
                          <span className="text-[10px] font-medium text-slate-400">Pending</span>
                        )}
                      </div>
                    </div>

                    {step.outputSummary && step.status === 'completed' && (
                      <p className="mt-1.5 text-[10px] text-emerald-700 dark:text-emerald-300 bg-white/70 dark:bg-slate-900/60 p-1.5 rounded border border-emerald-200 dark:border-emerald-900/50">
                        ✓ {step.outputSummary}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Results & Previews Section */}
          {(finalFiles.length > 0 || textOutput) && (
            <Card className="p-4 sm:p-5 space-y-3 border-2 border-emerald-500/30 bg-white dark:bg-slate-900 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">Task Completed!</h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {executionMessage || 'Output files are ready for download.'}
                    </p>
                  </div>
                </div>

                {finalFiles.length > 1 && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => downloadBlob(finalFiles[0].blob, finalFiles[0].name)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Download All
                  </Button>
                )}
              </div>

              {/* Text / Data Output */}
              {textOutput && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold uppercase text-[10px]">Text Output:</span>
                    <button
                      type="button"
                      onClick={handleCopyText}
                      className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-semibold text-[11px]"
                    >
                      {copiedText ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedText ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <pre className="p-2.5 rounded-lg bg-slate-950 text-slate-100 font-mono text-[11px] overflow-x-auto max-h-40 leading-relaxed">
                    {textOutput}
                  </pre>
                </div>
              )}

              {/* Processed Files Grid */}
              {finalFiles.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {finalFiles.map((file) => (
                    <div
                      key={file.name}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col justify-between gap-2 text-xs"
                    >
                      <div className="flex items-start gap-2.5">
                        {file.type.startsWith('image/') ? (
                          <img
                            src={file.url}
                            alt={file.name}
                            className="w-12 h-12 object-cover rounded-lg border border-slate-300 dark:border-slate-700 flex-shrink-0"
                          />
                        ) : file.name.endsWith('.pdf') ? (
                          <div className="w-12 h-12 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-6 h-6" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                            <FileArchive className="w-6 h-6" />
                          </div>
                        )}

                        <div className="min-w-0 flex-grow">
                          <p className="font-bold text-slate-900 dark:text-white truncate" title={file.name}>
                            {file.name}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            Size: <span className="font-semibold text-slate-700 dark:text-slate-300">{formatBytes(file.size)}</span>
                          </p>
                          {file.originalSize && file.originalSize > file.size && (
                            <span className="inline-block mt-0.5 px-1 py-0.2 rounded text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                              {Math.round(((file.originalSize - file.size) / file.originalSize) * 100)}% smaller
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 pt-0.5">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => downloadBlob(file.blob, file.name)}
                          className="w-full justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-1.5"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </Button>

                        {file.type.startsWith('image/') && (
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-1.5 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 transition-colors"
                            title="Preview"
                          >
                            Preview
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoWithAIWorkspace;
