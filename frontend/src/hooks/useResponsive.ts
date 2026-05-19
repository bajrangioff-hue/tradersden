import { useState, useEffect } from 'react';

type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const queries: Record<Breakpoint, string> = {
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
  '2xl': '(min-width: 1536px)',
};

export function useResponsive() {
  const [bp, setBp] = useState<Record<Breakpoint, boolean>>({
    sm: false, md: false, lg: false, xl: false, '2xl': false,
  });

  useEffect(() => {
    const mqls = Object.entries(queries).map(([key, q]) => {
      const m = window.matchMedia(q);
      const listener = (e: MediaQueryListEvent) =>
        setBp((prev) => ({ ...prev, [key]: e.matches }));
      m.addEventListener('change', listener);
      return { key, m, listener };
    });
    setBp(Object.fromEntries(mqls.map(({ key, m }) => [key, m.matches])) as Record<Breakpoint, boolean>);
    return () => mqls.forEach(({ m, listener }) => m.removeEventListener('change', listener));
  }, []);

  return bp;
}
