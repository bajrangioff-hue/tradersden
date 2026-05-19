import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { BRAND } from '../config/brand';

const AuthPage: React.FC = () => {
  const { login, register, loading, error, clearError, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, displayName || undefined);
      }
    } catch {
      /* error handled by context */
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    clearError();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card-surface p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold tracking-tight">{BRAND.name}</h1>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">{BRAND.tagline}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--bg-border)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Display Name (optional)</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--bg-border)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                placeholder="Trader Name"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--bg-border)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
              placeholder="Min 8 characters"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
            />
          </div>

          {(error) && (
            <div className="text-xs text-[var(--fail)] bg-[var(--fail-dim)] rounded-lg px-3 py-2 leading-relaxed">
              {error}
              {error.includes('backend') && (
                <div className="mt-1 text-[var(--text-tertiary)]">
                  Start it with: <code className="text-[var(--accent)]">uvicorn app.main:app --reload</code>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-lg text-sm font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </span>
            ) : isLogin ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            className="text-xs text-[var(--text-tertiary)] hover:text-[var(--accent)] cursor-pointer transition-colors"
            onClick={toggleMode}
          >
            {isLogin ? "Don't have an account? Register" : 'Already have an account? Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
