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
  isFastIntentEnabled,
} from '../../services/ai/geminiClient';
import { resolveNaturalLanguageIntent } from '../../services/ai/aiService';
import { ChatMessageItem, ChatMessage } from './ChatMessageItem';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({ isOpen, onClose }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
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

  const sendMessage = async (messageText: string) => {
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

      // 2. High-speed AI inference
      const history = messages
        .slice(-6)
        .map((m) => ({
          role: (m.sender === 'user' ? 'user' : 'model') as 'user' | 'model',
          text: m.text,
        }));

      const aiResponse = await callGeminiApi(
        '',
        messageText,
        history
      );

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
      console.error('AI Assistant Error:', err);
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

    await sendMessage(text);
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

        {/* Modal Window */}
        <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl text-left transition-all flex flex-col h-[650px] max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none">
            {/* Top Left: Title */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 shadow-2xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-sm text-[#0F172A] dark:text-white tracking-tight">
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
                title="Settings"
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
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
            {/* Empty State */}
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto py-6 space-y-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 shadow-xs">
                  <Sparkles className="w-5 h-5" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-black text-[#0F172A] dark:text-white">
                    How can ToolHub help?
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Ask to compress images, merge PDFs, format JSON, or compute grades.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full text-left">
                  {quickPrompts.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSend(p.title)}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-left flex flex-col justify-between group"
                    >
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 transition-colors">
                        {p.title}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        {p.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((msg) => (
              <ChatMessageItem
                key={msg.id}
                message={msg}
                isCopied={copiedId === msg.id}
                onCopy={handleCopyMessage}
                onNavigateTool={(path) => {
                  onClose();
                  navigate(path);
                }}
                onOpenSettings={() => {
                  onClose();
                  navigate('/settings');
                }}
              />
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div className="p-3 rounded-2xl rounded-tl-sm bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-500 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]"></span>
                  <span className="text-slate-400 font-medium ml-1">Thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Floating Input Box */}
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
              <span>Instant AI Assistant</span>
              <span>100% Client-Side Privacy</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
