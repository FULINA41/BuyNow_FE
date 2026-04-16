'use client';

import { PredictResponse } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Activity, BarChart3, Database, Layers } from 'lucide-react';
import { motion } from 'framer-motion';

interface AlphaSignalPanelProps {
  result: PredictResponse;
}

export default function AlphaSignalPanel({ result }: AlphaSignalPanelProps) {
  const returnPct = (result.pred_return * 100).toFixed(2);
  const isPositive = result.pred_return >= 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity size={20} />
          ML Prediction — {result.ticker} ({result.model === 'alphanet' ? 'AlphaNet' : 'LightGBM'})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Signal card: predicted return */}
        <div className="rounded-lg border bg-muted p-4 flex items-center gap-4">
          {isPositive ? (
            <TrendingUp size={28} className="text-emerald-500 shrink-0" />
          ) : (
            <TrendingDown size={28} className="text-red-500 shrink-0" />
          )}
          <div>
            <p className="text-sm text-muted-foreground">5-Day Predicted Return</p>
            <p className={cn(
              "text-2xl font-bold",
              isPositive ? "text-emerald-500" : "text-red-500",
            )}>
              {isPositive ? '+' : ''}{returnPct}%
            </p>
          </div>
        </div>

        {result.model === 'alphanet' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Confidence bar */}
            <div className="rounded-lg border bg-muted p-4">
              <p className="text-sm text-muted-foreground mb-2">Directional Confidence</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-3 rounded-full bg-muted-foreground/20 overflow-hidden">
                  <motion.div
                    className={cn(
                      "h-full rounded-full",
                      result.pred_direction >= 0.5 ? "bg-emerald-500" : "bg-red-500",
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${(result.pred_direction * 100).toFixed(0)}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
                <span className={cn(
                  "text-sm font-semibold tabular-nums w-20 text-right",
                  result.pred_direction >= 0.5 ? "text-emerald-500" : "text-red-500",
                )}>
                  {(result.pred_direction * 100).toFixed(0)}% Bullish
                </span>
              </div>
            </div>

            {/* Volatility gauge */}
            <div className="rounded-lg border bg-muted p-4">
              <p className="text-sm text-muted-foreground mb-2">Predicted 5-Day Volatility</p>
              <p className="text-xl font-bold text-foreground">
                {(result.pred_volatility * 100).toFixed(2)}%
              </p>
            </div>
          </div>
        )}

        {result.model === 'lgbm' && result.top_features.length > 0 && (
          <div className="rounded-lg border bg-muted p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 size={16} className="text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Key Driving Factors</p>
            </div>
            <div className="space-y-2">
              {(() => {
                const maxGain = Math.max(...result.top_features.map((f) => f.gain));
                return result.top_features.map((feat, i) => (
                  <div key={feat.feature} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-5 text-right tabular-nums">{i + 1}</span>
                    <span className="text-sm font-mono text-foreground w-28 truncate">{feat.feature}</span>
                    <div className="flex-1 h-2 rounded-full bg-muted-foreground/20 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${(feat.gain / maxGain) * 100}%` }}
                        transition={{ duration: 0.6, delay: i * 0.08, ease: 'easeOut' }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums w-16 text-right">
                      {feat.gain.toFixed(1)}
                    </span>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        {/* Meta footer */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
          <span className="flex items-center gap-1">
            <Database size={12} />
            {result.data_points} data points
          </span>
          <span className="flex items-center gap-1">
            <Layers size={12} />
            {result.seq_len}-day window
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
