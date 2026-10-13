import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowUp,
  RotateCcw,
  Settings,
  Copy,
  Check,
  ChevronDown,
  ArrowUpRight,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import {
  callGeminiApi,
  AVAILABLE_GEMINI_MODELS,
  DEFAULT_GEMINI_MODEL,
  getEffectiveApiKey,
  saveEffectiveApiKey,
  getPreferredModel,
  savePreferredModel,
} from '../services/ai/geminiClient';
import { resolveNaturalLanguageIntent } from '../services/ai/aiService';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: number;
  toolLink?: { name: string; path: string };
  isKeyPrompt?: boolean;
}

export const AIAssistantPage: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>(() => getEffectiveApiKey());
  const [selectedModel, setSelectedModel] = useState<string>(() => getPreferredModel());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [inlineKeyInput, setInlineKeyInput] = useState<string>('');

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setApiKey(getEffectiveApiKey());
    setSelectedModel(getPreferredModel());
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    savePreferredModel(modelId);
  };

  const handleSaveInlineKey = (keyVal: string) => {
    const trimmed = keyVal.trim();
    if (!trimmed) return;
    saveEffectiveApiKey(trimmed);
    setApiKey(trimmed);
    setInlineKeyInput('');

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

      const routeMatch = aiResponse.match(/\/tool\/([a-z0-9-]+)/i);
      const toolLink = routeMatch ? { name: routeMatch[1], path: routeMatch[0] } : undefined;

      setMessages((prev) => [
        ...prev.filter((m) => !m.isKeyPrompt),
        {
          id: `assistant-${Date.now()}`,
          sender: 'assistant',
          text: aiResponse,
          timestamp: Date.now(),
          toolLink,
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
          toolLink: fallback.actionPlan
            ? { name: fallback.actionPlan.tool.name, path: fallback.actionPlan.tool.path }
            : undefined,
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
          text: 'To chat using Google Gemini AI, please provide your Google API key below or configure it in Settings:',
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      <Breadcrumbs items={[{ label: 'AI Assistant' }]} />

      <Card className="flex flex-col h-[740px] max-h-[85vh] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl bg-white dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 select-none">
          {/* Model Selector */}
          <div className="relative flex items-center">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
              <Sparkles className="w-4 h-4 text-sky-500 shrink-0" />
              <select
                value={selectedModel}
                onChange={(e) => handleModelChange(e.target.value)}
                className="bg-transparent border-none text-xs sm:text-sm font-semibold focus:outline-none cursor-pointer appearance-none pr-4"
              >
                {AVAILABLE_GEMINI_MODELS.map((m) => (
                  <option key={m.id} value={m.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                    {m.name.split(' (')[0]}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 pointer-events-none" />
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
              title="Settings & API Key"
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

          {/* Messages */}
          {messages.map((msg) => (
            <div key={msg.id} className="space-y-2">
              {msg.sender === 'user' ? (
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-tr-xs bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 leading-relaxed whitespace-pre-wrap">
                    {msg.text}
                  </div>
                </div>
              ) : (
                <div className="flex gap-3 text-xs sm:text-sm leading-relaxed group">
                  <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sky-500 shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>

                  <div className="flex-1 space-y-2 text-slate-800 dark:text-slate-200">
                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {msg.isKeyPrompt && (
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 mt-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="password"
                            value={inlineKeyInput}
                            onChange={(e) => setInlineKeyInput(e.target.value)}
                            placeholder="Paste Google Gemini API Key (AIzaSy...)"
                            className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveInlineKey(inlineKeyInput)}
                            disabled={!inlineKeyInput.trim()}
                            className="px-3 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold disabled:opacity-50 transition-opacity shrink-0"
                          >
                            Connect
                          </button>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>Get free key at aistudio.google.com</span>
                          <button
                            type="button"
                            onClick={() => navigate('/settings')}
                            className="text-sky-500 hover:underline"
                          >
                            Settings →
                          </button>
                        </div>
                      </div>
                    )}

                    {msg.toolLink && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => navigate(msg.toolLink!.path)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-xs font-semibold text-sky-600 dark:text-sky-400 transition-colors shadow-2xs"
                        >
                          <span>Open {msg.toolLink.name}</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(msg.id, msg.text)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-opacity flex items-center gap-1 text-[11px]"
                        title="Copy message"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span className="text-emerald-500">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

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

        {/* Input Box */}
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
            ToolHub AI may produce errors. Utilities process files locally in your browser.
          </p>
        </div>
      </Card>
    </div>
  );
};
