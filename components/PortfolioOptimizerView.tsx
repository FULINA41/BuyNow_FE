'use client';

import { useState, useMemo } from 'react';
import { OptimizeResponse,InvestmentMode } from '@/lib/types';
import { fetchOptimizedPortfolio } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const CHART_COLORS = [
  '#2563eb', '#7c3aed', '#db2777', '#ea580c',
  '#16a34a', '#0891b2', '#4f46e5', '#c026d3',
  '#d97706', '#059669', '#6366f1', '#e11d48',
  '#f59e0b', '#84cc16', '#06b6d4', '#d946ef',
];

function PortfolioResults({ result }: { result: OptimizeResponse }) {
  const pieData = useMemo(() => {
    const significant = Object.entries(result.weights)
      .filter(([, w]) => w >= 0.01)
      .sort(([, a], [, b]) => b - a);

    const othersWeight = Object.values(result.weights)
      .filter((w) => w < 0.01)
      .reduce((sum, w) => sum + w, 0);

    const data = significant.map(([name, value]) => ({
      name,
      value: parseFloat((value * 100).toFixed(2)),
    }));

    if (othersWeight > 0) {
      data.push({ name: 'Others', value: parseFloat((othersWeight * 100).toFixed(2)) });
    }

    return data;
  }, [result.weights]);

  const returnPositive = result.expected_return >= 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                Expected Annual Return
              </p>
              <p className={`text-3xl font-bold tabular-nums ${returnPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                {returnPositive ? '+' : ''}{(result.expected_return * 100).toFixed(2)}%
              </p>
            </div>
            <div className="rounded-lg border p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                Annual Volatility
              </p>
              <p className="text-3xl font-bold tabular-nums text-foreground">
                {(result.volatility * 100).toFixed(2)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">Portfolio risk (σ)</p>
            </div>
            <div className="rounded-lg border p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                Sharpe Ratio
              </p>
              <p className={`text-3xl font-bold tabular-nums ${result.sharpe_ratio >= 1 ? 'text-emerald-600' : result.sharpe_ratio >= 0.5 ? 'text-foreground' : 'text-red-500'}`}>
                {result.sharpe_ratio.toFixed(3)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Risk-adjusted return</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Allocation Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={110}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, value }) => `${name} ${value}%`}
                    labelLine={false}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value}%`, 'Weight']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3 flex flex-col justify-center">
              {Object.entries(result.weights)
                .sort(([, a], [, b]) => b - a)
                .map(([ticker, weight], i) => (
                  <div key={ticker} className="flex items-center gap-3">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                    <span className="w-14 text-sm font-medium text-foreground">{ticker}</span>
                    <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(weight * 100).toFixed(1)}%`,
                          backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                        }}
                      />
                    </div>
                    <span className="w-16 text-sm tabular-nums text-muted-foreground text-right">
                      {(weight * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PortfolioOptimizerView() {
  const [tickers, setTickers] = useState<string[]>([]);
  const [tickerInput, setTickerInput] = useState('');
  const [lookbackYears, setLookbackYears] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OptimizeResponse | null>(null);

  const addTicker = () => {
    // 1. 处理输入：支持逗号、空格或换行符分隔的多个代码
    const inputParts = tickerInput.toUpperCase().split(/[,，\s]+/).map(s => s.trim()).filter(Boolean);
    
    if (inputParts.length === 0) return;

    setTickers((prev) => {
        // 2. 彻底防范嵌套：先用 flat() 拉平旧数组，再与新输入的代码合并
        const currentTickers = prev.flat();
        
        // 3. 找出重复项，用于精准提示
        const duplicates = inputParts.filter(t => currentTickers.includes(t));
        if (duplicates.length > 0) {
            setError(`${duplicates.join(', ')} already in the list`);
        } else {
            setError(null);
        }

        // 4. 合并并去重，确保返回的永远是干净的一维字符串数组
        const combined = [...currentTickers, ...inputParts];
        return Array.from(new Set(combined));
    });

    setTickerInput('');
};

  const removeTicker = (ticker: string) => {
    setTickers((prev) => prev.filter((t) => t !== ticker));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTicker();
    }
  };

  const handleOptimize = async () => {
    if (tickers.length < 2) {
      setError('Add at least 2 tickers to optimize');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchOptimizedPortfolio({ tickers, lookback_years: lookbackYears });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Optimization failed, please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 relative z-20">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="outline" size="sm" className="gap-1.5">
                <ArrowLeft size={14} />
                Back to Home Page
              </Button>
            </Link>
            <CardTitle>Portfolio Optimizer</CardTitle>
            <div className="w-[85px]" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
            <Input
            type="text"
            value={tickerInput.toUpperCase()} // 实时显示大写，符合美股习惯
            onChange={(e) => setTickerInput(e.target.value.toUpperCase().trim())}
            onKeyDown={handleKeyDown}
            placeholder="Enter ticker (e.g. AAPL)"
            className="flex-1"
          />
              <Button
                onClick={addTicker}
                variant="outline"
              >
                Add Ticker
              </Button>
            </div>

            {tickers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tickers.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-md border bg-muted px-2.5 py-1 text-sm font-medium text-foreground"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => removeTicker(t)}
                      className="ml-1 text-muted-foreground hover:text-foreground"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div>
              <Label className="mb-2 block">
                Historical Lookback (Years): {lookbackYears}
              </Label>
              <Slider
                min={1}
                max={10}
                value={[lookbackYears]}
                onValueChange={(val) => setLookbackYears(val[0])}
                className={cn(
                  "w-[60%]",
                  "[&>.relative>.absolute]:bg-black/60",
                  "[&_[role=slider]]:bg-gray-300 [&_[role=slider]]:border-black",
                  "[&>.relative]:bg-black-100"
                )}
              />
            </div>

            <Button
              onClick={handleOptimize}
              disabled={loading || tickers.length < 2}
              className="w-full relative z-30 hover:bg-white/60 active:text-white"
            >
              {loading ? 'Optimizing…' : 'Run Optimization'}
            </Button>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {result && <PortfolioResults result={result} />}
    </div>
  );
}
