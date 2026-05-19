export interface SymbolData {
  s: string;
  n: string;
  cats: string[];
}

export interface GradeData {
  passed: boolean;
  detail: string;
  grade: number;
  rsi: number;
}

export interface ChecklistItem {
  key: string;
  icon: string;
  label: string;
  sub: string;
}

export interface Target {
  level: number;
  price: number;
}

export interface Targets {
  direction: string;
  entry: number | null;
  targets: Target[];
  clear_targets: boolean;
}

export interface Pda {
  yesterday_high: number;
  yesterday_low: number;
  yesterday_close: number;
}

export interface Retracement {
  fib_level: number;
  current_retrace: number;
}

export interface AnalysisResult {
  symbol: string;
  pda: Pda;
  checklist: Record<string, { passed: boolean; detail: string }>;
  narrative?: string;
  direction: string;
  grade?: number;
  grade_letter?: string;
  score?: number;
  confluence_score?: number;
  confidence?: string;
  no_trade?: boolean;
  no_trade_reason?: string | null;
  session?: string;
  session_quality?: string;
  amd_phase?: string;
  daily_bias?: string;
  delivery_state?: string;
  target_state?: string;
  retrace_state?: string;
  key_levels?: {
    order_block?: { high: number; low: number } | null;
    fvg?: { top: number; bottom: number } | null;
    ote_zone?: { high: number; low: number } | null;
    dol_target?: number | null;
    equilibrium?: number;
  };
}

export interface CalendarEvent {
  title: string;
  country: string;
  currency: string;
  impact: string;
  forecast: string;
  previous: string;
  actual: string;
  datetime: string;
}

export interface NewsItem {
  title: string;
  publisher: string;
  summary: string;
  sentiment: string;
  url?: string;
  datetime?: string;
  pubDate?: string;
}

export interface LiveNewsItem {
  title: string;
  link: string;
  url: string;
  pubDate: string;
  datetime: string;
  description: string;
  source: string;
  category: string;
  time_ago: string;
}

export interface MarketPrice {
  s: string;
  p: number;
  c: number;
  pc: number;
  h: number;
  l: number;
  v: number;
  cat: string;
  t: number;
}

export interface MarketPrices {
  [symbol: string]: MarketPrice;
}

export interface UserProfile {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string | null;
  is_verified: boolean;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface ConfluenceLevel {
  id?: string;
  level_type: string;
  price: number;
  high?: number | null;
  low?: number | null;
  direction?: string | null;
  confluence_score: number;
  strength: string;
  source_modules?: string[];
  time_frame: string;
  is_mitigated: boolean;
  notes?: string | null;
  is_favorite?: boolean;
  details?: Record<string, unknown>;
  detected_at?: string;
  symbol?: string;
}

export interface ConfluenceAnalysis {
  symbol: string;
  interval: string;
  levels: ConfluenceLevel[];
  score: number;
  direction: string;
  grade: string;
  narrative: string;
  full_analysis: Record<string, unknown>;
}

export interface TradeOut {
  id: string;
  symbol: string;
  direction: string;
  entry_price: number;
  exit_price?: number | null;
  quantity: number;
  stop_loss?: number | null;
  take_profit?: number | null;
  commission: number;
  pnl?: number | null;
  outcome?: string | null;
  entry_time: string;
  exit_time?: string | null;
  session?: string | null;
  grade_at_entry?: string | null;
  setup_tags: string[];
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TradeListResponse {
  trades: TradeOut[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface SetupOut {
  id: string;
  symbol: string;
  title?: string | null;
  notes?: string | null;
  analysis_snapshot: Record<string, unknown>;
  level_ids: string[];
  created_at: string;
}

export interface OHLCV {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}
