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
  getEffectiveApiKey,
  getPreferredModel,
} from '../services/ai/geminiClient';
import { resolveNaturalLanguageIntent } from '../services/ai/aiService';
import { ChatMessageItem, ChatMessage } from '../components/ai/ChatMessageItem';

export const AIAssistantPage: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState<string>(() => getPreferredModel());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setSelectedModel(getPreferredModel());
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const sendMessage = async (messageText: string, activeApiKey: string) => {
    setIsLoading(true);

    try {
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

    const currentKey = getEffectiveApiKey();
    await sendMessage(text, currentKey);
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
        {/* Header (No model name in top left) */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 select-none">
          {/* Top Left: Clean Title & Icon (model name removed) */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-500/10 dark:bg-brand-500/20 flex items-center justify-center text-brand-500 shadow-2xs">
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
              <div className="w-12 h-12 rounded-full bg-brand-500/10 dark:bg-brand-500/20 flex items-center justify-center text-brand-500 shadow-xs">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full pt-2">
                {quickPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(p.title)}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-800/40 hover:bg-brand-50/50 dark:hover:bg-brand-950/20 hover:border-brand-300 dark:hover:border-brand-700 text-left transition-all"
                  >
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{p.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{p.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages rendered via ChatMessageItem */}
          {messages.map((msg) => (
            <ChatMessageItem
              key={msg.id}
              message={msg}
              onNavigateTool={(path) => navigate(path)}
              onCopy={handleCopyMessage}
              isCopied={copiedId === msg.id}
              onOpenSettings={() => navigate('/settings')}
            />
          ))}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex gap-3 text-xs sm:text-sm">
              <div className="w-6 h-6 rounded-full bg-brand-500/10 dark:bg-brand-500/20 flex items-center justify-center text-brand-500 shrink-0">
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

        {/* Floating Input Box */}
        <div className="p-3 sm:p-4 border-t border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 space-y-2">
          <div className="relative flex items-center rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 focus-within:border-brand-500 dark:focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:bg-white dark:focus-within:bg-slate-800 transition-all shadow-xs">
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
                  ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-brand shadow-xs hover:scale-105'
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
      </Card>
    </div>
  );
};
