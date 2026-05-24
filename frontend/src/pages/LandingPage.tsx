import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, BarChart3, TrendingUp, Target, DollarSign, Trophy, Layers } from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    { icon: <BarChart3 size={22} color="#fff" />, color: '#6C5CE7', title: 'Trade Journal', desc: 'Log every trade with detailed notes, screenshots and execution grades' },
    { icon: <TrendingUp size={22} color="#fff" />, color: '#00B894', title: 'Advanced Analytics', desc: 'Deep insights into your trading patterns, sessions, and setups' },
    { icon: <Target size={22} color="#fff" />, color: '#F59E0B', title: 'Equity Curve', desc: 'Visualize your account growth and identify drawdown periods instantly' },
    { icon: <DollarSign size={22} color="#fff" />, color: '#3B82F6', title: 'Win/Loss Calendar', desc: 'See your performance day by day in a clean heatmap calendar view' },
    { icon: <Trophy size={22} color="#fff" />, color: '#ec4899', title: 'Risk Metrics', desc: 'Track R multiples, expectancy, and consecutive win loss streaks' },
    { icon: <Layers size={22} color="#fff" />, color: '#10B981', title: 'Session Analysis', desc: 'Know exactly which sessions — London NY AM NY PM Asia — make you money' },
  ];

  return (
    <div style={{ background: '#FFFFFF', fontFamily: 'Inter' }}>
      {/* NAVBAR */}
      <nav
        style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid #F3F4F6',
          height: 64, padding: '0 80px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            fontSize: 18, fontWeight: 700,
            background: 'linear-gradient(135deg, #6C5CE7, #a855f7)',
            backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent',
          }}
        >
          TradePro
        </div>

        <div style={{ display: 'flex', gap: 32 }}>
          {['Products', 'Solutions', 'Supported Brokers', 'Pricing', 'Resources'].map((link) => (
            <span
              key={link}
              style={{
                fontSize: 14, color: '#374151', cursor: 'pointer', transition: 'color 150ms',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#6C5CE7' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#374151' }}
            >
              {link}
            </span>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            onClick={() => navigate('/login')}
            style={{
              fontSize: 14, color: '#374151', cursor: 'pointer', padding: '8px 16px', transition: 'color 150ms',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#6C5CE7' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#374151' }}
          >
            Log in
          </span>
          <button
            onClick={() => navigate('/login')}
            style={{
              background: 'linear-gradient(135deg, #6C5CE7, #a855f7)',
              color: '#fff', borderRadius: 8, padding: '8px 20px',
              fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
              transition: 'opacity 150ms',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* HERO */}
      <div
        style={{
          padding: '80px 80px 0 80px',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center',
        }}
      >
        <div>
          <h1 style={{ fontSize: 52, fontWeight: 800, lineHeight: 1.15, color: '#0F172A', margin: 0 }}>
            Everything you ever{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #6C5CE7, #ec4899)',
                backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent',
              }}
            >
              wanted to know
            </span>{' '}
            about your trading...
          </h1>
          <div style={{ fontSize: 20, color: '#6B7280', marginTop: 8 }}>
            ...but your spreadsheets never told you.
          </div>
          <div style={{ fontSize: 15, color: '#6B7280', lineHeight: 1.6, marginTop: 20, maxWidth: 480 }}>
            TradePro shows you the metrics that matter — and the behaviours that lead to profit with the power of journaling and analytics.
          </div>

          <button
            onClick={() => navigate('/login')}
            style={{
              marginTop: 32,
              background: 'linear-gradient(135deg, #6C5CE7, #ec4899)',
              color: '#fff', borderRadius: 10, padding: '14px 40px',
              fontSize: 16, fontWeight: 700, border: 'none', cursor: 'pointer',
              width: 'fit-content', transition: 'all 200ms',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            Get Started Now
          </button>

          <div style={{ marginTop: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginRight: 4 }}>
              <span style={{ fontSize: 14, color: '#374151', marginRight: 8 }}>Trusted by:</span>
              {[
                { bg: '#6C5CE7', initial: 'JD' },
                { bg: '#ec4899', initial: 'SK' },
                { bg: '#00B894', initial: 'AM' },
                { bg: '#F59E0B', initial: 'RT' },
                { bg: '#3B82F6', initial: 'PL' },
              ].map((a, i) => (
                <div
                  key={i}
                  style={{
                    width: 36, height: 36, borderRadius: '50%', background: a.bg,
                    border: '2px solid #fff', marginLeft: i === 0 ? 0 : -8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, color: '#fff',
                  }}
                >
                  {a.initial}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={14} fill="#10B981" color="#10B981" />
              ))}
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Excellent</span>
            <span style={{ fontSize: 13, color: '#6B7280' }}>932 reviews on Trustpilot</span>
          </div>
        </div>

        {/* Hero Right - Dashboard Mockup */}
        <div style={{ position: 'relative' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, #6C5CE7 0%, #a855f7 50%, #ec4899 100%)',
              borderRadius: 24, padding: 24, width: '100%',
              boxShadow: '0 40px 80px rgba(108,92,231,0.3)',
            }}
          >
            <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 20, width: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {[
                  { label: 'Net P&L', value: '+$4,720', color: '#00B894' },
                  { label: 'Win Rate', value: '68%', color: '#6C5CE7' },
                  { label: 'Profit Factor', value: '2.45', color: '#6C5CE7' },
                  { label: 'Avg RR', value: '1:2.8', color: '#6C5CE7' },
                ].map((s, i) => (
                  <div key={i} style={{ background: '#F8F9FC', borderRadius: 8, padding: '10px 8px' }}>
                    <div style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', color: '#9CA3AF', letterSpacing: '0.05em' }}>{s.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: s.color, marginTop: 2 }}>{s.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ height: 120, background: '#F8F9FC', borderRadius: 8, marginTop: 12, position: 'relative', overflow: 'hidden' }}>
                <svg width="100%" height="100%" viewBox="0 0 400 120" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6C5CE7" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#6C5CE7" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0 100 Q50 80 100 70 T200 55 T300 35 T400 20 L400 120 L0 120 Z" fill="url(#lineGrad)" />
                  <path d="M0 100 Q50 80 100 70 T200 55 T300 35 T400 20" stroke="#6C5CE7" strokeWidth="2" fill="none" strokeLinecap="round" />
                </svg>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginTop: 8, height: 16 }}>
                {Array.from({ length: 28 }).map((_, i) => {
                  const colors = ['#DCFCE7', '#FEE2E2', '#F3F4F6', '#DCFCE7', '#DCFCE7', '#FEE2E2', '#F3F4F6', '#DCFCE7', '#FEE2E2', '#DCFCE7', '#DCFCE7', '#DCFCE7', '#FEE2E2', '#F3F4F6', '#DCFCE7', '#DCFCE7', '#FEE2E2', '#DCFCE7', '#F3F4F6', '#DCFCE7', '#DCFCE7', '#FEE2E2', '#DCFCE7', '#FEE2E2', '#DCFCE7', '#DCFCE7', '#DCFCE7', '#FEE2E2'];
                  return <div key={i} style={{ background: colors[i], borderRadius: 2, height: 16 }} />;
                })}
              </div>
            </div>
          </div>

          <div
            style={{
              position: 'absolute', bottom: -20, left: -20,
              background: '#FFFFFF', borderRadius: 12, padding: 16,
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)', width: 240,
            }}
          >
            <div style={{ fontSize: 13, color: '#374151', fontFamily: 'Inter' }}>
              Reason: VWAP bounce; Risk 0.5 R; felt confident{' '}
              <span role="img" aria-label="check">&#10003;</span>
            </div>
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <div style={{ padding: '80px', textAlign: 'center' }}>
        <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6C5CE7', fontWeight: 600, marginBottom: 12 }}>
          Powerful features
        </div>
        <div style={{ fontSize: 36, fontWeight: 700, color: '#0F172A' }}>
          Everything you need to become a better trader
        </div>

        <div
          style={{
            marginTop: 48,
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32,
            textAlign: 'left',
          }}
        >
          {features.map((f) => (
            <div
              key={f.title}
              style={{
                background: '#FFFFFF', border: '1px solid #EEF0F3', borderRadius: 16, padding: 28,
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                transition: 'all 200ms',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 32px rgba(108,92,231,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <div
                style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: `linear-gradient(135deg, ${f.color}, ${f.color}dd)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 20,
                }}
              >
                {f.icon}
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#1A202C', marginBottom: 8 }}>{f.title}</div>
              <div style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div
        style={{
          padding: 80,
          background: 'linear-gradient(135deg, #6C5CE7, #a855f7)',
          borderRadius: 24, margin: '0 80px 80px 80px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 36, fontWeight: 700, color: '#FFFFFF' }}>
          Start your trading journey today
        </div>
        <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 12, lineHeight: 1.5 }}>
          Join thousands of traders who use TradePro to become consistently profitable
        </div>
        <button
          onClick={() => navigate('/login')}
          style={{
            background: '#FFFFFF', color: '#6C5CE7',
            borderRadius: 10, padding: '14px 40px',
            fontSize: 16, fontWeight: 700, marginTop: 32,
            border: 'none', cursor: 'pointer', transition: 'opacity 150ms',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.95' }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
        >
          Get Started Now
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
