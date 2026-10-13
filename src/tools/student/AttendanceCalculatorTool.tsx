import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useStorage } from '../../context/StorageContext';
import { CalendarCheck, AlertTriangle, CheckCircle, Award } from 'lucide-react';

export const AttendanceCalculatorTool: React.FC = () => {
  const [attended, setAttended] = useState<number>(38);
  const [total, setTotal] = useState<number>(45);
  const [target, setTarget] = useState<number>(75);
  const { recordToolUsage } = useStorage();

  const currentPercent = total > 0 ? (attended / total) * 100 : 0;
  const isSafe = currentPercent >= target;

  // If safe: how many more classes can be skipped?
  // (attended) / (total + x) >= target/100  =>  x <= (attended * 100 / target) - total
  const safeSkips = isSafe
    ? Math.max(0, Math.floor((attended * 100) / target - total))
    : 0;

  // If unsafe: how many consecutive classes must be attended?
  // (attended + y) / (total + y) >= target/100  =>  y >= (target * total - 100 * attended) / (100 - target)
  const requiredClasses = !isSafe && target < 100
    ? Math.max(0, Math.ceil((target * total - 100 * attended) / (100 - target)))
    : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Classes Attended
            </label>
            <Input
              type="number"
              min="0"
              value={attended}
              onChange={(e) => setAttended(Math.max(0, Number(e.target.value)))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Total Classes Held
            </label>
            <Input
              type="number"
              min="1"
              value={total}
              onChange={(e) => setTotal(Math.max(1, Number(e.target.value)))}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            <span>Target Minimum Attendance</span>
            <span className="font-mono text-sky-600 text-sm font-bold">{target}%</span>
          </div>
          <input
            type="range"
            min="50"
            max="95"
            value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-600"
          />
          <div className="flex gap-2 mt-2">
            {[75, 80, 85].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setTarget(preset)}
                className={`text-[10px] px-2 py-0.5 rounded border ${
                  target === preset
                    ? 'bg-sky-600 text-white border-sky-600'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
              >
                {preset}% Threshold
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Result Card */}
      <Card className={`p-6 border-2 ${isSafe ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20' : 'border-rose-500 bg-rose-50/30 dark:bg-rose-950/20'}`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              {isSafe ? (
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-500" />
              )}
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Current Attendance
              </span>
            </div>
            <p className="text-4xl font-extrabold text-slate-900 dark:text-slate-100 mt-1 font-mono">
              {currentPercent.toFixed(1)}%
            </p>
          </div>

          <div className="text-left sm:text-right">
            {isSafe ? (
              <div className="space-y-1">
                <span className="inline-block px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                  Safe Zone
                </span>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  You can safely skip <span className="text-emerald-600 dark:text-emerald-400 text-base">{safeSkips}</span> upcoming classes!
                </p>
                <p className="text-[11px] text-slate-500">
                  Skipping {safeSkips} classes keeps your attendance at or above {target}%.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <span className="inline-block px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300 text-xs font-bold">
                  Shortage Warning
                </span>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  You must attend the next <span className="text-rose-600 dark:text-rose-400 text-base">{requiredClasses}</span> classes in a row!
                </p>
                <p className="text-[11px] text-slate-500">
                  Attending {requiredClasses} consecutive classes will raise you to {target}%.
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
