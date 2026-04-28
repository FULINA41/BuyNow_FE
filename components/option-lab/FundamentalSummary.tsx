'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { DCFSummary, RiskFilter } from '@/lib/types';

interface Props {
  ticker: string;
  dcf: DCFSummary;
  spot: number;
  valuationFloor: number | null;
  riskFilter: RiskFilter;
}

function fmtMoney(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  if (Math.abs(v) >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  return `$${v.toFixed(2)}`;
}

function fmtPct(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  return `${(v * 100).toFixed(1)}%`;
}

function confidenceColor(score: number | null): string {
  if (score === null) return 'text-muted-foreground';
  if (score >= 0.7) return 'text-emerald-500';
  if (score >= 0.4) return 'text-amber-400';
  return 'text-red-500';
}

export default function FundamentalSummary({
  ticker,
  dcf,
  spot,
  valuationFloor,
  riskFilter,
}: Props) {
  const ratio = valuationFloor && valuationFloor > 0 ? spot / valuationFloor : null;
  const confidencePct =
    riskFilter.confidence_score !== null
      ? `${(riskFilter.confidence_score * 100).toFixed(0)}%`
      : '—';

  const dcfMarkdown = `
**Valuation snapshot — ${ticker}**

| Metric | Value |
| --- | --- |
| Spot | ${fmtMoney(spot)} |
| DCF fair value | ${fmtMoney(valuationFloor)} |
| Spot / DCF | ${ratio !== null ? `${ratio.toFixed(2)}×` : '—'} |
| FCF baseline (3y avg) | ${fmtMoney(dcf.fcf_baseline)} |
| Growth rate used | ${fmtPct(dcf.growth_rate_used)} |
| Terminal growth | ${fmtPct(dcf.terminal_growth)} |
| WACC | ${fmtPct(dcf.wacc)} |
${dcf.notes.length > 0 ? `\n_Notes:_ ${dcf.notes.join('; ')}` : ''}
`.trim();

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border/60 bg-card/40 p-4 text-sm">
        <div className="prose prose-invert max-w-none text-sm">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{dcfMarkdown}</ReactMarkdown>
        </div>
      </div>

      <div className="rounded-md border border-border/60 bg-card/40 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            LLM Risk Filter
          </h3>
          <span className={`text-sm font-bold ${confidenceColor(riskFilter.confidence_score)}`}>
            Confidence {confidencePct}
          </span>
        </div>

        {riskFilter.risk_flags.length > 0 ? (
          <ul className="space-y-2 mb-3">
            {riskFilter.risk_flags.map((flag, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 inline-block h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                <span className="text-foreground/90">{flag}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground italic mb-3">
            No near-term catalysts flagged.
          </p>
        )}

        {riskFilter.rationale && (
          <p className="text-xs leading-relaxed text-muted-foreground">
            {riskFilter.rationale}
          </p>
        )}

        {riskFilter.sources_consulted.length > 0 && (
          <details className="mt-3">
            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
              {riskFilter.sources_consulted.length} sources consulted
            </summary>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {riskFilter.sources_consulted.map((src, i) => (
                <span
                  key={i}
                  className="rounded border border-border/60 bg-muted/30 px-1.5 py-0.5 text-[10px] text-muted-foreground"
                >
                  {src}
                </span>
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
