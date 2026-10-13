import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Send,
  X,
  Key,
  Trash2,
  ArrowRight,
  Cpu,
  Copy,
  Check,
  Settings,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Button } from '../common/Button';
import {
  callGeminiApi,
  AVAILABLE_GEMINI_MODELS,
  DEFAULT_GEMINI_MODEL,
  getEffectiveApiKey,
  saveEffectiveApiKey,
  getPreferredModel,
  savePreferredModel,
} from '../../services/ai/geminiClient';
import { resolveNaturalLanguageIntent } from '../../services/ai/aiService';

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
  isKeyPrompt?: boolean;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState<string>(() => getEffectiveApiKey());
  const [selectedModel, setSelectedModel] = useState<string>(() => getPreferredModel());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [inlineKeyInput, setInlineKeyInput] = useState<string>('');

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Hello! I am your ToolHub AI Assistant powered by Google Gemini. Ask me about tools, calculations, image workflows, or PDF tasks.",
      timestamp: Date.now(),
    },
  ]);
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
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

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
        .filter((m) => m.id !== 'welcome' && !m.isKeyPrompt)
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

      // Check if response references a tool
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
          text: `[${selectedModel} Note: ${err.message || 'API request failed'}]\n\n${fallback.message}`,
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
          text: 'Google Gemini API key is required to use this model. Please provide your Google API key below or set it permanently in Settings:',
          timestamp: Date.now(),
          isKeyPrompt: true,
        },
      ]);
      return;
    }

    await sendMessage(text, currentKey);
  };

  const quickPrompts = [
    'Compress a photo under 50 KB',
    'Merge my PDF assignment documents',
    'Calculate my semester SGPA & CGPA',
    'Generate a Wi-Fi QR Code',
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-2 sm:p-4 text-center">
        {/* Backdrop */}
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity"
        />

        {/* Premium Modal Window */}
        <div className="relative w-full max-w-2xl transform overflow-hidden rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xl shadow-sky-500/10 text-left transition-all flex flex-col h-[670px] max-h-[92vh]">
          {/* Top Gradient Accent Bar */}
          <div className="h-1 w-full bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500" />

          {/* Premium Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 ring-2 ring-white/20">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black tracking-tight text-slate-900 dark:text-slate-100">
                    ToolHub AI
                  </h3>
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60">
                    Gemini Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Intelligent in-browser assistant</p>
              </div>
            </div>

            {/* Header Controls */}
            <div className="flex items-center gap-2">
              {/* Model Dropdown */}
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white/80 dark:bg-slate-800/80 shadow-xs text-xs text-slate-700 dark:text-slate-300">
                <Cpu className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                <select
                  value={selectedModel}
                  onChange={(e) => handleModelChange(e.target.value)}
                  className="bg-transparent border-none text-xs font-semibold focus:outline-none cursor-pointer pr-1"
                >
                  {AVAILABLE_GEMINI_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Settings Shortcut Link */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/settings');
                }}
                className={`p-2 rounded-xl border transition-all ${
                  apiKey
                    ? 'border-emerald-300/80 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100/50'
                    : 'border-amber-300/80 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 hover:bg-amber-100/50'
                }`}
                title="Manage API Key & Settings"
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* Clear Chat */}
              <button
                type="button"
                onClick={() =>
                  setMessages([
                    {
                      id: 'welcome-reset',
                      sender: 'assistant',
                      text: 'Chat cleared. How can I assist you with ToolHub utilities?',
                      timestamp: Date.now(),
                    },
                  ])
                }
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Clear Chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {/* Close Modal */}
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} group`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[80%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed transition-all shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-tr-xs shadow-sky-500/10'
                      : 'bg-slate-100/90 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 rounded-tl-xs border border-slate-200/60 dark:border-slate-700/60'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {/* Inline API Key Card if missing */}
                  {msg.isKeyPrompt && (
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="password"
                          value={inlineKeyInput}
                          onChange={(e) => setInlineKeyInput(e.target.value)}
                          placeholder="Paste Google Gemini API Key (AIzaSy...)"
                          className="w-full text-xs p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSaveInlineKey(inlineKeyInput)}
                          disabled={!inlineKeyInput.trim()}
                          className="shrink-0"
                        >
                          Connect
                        </Button>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Or manage in Settings</span>
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            navigate('/settings');
                          }}
                          className="text-sky-500 hover:underline font-semibold"
                        >
                          Open Settings →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Tool Action Button */}
                  {msg.toolLink && (
                    <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          navigate(msg.toolLink!.path);
                        }}
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-semibold text-xs shadow-md shadow-sky-500/20 transition-all hover:scale-[1.02]"
                      >
                        <span>Open {msg.toolLink.name}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-1 px-1 text-[10px] text-slate-400">
                  <span className="font-mono">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {msg.sender === 'assistant' && (
                    <button
                      type="button"
                      onClick={() => handleCopyMessage(msg.id, msg.text)}
                      className="opacity-0 group-hover:opacity-100 hover:text-slate-600 dark:hover:text-slate-200 transition-opacity flex items-center gap-0.5"
                      title="Copy response"
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
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2.5 text-xs text-sky-600 dark:text-sky-400 p-3 rounded-2xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/30 w-fit">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                </span>
                <span className="font-medium">Thinking with {selectedModel}...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips (when only greeting exists) */}
          {messages.length === 1 && (
            <div className="px-5 py-2.5 bg-slate-50/40 dark:bg-slate-950/40 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-[11px] font-semibold text-slate-400 shrink-0">Try:</span>
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(prompt)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-sky-400 hover:text-sky-500 transition-all shrink-0 shadow-2xs"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Floating Chat Input Bar */}
          <div className="p-3.5 sm:p-4 border-t border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 flex items-center gap-2.5">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask anything about tools or describe your task..."
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
            />

            <Button
              size="md"
              onClick={() => handleSend()}
              disabled={!inputText.trim() || isLoading}
              isLoading={isLoading}
              className="rounded-xl px-4 shrink-0 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 shadow-md shadow-sky-500/20"
              icon={<Send className="w-4 h-4" />}
            >
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
