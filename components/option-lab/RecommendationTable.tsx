'use client';

import type { RecommendationResponse, MarginMode } from '@/lib/types';

interface Props {
  data: RecommendationResponse;
  marginMode: MarginMode;
}

function fmtMoney(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  return `$${v.toFixed(2)}`;
}

function fmtPct(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  return `${(v * 100).toFixed(1)}%`;
}

function fmtCapital(v: number): string {
  return `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export default function RecommendationTable({ data, marginMode }: Props) {
  const { contract, roc_cash_secured: rocCs, roc_reg_t: rocRt } = data;

  if (!contract) {
    return (
      <div className="rounded-md border border-border/60 p-4 text-sm text-muted-foreground">
        No tradeable contract found for the chosen window.
      </div>
    );
  }

  const rows: { label: string; value: string }[] = [
    { label: 'Contract', value: contract.symbol ?? '—' },
    { label: 'Strike', value: fmtMoney(contract.strike) },
    { label: 'Expiration', value: `${contract.expiration} (${contract.days_to_expiry}d)` },
    {
      label: 'Bid / Mid / Ask',
      value: `${fmtMoney(contract.bid)} / ${fmtMoney(contract.mid)} / ${fmtMoney(contract.ask)}`,
    },
    {
      label: 'IV / IV Rank',
      value: `${fmtPct(contract.iv)} / ${
        contract.iv_rank !== null ? `${(contract.iv_rank * 100).toFixed(0)}%` : '—'
      }`,
    },
    { label: 'Delta', value: contract.delta !== null ? contract.delta.toFixed(3) : '—' },
    { label: 'Open Interest', value: contract.open_interest.toLocaleString() },
  ];

  const rocRows: {
    mode: string;
    visible: boolean;
    premium: number | null;
    capital: number | null;
    period: number | null;
    annualised: number | null;
    flag: boolean;
  }[] = [
    {
      mode: 'Cash Secured',
      visible: marginMode === 'cash_secured' || marginMode === 'both',
      premium: rocCs?.premium_per_contract ?? null,
      capital: rocCs?.capital_required ?? null,
      period: rocCs?.roc_per_period ?? null,
      annualised: rocCs?.roc_annualised ?? null,
      flag: rocCs?.margin_leverage_flag ?? false,
    },
    {
      mode: 'Reg-T Margin',
      visible: marginMode === 'reg_t' || marginMode === 'both',
      premium: rocRt?.premium_per_contract ?? null,
      capital: rocRt?.capital_required ?? null,
      period: rocRt?.roc_per_period ?? null,
      annualised: rocRt?.roc_annualised ?? null,
      flag: rocRt?.margin_leverage_flag ?? false,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Pick method headline */}
      <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3">
        <div className="text-[10px] font-medium uppercase tracking-wider text-emerald-400">
          Strategy
        </div>
        <div className="text-base font-bold text-foreground">SELL PUT — {data.ticker}</div>
        <div className="text-xs text-muted-foreground mt-0.5">
          Method: <span className="text-foreground/90">{data.strike_pick_method}</span>
        </div>
        <div className="text-xs text-muted-foreground mt-1 leading-snug">{data.rationale}</div>
      </div>

      {/* Contract details */}
      <div className="rounded-md border border-border/60 overflow-hidden">
        <table className="w-full text-sm">
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                className={i % 2 === 0 ? 'bg-card/30' : 'bg-transparent'}
              >
                <td className="px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground w-1/2">
                  {row.label}
                </td>
                <td className="px-3 py-2 text-right text-foreground tabular-nums">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ROC */}
      <div className="rounded-md border border-border/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/30">
              <th className="px-3 py-2 text-left text-xs uppercase tracking-wider text-muted-foreground">
                Mode
              </th>
              <th className="px-3 py-2 text-right text-xs uppercase tracking-wider text-muted-foreground">
                Premium
              </th>
              <th className="px-3 py-2 text-right text-xs uppercase tracking-wider text-muted-foreground">
                Capital
              </th>
              <th className="px-3 py-2 text-right text-xs uppercase tracking-wider text-muted-foreground">
                ROC (period)
              </th>
              <th className="px-3 py-2 text-right text-xs uppercase tracking-wider text-muted-foreground">
                Annualised
              </th>
            </tr>
          </thead>
          <tbody>
            {rocRows
              .filter((r) => r.visible)
              .map((r, i) => (
                <tr
                  key={i}
                  className={r.flag ? 'bg-red-500/10 text-red-300' : 'bg-card/30'}
                >
                  <td className="px-3 py-2">
                    <div className="font-medium text-foreground">{r.mode}</div>
                    {r.flag && (
                      <div className="text-[10px] text-red-400">⚠ leverage warning</div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {r.premium !== null ? fmtCapital(r.premium) : '—'}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {r.capital !== null ? fmtCapital(r.capital) : '—'}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmtPct(r.period)}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-bold">
                    {fmtPct(r.annualised)}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
