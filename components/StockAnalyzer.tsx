/**
 * Stock Analyzer Main Component
 */
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AnalysisResponse, InvestmentMode, PredictModel, PredictResponse } from '@/lib/types';
import { analyzeStock, fetchLLMAnalysis, fetchPrediction } from '@/lib/api';
import SignalCard from './SignalCard';
import RiskBadge from './RiskBadge';
import BuyZones from './BuyZones';
import ValuationCard from './ValuationCard';
import AlphaSignalPanel from './AlphaSignalPanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { AnimatedCard } from '@/components/ui/animated-card';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import { SearchIcon, Github, PieChart } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function StockAnalyzer() {
  const [ticker, setTicker] = useState('MSFT');
  const [years, setYears] = useState(10);
  const [mode, setMode] = useState<InvestmentMode>('standard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [llmLoading, setLlmLoading] = useState(false);
  const [llmError, setLlmError] = useState<string | null>(null);
  const [llmResult, setLlmResult] = useState('');
  const [llmStreaming, setLlmStreaming] = useState(false);
  const [predictModel, setPredictModel] = useState<PredictModel>('lgbm');
  const [predictResult, setPredictResult] = useState<PredictResponse | null>(null);
  const [predictError, setPredictError] = useState<string | null>(null);
  const chunksRef = useRef<string[]>([]);
  const chunkIndexRef = useRef(0);
  const doneRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopAnimation = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startAnimation = useCallback(() => {
    stopAnimation();
    chunksRef.current = [];
    chunkIndexRef.current = 0;
    doneRef.current = false;
    setLlmResult('');
    setLlmStreaming(true);

    timerRef.current = setInterval(() => {
      const idx = chunkIndexRef.current;
      if (idx < chunksRef.current.length) {
        setLlmResult((prev) => prev + chunksRef.current[idx]);
        chunkIndexRef.current = idx + 1;
      } else if (doneRef.current) {
        stopAnimation();
        setLlmStreaming(false);
        setLlmLoading(false);
      }
    }, 30);
  }, [stopAnimation]);

  useEffect(() => stopAnimation, [stopAnimation]);

  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7537/ingest/8dfb01be-c204-46a4-b56d-eb7b9f35fb9f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'fc746e'},body:JSON.stringify({sessionId:'fc746e',location:'StockAnalyzer.tsx:useEffect-llmResult',message:'llmResult state',data:{llmResultLen:llmResult.length,showBlock:llmResult !== ''},timestamp:Date.now(),hypothesisId:'H4'})}).catch(()=>{});
  }, [llmResult]);
  // #endregion

  const handleAnalyze = async () => {
    if (!ticker.trim()) {
      setError('Ticker cannot be empty');
      return;
    }

    const upperTicker = ticker.trim().toUpperCase();
    setLoading(true);
    setError(null);
    setPredictError(null);

    const [analysisResult, predictionResult] = await Promise.allSettled([
      analyzeStock({ ticker: upperTicker, years, mode }),
      fetchPrediction(upperTicker, predictModel),
    ]);

    if (analysisResult.status === 'fulfilled') {
      setResult(analysisResult.value);
    } else {
      setError(analysisResult.reason instanceof Error ? analysisResult.reason.message : 'Analysis failed, please try again');
    }

    if (predictionResult.status === 'fulfilled') {
      setPredictResult(predictionResult.value);
    } else {
      setPredictError(predictionResult.reason instanceof Error ? predictionResult.reason.message : 'ML prediction failed');
    }

    setLoading(false);
  };

  const handleLLMAnalysis = async () => {
    if (!ticker.trim()) {
      setLlmError('Ticker cannot be empty');
      return;
    }
    // #region agent log
    fetch('http://127.0.0.1:7537/ingest/8dfb01be-c204-46a4-b56d-eb7b9f35fb9f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'fc746e'},body:JSON.stringify({sessionId:'fc746e',location:'StockAnalyzer.tsx:handleLLMAnalysis',message:'handler entry',data:{ticker:ticker.trim()},timestamp:Date.now(),hypothesisId:'H3'})}).catch(()=>{});
    // #endregion
    setLlmLoading(true);
    setLlmError(null);
    startAnimation();
    try {
      for await (const chunk of fetchLLMAnalysis({
        ticker: ticker.trim().toUpperCase(),
        years,
        mode,
      })) {
        chunksRef.current.push(chunk);
      }
      doneRef.current = true;
    } catch (err) {
      doneRef.current = true;
      setLlmError(err instanceof Error ? err.message : 'LLM analysis failed, please try again');
      stopAnimation();
      setLlmStreaming(false);
      setLlmLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 relative z-20">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">BuyNow AI <a href='https://github.com/FULINA41/BuyNow' target='_blank' rel='noopener noreferrer'><Github size={16} /></a></CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <InputGroup>
                  <InputGroupAddon>
                    <InputGroupText>
                      <SearchIcon className="w-4 h-4" />
                    </InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput type="text" value={undefined} onChange={(e) => setTicker(e.target.value)} placeholder="Please enter the ticker" />
                </InputGroup>
              </div>

              <div className="relative z-30">
                <Select
                  value={mode}
                  onValueChange={(value: string) => setMode(value as InvestmentMode)}
                >
                  <SelectTrigger className="w-full relative z-30">
                    <SelectValue placeholder="Select Style" />
                  </SelectTrigger>
                  <SelectContent className="z-[200]">
                    <SelectItem value="conservative">Conservative</SelectItem>
                    <SelectItem value="standard">Standard (Recommended)</SelectItem>
                    <SelectItem value="aggressive">Aggressive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="relative z-30">
                <Select
                  value={predictModel}
                  onValueChange={(value: string) => setPredictModel(value as PredictModel)}
                >
                  <SelectTrigger className="w-full relative z-30">
                    <SelectValue placeholder="ML Model" />
                  </SelectTrigger>
                  <SelectContent className="z-[200]">
                    <SelectItem value="lgbm">LightGBM</SelectItem>
                    <SelectItem value="alphanet">AlphaNet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="mb-2 block">
                Historical Lookback (Years): {years}
              </Label>
              <Slider
                min={2}
                max={15}
                value={[years]}
                onValueChange={(val) => setYears(val[0])}
                className={cn(
                  "w-[60%]",
                  // Modify selected track color
                  "[&>.relative>.absolute]:bg-black/60",
                  // Modify slider border color
                  "[&_[role=slider]]:bg-gray-300 [&_[role=slider]]:border-black",
                  // Modify unselected track background
                  "[&>.relative]:bg-black-100"
                )}
              />
            </div>

            <Button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full relative z-30  hover:bg-white/60 active:text-white"
            >
              {loading ? 'Analyzing...' : 'Generate Analysis'}
            </Button>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
              {error}
            </div>
          )}
        </CardContent>
      </Card>



      <Card>
        <CardHeader>
          <CardTitle>LLM Based Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleLLMAnalysis}
            disabled={llmLoading}
            className="w-full relative z-30 hover:bg-white/60 active:text-white"
          >
            {llmLoading ? 'Generating...' : 'Generating LLM Based Analysis'}
          </Button>
          {llmError && (
            <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
              {llmError}
            </div>
          )}
          {llmResult !== '' && (
            <div className="mt-4 rounded-lg border bg-muted p-4 prose prose-invert prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{llmResult}</ReactMarkdown>
            </div>
          )}
        </CardContent>
      </Card>
      <Link href="/portfolio" className="block">
        <Card className="group cursor-pointer transition-colors hover:border-primary/50">
          <CardContent className="flex items-center justify-between py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <PieChart size={20} className="text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Portfolio Optimizer</p>
                <p className="text-sm text-muted-foreground">Optimize allocation across multiple stocks</p>
              </div>
            </div>
            <span className="text-muted-foreground transition-transform group-hover:translate-x-1">→</span>
          </CardContent>
        </Card>
      </Link>
      {result && (
        <div className="space-y-6">
          <AnimatedCard delay={0.1}>
            <Card>
              <CardHeader>
                <CardTitle>{ticker.toUpperCase()} — Results</CardTitle>
              </CardHeader>
              <CardContent>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <SignalCard signal={result.signal} />
                  <RiskBadge risk={result.risk} />
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Current Price</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-foreground">
                        ${result.signal.Last.toFixed(2)}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="rounded-lg border bg-muted p-4 mb-6">
                  <p className="text-foreground">
                    Summary: {' '}
                    {result.signal.A_pos ? 'Position Low' : 'Position Not Low'} ｜{' '}
                    {result.signal.B_rsi ? 'RSI Cold' : 'RSI Not Cold'} ｜{' '}
                    {result.signal.C_turn ? 'Starting Recovery' : 'No Recovery'}
                    {' '}(For batch decision-making, not predicting price movements)
                  </p>
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>

          {predictResult && (
            <AnimatedCard delay={0.15}>
              <AlphaSignalPanel result={predictResult} />
            </AnimatedCard>
          )}
          {predictError && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
              ML Prediction: {predictError}
            </div>
          )}

          <AnimatedCard delay={0.2}>
            <ValuationCard
              fundamentals={result.fundamentals}
              fairValue={result.fair_value}
            />
          </AnimatedCard>

          <AnimatedCard delay={0.25}>
            <BuyZones zones={result.zones} mode={mode} />
          </AnimatedCard>

          <AnimatedCard delay={0.35}>
            <Card>
              <CardHeader>
                <CardTitle>Add-on Positions (Operation Manual)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-lg border bg-muted p-4">
                    <p className="text-sm text-muted-foreground mb-1">First Add-on (Standard Zone Lower Bound)</p>
                    <p className="text-xl font-semibold text-foreground">
                      ${result.add_levels.FirstAdd.toFixed(2)}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-muted p-4">
                    <p className="text-sm text-muted-foreground mb-1">Pullback Add-on (Bottom Zone Midpoint)</p>
                    <p className="text-xl font-semibold text-foreground">
                      ${result.add_levels.PullbackAdd.toFixed(2)}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-muted p-4">
                    <p className="text-sm text-muted-foreground mb-1">Value Pocket Add-on</p>
                    <p className="text-xl font-semibold text-foreground">
                      {result.add_levels.ValuePocketAdd
                        ? `$${result.add_levels.ValuePocketAdd.toFixed(2)}`
                        : '—'}
                    </p>
                  </div>
                </div>
                {result.add_levels.ValuePocketRule && (
                  <p className="mt-4 text-sm text-muted-foreground">
                    Value Pocket Rule: {result.add_levels.ValuePocketRule} (May not display if fundamental fields are missing)
                  </p>
                )}
              </CardContent>
            </Card>
          </AnimatedCard>

          <AnimatedCard delay={0.45}>
            <Card>
              <CardHeader>
                <CardTitle>Why This Recommendation? (Plain Language Explanation)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-foreground">
                      {result.signal.A_pos ? '✅' : '❌'} A Position Low
                    </p>
                    <p className="text-sm text-muted-foreground ml-6">
                      3-Year Percentile: {result.signal.Pct3Y !== null ? `${(result.signal.Pct3Y * 100).toFixed(0)}%` : '—'}；
                      5-Year Percentile: {result.signal.Pct5Y !== null ? `${(result.signal.Pct5Y * 100).toFixed(0)}%` : '—'}
                      (Lower percentile = closer to historical lows)
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {result.signal.B_rsi ? '✅' : '❌'} B Sentiment Cold (RSI Low)
                    </p>
                    <p className="text-sm text-muted-foreground ml-6">
                      RSI(14): {result.signal.RSI.toFixed(1)} (&lt;35 usually indicates cold/oversold area)
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {result.signal.C_turn ? '✅' : '❌'} C Recovery Signs (RSI Turning)
                    </p>
                    <p className="text-sm text-muted-foreground ml-6">
                      Recent RSI upward turn indicates weakening downward momentum (does not guarantee reversal)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>

          <AnimatedCard delay={0.55}>
            <Card>
              <CardContent>
                <div className="rounded-lg border bg-muted p-4">
                  <p className="text-muted-foreground text-sm">
                    <strong>Disclaimer:</strong> This tool is for research and educational purposes only and does not constitute investment advice. Markets carry risks, invest with caution.
                  </p>
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>
        </div>
      )}
    </div>
  );
}
