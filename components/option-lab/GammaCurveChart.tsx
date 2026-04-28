'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { GEXCurvePoint } from '@/lib/types';

interface Props {
  curve: GEXCurvePoint[];
  spot: number;
  gammaWall: number | null;
  supportWall: number | null;
  putSupport: number | null;
}

function formatGex(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
  return value.toFixed(0);
}

export default function GammaCurveChart({ curve, spot, gammaWall, supportWall, putSupport }: Props) {
  if (curve.length === 0) {
    return (
      <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
        No GEX data available.
      </div>
    );
  }

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={curve} margin={{ top: 10, right: 16, left: 8, bottom: 16 }}>
          <defs>
            <linearGradient id="gexPos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#16a34a" stopOpacity={0.55} />
              <stop offset="100%" stopColor="#16a34a" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="gexNeg" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#ef4444" stopOpacity={0.55} />
              <stop offset="100%" stopColor="#ef4444" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
          <XAxis
            dataKey="strike"
            type="number"
            domain={['auto', 'auto']}
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            tickFormatter={(v) => `$${v}`}
            label={{
              value: 'Strike',
              position: 'insideBottom',
              offset: -8,
              fill: '#9ca3af',
              fontSize: 11,
            }}
          />
          <YAxis
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            tickFormatter={formatGex}
            width={60}
            label={{
              value: 'Net GEX',
              angle: -90,
              position: 'insideLeft',
              fill: '#9ca3af',
              fontSize: 11,
            }}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: '1px solid #ffffff20',
              background: 'rgba(0,0,0,0.85)',
              color: '#fff',
              fontSize: 12,
            }}
            formatter={(value) => [formatGex(Number(value)), 'Net GEX']}
            labelFormatter={(label) => `Strike $${label}`}
          />
          <Area
            type="monotone"
            dataKey="net_gex"
            stroke="#60a5fa"
            strokeWidth={1.5}
            fill="url(#gexPos)"
            isAnimationActive={false}
          />
          <ReferenceLine
            x={spot}
            stroke="#fbbf24"
            strokeDasharray="4 4"
            label={{
              value: `Spot $${spot.toFixed(2)}`,
              fill: '#fbbf24',
              fontSize: 10,
              position: 'top',
            }}
          />
          {gammaWall !== null && (
            <ReferenceLine
              x={gammaWall}
              stroke="#22c55e"
              strokeDasharray="2 2"
              label={{
                value: `Wall $${gammaWall}`,
                fill: '#22c55e',
                fontSize: 10,
                position: 'insideTopRight',
              }}
            />
          )}
          {supportWall !== null && supportWall !== gammaWall && (
            <ReferenceLine
              x={supportWall}
              stroke="#a855f7"
              strokeDasharray="3 3"
              label={{
                value: `Support $${supportWall}`,
                fill: '#a855f7',
                fontSize: 10,
                position: 'insideBottomRight',
              }}
            />
          )}
          {putSupport !== null && (
            <ReferenceLine
              x={putSupport}
              stroke="#ef4444"
              strokeDasharray="2 2"
              label={{
                value: `Put Sup $${putSupport}`,
                fill: '#ef4444',
                fontSize: 10,
                position: 'insideBottomLeft',
              }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
