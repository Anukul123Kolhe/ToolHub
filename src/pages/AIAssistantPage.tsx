import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Send,
  Trash2,
  ArrowRight,
  Cpu,
  Copy,
  Check,
  Settings,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
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
          text: 'Google Gemini API key is required to use this model. Please provide your Google API key below or configure it in Settings:',
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      <Breadcrumbs items={[{ label: 'AI Assistant' }]} />

      {/* Main Chat Container */}
      <Card className="flex flex-col h-[720px] max-h-[85vh] overflow-hidden border border-border shadow-2xl rounded-3xl bg-surface">
        {/* Top Gradient Accent Bar */}
        <div className="h-1 w-full bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500" />

        {/* Chat Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-surface-raised">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 ring-2 ring-white/20">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black tracking-tight text-foreground">ToolHub AI</h2>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  Gemini Active
                </span>
              </div>
              <p className="text-[11px] text-foreground-muted">Direct in-browser intelligent assistant</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Model Selector */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-border bg-surface text-xs text-foreground shadow-2xs">
              <Cpu className="w-3.5 h-3.5 text-primary shrink-0" />
              <select
                value={selectedModel}
                onChange={(e) => handleModelChange(e.target.value)}
                className="bg-transparent border-none text-xs font-semibold focus:outline-none cursor-pointer pr-1"
              >
                {AVAILABLE_GEMINI_MODELS.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Direct Link to Settings */}
            <button
              type="button"
              onClick={() => navigate('/settings')}
              className={`p-2 rounded-xl border transition-all ${
                apiKey
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                  : 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
              }`}
              title="Manage API Key in Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Clear Button */}
            <button
              type="button"
              onClick={() =>
                setMessages([
                  {
                    id: 'welcome-reset',
                    sender: 'assistant',
                    text: 'Chat cleared. How can I help you today?',
                    timestamp: Date.now(),
                  },
                ])
              }
              className="p-2 rounded-xl text-foreground-muted hover:text-foreground hover:bg-surface-raised transition-colors"
              title="Clear Chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} group`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed transition-all shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-tr-xs shadow-sky-500/10'
                    : 'bg-surface-raised text-foreground rounded-tl-xs border border-border'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>

                {/* Inline Key Prompt */}
                {msg.isKeyPrompt && (
                  <div className="mt-3 pt-3 border-t border-border space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="password"
                        value={inlineKeyInput}
                        onChange={(e) => setInlineKeyInput(e.target.value)}
                        placeholder="Paste Google Gemini API Key (AIzaSy...)"
                        className="w-full text-xs p-2 rounded-xl border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
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
                    <div className="flex items-center justify-between text-[11px] text-foreground-muted">
                      <span>Or configure permanently in Settings</span>
                      <button
                        type="button"
                        onClick={() => navigate('/settings')}
                        className="text-primary hover:underline font-semibold"
                      >
                        Open Settings →
                      </button>
                    </div>
                  </div>
                )}

                {/* Direct Tool Launch Pill */}
                {msg.toolLink && (
                  <div className="mt-3 pt-2.5 border-t border-border/60">
                    <button
                      type="button"
                      onClick={() => navigate(msg.toolLink!.path)}
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-semibold text-xs shadow-md shadow-sky-500/20 transition-all hover:scale-[1.02]"
                    >
                      <span>Open {msg.toolLink.name}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mt-1 px-1 text-[10px] text-foreground-muted">
                <span className="font-mono">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {msg.sender === 'assistant' && (
                  <button
                    type="button"
                    onClick={() => handleCopyMessage(msg.id, msg.text)}
                    className="opacity-0 group-hover:opacity-100 hover:text-foreground transition-opacity flex items-center gap-0.5"
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
            <div className="flex items-center gap-2.5 text-xs text-primary p-3 rounded-2xl bg-primary/5 border border-primary/20 w-fit">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="font-medium">Thinking with {selectedModel}...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        {messages.length === 1 && (
          <div className="px-5 py-2.5 bg-surface-raised border-t border-border flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-[11px] font-semibold text-foreground-muted shrink-0">Try:</span>
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(prompt)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-surface border border-border text-foreground hover:border-primary hover:text-primary transition-all shrink-0 shadow-2xs"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3.5 sm:p-4 border-t border-border bg-surface-raised flex items-center gap-2.5">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your question or request..."
            className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl bg-surface border border-border text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />

          <Button
            onClick={() => handleSend()}
            disabled={!inputText.trim() || isLoading}
            isLoading={isLoading}
            className="rounded-xl px-4 shrink-0 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 shadow-md shadow-sky-500/20"
            icon={<Send className="w-4 h-4" />}
          >
            <span>Send</span>
          </Button>
        </div>
      </Card>
    </div>
  );
};
