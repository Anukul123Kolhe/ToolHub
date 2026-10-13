import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowUp,
  X,
  RotateCcw,
  Settings,
} from 'lucide-react';
import {
  callGeminiApi,
  getEffectiveApiKey,
  saveEffectiveApiKey,
  getPreferredModel,
} from '../../services/ai/geminiClient';
import { resolveNaturalLanguageIntent } from '../../services/ai/aiService';
import { ChatMessageItem, ChatMessage } from './ChatMessageItem';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState<string>(() => getEffectiveApiKey());
  const [selectedModel, setSelectedModel] = useState<string>(() => getPreferredModel());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setApiKey(getEffectiveApiKey());
      setSelectedModel(getPreferredModel());
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSaveInlineKey = (keyVal: string) => {
    const trimmed = keyVal.trim();
    if (!trimmed) return;
    saveEffectiveApiKey(trimmed);
    setApiKey(trimmed);

    const promptToSend = pendingPrompt;
    setPendingPrompt(null);
    if (promptToSend) {
      sendMessage(promptToSend, trimmed);
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const sendMessage = async (messageText: string, activeApiKey: string) => {
    setIsLoading(true);

    try {
      const history = messages
        .filter((m) => !m.isKeyPrompt)
        .slice(-8)
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

      setMessages((prev) => [
        ...prev.filter((m) => !m.isKeyPrompt),
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
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          sender: 'assistant',
          text: fallback.message,
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

    const currentKey = apiKey || getEffectiveApiKey();

    if (!currentKey) {
      setPendingPrompt(text);
      setMessages((prev) => [
        ...prev,
        {
          id: `prompt-key-${Date.now()}`,
          sender: 'assistant',
          text: 'To connect with AI tools and assistance, please enter your Google Gemini API key below or set it in Settings:',
          timestamp: Date.now(),
          isKeyPrompt: true,
        },
      ]);
      return;
    }

    await sendMessage(text, currentKey);
  };

  const quickPrompts = [
    { title: 'Compress an image', desc: 'Reduce file size under 50KB or custom KB' },
    { title: 'Merge PDF files', desc: 'Combine multiple assignment PDFs into one' },
    { title: 'Calculate SGPA & CGPA', desc: 'Compute semester grades and percentage' },
    { title: 'Generate QR code', desc: 'Create Wi-Fi, URL, or contact QR codes' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-2 sm:p-4 text-center">
        {/* Backdrop */}
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        />

        {/* ChatGPT / Gemini Style Chat Window */}
        <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl text-left transition-all flex flex-col h-[650px] max-h-[90vh]">
          {/* Header (No model name on top left) */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 select-none">
            {/* Top Left: Clean Title & Icon (model name removed) */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sky-500 shadow-2xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 tracking-tight">
                AI Assistant
              </span>
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
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sky-500 shadow-xs">
                  <Sparkles className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-100">
                    What can I help with?
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
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
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-all"
                    >
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{p.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{p.desc}</p>
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
                onSaveKey={handleSaveInlineKey}
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
                <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sky-500 shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="flex items-center gap-1 py-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ChatGPT Style Floating Input Box */}
          <div className="p-3 sm:p-4 border-t border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 space-y-2">
            <div className="relative flex items-center rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 focus-within:border-slate-400 dark:focus-within:border-slate-500 focus-within:bg-white dark:focus-within:bg-slate-800 transition-all shadow-xs">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask ToolHub..."
                className="w-full text-xs sm:text-sm px-4 py-3 bg-transparent border-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
              />

              <button
                type="button"
                onClick={() => handleSend()}
                disabled={!inputText.trim() || isLoading}
                className={`mr-2 p-2 rounded-xl transition-all ${
                  inputText.trim() && !isLoading
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm hover:scale-105'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                }`}
                title="Send message"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>

            <p className="text-center text-[11px] text-slate-400">
              ToolHub AI connects directly to utilities. All tools process files locally.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
