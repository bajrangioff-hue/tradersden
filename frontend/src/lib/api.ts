import type { ConfluenceAnalysis, ConfluenceLevel, TradeOut, TradeListResponse, SetupOut, OHLCV, AuthTokens } from '../types';

const BASE = import.meta.env.VITE_API_BASE_URL ?? '';

let onUnauthorized: (() => void) | null = null;

export function setOnUnauthorized(cb: () => void) {
  onUnauthorized = cb;
}

function getStoredTokens(): AuthTokens | null {
  try {
    const raw = localStorage.getItem('bt_tokens');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getToken(): string | null {
  return getStoredTokens()?.access_token ?? null;
}

let refreshing: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  const tokens = getStoredTokens();
  if (!tokens?.refresh_token) return false;
  try {
    const resp = await fetch(`${BASE}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: tokens.refresh_token }),
    });
    if (!resp.ok) return false;
    const newTokens: AuthTokens = await resp.json();
    localStorage.setItem('bt_tokens', JSON.stringify(newTokens));
    return true;
  } catch {
    return false;
  }
}

async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const resp = await fetch(`${BASE}${path}`, { ...options, headers });
  if (resp.status === 401) {
    if (!refreshing) refreshing = tryRefresh();
    const refreshed = await refreshing;
    refreshing = null;
    if (refreshed) {
      const newToken = getToken();
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
        const retryResp = await fetch(`${BASE}${path}`, { ...options, headers });
        if (!retryResp.ok && retryResp.status === 401) {
          localStorage.removeItem('bt_tokens');
          localStorage.removeItem('bt_user');
          onUnauthorized?.();
          const body = await retryResp.json().catch(() => ({ detail: 'Session expired' }));
          throw new Error(body.detail || 'Session expired');
        }
        return retryResp;
      }
    }
    localStorage.removeItem('bt_tokens');
    localStorage.removeItem('bt_user');
    onUnauthorized?.();
    const body = await resp.json().catch(() => ({ detail: 'Session expired' }));
    throw new Error(body.detail || 'Session expired');
  }
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({ detail: `HTTP ${resp.status}` }));
    throw new Error(body.detail || `HTTP ${resp.status}`);
  }
  return resp;
}

export async function analyzeConfluence(symbol: string, interval = '1h', period = '1mo'): Promise<ConfluenceAnalysis> {
  const resp = await authFetch(
    `/api/v1/confluence/analyze?symbol=${encodeURIComponent(symbol)}&interval=${interval}&period=${period}`
  );
  return resp.json();
}

export async function analyzeAndSave(symbol: string, interval = '1h'): Promise<ConfluenceAnalysis> {
  const resp = await authFetch(
    `/api/v1/confluence/analyze-and-save?symbol=${encodeURIComponent(symbol)}&interval=${interval}`
  );
  return resp.json();
}

export async function listLevels(
  symbol: string,
  tf?: string,
  mitigated?: boolean
): Promise<ConfluenceLevel[]> {
  let path = `/api/v1/confluence/levels?symbol=${encodeURIComponent(symbol)}`;
  if (tf) path += `&time_frame=${tf}`;
  if (mitigated !== undefined) path += `&mitigated=${mitigated}`;
  const resp = await authFetch(path);
  return resp.json();
}

export async function updateLevel(
  id: string,
  data: { notes?: string; is_favorite?: boolean; is_mitigated?: boolean }
): Promise<ConfluenceLevel> {
  const resp = await authFetch(`/api/v1/confluence/levels/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return resp.json();
}

export async function deleteLevel(id: string): Promise<void> {
  await authFetch(`/api/v1/confluence/levels/${id}`, { method: 'DELETE' });
}

export async function createSetup(data: {
  symbol: string;
  title?: string;
  notes?: string;
  analysis_snapshot: Record<string, unknown>;
  level_ids?: string[];
}): Promise<SetupOut> {
  const resp = await authFetch('/api/v1/setups', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return resp.json();
}

export async function listSetups(): Promise<SetupOut[]> {
  const resp = await authFetch('/api/v1/setups');
  return resp.json();
}

export async function getSetup(id: string): Promise<SetupOut> {
  const resp = await authFetch(`/api/v1/setups/${id}`);
  return resp.json();
}

export async function deleteSetup(id: string): Promise<void> {
  await authFetch(`/api/v1/setups/${id}`, { method: 'DELETE' });
}

export async function listTrades(params?: {
  page?: number;
  page_size?: number;
  symbol?: string;
  outcome?: string;
  date_from?: string;
  date_to?: string;
}): Promise<TradeListResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.page_size) query.set('page_size', String(params.page_size));
  if (params?.symbol) query.set('symbol', params.symbol);
  if (params?.outcome) query.set('outcome', params.outcome);
  if (params?.date_from) query.set('date_from', params.date_from);
  if (params?.date_to) query.set('date_to', params.date_to);
  const qs = query.toString();
  const resp = await authFetch(`/api/v1/trades${qs ? '?' + qs : ''}`);
  return resp.json();
}

export async function createTrade(data: {
  symbol: string;
  direction: string;
  entry_price: number;
  quantity: number;
  stop_loss?: number;
  take_profit?: number;
  entry_time: string;
  exit_price?: number;
  exit_time?: string;
  commission?: number;
  session?: string;
  grade_at_entry?: string;
  setup_tags?: string[];
  notes?: string;
}): Promise<TradeOut> {
  const resp = await authFetch('/api/v1/trades', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return resp.json();
}

export async function getTrade(id: string): Promise<TradeOut> {
  const resp = await authFetch(`/api/v1/trades/${id}`);
  return resp.json();
}

export async function updateTrade(
  id: string,
  data: Partial<{
    exit_price: number;
    exit_time: string;
    stop_loss: number;
    take_profit: number;
    notes: string;
    commission: number;
  }>
): Promise<TradeOut> {
  const resp = await authFetch(`/api/v1/trades/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return resp.json();
}

export async function deleteTrade(id: string): Promise<void> {
  await authFetch(`/api/v1/trades/${id}`, { method: 'DELETE' });
}

export async function fetchOHLCV(symbol: string, interval = '1h', range = '1mo'): Promise<OHLCV[]> {
  const proxy = `${BASE}/api/v1/analyze/${encodeURIComponent(symbol)}?es_symbol=ES%3DF`;
  const resp = await fetch(proxy);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const json = await resp.json();
  if (json.data?.ohlcv) return json.data.ohlcv;
  return [];
}
