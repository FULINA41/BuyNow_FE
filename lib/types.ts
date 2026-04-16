/**
 * TypeScript Type Definitions
 */

export type InvestmentMode = "conservative" | "standard" | "aggressive";

export interface AnalysisRequest {
  ticker: string;
  years: number;
  mode: InvestmentMode;
}

export interface SignalResponse {
  Signal: string;
  Last: number;
  RSI: number;
  Pct3Y: number | null;
  Pct5Y: number | null;
  A_pos: boolean;
  B_rsi: boolean;
  C_turn: boolean;
}

export interface RiskResponse {
  Risk: string;
  RiskScore: number;
  TrendUp: boolean;
  MA50: number | null;
  MA200: number | null;
  Vol: number | null;
  DD1Y: number | null;
  Last: number;
}

export interface ZonesResponse {
  ATR14: number | null;
  Last: number;
  Conservative: [number, number];
  Neutral: [number, number];
  Aggressive: [number, number];
}

export interface FundamentalsResponse {
  Price: number | null;
  Shares: number | null;
  MarketCap: number | null;
  RevenueTTM: number | null;
  FCF: number | null;
  PE: number | null;
  PS: number | null;
  PB: number | null;
}

export interface FairValueResponse {
  Method: string;
  FairLow: number | null;
  FairMid: number | null;
  FairHigh: number | null;
}

export interface AddLevelsResponse {
  FirstAdd: number;
  PullbackAdd: number;
  ValuePocketAdd: number | null;
  ValuePocketRule: string | null;
}

export interface AnalysisResponse {
  signal: SignalResponse;
  risk: RiskResponse;
  zones: ZonesResponse;
  fundamentals: FundamentalsResponse;
  fair_value: FairValueResponse;
  add_levels: AddLevelsResponse;
}

export interface OptimizeRequest {
  tickers: string[];
  lookback_years?: number;
  risk_free_rate?: number;
}

export interface OptimizeResponse {
  weights: Record<string, number>;
  expected_return: number;
  volatility: number;
  sharpe_ratio: number;
}

export type PredictModel = "alphanet" | "lgbm";

export interface AlphaNetResult {
  model: "alphanet";
  pred_return: number;
  pred_direction: number;
  pred_volatility: number;
  ticker: string;
  seq_len: number;
  data_points: number;
}

export interface LgbmResult {
  model: "lgbm";
  pred_return: number;
  top_features: { feature: string; gain: number }[];
  ticker: string;
  seq_len: number;
  data_points: number;
}

export type PredictResponse = AlphaNetResult | LgbmResult;
