import React, { useRef, useEffect } from 'react';
import { createChart, ColorType, CandlestickSeries, createSeriesMarkers } from 'lightweight-charts';
import type { OHLCV, ConfluenceLevel } from '../../types';

interface Props {
  data: OHLCV[];
  levels: ConfluenceLevel[];
  symbol: string;
}

const LEVEL_COLORS: Record<string, string> = {
  ORDER_BLOCK: '#2D7FF9',
  FVG: '#22C55E',
  BSL: '#F59E0B',
  SSL: '#EF4444',
  EQUAL_HIGHS: '#A855F7',
  EQUAL_LOWS: '#A855F7',
  LIQUIDITY: '#F59E0B',
  DOL: '#EC4899',
  OTE: '#0EA5E9',
  BREAKER: '#F97316',
  INDUCEMENT: '#14B8A6',
};

const ConfluenceChart: React.FC<Props> = ({ data, levels, symbol }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#111113' },
        textColor: '#71717A',
        fontSize: 10,
      },
      grid: {
        vertLines: { color: '#1F1F23' },
        horzLines: { color: '#1F1F23' },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: '#3F3F46', width: 1, style: 2 },
        horzLine: { color: '#3F3F46', width: 1, style: 2 },
      },
      timeScale: {
        borderColor: '#27272A',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: '#27272A',
      },
      width: containerRef.current.clientWidth,
      height: 480,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22C55E',
      downColor: '#EF4444',
      borderUpColor: '#22C55E',
      borderDownColor: '#EF4444',
      wickUpColor: '#22C55E',
      wickDownColor: '#EF4444',
    });

    const candleData = data.map((d) => ({
      time: d.time,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));
    candleSeries.setData(candleData);

    const markers = levels.map((lvl) => {
      const color = LEVEL_COLORS[lvl.level_type] || '#71717A';
      const isBullish = lvl.direction === 'bullish' || lvl.direction === 'BULLISH';
      return {
        time: data.length > 0 ? data[Math.min(Math.floor(data.length * 0.8), data.length - 1)].time : (data[0]?.time || ''),
        position: isBullish ? 'belowBar' as const : 'aboveBar' as const,
        color,
        shape: isBullish ? 'arrowUp' as const : 'arrowDown' as const,
        text: `${lvl.level_type} ${lvl.price} (${lvl.confluence_score})`,
      };
    });

    if (markers.length > 0) {
      createSeriesMarkers(candleSeries, markers);
    }

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data, levels, symbol]);

  return (
    <div className="card-surface overflow-hidden">
      <div className="px-4 py-2 border-b border-[var(--bg-border)] flex items-center gap-3">
        <span className="text-sm font-semibold">{symbol}</span>
        <span className="text-xs text-[var(--text-tertiary)]">{levels.length} confluence levels</span>
      </div>
      <div ref={containerRef} />
    </div>
  );
};

export default ConfluenceChart;
