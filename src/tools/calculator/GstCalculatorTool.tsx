import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useStorage } from '../../context/StorageContext';
import { Calculator, Copy, Check, FileSpreadsheet, ArrowRightLeft } from 'lucide-react';

export const GstCalculatorTool: React.FC = () => {
  const [amount, setAmount] = useState<number>(1000);
  const [gstRate, setGstRate] = useState<number>(18);
  const [calcType, setCalcType] = useState<'exclusive' | 'inclusive'>('exclusive');
  const [supplyType, setSupplyType] = useState<'intra' | 'inter'>('intra');
  const [copied, setCopied] = useState<boolean>(false);

  const { recordToolUsage } = useStorage();

  const standardRates = [0, 5, 12, 18, 28];

  const calculate = () => {
    const netOrGross = Math.max(0, amount);
    let netAmount = 0;
    let gstAmount = 0;
    let grossAmount = 0;

    if (calcType === 'exclusive') {
      // Amount is without GST (Exclusive)
      netAmount = netOrGross;
      gstAmount = (netAmount * gstRate) / 100;
      grossAmount = netAmount + gstAmount;
    } else {
      // Amount is with GST (Inclusive)
      grossAmount = netOrGross;
      netAmount = (grossAmount * 100) / (100 + gstRate);
      gstAmount = grossAmount - netAmount;
    }

    const cgst = supplyType === 'intra' ? gstAmount / 2 : 0;
    const sgst = supplyType === 'intra' ? gstAmount / 2 : 0;
    const igst = supplyType === 'inter' ? gstAmount : 0;

    return {
      netAmount,
      gstAmount,
      grossAmount,
      cgst,
      sgst,
      igst,
    };
  };

  const results = calculate();

  const handleCopySummary = () => {
    const summary = `GST Calculation Summary:
Amount: ₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
Mode: ${calcType === 'exclusive' ? 'Exclusive of GST' : 'Inclusive of GST'}
GST Rate: ${gstRate}%
Net Amount: ₹${results.netAmount.toFixed(2)}
Total GST: ₹${results.gstAmount.toFixed(2)}
${supplyType === 'intra' ? `CGST: ₹${results.cgst.toFixed(2)}\nSGST: ₹${results.sgst.toFixed(2)}` : `IGST: ₹${results.igst.toFixed(2)}`}
Total Gross: ₹${results.grossAmount.toFixed(2)}`;

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    recordToolUsage('calc-gst', 'GST Calculator');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-foreground">GST & Sales Tax Calculator</h1>
          <p className="text-sm text-foreground-muted">
            Calculate Goods and Services Tax (GST) with standard slabs (0%, 5%, 12%, 18%, 28%) and CGST/SGST/IGST breakdown.
          </p>
        </div>

        <div className="inline-flex rounded-lg border border-border p-1 bg-surface-raised self-start">
          <button
            onClick={() => setCalcType('exclusive')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              calcType === 'exclusive'
                ? 'bg-primary text-primary-contrast shadow-sm'
                : 'text-foreground-muted hover:text-foreground'
            }`}
          >
            Add GST (Exclusive)
          </button>
          <button
            onClick={() => setCalcType('inclusive')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              calcType === 'inclusive'
                ? 'bg-primary text-primary-contrast shadow-sm'
                : 'text-foreground-muted hover:text-foreground'
            }`}
          >
            Remove GST (Inclusive)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input Parameters */}
        <Card className="p-6 space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-2">
            <Calculator className="w-4 h-4 text-primary" /> Inputs
          </h2>

          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">
              {calcType === 'exclusive' ? 'Base Amount (₹)' : 'Total Gross Amount (₹)'}
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={amount || ''}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="w-full rounded-lg border border-border bg-surface-raised p-2.5 text-lg font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">GST Slab / Rate (%)</label>
            <div className="grid grid-cols-5 gap-2">
              {standardRates.map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setGstRate(rate)}
                  className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                    gstRate === rate
                      ? 'bg-primary text-primary-contrast border-primary shadow-sm'
                      : 'border-border bg-surface-raised text-foreground hover:border-primary/50'
                  }`}
                >
                  {rate}%
                </button>
              ))}
            </div>
            <div className="pt-2 flex items-center gap-2">
              <span className="text-xs text-foreground-muted">Custom Rate:</span>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={gstRate}
                onChange={(e) => setGstRate(parseFloat(e.target.value) || 0)}
                className="w-24 rounded-lg border border-border bg-surface-raised px-2.5 py-1 text-xs font-bold text-foreground focus:outline-none"
              />
              <span className="text-xs text-foreground-muted">%</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">Supply / Transaction Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSupplyType('intra')}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all text-left ${
                  supplyType === 'intra'
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'border-border bg-surface-raised text-foreground-muted'
                }`}
              >
                Intra-State (CGST + SGST)
              </button>
              <button
                type="button"
                onClick={() => setSupplyType('inter')}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all text-left ${
                  supplyType === 'inter'
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'border-border bg-surface-raised text-foreground-muted'
                }`}
              >
                Inter-State (IGST)
              </button>
            </div>
          </div>
        </Card>

        {/* Results & Tax Invoice Breakdown */}
        <Card className="p-6 space-y-5 bg-gradient-to-br from-surface via-surface to-primary/5">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> Tax Breakdown
            </h2>
            <Button onClick={handleCopySummary} variant="secondary" size="sm" className="gap-1.5">
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy Invoice Summary'}
            </Button>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-surface-raised border border-border flex items-center justify-between">
              <div>
                <p className="text-xs text-foreground-muted">Net Base Amount</p>
                <p className="text-2xl font-bold text-foreground">
                  ₹{results.netAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-foreground-muted">GST Rate</p>
                <p className="text-lg font-bold text-primary">{gstRate}%</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-raised border border-border flex items-center justify-between">
              <div>
                <p className="text-xs text-foreground-muted">Total Tax Amount (GST)</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  ₹{results.gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {supplyType === 'intra' ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-surface-raised border border-border">
                  <p className="text-xs text-foreground-muted">CGST ({gstRate / 2}%)</p>
                  <p className="text-base font-bold text-foreground">
                    ₹{results.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-surface-raised border border-border">
                  <p className="text-xs text-foreground-muted">SGST ({gstRate / 2}%)</p>
                  <p className="text-base font-bold text-foreground">
                    ₹{results.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-surface-raised border border-border">
                <p className="text-xs text-foreground-muted">IGST ({gstRate}%)</p>
                <p className="text-base font-bold text-foreground">
                  ₹{results.igst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            )}

            <div className="p-4 rounded-xl bg-primary text-primary-contrast flex items-center justify-between shadow-md">
              <div>
                <p className="text-xs font-semibold opacity-90">Total Gross Invoice Amount</p>
                <p className="text-3xl font-black">
                  ₹{results.grossAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
