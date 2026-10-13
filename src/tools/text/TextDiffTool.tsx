import React, { useState } from 'react';
import DiffMatchPatch from 'diff-match-patch';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Dropzone } from '../../components/common/Dropzone';
import { useStorage } from '../../context/StorageContext';
import { ArrowLeftRight, Check, Copy, FileText, Trash2, Eye } from 'lucide-react';

export const TextDiffTool: React.FC = () => {
  const [originalText, setOriginalText] = useState<string>(
    'The quick brown fox jumps over the lazy dog.\nAll utilities in one place.'
  );
  const [modifiedText, setModifiedText] = useState<string>(
    'The fast brown fox leaps over the sleepy dog.\nAll utilities in one private place.'
  );
  const [viewMode, setViewMode] = useState<'unified' | 'split'>('unified');
  const [copied, setCopied] = useState<boolean>(false);

  const { recordToolUsage } = useStorage();

  const computeDiff = () => {
    const dmp = new DiffMatchPatch();
    const diffs = dmp.diff_main(originalText, modifiedText);
    dmp.diff_cleanupSemantic(diffs);

    let additions = 0;
    let deletions = 0;
    let equals = 0;

    for (const [op, text] of diffs) {
      if (op === 1) additions += text.length;
      else if (op === -1) deletions += text.length;
      else equals += text.length;
    }

    return { diffs, additions, deletions, equals };
  };

  const { diffs, additions, deletions, equals } = computeDiff();

  const handleSwap = () => {
    const temp = originalText;
    setOriginalText(modifiedText);
    setModifiedText(temp);
  };

  const handleClear = () => {
    setOriginalText('');
    setModifiedText('');
  };

  const handleCopySummary = () => {
    let report = `Diff Summary:\n+${additions} chars added\n-${deletions} chars removed\n\n`;
    for (const [op, text] of diffs) {
      if (op === 1) report += `[+ ${text} +]`;
      else if (op === -1) report += `[- ${text} -]`;
      else report += text;
    }
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    recordToolUsage('text-diff-viewer', 'Text Difference Viewer');
  };

  const handleFileOriginal = (files: File[]) => {
    if (files.length > 0) {
      const reader = new FileReader();
      reader.onload = (e) => setOriginalText((e.target?.result as string) || '');
      reader.readAsText(files[0]);
    }
  };

  const handleFileModified = (files: File[]) => {
    if (files.length > 0) {
      const reader = new FileReader();
      reader.onload = (e) => setModifiedText((e.target?.result as string) || '');
      reader.readAsText(files[0]);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Text & Code Difference Viewer</h1>
          <p className="text-sm text-foreground-muted">
            Inspect side-by-side and unified differences with character-level additions and deletions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleSwap} variant="secondary" size="sm" className="gap-1.5">
            <ArrowLeftRight className="w-3.5 h-3.5" /> Swap
          </Button>
          <Button onClick={handleClear} variant="ghost" size="sm" className="gap-1.5 text-red-500 hover:text-red-600">
            <Trash2 className="w-3.5 h-3.5" /> Clear
          </Button>
        </div>
      </div>

      {/* Input Panes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Original Version
            </label>
            <label className="text-xs text-primary hover:underline cursor-pointer">
              Upload file
              <input
                type="file"
                className="hidden"
                onChange={(e) => e.target.files && handleFileOriginal(Array.from(e.target.files))}
              />
            </label>
          </div>
          <textarea
            value={originalText}
            onChange={(e) => setOriginalText(e.target.value)}
            placeholder="Paste original text here..."
            rows={8}
            className="w-full rounded-lg border border-border bg-surface-raised p-3 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <div className="text-right text-[11px] text-foreground-muted">
            {originalText.length.toLocaleString()} chars
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Modified Version
            </label>
            <label className="text-xs text-primary hover:underline cursor-pointer">
              Upload file
              <input
                type="file"
                className="hidden"
                onChange={(e) => e.target.files && handleFileModified(Array.from(e.target.files))}
              />
            </label>
          </div>
          <textarea
            value={modifiedText}
            onChange={(e) => setModifiedText(e.target.value)}
            placeholder="Paste modified text here..."
            rows={8}
            className="w-full rounded-lg border border-border bg-surface-raised p-3 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <div className="text-right text-[11px] text-foreground-muted">
            {modifiedText.length.toLocaleString()} chars
          </div>
        </Card>
      </div>

      {/* Visual Difference Output */}
      <Card className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" /> Visual Comparison
            </h3>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                +{additions} added
              </span>
              <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold">
                -{deletions} removed
              </span>
              <span className="text-foreground-muted">{equals} unchanged</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={handleCopySummary} variant="secondary" size="sm" className="gap-1.5">
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy Diff'}
            </Button>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface-raised border border-border font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap">
          {diffs.map(([op, text], index) => {
            if (op === 1) {
              return (
                <mark
                  key={index}
                  className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold px-0.5 rounded border-b-2 border-emerald-500"
                >
                  {text}
                </mark>
              );
            }
            if (op === -1) {
              return (
                <del
                  key={index}
                  className="bg-rose-500/20 text-rose-700 dark:text-rose-300 line-through px-0.5 rounded opacity-80"
                >
                  {text}
                </del>
              );
            }
            return <span key={index} className="text-foreground">{text}</span>;
          })}
        </div>
      </Card>
    </div>
  );
};
