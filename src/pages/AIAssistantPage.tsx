import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowUp,
  RotateCcw,
  Settings,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import {
  callGeminiApi,
  isFastIntentEnabled,
} from '../services/ai/geminiClient';
import { resolveNaturalLanguageIntent } from '../services/ai/aiService';
import { ChatMessageItem, ChatMessage } from '../components/ai/ChatMessageItem';

export const AIAssistantPage: React.FC = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      <Breadcrumbs items={[{ label: 'AI Assistant' }]} />

      <Card className="flex flex-col h-[740px] max-h-[85vh] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl bg-white dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none">
          {/* Top Left: Title */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 shadow-2xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-sm text-[#0F172A] dark:text-white tracking-tight">
                AI Assistant
              </span>
            </div>
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
              onClick={() => navigate('/settings')}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Conversation Stream */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-5">
          {/* Empty State */}
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto py-8 space-y-6">
              <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 shadow-xs">
                <Sparkles className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] dark:text-white">
                  How can ToolHub help you?
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Ask to convert files, calculate grades, compress media, or generate barcodes.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left">
                {quickPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(p.title)}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-left flex flex-col justify-between group"
                  >
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 transition-colors">
                      {p.title}
                    </span>
                    <span className="text-[11px] text-slate-400 mt-1 font-normal">
                      {p.desc}
                    </span>
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
              isCopied={copiedId === msg.id}
              onCopy={handleCopyMessage}
              onNavigateTool={(path) => navigate(path)}
              onOpenSettings={() => navigate('/settings')}
            />
          ))}

          {/* Loading Typing Indicator */}
          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-3.5 rounded-2xl rounded-tl-sm bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-500 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]"></span>
                <span className="text-slate-400 font-medium ml-1">Thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
          <div className="relative flex items-center rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 shadow-xs transition-all">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask anything (e.g. compress my image under 50kb, merge pdfs)..."
              disabled={isLoading}
              className="w-full text-xs sm:text-sm px-4 py-3 bg-transparent text-[#0F172A] dark:text-white placeholder:text-slate-400 focus:outline-none"
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
            <span>All tool files process 100% locally in browser memory</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
