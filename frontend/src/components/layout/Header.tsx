import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { SYMBOLS_DATA } from '../../utils/constants';
import { getSearchSuggestions } from '../../utils/formatters';
import { BRAND } from '../../config/brand';
import { useAuth } from '../../lib/auth';

interface HeaderProps {
  searchVal: string;
  onSearchChange: (v: string) => void;
  onAnalyze: (sym: string) => void;
  connected?: boolean;
  activeTab: string;
  onTabSelect: (tab: string) => void;
}

function getSessionBadge(): { label: string; active: boolean } {
  const h = new Date().getUTCHours();
  if (h >= 7 && h < 9) return { label: 'LONDON KZ', active: true };
  if (h >= 13 && h < 15) return { label: 'NY KZ', active: true };
  if (h >= 0 && h < 7) return { label: 'ASIA', active: false };
  if (h >= 15 && h < 17) return { label: 'NY AM', active: true };
  if (h >= 17 && h < 19) return { label: 'LUNCH', active: false };
  return { label: 'OFF', active: false };
}

const NAV_TABS = [
  { id: 'all', label: 'ANALYZER' },
  { id: 'dashboard', label: 'DASHBOARD' },
  { id: 'journal', label: 'JOURNAL' },
  { id: 'calendar', label: 'CALENDAR' },
  { id: 'statistics', label: 'STATISTICS' },
  { id: 'settings', label: 'SETTINGS' },
];

const Header: React.FC<HeaderProps> = ({ searchVal, onSearchChange, onAnalyze, connected = true, activeTab, onTabSelect }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState<{ s: string; n: string; cats: string[] }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [utcTime, setUtcTime] = useState('');
  const [analysing, setAnalysing] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const session = getSessionBadge();

  useEffect(() => {
    const q = searchVal.trim();
    setSuggestions(q ? getSearchSuggestions(q, SYMBOLS_DATA) as typeof suggestions : []);
  }, [searchVal]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSuggestions(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const tick = () => setUtcTime(new Date().toUTCString().slice(5, 22));
    tick(); const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const handleSelect = useCallback((sym: string) => {
    onSearchChange(sym);
    setShowSuggestions(false);
    setMobileSearchOpen(false);
    setAnalysing(true);
    onAnalyze(sym);
    setTimeout(() => setAnalysing(false), 800);
  }, [onSearchChange, onAnalyze]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const sym = searchVal.trim().toUpperCase() || 'SPY';
      setShowSuggestions(false);
      setAnalysing(true);
      onAnalyze(sym);
      setTimeout(() => setAnalysing(false), 800);
    }
    if (e.key === 'Escape') setShowSuggestions(false);
  }, [searchVal, onAnalyze]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); inputRef.current?.focus(); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 h-16" style={{ background: 'var(--bg-surface)', borderBottom: '1px solid rgba(42,42,46,0.8)' }}>
      <div className="h-full flex items-center px-4 lg:px-5 gap-3">
        {/* Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-lg shrink-0" style={{ background: 'var(--accent)' }}>
            <span className="text-black">B</span>
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>{BRAND.name}</div>
            <div className="text-[8px] font-bold tracking-[0.15em] uppercase" style={{ color: 'var(--text-tertiary)' }}>ICT EXECUTION</div>
          </div>
          <div className="w-px h-5" style={{ background: 'var(--bg-border)' }} />
        </div>

        {/* Primary Nav */}
        <nav className="hidden lg:flex items-center gap-0.5">
          {NAV_TABS.map((t) => {
            const isActive = activeTab === t.id || (t.id === 'all' && !['dashboard', 'journal', 'calendar', 'statistics', 'settings', 'news', 'scanner'].includes(activeTab));
            return (
              <button
                key={t.id}
                onClick={() => onTabSelect(t.id)}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border-none rounded-lg ${
                  isActive ? 'text-black' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                }`}
                style={{ background: isActive ? 'var(--accent)' : 'transparent' }}
              >
                {t.label}
              </button>
            );
          })}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search */}
        <div className="hidden md:block relative max-w-[220px] w-full" ref={searchRef}>
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={searchVal}
            placeholder="Search symbol... (⌘K)"
            onChange={(e) => { onSearchChange(e.target.value); if (e.target.value.trim()) setShowSuggestions(true); }}
            onFocus={() => { if (searchVal.trim()) setShowSuggestions(true); }}
            onKeyDown={handleKeyDown}
            className="w-full rounded-lg pl-8 pr-2 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none transition-all font-mono"
            style={{ background: 'var(--bg-tertiary)', border: '1px solid transparent' }}
            onFocusCapture={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
            onBlurCapture={(e) => { e.currentTarget.style.borderColor = 'transparent'; }}
          />
          {searchVal && (
            <button className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] cursor-pointer bg-transparent border-none p-0.5" onClick={() => { onSearchChange(''); inputRef.current?.focus(); setShowSuggestions(false); }}>
              <X size={12} />
            </button>
          )}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 rounded-xl overflow-hidden z-50" style={{
              background: 'var(--bg-elevated)',
              border: 'var(--border-subtle)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}>
              {suggestions.map((sym, i) => (
                <button key={sym.s} onMouseDown={() => handleSelect(sym.s)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-left bg-transparent border-none cursor-pointer transition-colors hover:bg-[var(--bg-hover)]"
                  style={{ borderBottom: i < suggestions.length - 1 ? '1px solid rgba(42,42,46,0.6)' : 'none' }}>
                  <span className="flex items-center gap-2.5">
                    <span className="text-xs font-semibold text-[var(--text-primary)] font-mono">{sym.s}</span>
                    <span className="text-[10px] text-[var(--text-secondary)]">{sym.n}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    {sym.cats.slice(0, 2).map((cat) => (
                      <span key={cat} className="text-[7px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: 'var(--accent-dim-2)', color: 'var(--accent)' }}>
                        {cat}
                      </span>
                    ))}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Status + Time */}
        <div className="hidden lg:flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-[var(--pass)]' : 'bg-[var(--fail)]'}`} style={connected ? { boxShadow: '0 0 4px var(--pass)' } : {}} />
            <span className="text-[9px] font-bold tracking-wider uppercase" style={{ color: connected ? 'var(--pass)' : 'var(--fail)' }}>LIVE</span>
          </div>
          <div className="w-px h-4" style={{ background: 'var(--bg-border)' }} />
          <span className="text-xs font-mono font-medium" style={{ color: 'var(--text-tertiary)' }}>{utcTime}</span>
          <div className="w-px h-4" style={{ background: 'var(--bg-border)' }} />
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${session.active ? 'text-[var(--pass)]' : ''}`} style={{ background: session.active ? 'var(--pass-dim)' : 'var(--bg-tertiary)', color: session.active ? 'var(--pass)' : 'var(--text-tertiary)' }}>
            {session.label}
          </span>
        </div>

        {/* Mobile search */}
        <button className="md:hidden p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer bg-transparent border-none" onClick={() => setMobileSearchOpen(!mobileSearchOpen)}>
          <Search size={16} />
        </button>

        {/* ANALYZE button */}
        <button
          onClick={() => { setAnalysing(true); onAnalyze(searchVal.trim().toUpperCase() || 'SPY'); setTimeout(() => setAnalysing(false), 800); }}
          className="px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border-none shrink-0"
          style={{ background: analysing ? 'var(--bg-hover)' : 'var(--accent)', color: analysing ? 'var(--text-secondary)' : '#000' }}
        >
          {analysing ? '...' : 'ANALYZE'}
        </button>

        {/* User Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer border-none transition-all"
            style={{ background: userMenuOpen ? 'var(--bg-hover)' : 'transparent' }}
          >
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
              {user?.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-medium leading-tight" style={{ color: 'var(--text-primary)' }}>{user?.display_name || 'User'}</div>
              <div className="text-[9px]" style={{ color: 'var(--text-tertiary)' }}>{user?.email || ''}</div>
            </div>
            <ChevronDown size={12} style={{ color: 'var(--text-tertiary)' }} />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-48 rounded-xl overflow-hidden z-50" style={{
              background: 'var(--bg-elevated)',
              border: 'var(--border-subtle)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}>
              <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--bg-border)' }}>
                <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{user?.display_name || 'User'}</div>
                <div className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{user?.email || ''}</div>
              </div>
              <button onClick={() => { setUserMenuOpen(false); navigate('/settings'); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-left bg-transparent border-none cursor-pointer transition-colors hover:bg-[var(--bg-hover)]" style={{ color: 'var(--text-secondary)' }}>
                <Settings size={14} />
                Settings
              </button>
              <div className="border-t" style={{ borderColor: 'var(--bg-border)' }} />
              <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-left bg-transparent border-none cursor-pointer transition-colors hover:bg-[var(--bg-hover)]" style={{ color: 'var(--fail)' }}>
                <LogOut size={14} />
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile search overlay */}
      {mobileSearchOpen && (
        <div className="md:hidden px-4 pb-3" ref={searchRef}>
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none" />
            <input type="text" value={searchVal} placeholder="Search symbol..." onChange={(e) => { onSearchChange(e.target.value); if (e.target.value.trim()) setShowSuggestions(true); }} onKeyDown={handleKeyDown} autoFocus
              className="w-full rounded-lg pl-8 pr-3 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none font-mono" style={{ background: 'var(--bg-tertiary)' }} />
          </div>
          {showSuggestions && suggestions.length > 0 && (
            <div className="mt-1 rounded-lg overflow-hidden" style={{ background: 'var(--bg-elevated)', border: 'var(--border-subtle)' }}>
              {suggestions.map((sym) => (
                <button key={sym.s} onMouseDown={() => handleSelect(sym.s)}
                  className="w-full flex items-center justify-between px-3 py-2 text-left bg-transparent border-none cursor-pointer hover:bg-[var(--bg-hover)]" style={{ borderBottom: 'var(--border-subtle)' }}>
                  <span className="text-xs font-semibold text-[var(--text-primary)] font-mono">{sym.s}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
