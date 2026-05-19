import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { API_BASE } from '../utils/constants';
import type { MarketPrice, MarketPrices } from '../types';

interface MarketStore {
  prices: MarketPrices;
  loading: boolean;
  error: string | null;
  lastUpdate: number | null;
  getPrice: (symbol: string) => MarketPrice | undefined;
  getChangeStr: (symbol: string) => string;
  getChangePctStr: (symbol: string) => string;
  refresh: () => Promise<void>;
}

const MarketContext = createContext<MarketStore | null>(null);

const POLL_INTERVAL = 10_000;

export function MarketProvider({ children }: { children: React.ReactNode }) {
  const [prices, setPrices] = useState<MarketPrices>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const mountedRef = useRef(true);
  const pricesRef = useRef<MarketPrices>({});

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/market/prices`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.status === 'success' && json.data) {
        pricesRef.current = json.data as MarketPrices;
        setPrices(json.data as MarketPrices);
        setLastUpdate(Date.now());
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setError(msg);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [refresh]);

  const getPrice = useCallback(
    (symbol: string) => pricesRef.current[symbol.toUpperCase()],
    [],
  );

  const getChangeStr = useCallback(
    (symbol: string): string => {
      const p = pricesRef.current[symbol.toUpperCase()];
      if (!p) return '--';
      const sign = p.c >= 0 ? '+' : '';
      return `${sign}${p.c.toFixed(2)}`;
    },
    [],
  );

  const getChangePctStr = useCallback(
    (symbol: string): string => {
      const p = pricesRef.current[symbol.toUpperCase()];
      if (!p) return '--';
      const sign = p.pc >= 0 ? '+' : '';
      return `${sign}${p.pc.toFixed(2)}%`;
    },
    [],
  );

  const store = useMemo<MarketStore>(
    () => ({
      prices,
      loading,
      error,
      lastUpdate,
      getPrice,
      getChangeStr,
      getChangePctStr,
      refresh,
    }),
    [prices, loading, error, lastUpdate, getPrice, getChangeStr, getChangePctStr, refresh],
  );

  return (
    <MarketContext.Provider value={store}>
      {children}
    </MarketContext.Provider>
  );
}

export function useMarketStore(): MarketStore {
  const ctx = useContext(MarketContext);
  if (!ctx) {
    throw new Error('useMarketStore must be used within a MarketProvider');
  }
  return ctx;
}
