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


/* ── Option Lab ───────────────────────────────────────────────── */

export interface GEXCurvePoint {
  strike: number;
  net_gex: number;
}

export interface GEXResponse {
  ticker: string;
  spot: number;
  as_of: string;                 // ISO datetime
  contracts_loaded: number;
  expiry_filter: string | null;  // ISO date
  curve: GEXCurvePoint[];
  gamma_wall: number | null;     // global max positive GEX (may be a call ceiling above spot)
  support_wall: number | null;   // max positive GEX at-or-below spot (real put-side floor)
  put_support: number | null;
  total_gex: number;
  source: string;                // "alpaca" | "yfinance"
}

export type MarginMode = "cash_secured" | "reg_t" | "both";
export type Aggressiveness = "conservative" | "moderate" | "aggressive";

export interface RecommendationRequest {
  margin_mode?: MarginMode;
  aggressiveness?: Aggressiveness;
  enable_llm_filter?: boolean;
  risk_free_rate?: number;
  wacc?: number;
}

export interface RecommendedContract {
  symbol: string | null;
  strike: number;
  expiration: string;            // ISO date
  days_to_expiry: number;
  type: string;
  bid: number | null;
  ask: number | null;
  mid: number | null;
  iv: number | null;
  iv_rank: number | null;        // 0-1
  open_interest: number;
  delta: number | null;
  gamma: number | null;
}

export interface StrategyROC {
  margin_mode: string;
  premium_per_contract: number;
  capital_required: number;
  roc_per_period: number;
  roc_annualised: number;
  margin_leverage_flag: boolean;
}

export interface DCFSummary {
  method: string;
  fair_value_per_share: number | null;
  fcf_baseline: number | null;
  growth_rate_used: number | null;
  terminal_growth: number;
  wacc: number;
  horizon_years: number;
  notes: string[];
}

export interface RiskFilter {
  risk_flags: string[];
  confidence_score: number | null;
  rationale: string;
  sources_consulted: string[];
}

export interface RecommendationResponse {
  ticker: string;
  action: "SELL_PUT";
  spot: number;
  as_of: string;
  strike_pick_method: string;
  valuation_floor: number | null;
  gamma_wall: number | null;
  support_wall: number | null;
  sigma_buffer: number | null;
  final_strike: number;
  rationale: string;
  contract: RecommendedContract | null;
  roc_cash_secured: StrategyROC | null;
  roc_reg_t: StrategyROC | null;
  dcf: DCFSummary;
  risk_filter: RiskFilter;
}
