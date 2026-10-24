import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowUp,
  X,
  RotateCcw,
  Settings,
  Key,
  ChevronDown,
} from 'lucide-react';
import {
  callGeminiApi,
  getEffectiveApiKey,
  getPreferredModel,
  savePreferredModel,
  hasUserApiKey,
  AVAILABLE_GEMINI_MODELS,
  getAllAvailableModels,
  normalizeModelId,
  isFastIntentEnabled,
  GeminiModelOption,
} from '../../services/ai/geminiClient';
import { resolveNaturalLanguageIntent } from '../../services/ai/aiService';
import { ChatMessageItem, ChatMessage } from './ChatMessageItem';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({ isOpen, onClose }) => {
  const [availableModels, setAvailableModels] = useState<GeminiModelOption[]>(() => getAllAvailableModels());
  const [selectedModel, setSelectedModel] = useState<string>(() => getPreferredModel());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [userKeyActive, setUserKeyActive] = useState<boolean>(() => hasUserApiKey());

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setAvailableModels(getAllAvailableModels());
      setSelectedModel(getPreferredModel());
      setUserKeyActive(hasUserApiKey());
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleModelChange = (newModel: string) => {
    const normalized = normalizeModelId(newModel);
    setSelectedModel(normalized);
    savePreferredModel(normalized);
  };

  const sendMessage = async (messageText: string, activeApiKey: string) => {
    setIsLoading(true);

    try {
      // 1. Zero-latency intent optimization if enabled for direct tool listing
      const lower = messageText.toLowerCase().trim();
      const isDirectListQuery =
        lower.startsWith('give me list of') ||
        lower.startsWith('list of') ||
        lower.startsWith('show me all') ||
        lower.includes('list all image') ||
        lower.includes('list all pdf');

      if (isFastIntentEnabled() && isDirectListQuery) {
        const directMatch = resolveNaturalLanguageIntent(messageText);
        if (directMatch && directMatch.message && !directMatch.message.includes("couldn't fully identify")) {
          setMessages((prev) => [
            ...prev,
            {
              id: `assistant-${Date.now()}`,
              sender: 'assistant',
              text: directMatch.message,
              timestamp: Date.now(),
            },
          ]);
          setIsLoading(false);
          return;
        }
      }

      // 2. High-speed Google Gemini API inference with selected model
      const history = messages
        .slice(-6)
        .map((m) => ({
          role: (m.sender === 'user' ? 'user' : 'model') as 'user' | 'model',
          text: m.text,
        }));

      const aiResponse = await callGeminiApi(
        activeApiKey,
        messageText,
        history,
        selectedModel
      );

      // If the model was automatically switched to a working fallback, sync UI state
      const currentPreferred = getPreferredModel();
      if (currentPreferred && currentPreferred !== selectedModel) {
        setSelectedModel(currentPreferred);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          sender: 'assistant',
          text: aiResponse,
          timestamp: Date.now(),
        },
      ]);
    } catch (err: any) {
      console.error('Gemini API Error:', err);
      const fallback = resolveNaturalLanguageIntent(messageText);
      const quotaNotice = err?.message?.includes('limit: 0')
        ? `\n\n> 💡 *Note: The selected model has limit: 0 on Google Free Tier. Switched to Gemini 2.5 Flash.*`
        : '';
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          sender: 'assistant',
          text: (fallback.message || '') + quotaNotice,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (customText?: string) => {
    const text = (customText || inputText).trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputText('');

    const currentKey = getEffectiveApiKey();
    await sendMessage(text, currentKey);
  };

  const quickPrompts = [
    { title: 'Give me list of image tools', desc: 'Browse all 18 in-browser photo utilities' },
    { title: 'Compress an image', desc: 'Reduce file size under 50KB or custom KB' },
    { title: 'Merge PDF files', desc: 'Combine multiple assignment PDFs into one' },
    { title: 'Calculate SGPA & CGPA', desc: 'Compute semester grades and percentage' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-2 sm:p-4 text-center">
        {/* Backdrop */}
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        />

        {/* ChatGPT / Gemini Style Chat Window */}
        <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl text-left transition-all flex flex-col h-[650px] max-h-[90vh]">
          {/* Header with Model Selector & API Key Status */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none">
            {/* Top Left: Title, Active Google Model Dropdown & Key Badge */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 shadow-2xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="font-extrabold text-sm text-[#0F172A] dark:text-white tracking-tight hidden xs:inline">
                  AI Assistant
                </span>
              </div>

              {/* Google Gemini Model Selector */}
              <div className="relative flex items-center">
                <select
                  value={selectedModel}
                  onChange={(e) => handleModelChange(e.target.value)}
                  className="text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-lg pl-2.5 pr-7 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none transition-colors max-w-[190px] truncate"
                  title="Select Google Gemini Model"
                >
                  {availableModels.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.tag})
                    </option>
                  ))}
                  {!availableModels.some((m) => m.id === selectedModel) && (
                    <option value={selectedModel}>
                      Custom: {selectedModel}
                    </option>
                  )}
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2 pointer-events-none text-slate-400" />
              </div>

              {/* API Key Status Indicator */}
              {userKeyActive && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300">
                  <Key className="w-2.5 h-2.5" />
                  Custom Key
                </span>
              )}
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setMessages([])}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="New Chat"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/settings');
                }}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Settings & API Key"
              >
                <Settings className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-1"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Conversation Stream */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-5">
            {/* Empty State / Welcome Screen */}
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto py-8 space-y-6">
                <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 shadow-xs">
                  <Sparkles className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] dark:text-white">
                    What can I help with?
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
                    Search and run utilities, process files, format code, or calculate formulas.
                  </p>
                </div>

                {/* Prompt Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full pt-2">
                  {quickPrompts.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSend(p.title)}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-800/40 hover:bg-blue-50/70 dark:hover:bg-blue-950/50 hover:border-blue-400 dark:hover:border-blue-700 text-left transition-all"
                    >
                      <p className="text-xs font-bold text-[#0F172A] dark:text-slate-200">{p.title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 font-normal">{p.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message History */}
            {messages.map((msg) => (
              <ChatMessageItem
                key={msg.id}
                message={msg}
                onNavigateTool={(path) => {
                  onClose();
                  navigate(path);
                }}
                onCopy={handleCopyMessage}
                isCopied={copiedId === msg.id}
                onOpenSettings={() => {
                  onClose();
                  navigate('/settings');
                }}
              />
            ))}

            {/* Typing / Generating Indicator */}
            {isLoading && (
              <div className="flex gap-3 text-xs sm:text-sm">
                <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 shrink-0">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div className="flex items-center gap-1.5 py-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ChatGPT Style Floating Input Box */}
          <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
            <div className="relative flex items-center rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 focus-within:border-blue-500 dark:focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:bg-white dark:focus-within:bg-slate-800 transition-all shadow-xs">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask ToolHub or enter any utility request..."
                className="w-full text-xs sm:text-sm px-4 py-3 bg-transparent border-none text-[#0F172A] dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
              />

              <button
                type="button"
                onClick={() => handleSend()}
                disabled={!inputText.trim() || isLoading}
                className={`mr-2 p-2 rounded-xl transition-all ${
                  inputText.trim() && !isLoading
                    ? 'bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/30 hover:scale-105'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                }`}
                title="Send message"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span>Google Gemini ({selectedModel})</span>
              <span>100% Client-Side Privacy</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
