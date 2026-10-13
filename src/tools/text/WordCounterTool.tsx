import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useStorage } from '../../context/StorageContext';
import { FileText, Copy, Trash2, Check, Clock, Type } from 'lucide-react';

export const WordCounterTool: React.FC = () => {
  const [text, setText] = useState<string>(
    'ToolHub is a unified, privacy-first online utility platform. Every tool processes data locally in your browser memory without uploading your private files.'
  );
  const [copied, setCopied] = useState<boolean>(false);
  const { recordToolUsage } = useStorage();

  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  const charactersWithSpaces = text.length;
  const charactersNoSpaces = text.replace(/\s/g, '').length;
  const sentences = trimmed ? (text.match(/[^.!?]+[.!?]+(\s|$)/g) || []).length || (words > 0 ? 1 : 0) : 0;
  const paragraphs = trimmed ? text.split(/\n+/).filter((p) => p.trim().length > 0).length : 0;

  // Reading time (approx 200 words per minute)
  const readingTimeMinutes = Math.ceil(words / 200);
  // Speaking time (approx 130 words per minute)
  const speakingTimeMinutes = Math.ceil(words / 130);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toUppercase = () => setText((prev) => prev.toUpperCase());
  const toLowercase = () => setText((prev) => prev.toLowerCase());
  const toTitleCase = () =>
    setText((prev) =>
      prev.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())
    );

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <Card className="p-3.5 text-center">
          <span className="text-[11px] font-semibold uppercase text-slate-400">Words</span>
          <p className="text-2xl font-extrabold text-sky-600 dark:text-sky-400 mt-0.5">{words}</p>
        </Card>
        <Card className="p-3.5 text-center">
          <span className="text-[11px] font-semibold uppercase text-slate-400">Characters</span>
          <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">{charactersWithSpaces}</p>
        </Card>
        <Card className="p-3.5 text-center">
          <span className="text-[11px] font-semibold uppercase text-slate-400">No Spaces</span>
          <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">{charactersNoSpaces}</p>
        </Card>
        <Card className="p-3.5 text-center">
          <span className="text-[11px] font-semibold uppercase text-slate-400">Sentences</span>
          <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">{sentences}</p>
        </Card>
        <Card className="p-3.5 text-center">
          <span className="text-[11px] font-semibold uppercase text-slate-400">Paragraphs</span>
          <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">{paragraphs}</p>
        </Card>
        <Card className="p-3.5 text-center">
          <span className="text-[11px] font-semibold uppercase text-slate-400">Reading Time</span>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">~{readingTimeMinutes}m</p>
        </Card>
      </div>

      {/* Editor & Actions */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-1.5">
            <Button size="sm" variant="outline" onClick={toUppercase}>
              UPPERCASE
            </Button>
            <Button size="sm" variant="outline" onClick={toLowercase}>
              lowercase
            </Button>
            <Button size="sm" variant="outline" onClick={toTitleCase}>
              Title Case
            </Button>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
              icon={copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            >
              {copied ? 'Copied' : 'Copy'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setText('')}
              title="Clear text"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Start typing or paste text here to inspect live counts..."
          rows={12}
          className="w-full p-3 text-xs leading-relaxed bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-lg border-0 focus:outline-none resize-y"
        />
      </Card>
    </div>
  );
};
