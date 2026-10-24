import React from 'react';
import { ShieldCheck, Lock, EyeOff, ServerOff, Cpu, CheckCircle } from 'lucide-react';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Breadcrumbs items={[{ label: 'Privacy Architecture' }]} />

      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Zero-Knowledge Architecture</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Privacy Policy & Security Design
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          ToolHub was engineered from the ground up to solve the privacy epidemic of modern online utility sites.
          Here is exactly how your files and data are handled.
        </p>
      </div>

      {/* 4 Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
            <ServerOff className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
            Zero File Uploads
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Every document, photograph, and video you select is read directly into your device's browser memory (RAM). At no point are your file contents uploaded to any cloud server or third-party storage.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5">
          <div className="w-9 h-9 rounded-xl bg-accent-500/10 dark:bg-accent-500/20 flex items-center justify-center text-accent-600 dark:text-accent-400">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
            In-Browser WebAssembly & Web Workers
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Heavy image compression, PDF merging, and OCR text extraction execute locally inside sandboxed browser threads. This ensures maximum execution speed without network latency.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
            CSPRNG Cryptography
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            All generated passwords and UUIDs utilize the W3C Web Crypto API (<code className="font-mono text-xs">crypto.getRandomValues</code>). Passwords are never sent or logged anywhere.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-600">
            <EyeOff className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
            AI Assistant Data Boundary
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            The AI task orchestrator receives only non-sensitive tool schemas and parameters (e.g. dimensions, target KB). It never receives your raw binary files or personal photos.
          </p>
        </div>
      </div>

      {/* Technical Verification Guide */}
      <div className="p-6 rounded-2xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
          How to Independently Verify Our Claims
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          You do not need to take our word for it. You can inspect the network activity directly using your browser's Developer Tools:
        </p>
        <ol className="list-decimal list-inside space-y-2 text-xs text-slate-600 dark:text-slate-300">
          <li>Press <kbd className="font-mono px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border">F12</kbd> to open Developer Tools.</li>
          <li>Click the <strong>Network</strong> tab.</li>
          <li>Drop a 5MB image or PDF into any of our tools (e.g., Image Compressor or PDF Merge).</li>
          <li>Observe the Network log: <strong>zero outbound POST/PUT requests</strong> transmitting your file bytes.</li>
        </ol>
      </div>
    </div>
  );
};
