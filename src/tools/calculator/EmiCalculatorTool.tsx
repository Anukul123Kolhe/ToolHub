import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useStorage } from '../../context/StorageContext';
import { CreditCard, PieChart, Calendar, RefreshCw } from 'lucide-react';

export const EmiCalculatorTool: React.FC = () => {
  const [loanAmount, setLoanAmount] = useState<number>(1000000); // 10 Lakhs
  const [interestRate, setInterestRate] = useState<number>(8.5); // 8.5%
  const [tenureYears, setTenureYears] = useState<number>(5); // 5 Years
  const { recordToolUsage } = useStorage();

  const tenureMonths = tenureYears * 12;
  const monthlyRate = interestRate / 12 / 100;

  // EMI formula: [P * r * (1+r)^n] / [(1+r)^n - 1]
  const emi =
    monthlyRate > 0 && tenureMonths > 0
      ? Math.round(
          (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
            (Math.pow(1 + monthlyRate, tenureMonths) - 1)
        )
      : Math.round(loanAmount / (tenureMonths || 1));

  const totalPayment = emi * tenureMonths;
  const totalInterest = Math.max(0, totalPayment - loanAmount);
  const principalPercent = totalPayment > 0 ? Math.round((loanAmount / totalPayment) * 100) : 100;
  const interestPercent = 100 - principalPercent;

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      {/* Input Controls */}
      <Card className="p-6 md:col-span-7 space-y-6">
        <div>
          <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            <span>Loan Amount</span>
            <span className="font-mono text-sky-600 text-sm font-bold">
              ₹ {loanAmount.toLocaleString()}
            </span>
          </div>
          <input
            type="range"
            min="10000"
            max="10000000"
            step="10000"
            value={loanAmount}
            onChange={(e) => setLoanAmount(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-600"
          />
          <div className="flex gap-2 mt-2">
            {[100000, 500000, 1000000, 2500000, 5000000].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setLoanAmount(val)}
                className="text-[10px] px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              >
                ₹ {(val / 100000).toFixed(0)}L
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            <span>Interest Rate (% per annum)</span>
            <span className="font-mono text-sky-600 text-sm font-bold">{interestRate}%</span>
          </div>
          <input
            type="range"
            min="1"
            max="25"
            step="0.1"
            value={interestRate}
            onChange={(e) => setInterestRate(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-600"
          />
        </div>

        <div>
          <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            <span>Loan Tenure (Years)</span>
            <span className="font-mono text-sky-600 text-sm font-bold">
              {tenureYears} Years ({tenureMonths} Months)
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="30"
            value={tenureYears}
            onChange={(e) => setTenureYears(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-600"
          />
        </div>
      </Card>

      {/* Results Overview */}
      <Card className="p-6 md:col-span-5 space-y-6 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/60 text-center">
            <span className="text-xs uppercase tracking-wider text-sky-600 dark:text-sky-400 font-semibold">
              Monthly Loan EMI
            </span>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-1 font-mono">
              ₹ {emi.toLocaleString()}
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Principal Amount</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                ₹ {loanAmount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Total Interest Payable</span>
              <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">
                ₹ {totalInterest.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-xs py-1 font-bold">
              <span className="text-slate-700 dark:text-slate-300">Total Payment</span>
              <span className="font-mono text-slate-900 dark:text-slate-100">
                ₹ {totalPayment.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Breakdown Bar */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Principal: {principalPercent}%</span>
              <span>Interest: {interestPercent}%</span>
            </div>
            <div className="w-full h-3 bg-amber-500 rounded-full overflow-hidden flex">
              <div
                className="bg-sky-500 h-full transition-all duration-300"
                style={{ width: `${principalPercent}%` }}
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
