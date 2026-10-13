import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Send,
  X,
  Key,
  Trash2,
  ArrowRight,
  AlertCircle,
  Check,
  Cpu,
} from 'lucide-react';
import { Button } from '../common/Button';
import {
  callGeminiApi,
  AVAILABLE_GEMINI_MODELS,
  DEFAULT_GEMINI_MODEL,
  getEffectiveApiKey,
  saveEffectiveApiKey,
  clearEffectiveApiKey,
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
      text: "Hello! I am your ToolHub AI Assistant powered by Google Gemini. Ask me anything about our 140+ tools, image processing, PDF conversions, code utilities, or calculations.",
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
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

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

    // If there was a pending prompt or inline prompt, send it now!
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
      // Fallback to local resolver if API fails
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
      // Prompt directly for the key inline in the chat
      setPendingPrompt(text);
      setMessages((prev) => [
        ...prev,
        {
          id: `prompt-key-${Date.now()}`,
          sender: 'assistant',
          text: 'To chat using Google Gemini AI, please provide your Google Gemini API key below:',
          timestamp: Date.now(),
          isKeyPrompt: true,
        },
      ]);
      return;
    }

    await sendMessage(text, currentKey);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-2 sm:p-4 text-center">
        {/* Backdrop */}
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        />

        {/* Chat Modal Window */}
        <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl text-left transition-all flex flex-col h-[650px] max-h-[92vh]">
          {/* Minimal Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-500 text-white flex items-center justify-center shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                AI Assistant
              </h3>
            </div>

            {/* Model Selector & Key Config Controls */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300">
                <Cpu className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                <select
                  value={selectedModel}
                  onChange={(e) => handleModelChange(e.target.value)}
                  className="bg-transparent border-none text-xs font-medium focus:outline-none cursor-pointer pr-1"
                >
                  {AVAILABLE_GEMINI_MODELS.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => setShowKeyPopover((prev) => !prev)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                  apiKey
                    ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                    : 'border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                }`}
                title="Google Gemini API Key"
              >
                <Key className="w-3 h-3" />
                <span>{apiKey ? 'API Key' : 'Add Key'}</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setMessages([
                    {
                      id: 'welcome-reset',
                      sender: 'assistant',
                      text: "Chat cleared. How can I help you?",
                      timestamp: Date.now(),
                    },
                  ])
                }
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Clear Chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Key Popover if user clicks 'Key' button */}
          {showKeyPopover && (
            <div className="p-3 bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-sky-500" /> Google Gemini API Key
                </span>
                {apiKey && (
                  <button
                    type="button"
                    onClick={handleClearKey}
                    className="text-rose-500 hover:underline text-[11px]"
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
                  placeholder={apiKey ? 'API Key is active. Paste new key to update...' : 'Enter Google Gemini API key (AIzaSy...)'}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
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

          {/* Chat Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-sky-600 text-white rounded-br-none shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {/* Inline Key Prompt inside Chat */}
                  {msg.isKeyPrompt && (
                    <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-700 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="password"
                          value={inlineKeyInput}
                          onChange={(e) => setInlineKeyInput(e.target.value)}
                          placeholder="Paste API Key (AIzaSy...)"
                          className="w-full text-xs p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
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

                  {/* Tool Action Button */}
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
                <span>Thinking with {selectedModel}...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask anything about tools..."
              className="w-full text-xs p-2 bg-transparent border-0 focus:outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />

            <Button
              size="sm"
              onClick={() => handleSend()}
              disabled={!inputText.trim()}
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
