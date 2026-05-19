import React, { useState, useEffect } from 'react';
import { BRAND } from '../../config/brand';
import { useMarketStore } from '../../hooks/useMarketStore';
import { getSessionInfo } from '../../utils/formatters';

const StatusBar: React.FC = () => {
  const [utcTime, setUtcTime] = useState(() => new Date().toUTCString().slice(5, 22));
  const { lastUpdate, error } = useMarketStore();
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().slice(5, 22));
      const session = getSessionInfo();
      if (session.nextInMs > 0) {
        const totalSec = Math.floor(session.nextInMs / 1000);
        const mins = Math.floor(totalSec / 60);
        const secs = totalSec % 60;
        setCountdown(`${session.nextLabel} in ${mins}m ${secs}s`);
      } else {
        setCountdown('');
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const marketConnected = lastUpdate && (Date.now() - lastUpdate) < 15000;
  const session = getSessionInfo();

  return (
    <footer className="h-7 flex items-center px-4 text-[10px] font-mono shrink-0" style={{ background: 'var(--bg-app)', borderTop: 'var(--border-subtle)' }}>
      <div className="flex-1 flex items-center gap-2">
        <span className="text-[var(--text-dim)]">{BRAND.name} v{BRAND.version}</span>
        <span className="text-[var(--text-dim)]">|</span>
        <span className="text-[var(--text-dim)]">ICT Framework</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full ${marketConnected ? 'bg-[var(--pass)]' : 'bg-[var(--fail)]'}`}
            style={marketConnected ? { animation: 'pulse-dot 2s infinite' } : {}}
          />
          <span className="text-[var(--text-tertiary)]">Market</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--pass)]" style={{ animation: 'pulse-dot 2s infinite' }} />
          <span className="text-[var(--text-tertiary)]">Live</span>
        </span>
      </div>
      <div className="flex-1 flex items-center justify-end gap-2">
        <span className="text-[var(--text-dim)]">
          <span style={{ color: session.active ? 'var(--pass)' : 'var(--text-dim)' }}>{session.label}</span>
        </span>
        {countdown && <span className="text-[var(--text-dim)]">· {countdown}</span>}
        <span className="text-[var(--text-dim)]">|</span>
        <span className="text-[var(--text-tertiary)]">{utcTime}</span>
      </div>
    </footer>
  );
};

export default StatusBar;
