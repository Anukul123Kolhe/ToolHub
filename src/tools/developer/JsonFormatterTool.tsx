import React, { useState } from 'react';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { useStorage } from '../../context/StorageContext';
import { downloadText } from '../../utils/file';
import {
  Braces,
  Copy,
  Download,
  Check,
  AlertCircle,
  FileCode,
  Trash2,
  Minimize2,
} from 'lucide-react';

const SAMPLE_JSON = `{
  "name": "ToolHub",
  "version": "1.0.0",
  "privacy": "zero-upload",
  "tools": [
    {"id": "pdf-merge", "category": "pdf"},
    {"id": "image-compressor", "category": "image"},
    {"id": "sgpa-calculator", "category": "student"}
  ],
  "settings": {
    "offlineCapable": true,
    "maxFileSizeMb": 50
  }
}`;

export const JsonFormatterTool: React.FC = () => {
  const [input, setInput] = useState<string>(SAMPLE_JSON);
  const [indentSize, setIndentSize] = useState<number>(2);
  const [error, setError] = useState<{ message: string; line?: number } | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const { recordToolUsage } = useStorage();

  const handleFormat = (indent: number = indentSize) => {
    setError(null);
    try {
      const parsed = JSON.parse(input);
      const formatted = JSON.stringify(parsed, null, indent);
      setInput(formatted);
      recordToolUsage('dev-json-formatter', `Formatted JSON (${formatted.length} characters)`);
    } catch (err: any) {
      setError({ message: err.message || 'Invalid JSON syntax' });
    }
  };

  const handleMinify = () => {
    setError(null);
    try {
      const parsed = JSON.parse(input);
      const minified = JSON.stringify(parsed);
      setInput(minified);
      recordToolUsage('dev-json-formatter', `Minified JSON (${minified.length} characters)`);
    } catch (err: any) {
      setError({ message: err.message || 'Invalid JSON syntax' });
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(input);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    downloadText(input, 'formatted.json', 'application/json');
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <Card className="p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={() => handleFormat(indentSize)}
            icon={<Braces className="w-3.5 h-3.5" />}
          >
            Format JSON
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleMinify}
            icon={<Minimize2 className="w-3.5 h-3.5" />}
          >
            Minify / Compact
          </Button>

          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 pl-2">
            <span>Indent:</span>
            <select
              value={indentSize}
              onChange={(e) => {
                const s = Number(e.target.value);
                setIndentSize(s);
                handleFormat(s);
              }}
              className="p-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100"
            >
              <option value="2">2 Spaces</option>
              <option value="4">4 Spaces</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
            icon={copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          >
            {copied ? 'Copied!' : 'Copy'}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleDownload}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Download
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setInput('')}
            title="Clear editor"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </Card>

      {/* Syntax Error Banner */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error.message}</span>
        </div>
      )}

      {/* Code Editor Area */}
      <Card className="p-2 overflow-hidden">
        <textarea
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (error) setError(null);
          }}
          placeholder="Paste or type raw JSON here..."
          rows={18}
          className="w-full p-4 font-mono text-xs leading-relaxed bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-lg border-0 focus:outline-none resize-y"
          spellCheck={false}
        />
      </Card>
    </div>
  );
};
