'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { fetchGexCurve, fetchOptionRecommendation } from '@/lib/api';
import type {
  Aggressiveness,
  GEXResponse,
  MarginMode,
  RecommendationResponse,
} from '@/lib/types';

import GammaCurveChart from './option-lab/GammaCurveChart';
import FundamentalSummary from './option-lab/FundamentalSummary';
import RecommendationTable from './option-lab/RecommendationTable';


export default function OptionLabView() {
  const [tickerInput, setTickerInput] = useState('NVDA');
  const [marginMode, setMarginMode] = useState<MarginMode>('both');
  const [aggressiveness, setAggressiveness] = useState<Aggressiveness>('moderate');
  const [enableLLM, setEnableLLM] = useState(true);

  const [loadingGex, setLoadingGex] = useState(false);
  const [loadingRec, setLoadingRec] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [gex, setGex] = useState<GEXResponse | null>(null);
  const [rec, setRec] = useState<RecommendationResponse | null>(null);

  const handleRun = async () => {
    const ticker = tickerInput.trim().toUpperCase();
    if (!ticker) {
      setError('Enter a ticker first.');
      return;
    }
    setError(null);
    setLoadingGex(true);
    setLoadingRec(true);
    setGex(null);
    setRec(null);

    // Run GEX and recommendation in parallel — they share an upstream
    // chain cache on the backend, so the second call lands warm.
    const gexPromise = fetchGexCurve(ticker, {
      maxDaysToExpiry: 60,
      strikeWindowPct: 0.15,
    })
      .then((d) => setGex(d))
      .catch((e) => {
        const msg = e instanceof Error ? e.message : String(e);
        setError(`GEX failed: ${msg}`);
      })
      .finally(() => setLoadingGex(false));

    const recPromise = fetchOptionRecommendation(ticker, {
      margin_mode: marginMode,
      aggressiveness,
      enable_llm_filter: enableLLM,
    })
      .then((d) => setRec(d))
      .catch((e) => {
        const msg = e instanceof Error ? e.message : String(e);
        setError((prev) => prev ?? `Recommendation failed: ${msg}`);
      })
      .finally(() => setLoadingRec(false));

    await Promise.allSettled([gexPromise, recPromise]);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRun();
    }
  };

  const busy = loadingGex || loadingRec;

  return (
    <div className="w-full max-w-[1500px] mx-auto p-6 space-y-6 relative z-20">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="outline" size="sm" className="gap-1.5">
                <ArrowLeft size={14} />
                Back to Home
              </Button>
            </Link>
            <CardTitle>Option Lab — Sell-Put Recommender</CardTitle>
            <div className="w-[110px]" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-4">
            Three-layer defense: DCF valuation floor · dealer Gamma wall · grounded LLM risk
            filter. Data delayed up to 15 minutes (Alpaca free tier / yfinance fallback).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
            <div className="md:col-span-2">
              <Label htmlFor="ticker" className="mb-1.5 block">
                Ticker
              </Label>
              <Input
                id="ticker"
                value={tickerInput.toUpperCase()}
                onChange={(e) => setTickerInput(e.target.value.toUpperCase().trim())}
                onKeyDown={handleKey}
                placeholder="e.g. NVDA"
                className="font-mono"
              />
            </div>
            <div>
              <Label className="mb-1.5 block">Aggressiveness</Label>
              <Select
                value={aggressiveness}
                onValueChange={(v) => setAggressiveness(v as Aggressiveness)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conservative">Conservative (0.8σ · 6% OTM)</SelectItem>
                  <SelectItem value="moderate">Moderate (0.5σ · 4% OTM)</SelectItem>
                  <SelectItem value="aggressive">Aggressive (0.3σ · 2.5% OTM)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">Margin Mode</Label>
              <Select value={marginMode} onValueChange={(v) => setMarginMode(v as MarginMode)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash_secured">Cash Secured</SelectItem>
                  <SelectItem value="reg_t">Reg-T Margin</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">LLM Risk Filter</Label>
              <Select
                value={enableLLM ? 'on' : 'off'}
                onValueChange={(v) => setEnableLLM(v === 'on')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="on">Enabled (slower)</SelectItem>
                  <SelectItem value="off">Disabled (fast)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4">
            <Button
              onClick={handleRun}
              disabled={busy || !tickerInput.trim()}
              className="w-full hover:bg-white/60 active:text-white"
            >
              {busy ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {loadingGex && loadingRec
                    ? 'Loading GEX & recommendation…'
                    : loadingRec
                    ? 'Running recommendation…'
                    : 'Loading GEX…'}
                </span>
              ) : (
                'Analyze'
              )}
            </Button>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {(gex || rec) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-[1.4fr_1fr_1fr] gap-4">
          {/* Left: GEX curve */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Gamma Exposure</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingGex && !gex ? (
                <SkeletonBlock height={320} />
              ) : gex ? (
                <>
                  <GammaCurveChart
                    curve={gex.curve}
                    spot={gex.spot}
                    gammaWall={gex.gamma_wall}
                    supportWall={gex.support_wall}
                    putSupport={gex.put_support}
                  />
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <Stat label="Spot" value={`$${gex.spot.toFixed(2)}`} />
                    <Stat
                      label="Gamma Wall (global)"
                      value={gex.gamma_wall ? `$${gex.gamma_wall.toFixed(2)}` : '—'}
                      accent="text-emerald-400"
                    />
                    <Stat
                      label="Support Wall (≤ spot)"
                      value={gex.support_wall ? `$${gex.support_wall.toFixed(2)}` : '—'}
                      accent="text-purple-400"
                    />
                    <Stat
                      label="Put Support"
                      value={gex.put_support ? `$${gex.put_support.toFixed(2)}` : '—'}
                      accent="text-red-400"
                    />
                  </div>
                  <div className="mt-2 text-[10px] text-muted-foreground">
                    {gex.contracts_loaded} contracts · <SourceLabel source={gex.source} />
                  </div>
                </>
              ) : (
                <div className="h-[320px] flex items-center justify-center text-sm text-muted-foreground">
                  GEX unavailable.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Middle: fundamentals + LLM */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Fundamentals & Risk</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingRec && !rec ? (
                <SkeletonBlock height={320} />
              ) : rec ? (
                <FundamentalSummary
                  ticker={rec.ticker}
                  dcf={rec.dcf}
                  spot={rec.spot}
                  valuationFloor={rec.valuation_floor}
                  riskFilter={rec.risk_filter}
                />
              ) : (
                <div className="h-[320px] flex items-center justify-center text-sm text-muted-foreground">
                  Recommendation unavailable.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right: recommended contract */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Recommended Sell-Put</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingRec && !rec ? (
                <SkeletonBlock height={320} />
              ) : rec ? (
                <RecommendationTable data={rec} marginMode={marginMode} />
              ) : (
                <div className="h-[320px] flex items-center justify-center text-sm text-muted-foreground">
                  Recommendation unavailable.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}


function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded border border-border/60 p-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`tabular-nums font-bold ${accent ?? 'text-foreground'}`}>{value}</div>
    </div>
  );
}

function SourceLabel({ source }: { source: string }) {
  if (source === 'alpaca-volume-proxy') {
    return (
      <span
        className="text-amber-400 cursor-help"
        title="Alpaca's free indicative feed has no Open Interest. GEX uses daily volume as a proxy weight — wall positions remain reliable, but the absolute GEX value reflects intraday flow rather than accumulated positioning."
      >
        Alpaca · Volume-weighted ⓘ
      </span>
    );
  }
  if (source === 'alpaca') return <>Alpaca · OI-weighted</>;
  if (source === 'polygon') return <>Polygon · OI-weighted</>;
  if (source === 'yfinance') return <>yfinance</>;
  return <>source {source}</>;
}

function SkeletonBlock({ height }: { height: number }) {
  return (
    <div
      className="w-full rounded-md border border-border/40 bg-muted/10 animate-pulse"
      style={{ height }}
    />
  );
}
