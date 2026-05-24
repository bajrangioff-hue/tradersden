import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../lib/auth';

const LoginPage: React.FC = () => {
  const { login, loading, error, clearError, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [localError, setLocalError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(''), 3000); return () => clearTimeout(t) }
  }, [toast]);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

  useEffect(() => {
    if (!googleClientId) return;
    if (document.querySelector('script[src*="accounts.google.com/gsi/client"]')) return;
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true; s.defer = true;
    document.body.appendChild(s);
  }, [googleClientId]);

  const handleGoogle = () => {
    if (!googleClientId) { setToast('Google sign in coming soon'); return; }
    try {
      const { google } = window as unknown as { google: { accounts: { oauth2: { initTokenClient: (cfg: { client_id: string; scope: string; callback: (resp: { access_token: string }) => void }) => { requestAccessToken: () => void } } } } };
      const client = google.accounts.oauth2.initTokenClient({
        client_id: googleClientId,
        scope: 'openid email profile',
        callback: async (tokenResponse) => {
          try {
            const resp = await fetch('/api/v1/auth/google', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ access_token: tokenResponse.access_token }),
            });
            if (resp.ok) {
              const tokens = await resp.json();
              const meResp = await fetch('/api/v1/auth/me', {
                headers: { Authorization: `Bearer ${tokens.access_token}` },
              });
              if (meResp.ok) {
                const user = await meResp.json();
                localStorage.setItem('bt_tokens', JSON.stringify(tokens));
                localStorage.setItem('bt_user', JSON.stringify(user));
                window.location.href = '/dashboard';
                return;
              }
            }
            setToast('Google sign in failed — try email instead');
          } catch {
            setToast('Google sign in failed — try email instead');
          }
        },
      });
      client.requestAccessToken();
    } catch {
      setToast('Google sign in coming soon');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setLocalError('Please enter a valid email');
      return;
    }
    if (!password) {
      setLocalError('Please enter your password');
      return;
    }

    try {
      await login(email, password);
    } catch {
      /* error displayed from context */
    }
  };

  const displayError = localError || error;
  const errorMap: Record<string, string> = {
    'Invalid email or password': 'Invalid email or password',
    '401': 'Invalid email or password',
  };
  const errorMsg = displayError
    ? (errorMap[displayError] || errorMap[displayError.replace(/^HTTP\s+(\d+).*$/, '$1')] || (displayError.includes('401') || displayError.includes('403') ? 'Invalid email or password' : 'Server error. Please try again'))
    : '';

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'linear-gradient(135deg, #F0EBFF 0%, #FFFFFF 40%, #FFFFFF 60%, #FFE8F5 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Inter',
      }}
    >
      <div
        style={{
          position: 'absolute', top: -100, left: -100,
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, #E9D5FF, transparent 70%)',
          opacity: 0.6, filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute', bottom: -100, right: -100,
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, #FFD6EF, transparent 70%)',
          opacity: 0.6, filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative', zIndex: 10,
          background: '#FFFFFF',
          borderRadius: 20,
          padding: '48px 40px',
          width: 440,
          boxShadow: '0 4px 6px rgba(0,0,0,0.05), 0 20px 60px rgba(108,92,231,0.08)',
          border: '1px solid rgba(108,92,231,0.08)',
        }}
      >
        <div
          style={{
            width: 48, height: 48, borderRadius: 12,
            background: 'linear-gradient(135deg, #6C5CE7, #a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            fontSize: 22, fontWeight: 900, color: '#fff',
          }}
        >
          T
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0F172A', textAlign: 'center', margin: 0 }}>Sign in</h1>
        <p style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 4, marginBottom: 28 }}>
          We help traders become profitable!
        </p>

        <button
          onClick={handleGoogle}
          style={{
            width: '100%', height: 44,
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            fontSize: 14, fontWeight: 500, color: '#374151',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            transition: 'all 150ms',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.borderColor = '#D1D5DB' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = '#E5E7EB' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Sign in with Google
        </button>

        <div style={{ margin: '20px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
          <span style={{ fontSize: 13, color: '#9CA3AF' }}>or</span>
          <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoComplete="email"
            style={{
              width: '100%', height: 44,
              border: '1px solid #E5E7EB', borderRadius: 10,
              padding: '0 14px', fontSize: 14, color: '#0F172A',
              background: '#FFFFFF',
              outline: 'none', transition: 'all 150ms',
              marginBottom: 12, boxSizing: 'border-box',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#6C5CE7'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(108,92,231,0.1)' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none' }}
          />

          <div style={{ position: 'relative', marginBottom: 8 }}>
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
              style={{
                width: '100%', height: 44,
                border: '1px solid #E5E7EB', borderRadius: 10,
                padding: '0 44px 0 14px', fontSize: 14, color: '#0F172A',
                background: '#FFFFFF',
                outline: 'none', transition: 'all 150ms',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#6C5CE7'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(108,92,231,0.1)' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none' }}
            />
            <div
              onClick={() => setShowPw(!showPw)}
              style={{
                position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                cursor: 'pointer', color: '#9CA3AF', display: 'flex',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#6C5CE7' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#9CA3AF' }}
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </div>
          </div>

          <div style={{ textAlign: 'left', marginBottom: 20 }}>
            <span
              style={{ fontSize: 13, color: '#6C5CE7', cursor: 'pointer' }}
              onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline' }}
              onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none' }}
            >
              Forgot password?
            </span>
          </div>

          {errorMsg && (
            <div
              style={{
                background: '#FEF2F2', border: '1px solid #FECACA',
                borderRadius: 8, padding: '10px 14px',
                fontSize: 13, color: '#DC2626',
                display: 'flex', gap: 8, alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <AlertCircle size={14} color="#DC2626" />
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', height: 44,
              background: loading ? 'linear-gradient(135deg, #6C5CE7, #7C3AED)' : 'linear-gradient(135deg, #6C5CE7, #7C3AED)',
              border: 'none', borderRadius: 10,
              color: '#FFFFFF', fontSize: 14, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(108,92,231,0.4)',
              transition: 'all 150ms', opacity: loading ? 0.8 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)' } }}
            onMouseLeave={(e) => { if (!loading) { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' } }}
          >
            {loading ? (
              <div
                style={{
                  width: 16, height: 16, borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: 'transparent',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
            ) : 'Sign in'}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: '#6B7280' }}>
          Don't have an account?{' '}
          <Link
            to="/signup"
            style={{ color: '#6C5CE7', fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }}
            onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline' }}
            onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none' }}
          >
            Sign up
          </Link>
        </div>
      </div>

      {toast && (
        <div
          style={{
            position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
            background: '#1A202C', color: '#FFFFFF',
            borderRadius: 8, padding: '12px 16px',
            fontSize: 13, zIndex: 100, fontFamily: 'Inter',
          }}
        >
          {toast}
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
