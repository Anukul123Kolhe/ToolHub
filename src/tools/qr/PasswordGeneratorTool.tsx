import React, { useState, useEffect } from 'react';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { generateSecurePassword } from '../../utils/crypto';
import { useStorage } from '../../context/StorageContext';
import { Key, Copy, Check, RefreshCw, ShieldCheck } from 'lucide-react';

export const PasswordGeneratorTool: React.FC = () => {
  const [password, setPassword] = useState<string>('');
  const [length, setLength] = useState<number>(18);
  const [includeUppercase, setIncludeUppercase] = useState<boolean>(true);
  const [includeLowercase, setIncludeLowercase] = useState<boolean>(true);
  const [includeNumbers, setIncludeNumbers] = useState<boolean>(true);
  const [includeSymbols, setIncludeSymbols] = useState<boolean>(true);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const { recordToolUsage } = useStorage();

  const generate = () => {
    const pw = generateSecurePassword({
      length,
      includeUppercase,
      includeLowercase,
      includeNumbers,
      includeSymbols,
      excludeAmbiguous,
    });
    setPassword(pw);
  };

  useEffect(() => {
    generate();
  }, [length, includeUppercase, includeLowercase, includeNumbers, includeSymbols, excludeAmbiguous]);

  const handleCopy = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    recordToolUsage('password-generator', `Generated secure password (${length} chars)`);
  };

  // Calculate entropy score
  let charsetSize = 0;
  if (includeUppercase) charsetSize += 26;
  if (includeLowercase) charsetSize += 26;
  if (includeNumbers) charsetSize += 10;
  if (includeSymbols) charsetSize += 30;

  const entropy = Math.round(length * (charsetSize > 0 ? Math.log2(charsetSize) : 0));
  const strength =
    entropy > 80 ? 'Very Strong' : entropy > 60 ? 'Strong' : entropy > 40 ? 'Moderate' : 'Weak';
  const strengthColor =
    entropy > 80
      ? 'bg-emerald-500'
      : entropy > 60
      ? 'bg-sky-500'
      : entropy > 40
      ? 'bg-amber-500'
      : 'bg-rose-500';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Generated Password Box */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <span className="font-mono text-lg font-bold text-slate-900 dark:text-slate-100 tracking-wider break-all select-all">
            {password}
          </span>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={generate}
              className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="Generate new password"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <Button
              size="sm"
              onClick={handleCopy}
              icon={copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            >
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>

        {/* Strength Indicator */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Security Entropy: {entropy} bits</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">{strength}</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${strengthColor} transition-all duration-300`}
              style={{ width: `${Math.min(100, (entropy / 90) * 100)}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Configuration Controls */}
      <Card className="p-6 space-y-5">
        <div>
          <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            <span>Password Length</span>
            <span className="font-mono text-sky-600 text-sm font-bold">{length} characters</span>
          </div>
          <input
            type="range"
            min="8"
            max="48"
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-600"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeUppercase}
              onChange={(e) => setIncludeUppercase(e.target.checked)}
              className="rounded text-sky-600 focus:ring-sky-500"
            />
            <span>Uppercase Letters (A-Z)</span>
          </label>

          <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeLowercase}
              onChange={(e) => setIncludeLowercase(e.target.checked)}
              className="rounded text-sky-600 focus:ring-sky-500"
            />
            <span>Lowercase Letters (a-z)</span>
          </label>

          <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeNumbers}
              onChange={(e) => setIncludeNumbers(e.target.checked)}
              className="rounded text-sky-600 focus:ring-sky-500"
            />
            <span>Numbers (0-9)</span>
          </label>

          <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeSymbols}
              onChange={(e) => setIncludeSymbols(e.target.checked)}
              className="rounded text-sky-600 focus:ring-sky-500"
            />
            <span>Symbols (!@#$%^&*)</span>
          </label>
        </div>

        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
          <ShieldCheck className="w-4 h-4 flex-shrink-0" />
          <span>
            Generated client-side using W3C Web Cryptography API (<code className="font-mono">crypto.getRandomValues</code>). Never sent to a server.
          </span>
        </div>
      </Card>
    </div>
  );
};
