/**
 * Valuation Card Component
 */
import { FundamentalsResponse, FairValueResponse } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ValuationCardProps {
  fundamentals: FundamentalsResponse;
  fairValue: FairValueResponse;
}

function formatMoney(value: number | null): string {
  if (value === null) return '—';
  return `$${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

function formatCompact(value: number | null): string {
  if (value === null) return '—';
  const abs = Math.abs(value);
  if (abs >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return value.toFixed(2);
}

function formatCompactMoney(value: number | null): string {
  if (value === null) return '—';
  return `$${formatCompact(value)}`;
}

function formatRatio(value: number | null): string {
  if (value === null) return '—';
  return value.toFixed(2);
}

export default function ValuationCard({ fundamentals, fairValue }: ValuationCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Valuation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-lg border bg-muted p-4">
            <p className="text-sm text-muted-foreground mb-1">Price</p>
            <p className="text-lg font-semibold text-foreground">{formatMoney(fundamentals.Price)}</p>
          </div>
          <div className="rounded-lg border bg-muted p-4">
            <p className="text-sm text-muted-foreground mb-1">Market Cap</p>
            <p className="text-lg font-semibold text-foreground">{formatCompactMoney(fundamentals.MarketCap)}</p>
          </div>
          <div className="rounded-lg border bg-muted p-4">
            <p className="text-sm text-muted-foreground mb-1">Revenue (TTM)</p>
            <p className="text-lg font-semibold text-foreground">{formatCompactMoney(fundamentals.RevenueTTM)}</p>
          </div>
          <div className="rounded-lg border bg-muted p-4">
            <p className="text-sm text-muted-foreground mb-1">Free Cash Flow</p>
            <p className="text-lg font-semibold text-foreground">{formatCompactMoney(fundamentals.FCF)}</p>
          </div>
          <div className="rounded-lg border bg-muted p-4">
            <p className="text-sm text-muted-foreground mb-1">P/E</p>
            <p className="text-lg font-semibold text-foreground">{formatRatio(fundamentals.PE)}</p>
          </div>
          <div className="rounded-lg border bg-muted p-4">
            <p className="text-sm text-muted-foreground mb-1">P/S</p>
            <p className="text-lg font-semibold text-foreground">{formatRatio(fundamentals.PS)}</p>
          </div>
          <div className="rounded-lg border bg-muted p-4">
            <p className="text-sm text-muted-foreground mb-1">P/B</p>
            <p className="text-lg font-semibold text-foreground">{formatRatio(fundamentals.PB)}</p>
          </div>
          <div className="rounded-lg border bg-muted p-4">
            <p className="text-sm text-muted-foreground mb-1">Shares</p>
            <p className="text-lg font-semibold text-foreground">{formatCompact(fundamentals.Shares)}</p>
          </div>
        </div>

        <div className="mt-6 border-t pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border bg-muted p-4">
              <p className="text-sm text-muted-foreground mb-1">Fair Value (Low)</p>
              <p className="text-xl font-semibold text-foreground">{formatMoney(fairValue.FairLow)}</p>
            </div>
            <div className="rounded-lg border bg-muted p-4">
              <p className="text-sm text-muted-foreground mb-1">Fair Value (Mid)</p>
              <p className="text-xl font-semibold text-foreground">{formatMoney(fairValue.FairMid)}</p>
            </div>
            <div className="rounded-lg border bg-muted p-4">
              <p className="text-sm text-muted-foreground mb-1">Fair Value (High)</p>
              <p className="text-xl font-semibold text-foreground">{formatMoney(fairValue.FairHigh)}</p>
            </div>
          </div>
          {fairValue.Method && (
            <p className="mt-4 text-sm text-muted-foreground">
              Method: {fairValue.Method}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
