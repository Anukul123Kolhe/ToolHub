import React, { useState, useRef, useEffect } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { formatBytes, downloadBlob } from '../utils/file';
import { useStorage } from '../context/StorageContext';
import {
  Sparkles,
  Upload,
  FileText,
  Image as ImageIcon,
  FileArchive,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Download,
  Trash2,
  RefreshCw,
  Sliders,
  ShieldCheck,
  Mic,
  MicOff,
  Copy,
  Check,
  ChevronRight,
  Plus,
  X,
  FileCode,
  Zap,
} from 'lucide-react';
import {
  parseWorkflowInstruction,
  executeWorkflowPlan,
  ExecutionPlan,
  ExecutionStep,
} from '../services/ai/workflowEngine';
import { ProcessedFile } from '../services/ai/toolRegistry';

export const DoWithAIPage: React.FC = () => {
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Header Section */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
          <span>Intelligent File Processing & Task Execution Workspace</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          Do With <span className="text-blue-600 dark:text-blue-400">AI</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300">
          Upload anything. Tell AI what you need. Get it done.
        </p>

        {/* Supported Formats & Privacy Badge */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs">
          <span className="font-semibold text-slate-500 dark:text-slate-400">Supported:</span>
          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-300">
            JPG, PNG, WebP
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-300">
            PDF Documents
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-300">
            JSON, Text, Code
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-300">
            ZIP Archives
          </span>

          <span className="inline-flex items-center gap-1.5 ml-2 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            100% Client-Side Local & Private
          </span>
        </div>
      </div>

      {/* 2. Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: File Upload & Staging (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-5 space-y-4 shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
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
                  Clear All
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
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-2xl p-6 text-center cursor-pointer transition-all bg-slate-50/50 dark:bg-slate-900/50 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 group"
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
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Drag and drop files here, or <span className="text-blue-600 dark:text-blue-400 underline">browse</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Upload photos, PDFs, text, or data files for instant processing
              </p>
            </div>

            {/* Staged File List */}
            {filePreviews.length > 0 && (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {filePreviews.map((file, idx) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {file.url ? (
                        <img
                          src={file.url}
                          alt={file.name}
                          className="w-9 h-9 object-cover rounded-lg border border-slate-300 dark:border-slate-700 flex-shrink-0"
                        />
                      ) : file.name.endsWith('.pdf') ? (
                        <div className="w-9 h-9 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center flex-shrink-0">
                          <FileCode className="w-5 h-5" />
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{file.name}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{formatBytes(file.size)}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: AI Instruction & Execution Workspace (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <Card className="p-6 space-y-4 shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label htmlFor="ai-instructions" className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
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
                id="ai-instructions"
                rows={4}
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="Tell AI what you want to do with your files...

Examples:
• Compress these images below 100 KB, convert them into JPG, and put into one ZIP.
• Merge these PDF files into one document and add page numbers.
• Convert these photos into a clean PDF.
• Extract pages 1-3 from this PDF.
• Resize this image to passport photo dimensions."
                className="w-full p-4 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all placeholder:text-slate-400 leading-relaxed"
              />

              {/* Voice Input Button */}
              {recognitionAvailable && (
                <button
                  type="button"
                  onClick={toggleVoice}
                  className={`absolute right-3 bottom-3 p-2 rounded-xl transition-all ${
                    isListening
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                  title={isListening ? 'Stop listening' : 'Speak your instruction'}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              )}
            </div>

            {/* Smart Suggestions Chips */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Example Prompts:</span>
              <div className="flex flex-wrap gap-1.5 text-xs">
                {hasImages && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setInstruction(
                          'Compress these images below 100 KB, convert them into JPG format, and put all the processed images into one ZIP file.'
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition-colors"
                    >
                      ⚡ Compress below 100KB + JPG + ZIP
                    </button>
                    <button
                      type="button"
                      onClick={() => setInstruction('Convert these images into a clean PDF document')}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      📄 Images to PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => setInstruction('Resize this photo to official passport photo dimensions')}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      👤 Passport Photo Size
                    </button>
                  </>
                )}

                {hasPdfs && (
                  <>
                    <button
                      type="button"
                      onClick={() => setInstruction('Merge these PDF files into one document and add page numbers')}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition-colors"
                    >
                      📑 Merge PDFs + Add Page Numbers
                    </button>
                    <button
                      type="button"
                      onClick={() => setInstruction('Extract pages 1-2 from this PDF document')}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors"
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
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      Compress images below 100KB + ZIP
                    </button>
                    <button
                      type="button"
                      onClick={() => setInstruction('Merge these PDF files into one document')}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      Merge PDFs into one
                    </button>
                    <button
                      type="button"
                      onClick={() => setInstruction('Clean extra spaces and format JSON')}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      Format JSON & Clean Text
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Execute Button */}
            <div className="pt-2">
              <Button
                variant="primary"
                size="lg"
                onClick={() => handlePlanAndExecute()}
                disabled={isExecuting}
                className="w-full justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/30 transition-all text-base rounded-xl"
              >
                {isExecuting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                    Executing AI Operations...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2 text-yellow-300" />
                    Do It With AI
                  </>
                )}
              </Button>
            </div>

            {/* Clarification Box */}
            {currentPlan?.needsClarification && (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                      {currentPlan.clarificationQuestion}
                    </h3>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                      Select one option below to start immediate execution:
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {currentPlan.clarificationOptions?.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handlePlanAndExecute(opt.parameters)}
                      className="px-3 py-2 text-xs font-bold rounded-lg bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-100 transition-all text-center shadow-xs"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </Card>

          {/* 3. Step-by-Step Execution Plan & Timeline */}
          {executionSteps.length > 0 && (
            <Card className="p-5 space-y-3 border border-slate-200 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>AI Execution Plan ({executionSteps.length} Steps)</span>
              </h2>

              <div className="space-y-3 pt-1">
                {executionSteps.map((step, idx) => (
                  <div
                    key={step.id}
                    className={`p-3.5 rounded-xl border transition-all ${
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
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            step.status === 'completed'
                              ? 'bg-emerald-600 text-white'
                              : step.status === 'running'
                              ? 'bg-blue-600 text-white animate-pulse'
                              : step.status === 'failed'
                              ? 'bg-rose-600 text-white'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {step.status === 'completed' ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            idx + 1
                          )}
                        </span>

                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {step.toolName}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {step.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        {step.status === 'running' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            {step.progress}%
                          </span>
                        )}
                        {step.status === 'completed' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Done
                          </span>
                        )}
                        {step.status === 'failed' && (
                          <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                            Failed
                          </span>
                        )}
                        {step.status === 'pending' && (
                          <span className="text-[11px] font-medium text-slate-400">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>

                    {step.outputSummary && step.status === 'completed' && (
                      <p className="mt-2 text-[11px] text-emerald-700 dark:text-emerald-300 bg-white/70 dark:bg-slate-900/60 p-2 rounded-lg border border-emerald-200 dark:border-emerald-900/50">
                        ✓ {step.outputSummary}
                      </p>
                    )}

                    {step.errorMessage && step.status === 'failed' && (
                      <p className="mt-2 text-[11px] text-rose-700 dark:text-rose-300 bg-white/70 dark:bg-slate-900/60 p-2 rounded-lg border border-rose-200 dark:border-rose-900/50">
                        ✗ {step.errorMessage}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* 4. Live Results & Previews Section */}
          {(finalFiles.length > 0 || textOutput) && (
            <Card className="p-6 space-y-4 border-2 border-emerald-500/30 bg-white dark:bg-slate-900 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      Task Completed Successfully!
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {executionMessage || 'Your files are ready for preview and download.'}
                    </p>
                  </div>
                </div>

                {/* Master ZIP Download if multiple files */}
                {finalFiles.length > 1 && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      const zipStep = executionSteps.find((s) => s.toolId === 'file-zip-create');
                      if (zipStep && finalFiles[0].name.endsWith('.zip')) {
                        downloadBlob(finalFiles[0].blob, finalFiles[0].name);
                      } else {
                        downloadBlob(finalFiles[0].blob, finalFiles[0].name);
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    Download All
                  </Button>
                )}
              </div>

              {/* Text / Data Output Viewer */}
              {textOutput && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold uppercase">Text Output:</span>
                    <button
                      type="button"
                      onClick={handleCopyText}
                      className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                    >
                      {copiedText ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedText ? 'Copied' : 'Copy Text'}
                    </button>
                  </div>
                  <pre className="p-3.5 rounded-xl bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto max-h-56 leading-relaxed">
                    {textOutput}
                  </pre>
                </div>
              )}

              {/* Processed Files Grid */}
              {finalFiles.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {finalFiles.map((file) => (
                    <div
                      key={file.name}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        {file.type.startsWith('image/') ? (
                          <img
                            src={file.url}
                            alt={file.name}
                            className="w-16 h-16 object-cover rounded-lg border border-slate-300 dark:border-slate-700 flex-shrink-0"
                          />
                        ) : file.name.endsWith('.pdf') ? (
                          <div className="w-16 h-16 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-8 h-8" />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                            <FileArchive className="w-8 h-8" />
                          </div>
                        )}

                        <div className="min-w-0 flex-grow">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate" title={file.name}>
                            {file.name}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Size: <span className="font-semibold text-slate-700 dark:text-slate-300">{formatBytes(file.size)}</span>
                          </p>

                          {file.originalSize && file.originalSize > file.size && (
                            <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                              {Math.round(((file.originalSize - file.size) / file.originalSize) * 100)}% smaller
                            </span>
                          )}

                          {file.width && file.height && (
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {file.width} × {file.height} px
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => downloadBlob(file.blob, file.name)}
                          className="w-full justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2"
                        >
                          <Download className="w-3.5 h-3.5 mr-1.5" />
                          Download
                        </Button>

                        {file.type.startsWith('image/') && (
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-2 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 transition-colors"
                            title="Preview full size"
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

export default DoWithAIPage;
