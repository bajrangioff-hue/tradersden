import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { BRAND } from '../config/brand';

function strengthCheck(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
const STRENGTH_COLORS = ['', '#EF4444', '#F59E0B', '#F0B90B', '#22C55E', '#22C55E'];

const SignupPage: React.FC = () => {
  const { register, loading, error, clearError, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [localError, setLocalError] = useState('');

  const strength = useMemo(() => strengthCheck(password), [password]);
  const passwordsMatch = password === confirmPassword;

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!passwordsMatch) {
      setLocalError('Passwords do not match');
      return;
    }
    if (strength < 2) {
      setLocalError('Password too weak — use at least 8 characters with mixed case and numbers');
      return;
    }

    try {
      await register(email, password, displayName || undefined);
    } catch {
      /* error handled by context */
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-app)' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-[0.08]" style={{ background: 'radial-gradient(circle, var(--accent), transparent)' }} />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full opacity-[0.06]" style={{ background: 'radial-gradient(circle, var(--accent), transparent)' }} />
      </div>

      <div
        className="relative w-full max-w-md rounded-2xl p-8"
        style={{
          background: 'rgba(17, 17, 19, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-2xl mx-auto mb-4" style={{ background: 'var(--accent)' }}>
            <span className="text-black">B</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">Create Account</h1>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">Join {BRAND.name}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-dim)] outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 1px var(--accent-dim)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Display Name (optional)</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-dim)] outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 1px var(--accent-dim)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
              placeholder="Trader Name"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-dim)] outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 1px var(--accent-dim)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
              placeholder="Min 8 characters"
              autoComplete="new-password"
            />
            {password.length > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${(strength / 5) * 100}%`,
                      background: STRENGTH_COLORS[strength],
                    }}
                  />
                </div>
                <span className="text-[10px] font-medium" style={{ color: STRENGTH_COLORS[strength] || 'var(--text-dim)' }}>
                  {STRENGTH_LABELS[strength]}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Confirm Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-dim)] outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderColor: confirmPassword && !passwordsMatch ? 'var(--fail)' : 'rgba(255,255,255,0.08)',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = confirmPassword && !passwordsMatch ? 'var(--fail)' : 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 1px var(--accent-dim)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = confirmPassword && !passwordsMatch ? 'var(--fail)' : 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
              placeholder="Re-enter password"
              autoComplete="new-password"
            />
            {confirmPassword && !passwordsMatch && (
              <div className="mt-1 text-[10px] text-[var(--fail)]">Passwords do not match</div>
            )}
          </div>

          {(error || localError) && (
            <div className="text-xs text-[var(--fail)] rounded-lg px-3 py-2 leading-relaxed" style={{ background: 'rgba(239,68,68,0.1)' }}>
              {localError || error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all border-none"
            style={{ background: 'var(--accent)', color: '#000' }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = 'var(--accent-hover)'; }}
            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = 'var(--accent)'; }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Creating account...
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-xs text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors"
          >
            Already have an account? <span className="font-semibold">Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
