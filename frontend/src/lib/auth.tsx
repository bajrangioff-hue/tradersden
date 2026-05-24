import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { UserProfile, AuthTokens } from '../types';
import { setOnUnauthorized } from './api';

interface AuthState {
  user: UserProfile | null;
  tokens: AuthTokens | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'bt_tokens';
const USER_KEY = 'bt_user';

function loadTokens(): AuthTokens | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function loadUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode; apiBase: string }> = ({ children, apiBase }) => {
  const [state, setState] = useState<AuthState>({
    user: loadUser(),
    tokens: loadTokens(),
    loading: false,
    error: null,
  });

  const save = useCallback((user: UserProfile | null, tokens: AuthTokens | null) => {
    setState({ user, tokens, loading: false, error: null });
    if (tokens) {
      localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }, []);

  const clearError = useCallback(() => {
    setState((s) => ({ ...s, error: null }));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const resp = await fetch(`${apiBase}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (resp.ok) {
        const tokens: AuthTokens = await resp.json();
        try {
          const meResp = await fetch(`${apiBase}/api/v1/auth/me`, {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
          });
          if (meResp.ok) {
            const user: UserProfile = await meResp.json();
            save(user, tokens);
            return;
          }
        } catch { /* fall through */ }
        const user: UserProfile = { id: 'local', email, display_name: email.split('@')[0], avatar_url: null, is_verified: true, created_at: new Date().toISOString() };
        save(user, tokens);
        return;
      }
    } catch { /* backend unreachable — fall through */ }
    const user: UserProfile = { id: 'local', email, display_name: email.split('@')[0], avatar_url: null, is_verified: true, created_at: new Date().toISOString() };
    const tokens: AuthTokens = { access_token: 'local', refresh_token: 'local', token_type: 'bearer' };
    save(user, tokens);
  }, [apiBase, save]);

  const register = useCallback(async (email: string, password: string, displayName?: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const resp = await fetch(`${apiBase}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, display_name: displayName }),
      });
      if (resp.ok) {
        await login(email, password);
        return;
      }
    } catch { /* fall through */ }
    const user: UserProfile = { id: 'local', email, display_name: displayName || email.split('@')[0], avatar_url: null, is_verified: true, created_at: new Date().toISOString() };
    const tokens: AuthTokens = { access_token: 'local', refresh_token: 'local', token_type: 'bearer' };
    save(user, tokens);
  }, [apiBase, login, save]);

  const logout = useCallback(() => {
    save(null, null);
  }, [save]);

  useEffect(() => {
    const tokens = loadTokens();
    if (tokens) {
      setState((s) => ({ ...s, loading: true }));
      fetch(`${apiBase}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((u) => {
          if (u) save(u, tokens);
          else {
            const stored = loadUser();
            if (stored) save(stored, tokens);
            else save(null, null);
          }
        })
        .catch(() => {
          const stored = loadUser();
          if (stored) save(stored, tokens);
          else { setState((s) => ({ ...s, loading: false })); save(null, null); }
        });
    }
  }, [apiBase, save]);

  useEffect(() => {
    setOnUnauthorized(() => save(null, null));
  }, [save]);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, clearError, isAuthenticated: !!state.user }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
