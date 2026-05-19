import { useState, useMemo, useCallback } from 'react';

type ImpactFilter = 'all' | 'high' | 'medium' | 'low';

export interface FilterState {
  impact: ImpactFilter;
  currencies: string[];
  sort: 'time_asc' | 'time_desc' | 'impact_high';
}

export function useFilterState<T extends { impact?: string; currency?: string; country?: string; datetime?: string }>(items: T[]) {
  const [filters, setFilters] = useState<FilterState>({
    impact: 'all',
    currencies: [],
    sort: 'time_asc',
  });

  const allCurrencies = useMemo(() => {
    const set = new Set<string>();
    items.forEach((e) => { const c = e.currency || e.country; if (c) set.add(c); });
    return Array.from(set).sort();
  }, [items]);

  const setImpact = useCallback((impact: ImpactFilter) =>
    setFilters((f) => ({ ...f, impact })), []);

  const toggleCurrency = useCallback((c: string) =>
    setFilters((f) => ({
      ...f,
      currencies: f.currencies.includes(c)
        ? f.currencies.filter((x) => x !== c)
        : [...f.currencies, c],
    })), []);

  const setSort = useCallback((sort: FilterState['sort']) =>
    setFilters((f) => ({ ...f, sort })), []);

  const clear = useCallback(() =>
    setFilters({ impact: 'all', currencies: [], sort: 'time_asc' }), []);

  const hasFilters = filters.impact !== 'all' || filters.currencies.length > 0;

  const filtered = useMemo(() => {
    let result = [...items];
    if (filters.impact !== 'all') {
      result = result.filter((e) => (e.impact || 'low') === filters.impact);
    }
    if (filters.currencies.length > 0) {
      result = result.filter((e) =>
        filters.currencies.includes(e.currency || e.country || '')
      );
    }
    const order = { high: 0, medium: 1, low: 2 };
    result.sort((a, b) => {
      if (filters.sort === 'time_asc')
        return new Date(a.datetime || 0).getTime() - new Date(b.datetime || 0).getTime();
      if (filters.sort === 'time_desc')
        return new Date(b.datetime || 0).getTime() - new Date(a.datetime || 0).getTime();
      return (order[a.impact as keyof typeof order] ?? 1) - (order[b.impact as keyof typeof order] ?? 1);
    });
    return result;
  }, [items, filters]);

  return { filters, allCurrencies, setImpact, toggleCurrency, setSort, clear, hasFilters, filtered };
}
