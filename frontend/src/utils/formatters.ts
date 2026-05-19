export function formatTime(dt: string): string {
  try {
    const d = new Date(dt);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  } catch {}
  return dt ? dt.slice(0, 5) : '';
}

export function getSearchSuggestions(query: string, symbols: { s: string; n: string }[]): { s: string; n: string }[] {
  const q = query.toUpperCase().trim();
  if (!q) return [];
  return symbols
    .filter((s) => s.s.toUpperCase().includes(q) || s.n.toUpperCase().includes(q))
    .slice(0, 8);
}

export function getDecimalPlaces(symbol: string): number {
  const s = symbol.toUpperCase();
  if (s.includes('-USD')) return 2;
  if (s.includes('=X')) {
    if (s.startsWith('USDJPY') || s.startsWith('JPY')) return 3;
    return 5;
  }
  if (s.includes('=F')) {
    if (['NQ', 'MNQ', 'ES', 'MES', 'YM', 'MYM'].some((x) => s.startsWith(x))) return 0;
    if (s.startsWith('GC') || s.startsWith('MGC') || s.startsWith('SI') || s.startsWith('MSI')) return 1;
    if (s.startsWith('CL') || s.startsWith('MCL') || s.startsWith('NG')) return 2;
    if (s.startsWith('ZC') || s.startsWith('ZW') || s.startsWith('ZS')) return 2;
    return 2;
  }
  return 2;
}

export function formatPrice(symbol: string, price: number | undefined | null): string {
  if (price == null) return '---';
  const dp = getDecimalPlaces(symbol);
  return price.toFixed(dp);
}

export function formatChange(symbol: string, price: number | undefined | null): string {
  if (price == null) return '--';
  const dp = getDecimalPlaces(symbol);
  const sign = price >= 0 ? '+' : '';
  return `${sign}${price.toFixed(dp)}`;
}

export function formatPct(pct: number | undefined | null): string {
  if (pct == null) return '--';
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(2)}%`;
}

export function getSessionInfo(): { label: string; active: boolean; nextLabel: string; nextInMs: number } {
  const now = new Date();
  const h = now.getUTCHours();
  const m = now.getUTCMinutes();
  const totalMin = h * 60 + m;

  const sessions = [
    { start: 0, end: 7 * 60, label: 'ASIA', active: false },
    { start: 7 * 60, end: 9 * 60, label: 'LONDON KZ', active: true },
    { start: 9 * 60, end: 13 * 60, label: 'LONDON AM', active: false },
    { start: 13 * 60, end: 15 * 60, label: 'NY KZ', active: true },
    { start: 15 * 60, end: 17 * 60, label: 'NY AM', active: true },
    { start: 17 * 60, end: 19 * 60, label: 'LUNCH', active: false },
  ];

  for (const s of sessions) {
    if (totalMin >= s.start && totalMin < s.end) {
      const nextIdx = sessions.indexOf(s) + 1;
      const next = nextIdx < sessions.length ? sessions[nextIdx] : sessions[0];
      const nextTime = next.start;
      let nextInMs = (nextTime - totalMin) * 60 * 1000;
      if (nextInMs <= 0) nextInMs += 24 * 60 * 60 * 1000;
      return { label: s.label, active: s.active, nextLabel: next.label, nextInMs };
    }
  }
  return { label: 'OFF', active: false, nextLabel: 'LONDON KZ', nextInMs: (7 * 60 - totalMin + 24 * 60) * 60 * 1000 };
}
