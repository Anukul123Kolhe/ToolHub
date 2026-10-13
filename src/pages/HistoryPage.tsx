import React from 'react';
import { useNavigate } from 'react-router-dom';
import { History, Trash2, ArrowRight, ShieldCheck } from 'lucide-react';
import { useStorage } from '../context/StorageContext';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

export const HistoryPage: React.FC = () => {
  const { history, clearHistory } = useStorage();
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Breadcrumbs items={[{ label: 'Activity History' }]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Activity History
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Local session audit log of tools used and actions performed on this device
          </p>
        </div>

        {history.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearHistory} icon={<Trash2 className="w-4 h-4 text-rose-500" />}>
            Clear History
          </Button>
        )}
      </div>

      {/* Privacy Banner */}
      <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-800 dark:text-emerald-300">
        <ShieldCheck className="w-5 h-5 flex-shrink-0 text-emerald-600" />
        <span>
          <strong>Zero Server Tracking:</strong> This log is saved exclusively in your browser's private local storage. It is never transmitted across the network and can be cleared at any time.
        </span>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <History className="w-6 h-6" />
          </div>
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            No activity history recorded yet
          </h2>
          <p className="text-xs text-slate-500">
            When you process files or run tools, your recent actions will appear here for fast reference.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((record) => (
            <div
              key={record.id}
              onClick={() => navigate(`/tool/${record.toolId}`)}
              className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-500 dark:hover:border-sky-500 shadow-sm cursor-pointer transition-all"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {record.toolName}
                  </span>
                  <Badge variant="neutral" size="sm">
                    {record.category}
                  </Badge>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {record.summary}
                </p>
              </div>

              <div className="flex items-center gap-1 text-xs text-sky-600 dark:text-sky-400 font-semibold">
                <span>Rerun</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
