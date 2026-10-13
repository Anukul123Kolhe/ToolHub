import React, { useState } from 'react';
import {
  Sparkles,
  ArrowUpRight,
  Copy,
  Check,
  FileText,
  Image as ImageIcon,
  Calculator,
  Code,
  QrCode,
  Type,
  FileArchive,
  Wrench,
  CheckCircle2,
} from 'lucide-react';
import { TOOL_MAP } from '../../config/tools';
import { ToolCategory, ToolRegistryItem } from '../../types/tool';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: number;
  isKeyPrompt?: boolean;
}

interface ChatMessageItemProps {
  message: ChatMessage;
  onNavigateTool: (path: string) => void;
  onSaveKey?: (key: string) => void;
  onCopy: (id: string, text: string) => void;
  isCopied: boolean;
  onOpenSettings?: () => void;
}

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  pdf: FileText,
  image: ImageIcon,
  student: Calculator,
  text: Type,
  calculator: Calculator,
  qr: QrCode,
  developer: Code,
  productivity: CheckCircle2,
  media: FileArchive,
  career: Wrench,
  advanced: Sparkles,
};

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  onNavigateTool,
  onSaveKey,
  onCopy,
  isCopied,
  onOpenSettings,
}) => {
  const [inlineKey, setInlineKey] = useState('');
  const [copiedCodeBlockIdx, setCopiedCodeBlockIdx] = useState<number | null>(null);

  // Extract all tool IDs referenced in the text
  const extractReferencedTools = (text: string): ToolRegistryItem[] => {
    const regex = /\/tool\/([a-z0-9-]+)/gi;
    const matches = Array.from(text.matchAll(regex));
    const tools: ToolRegistryItem[] = [];
    const seenIds = new Set<string>();

    for (const match of matches) {
      const toolId = match[1].toLowerCase();
      if (!seenIds.has(toolId)) {
        seenIds.add(toolId);
        const found = TOOL_MAP.get(toolId);
        if (found) {
          tools.push(found);
        }
      }
    }
    return tools;
  };

  const referencedTools = extractReferencedTools(message.text);

  const handleCopyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeBlockIdx(idx);
    setTimeout(() => setCopiedCodeBlockIdx(null), 2000);
  };

  type FormattedPart =
    | { type: 'text'; content: string }
    | { type: 'code'; language: string; code: string; idx: number };

  // Render text with code blocks and markdown styling
  const renderFormattedText = (rawText: string) => {
    // Split by code blocks
    const codeBlockRegex = /```([a-z0-9_-]*)\n([\s\S]*?)```/gi;
    const parts: FormattedPart[] = [];
    let lastIndex = 0;
    let match;
    let blockIdx = 0;

    while ((match = codeBlockRegex.exec(rawText)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: rawText.substring(lastIndex, match.index),
        });
      }
      parts.push({
        type: 'code',
        language: match[1] || 'text',
        code: match[2].trim(),
        idx: blockIdx++,
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < rawText.length) {
      parts.push({
        type: 'text',
        content: rawText.substring(lastIndex),
      });
    }

    return (
      <div className="space-y-3">
        {parts.map((part, pIdx) => {
          if (part.type === 'code') {
            return (
              <div
                key={pIdx}
                className="my-3 rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950 font-mono text-xs shadow-md"
              >
                <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400">
                  <span className="uppercase font-semibold tracking-wider">{part.language}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(part.code, part.idx)}
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    {copiedCodeBlockIdx === part.idx ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3.5 overflow-x-auto text-slate-100 leading-relaxed whitespace-pre font-mono">
                  <code>{part.code}</code>
                </pre>
              </div>
            );
          }

          // Format paragraphs, bullet lists, and inline links
          const paragraphs = part.content.split('\n\n');
          return (
            <div key={pIdx} className="space-y-2.5">
              {paragraphs.map((para, paraIdx) => {
                const lines = para.split('\n');
                return (
                  <div key={paraIdx} className="space-y-1">
                    {lines.map((line, lIdx) => {
                      const trimmed = line.trim();
                      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
                        return (
                          <div key={lIdx} className="flex items-start gap-2 ml-1">
                            <span className="text-sky-500 font-bold shrink-0 mt-0.5">•</span>
                            <span className="leading-relaxed">{renderInlineMarkdown(trimmed.substring(2))}</span>
                          </div>
                        );
                      }
                      if (/^\d+\.\s/.test(trimmed)) {
                        const numMatch = trimmed.match(/^(\d+\.)\s(.*)/);
                        return (
                          <div key={lIdx} className="flex items-start gap-2 ml-1">
                            <span className="text-sky-500 font-semibold shrink-0 mt-0.5">{numMatch?.[1]}</span>
                            <span className="leading-relaxed">{renderInlineMarkdown(numMatch?.[2] || '')}</span>
                          </div>
                        );
                      }
                      return (
                        <p key={lIdx} className="leading-relaxed">
                          {renderInlineMarkdown(line)}
                        </p>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  const renderInlineMarkdown = (text: string) => {
    // Replace markdown links [Name](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(renderBoldAndCode(text.substring(lastIndex, match.index)));
      }
      const label = match[1];
      const url = match[2];
      parts.push(
        <button
          key={match.index}
          type="button"
          onClick={() => onNavigateTool(url)}
          className="text-sky-600 dark:text-sky-400 font-semibold hover:underline inline-flex items-center gap-0.5"
        >
          {label} <ArrowUpRight className="w-3 h-3" />
        </button>
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(renderBoldAndCode(text.substring(lastIndex)));
    }

    return parts;
  };

  const renderBoldAndCode = (segment: string) => {
    // Format `code` and **bold**
    const tokens = segment.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
    return tokens.map((token, i) => {
      if (token.startsWith('`') && token.endsWith('`')) {
        return (
          <code
            key={i}
            className="px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 font-mono text-[11px] text-slate-800 dark:text-slate-200 border border-slate-300/50 dark:border-slate-700/50"
          >
            {token.slice(1, -1)}
          </code>
        );
      }
      if (token.startsWith('**') && token.endsWith('**')) {
        return (
          <strong key={i} className="font-bold text-slate-900 dark:text-slate-100">
            {token.slice(2, -2)}
          </strong>
        );
      }
      return token;
    });
  };

  if (message.sender === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-tr-xs bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 leading-relaxed whitespace-pre-wrap">
          {message.text}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 text-xs sm:text-sm leading-relaxed group">
      <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sky-500 shrink-0 mt-0.5">
        <Sparkles className="w-3.5 h-3.5" />
      </div>

      <div className="flex-1 space-y-3 text-slate-800 dark:text-slate-200 max-w-full">
        {/* Formatted Text Content */}
        {renderFormattedText(message.text)}

        {/* ChatGPT / Gemini Style Connected Tool Cards */}
        {referencedTools.length > 0 && (
          <div className="pt-2 space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Connected ToolHub Utilities
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {referencedTools.map((tool) => {
                const IconComponent = CATEGORY_ICONS[tool.category] || Wrench;
                return (
                  <div
                    key={tool.id}
                    onClick={() => onNavigateTool(tool.path)}
                    className="group/card flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-sky-400/80 dark:hover:border-sky-500/80 transition-all cursor-pointer shadow-xs hover:shadow-md"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 border border-sky-200/50 dark:border-sky-800/50 group-hover/card:scale-105 transition-transform">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover/card:text-sky-500 transition-colors">
                          {tool.name}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {tool.shortDescription || tool.description}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 p-1 rounded-lg text-slate-400 group-hover/card:text-sky-500 group-hover/card:translate-x-0.5 transition-all">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Inline API Key Card if Prompted */}
        {message.isKeyPrompt && onSaveKey && (
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5 mt-2">
            <div className="flex items-center gap-2">
              <input
                type="password"
                value={inlineKey}
                onChange={(e) => setInlineKey(e.target.value)}
                placeholder="Paste Google Gemini API Key (AIzaSy...)"
                className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono"
              />
              <button
                type="button"
                onClick={() => onSaveKey(inlineKey)}
                disabled={!inlineKey.trim()}
                className="px-3.5 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold disabled:opacity-50 transition-opacity shrink-0 shadow-xs"
              >
                Connect
              </button>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Free key from Google AI Studio</span>
              {onOpenSettings && (
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="text-sky-500 hover:underline font-medium"
                >
                  Configure in Settings →
                </button>
              )}
            </div>
          </div>
        )}

        {/* Action Bar (Copy Message) */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => onCopy(message.id, message.text)}
            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-opacity flex items-center gap-1 text-[11px]"
            title="Copy response"
          >
            {isCopied ? (
              <>
                <Check className="w-3 h-3 text-emerald-500" />
                <span className="text-emerald-500 font-medium">Copied</span>
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
  );
};
