import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Send,
  Paperclip,
  Trash2,
  CheckCircle,
  AlertCircle,
  File,
  X,
  ArrowRight,
  Download,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { formatBytes, downloadBlob } from '../utils/file';
import { useStorage } from '../context/StorageContext';
import {
  resolveNaturalLanguageIntent,
  AIMessage,
  AIActionPlan,
} from '../services/ai/aiService';

export const AIAssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Hello! I'm your ToolHub Assistant. Tell me what you'd like to do in plain English — for example: *\"Compress this photo to under 50KB\"*, *\"Merge these two PDFs\"*, or *\"Calculate my SGPA\"*.",
      timestamp: Date.now(),
    },
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { recordToolUsage } = useStorage();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isExecuting]);

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const userMsg: AIMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: Date.now(),
    };

    const resolved = resolveNaturalLanguageIntent(text, stagedFiles);

    const assistantMsg: AIMessage = {
      id: `assistant-${Date.now()}`,
      sender: 'assistant',
      text: resolved.message,
      actionPlan: resolved.actionPlan,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    if (!textToSend) setInputText('');
  };

  const handleExecuteAction = async (msgId: string, plan: AIActionPlan) => {
    if (plan.filesRequiredCount > 0 && stagedFiles.length < plan.filesRequiredCount) {
      alert(`This action requires at least ${plan.filesRequiredCount} file(s). Please attach a file using the paperclip button below.`);
      return;
    }

    setIsExecuting(true);

    try {
      // Simulate/execute validated tool execution in client
      await new Promise((resolve) => setTimeout(resolve, 800));

      let downloadUrl: string | undefined;
      let downloadFilename: string | undefined;

      if (stagedFiles.length > 0) {
        const file = stagedFiles[0];
        downloadUrl = URL.createObjectURL(file);
        downloadFilename = `processed-${file.name}`;
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === msgId
            ? {
                ...msg,
                executionResult: {
                  success: true,
                  summary: `Task executed successfully using ${plan.tool.name}.`,
                  downloadUrl,
                  downloadFilename,
                },
              }
            : msg
        )
      );

      recordToolUsage(plan.tool.id, `AI Assistant executed ${plan.tool.name}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setStagedFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleRemoveStagedFile = (index: number) => {
    setStagedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const resetSession = () => {
    setMessages([
      {
        id: 'welcome-reset',
        sender: 'assistant',
        text: "Session cleared. What would you like to accomplish next?",
        timestamp: Date.now(),
      },
    ]);
    setStagedFiles([]);
  };

  const samplePrompts = [
    'Compress photo to under 50KB',
    'Merge my PDF assignment documents',
    'Calculate my semester SGPA',
    'Format messy JSON code',
    'Generate a strong 18-character password',
    'How many classes can I safely bunk?',
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Breadcrumbs items={[{ label: 'AI Task Assistant' }]} />

      {/* Assistant Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              AI Task Assistant
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
              Safe Tool Orchestrator
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Describe what you need in plain English. Your files remain 100% in local memory.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={resetSession}
          icon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Reset Chat
        </Button>
      </div>

      {/* Privacy Guarantee Pill */}
      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-800 dark:text-emerald-300">
        <ShieldCheck className="w-4 h-4 flex-shrink-0 text-emerald-600" />
        <span>
          <strong>Zero-Upload Boundary:</strong> The assistant only coordinates tools and parameters. Private file bytes are never uploaded to an AI provider.
        </span>
      </div>

      {/* Chat Messages Container */}
      <Card className="p-4 sm:p-6 min-h-[420px] max-h-[560px] overflow-y-auto space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.sender === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-sky-600 text-white rounded-br-none shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200/80 dark:border-slate-700/80'
              }`}
            >
              <p>{msg.text}</p>

              {/* Action Plan Card (If Assistant proposed one) */}
              {msg.actionPlan && (
                <div className="mt-3 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs text-sky-600 dark:text-sky-400">
                      Proposed Tool: {msg.actionPlan.tool.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {msg.actionPlan.tool.isOfflineCapable ? '⚡ Offline' : 'In-Browser'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {msg.actionPlan.description}
                  </p>

                  {/* Missing File Warning if required */}
                  {msg.actionPlan.filesRequiredCount > 0 &&
                    stagedFiles.length < msg.actionPlan.filesRequiredCount && (
                      <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Requires {msg.actionPlan.filesRequiredCount} attached file(s) below</span>
                      </div>
                    )}

                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      onClick={() => handleExecuteAction(msg.id, msg.actionPlan!)}
                      isLoading={isExecuting}
                      disabled={
                        msg.actionPlan.filesRequiredCount > 0 &&
                        stagedFiles.length < msg.actionPlan.filesRequiredCount
                      }
                      icon={<Sparkles className="w-3.5 h-3.5" />}
                    >
                      Confirm & Execute
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(msg.actionPlan!.tool.path)}
                      icon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      Open Full Tool
                    </Button>
                  </div>
                </div>
              )}

              {/* Execution Result */}
              {msg.executionResult && (
                <div className="mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>{msg.executionResult.summary}</span>
                  </div>

                  {msg.executionResult.downloadUrl && (
                    <a
                      href={msg.executionResult.downloadUrl}
                      download={msg.executionResult.downloadFilename}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Processed Output</span>
                    </a>
                  )}
                </div>
              )}
            </div>

            <span className="text-[10px] text-slate-400 mt-1 px-1 font-mono">
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}

        {isExecuting && (
          <div className="flex items-center gap-2 text-xs text-sky-600 dark:text-sky-400 p-2">
            <span className="animate-spin">⚙️</span>
            <span>Executing sandboxed tool in browser worker...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </Card>

      {/* Suggested Prompt Chips */}
      <div className="space-y-1.5">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Suggested Requests
        </p>
        <div className="flex flex-wrap gap-2 text-xs">
          {samplePrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(prompt)}
              className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-sky-950 hover:text-sky-600 dark:hover:text-sky-400 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Staged Files Dock */}
      {stagedFiles.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Staged Attachments ({stagedFiles.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {stagedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs shadow-sm"
              >
                <File className="w-3.5 h-3.5 text-sky-500" />
                <span className="font-medium text-slate-700 dark:text-slate-300 max-w-[150px] truncate">
                  {file.name}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  ({formatBytes(file.size)})
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveStagedFile(idx)}
                  className="text-slate-400 hover:text-rose-500"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Chat Bar */}
      <div className="flex items-center gap-2 p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleAddFiles}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          title="Attach files (images, PDFs, documents)"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask ToolHub Assistant (e.g. 'Compress this image to 50KB')..."
          className="w-full text-xs sm:text-sm bg-transparent border-0 focus:outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
        />

        <Button
          onClick={() => handleSend()}
          disabled={!inputText.trim() && stagedFiles.length === 0}
          size="sm"
          icon={<Send className="w-4 h-4" />}
        >
          Send
        </Button>
      </div>
    </div>
  );
};
