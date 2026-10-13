import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Send,
  X,
  Key,
  ShieldCheck,
  Check,
  AlertCircle,
  ExternalLink,
  Trash2,
  Paperclip,
  File,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../common/Button';
import { callGeminiApi } from '../../services/ai/geminiClient';
import { resolveNaturalLanguageIntent } from '../../services/ai/aiService';
import { formatBytes } from '../../utils/file';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: number;
  toolLink?: { name: string; path: string };
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('toolhub_gemini_api_key') || '';
  });
  const [inputKey, setInputKey] = useState<string>('');
  const [showKeySettings, setShowKeySettings] = useState<boolean>(false);
  const [keySavedMessage, setKeySavedMessage] = useState<boolean>(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Hello! I'm your ToolHub Assistant. Ask me anything about our 140+ in-browser utilities, how to compress photos, calculate grades, merge PDFs, or format code.",
      timestamp: Date.now(),
    },
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      if (!apiKey) {
        setShowKeySettings(true);
      }
    }
  }, [isOpen, apiKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSaveApiKey = () => {
    const trimmed = inputKey.trim();
    if (!trimmed) return;
    localStorage.setItem('toolhub_gemini_api_key', trimmed);
    setApiKey(trimmed);
    setInputKey('');
    setShowKeySettings(false);
    setKeySavedMessage(true);
    setTimeout(() => setKeySavedMessage(false), 3000);
  };

  const handleClearApiKey = () => {
    localStorage.removeItem('toolhub_gemini_api_key');
    setApiKey('');
    setInputKey('');
    setShowKeySettings(true);
  };

  const handleSend = async (customText?: string) => {
    const text = customText || inputText;
    if (!text.trim() && stagedFiles.length === 0) return;

    setErrorMessage(null);
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text.trim() + (stagedFiles.length > 0 ? ` [Attached: ${stagedFiles.map((f) => f.name).join(', ')}]` : ''),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputText('');
    setIsLoading(true);

    try {
      if (apiKey) {
        // Build conversation history for Gemini
        const history = messages
          .filter((m) => m.id !== 'welcome')
          .slice(-6)
          .map((m) => ({
            role: (m.sender === 'user' ? 'user' : 'model') as 'user' | 'model',
            text: m.text,
          }));

        const aiResponseText = await callGeminiApi(apiKey, text, history);

        // Check if response mentions a tool route
        const routeMatch = aiResponseText.match(/\/tool\/([a-z0-9-]+)/i);
        const toolLink = routeMatch ? { name: routeMatch[1], path: routeMatch[0] } : undefined;

        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            sender: 'assistant',
            text: aiResponseText,
            timestamp: Date.now(),
            toolLink,
          },
        ]);
      } else {
        // Fallback to client-side rule resolver
        const resolved = resolveNaturalLanguageIntent(text, stagedFiles);
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            sender: 'assistant',
            text: `${resolved.message}\n\n*(Tip: Add your free Google Gemini API key above for unrestricted conversational chat!)*`,
            timestamp: Date.now(),
            toolLink: resolved.actionPlan ? { name: resolved.actionPlan.tool.name, path: resolved.actionPlan.tool.path } : undefined,
          },
        ]);
      }
    } catch (err: any) {
      console.error('AI chat error:', err);
      setErrorMessage(err.message || 'Failed to get response from AI.');
    } finally {
      setIsLoading(false);
      setStagedFiles([]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setStagedFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const samplePrompts = [
    'Which tool compresses photos under 50KB?',
    'How do I calculate semester SGPA?',
    'Merge my PDF files into one',
    'How many classes can I safely bunk?',
    'Format messy JSON code',
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-3 sm:p-4 text-center">
        {/* Backdrop */}
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        />

        {/* Modal Window */}
        <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl text-left transition-all flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>AI Assistant</span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                    Tool Guide & Orchestrator
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">Ask anything about ToolHub utilities</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowKeySettings((prev) => !prev)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                  apiKey
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                    : 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                }`}
                title="Configure Google Gemini API Key"
              >
                <Key className="w-3.5 h-3.5" />
                <span>{apiKey ? 'API Connected' : 'Set API Key'}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* API Key Configuration Banner */}
          {showKeySettings && (
            <div className="p-4 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-sky-500" />
                    <span>Google Gemini API Key</span>
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    ToolHub connects directly to the Google Gemini API to chat with you about tools.
                    Don't have a key?{' '}
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-600 dark:text-sky-400 underline inline-flex items-center gap-0.5 font-semibold"
                    >
                      Get a free key at Google AI Studio <ExternalLink className="w-3 h-3" />
                    </a>{' '}
                    (100% free, no credit card required).
                  </p>
                </div>
                {apiKey && (
                  <button
                    type="button"
                    onClick={handleClearApiKey}
                    className="text-[11px] text-rose-500 hover:underline flex-shrink-0"
                  >
                    Clear Key
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  placeholder={apiKey ? 'API key is configured. Enter new key to replace...' : 'Paste your Google Gemini API key (AIzaSy...)'}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <Button size="sm" onClick={handleSaveApiKey} disabled={!inputKey.trim()}>
                  Save Key
                </Button>
              </div>
            </div>
          )}

          {keySavedMessage && (
            <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Google Gemini API key saved! You are now chatting with real AI.</span>
            </div>
          )}

          {/* Privacy Note */}
          <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Zero file uploads: AI assists with tool selection & parameters.</span>
            </span>
            <button
              type="button"
              onClick={() =>
                setMessages([
                  {
                    id: 'welcome-reset',
                    sender: 'assistant',
                    text: 'Chat cleared. How can I assist you with ToolHub tools?',
                    timestamp: Date.now(),
                  },
                ])
              }
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[460px]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-sky-600 text-white rounded-br-none shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {/* Direct Tool Launch Pill if recommended */}
                  {msg.toolLink && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          navigate(msg.toolLink!.path);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs shadow-sm transition-colors"
                      >
                        <span>Open {msg.toolLink.name}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1 font-mono">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-sky-600 dark:text-sky-400 p-2">
                <span className="animate-spin">⚙️</span>
                <span>Consulting ToolHub AI...</span>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11px]">
            <span className="text-slate-400 font-semibold flex-shrink-0">Suggestions:</span>
            {samplePrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(prompt)}
                className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-sky-600 hover:border-sky-300 flex-shrink-0 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Staged attachments preview */}
          {stagedFiles.length > 0 && (
            <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-2 text-xs">
              {stagedFiles.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  <File className="w-3 h-3 text-sky-500" />
                  <span className="max-w-[120px] truncate">{f.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">({formatBytes(f.size)})</span>
                  <button
                    type="button"
                    onClick={() => setStagedFiles((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-slate-400 hover:text-rose-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Chat Input Bar */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-slate-400 hover:text-sky-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="Attach a sample file for the assistant to inspect"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask AI about tools (e.g. 'I need to make a signature 300x100')..."
              className="w-full text-xs p-2 bg-transparent border-0 focus:outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />

            <Button
              size="sm"
              onClick={() => handleSend()}
              disabled={!inputText.trim() && stagedFiles.length === 0}
              isLoading={isLoading}
              icon={<Send className="w-3.5 h-3.5" />}
            >
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
