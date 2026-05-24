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
const STRENGTH_COLORS = ['', '#E17055', '#F59E0B', '#6C5CE7', '#00B894', '#00B894'];

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
    if (isAuthenticated) navigate('/dashboard', { replace: true });
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
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#F8F9FC' }}>
      <div
        className="w-full max-w-md"
        style={{
          background: '#FFFFFF',
          border: '1px solid #EEF0F3',
          borderRadius: 12,
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          padding: 40,
        }}
      >
        <div className="text-center mb-8">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-2xl mx-auto mb-4"
            style={{ background: '#6C5CE7' }}
          >
            <span style={{ color: '#FFFFFF' }}>B</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: '#1A202C' }}>Create Account</h1>
          <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>Join {BRAND.name}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#4A5568' }}>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all"
              style={{
                color: '#1A202C',
                background: '#F8F9FC',
                border: '1px solid #EEF0F3',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#6C5CE7'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#EEF0F3'; }}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#4A5568' }}>Display Name (optional)</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all"
              style={{
                color: '#1A202C',
                background: '#F8F9FC',
                border: '1px solid #EEF0F3',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#6C5CE7'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#EEF0F3'; }}
              placeholder="Trader Name"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#4A5568' }}>Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all"
              style={{
                color: '#1A202C',
                background: '#F8F9FC',
                border: '1px solid #EEF0F3',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#6C5CE7'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#EEF0F3'; }}
              placeholder="Min 8 characters"
              autoComplete="new-password"
            />
            {password.length > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: '#EEF0F3' }}>
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${(strength / 5) * 100}%`,
                      background: STRENGTH_COLORS[strength],
                    }}
                  />
                </div>
                <span className="text-[10px] font-medium" style={{ color: STRENGTH_COLORS[strength] || '#9CA3AF' }}>
                  {STRENGTH_LABELS[strength]}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#4A5568' }}>Confirm Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all"
              style={{
                color: '#1A202C',
                background: '#F8F9FC',
                border: '1px solid #EEF0F3',
                borderColor: confirmPassword && !passwordsMatch ? '#E17055' : '#EEF0F3',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = confirmPassword && !passwordsMatch ? '#E17055' : '#6C5CE7'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = confirmPassword && !passwordsMatch ? '#E17055' : '#EEF0F3'; }}
              placeholder="Re-enter password"
              autoComplete="new-password"
            />
            {confirmPassword && !passwordsMatch && (
              <div className="mt-1 text-[10px]" style={{ color: '#E17055' }}>Passwords do not match</div>
            )}
          </div>

          {(error || localError) && (
            <div className="text-xs rounded-lg px-3 py-2 leading-relaxed" style={{ color: '#E17055', background: 'rgba(225,112,85,0.10)' }}>
              {localError || error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all border-none"
            style={{ background: '#6C5CE7', color: '#FFFFFF' }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = '#5A4BD1'; }}
            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = '#6C5CE7'; }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Creating account...</span>
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-xs transition-colors"
            style={{ color: '#9CA3AF' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#6C5CE7'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#9CA3AF'; }}
          >
            Already have an account? <span className="font-semibold">Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
