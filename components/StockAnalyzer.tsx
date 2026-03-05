/**
 * Stock Analyzer Main Component
 */
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AnalysisResponse, InvestmentMode } from '@/lib/types';
import { analyzeStock, fetchLLMAnalysis } from '@/lib/api';
import SignalCard from './SignalCard';
import RiskBadge from './RiskBadge';
import BuyZones from './BuyZones';
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
import { SearchIcon, Github } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const chunksRef = useRef<string[]>([]);
  const chunkIndexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopAnimation = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startAnimation = useCallback(() => {
    stopAnimation();
    chunkIndexRef.current = 0;
    setLlmResult('');
    setLlmStreaming(true);

    timerRef.current = setInterval(() => {
      const chunks = chunksRef.current;
      const idx = chunkIndexRef.current;
      if (idx >= chunks.length) {
        stopAnimation();
        setLlmStreaming(false);
        setLlmLoading(false);
        return;
      }
      setLlmResult((prev) => prev + chunks[idx]);
      chunkIndexRef.current = idx + 1;
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

    setLoading(true);
    setError(null);

    try {
      const data = await analyzeStock({
        ticker: ticker.trim().toUpperCase(),
        years,
        mode,
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed, please try again');
    } finally {
      setLoading(false);
    }
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
    setLlmResult('');
    stopAnimation();
    try {
      const allChunks: string[] = [];
      for await (const chunk of fetchLLMAnalysis({
        ticker: ticker.trim().toUpperCase(),
        years,
        mode,
      })) {
        allChunks.push(chunk);
      }
      chunksRef.current = allChunks;
      startAnimation();
    } catch (err) {
      setLlmError(err instanceof Error ? err.message : 'LLM analysis failed, please try again');
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="mt-4 rounded-lg border bg-muted p-4">
              {llmStreaming ? (
                <pre className="text-foreground text-sm whitespace-pre-wrap font-sans">{llmResult}</pre>
              ) : (
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{llmResult}</ReactMarkdown>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

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

          <AnimatedCard delay={0.2}>
            <BuyZones zones={result.zones} mode={mode} />
          </AnimatedCard>

          <AnimatedCard delay={0.3}>
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

          <AnimatedCard delay={0.4}>
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

          <AnimatedCard delay={0.5}>
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
