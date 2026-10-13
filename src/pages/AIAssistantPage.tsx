import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Send,
  Trash2,
  ArrowRight,
  Key,
  Cpu,
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
  clearEffectiveApiKey,
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
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    return localStorage.getItem('toolhub_gemini_model') || DEFAULT_GEMINI_MODEL;
  });
  const [showKeyPopover, setShowKeyPopover] = useState<boolean>(false);
  const [keyInputValue, setKeyInputValue] = useState<string>('');
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    localStorage.setItem('toolhub_gemini_model', modelId);
  };

  const handleSaveKey = (keyToSave: string, continuePrompt?: string) => {
    const trimmed = keyToSave.trim();
    if (!trimmed) return;
    saveEffectiveApiKey(trimmed);
    setApiKey(trimmed);
    setKeyInputValue('');
    setInlineKeyInput('');
    setShowKeyPopover(false);

    const promptToSend = continuePrompt || pendingPrompt;
    setPendingPrompt(null);
    if (promptToSend) {
      sendMessage(promptToSend, trimmed);
    }
  };

  const handleClearKey = () => {
    clearEffectiveApiKey();
    setApiKey('');
    setKeyInputValue('');
    setShowKeyPopover(false);
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

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    const currentKey = apiKey || getEffectiveApiKey();

    if (!currentKey) {
      setPendingPrompt(text);
      setMessages((prev) => [
        ...prev,
        {
          id: `prompt-key-${Date.now()}`,
          sender: 'assistant',
          text: 'Google Gemini API key is required to use this model. Please provide your Google API key below:',
          timestamp: Date.now(),
          isKeyPrompt: true,
        },
      ]);
      return;
    }

    await sendMessage(text, currentKey);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      <Breadcrumbs items={[{ label: 'AI Assistant' }]} />

      {/* Main Chat Container */}
      <Card className="flex flex-col h-[700px] max-h-[85vh] overflow-hidden border border-border shadow-xl">
        {/* Chat Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-surface-raised">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-contrast flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">AI Assistant</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Model Selector */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-surface text-xs text-foreground">
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

            {/* API Key Status / Toggle */}
            <button
              type="button"
              onClick={() => setShowKeyPopover((prev) => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                apiKey
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>{apiKey ? 'API Connected' : 'Add API Key'}</span>
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
              className="p-2 rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface transition-colors"
              title="Clear Chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Key Popover Bar */}
        {showKeyPopover && (
          <div className="p-3 bg-surface border-b border-border space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-primary" /> Google Gemini API Key
              </span>
              {apiKey && (
                <button
                  type="button"
                  onClick={handleClearKey}
                  className="text-red-500 hover:underline text-[11px]"
                >
                  Remove Key
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="password"
                value={keyInputValue}
                onChange={(e) => setKeyInputValue(e.target.value)}
                placeholder={apiKey ? 'API Key active. Enter new key to update...' : 'Enter Google Gemini API key (AIzaSy...)'}
                className="w-full text-xs p-2 rounded-lg border border-border bg-surface-raised text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <Button
                size="sm"
                onClick={() => handleSaveKey(keyInputValue)}
                disabled={!keyInputValue.trim()}
              >
                Save
              </Button>
            </div>
          </div>
        )}

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-primary text-primary-contrast rounded-br-none shadow-sm'
                    : 'bg-surface-raised text-foreground rounded-bl-none border border-border'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>

                {/* Inline Key Prompt */}
                {msg.isKeyPrompt && (
                  <div className="mt-3 pt-2.5 border-t border-border space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="password"
                        value={inlineKeyInput}
                        onChange={(e) => setInlineKeyInput(e.target.value)}
                        placeholder="Paste Google Gemini API Key (AIzaSy...)"
                        className="w-full text-xs p-2 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleSaveKey(inlineKeyInput, pendingPrompt || undefined)}
                        disabled={!inlineKeyInput.trim()}
                      >
                        Connect
                      </Button>
                    </div>
                  </div>
                )}

                {/* Direct Tool Launch Pill */}
                {msg.toolLink && (
                  <div className="mt-3 pt-2.5 border-t border-border/60">
                    <button
                      type="button"
                      onClick={() => navigate(msg.toolLink!.path)}
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-primary hover:opacity-90 text-primary-contrast font-semibold text-xs shadow-sm transition-all"
                    >
                      <span>Open {msg.toolLink.name}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <span className="text-[10px] text-foreground-muted mt-1 px-1 font-mono">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-primary p-2">
              <span className="animate-spin">⚙️</span>
              <span>Thinking with {selectedModel}...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-border bg-surface-raised flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your question or request..."
            className="w-full text-xs sm:text-sm p-2.5 bg-transparent border-0 focus:outline-none text-foreground placeholder:text-foreground-muted"
          />

          <Button
            onClick={handleSend}
            disabled={!inputText.trim() || isLoading}
            isLoading={isLoading}
            className="gap-2 shrink-0"
          >
            <Send className="w-4 h-4" />
            <span>Send</span>
          </Button>
        </div>
      </Card>
    </div>
  );
};
